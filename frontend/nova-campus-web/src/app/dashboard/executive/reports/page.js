'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { fetchCampusOverview, fetchEnrollmentTrend, average, sum } from '@/lib/executiveData';
import { downloadCsv } from '@/lib/csv';

import StrategicReportsTab from '@/components/executive/StrategicReportsTab';

export default function StrategicReports() {
  const { apiFetch } = useApi();
  const { translate } = useLanguage();

  const [kpis, setKpis] = useState({ campusCount: null, programCount: null, overdueAmount: null, overdueCount: null });
  const dataRef = useRef([]);

  useEffect(() => {
    fetchCampusOverview(apiFetch).then((campuses) => {
      if (!campuses || campuses.length === 0) return;
      dataRef.current = campuses;

      const programCount = sum(campuses.map((c) => (c.byProgram || []).length));
      setKpis({
        campusCount: campuses.length,
        programCount,
        overdueAmount: sum(campuses.map((c) => c.overdue?.overdueAmount)),
        overdueCount: sum(campuses.map((c) => c.overdue?.overdueCount)),
      });
    });
  }, [apiFetch]);

  const buildCampusComparison = useCallback(() => {
    const campuses = dataRef.current;
    const groupSuccess = average(campuses.map((c) => c.successRate));
    const groupGrade = average(campuses.map((c) => c.averageGrade), 2);
    const groupAttendance = average(campuses.map((c) => c.attendanceRate));
    const groupDropout = average(campuses.map((c) => c.dropoutRate));

    const rows = [
      ...campuses.map((c) => ({
        campus: c.campusName,
        students: c.totalStudents,
        successRate: c.successRate,
        averageGrade: c.averageGrade,
        attendanceRate: c.attendanceRate,
        dropoutRate: c.dropoutRate,
        revenue: c.billing?.totalCollected ?? '',
      })),
      {
        campus: translate('csvGroupAverage'),
        students: average(campuses.map((c) => c.totalStudents), 0),
        successRate: groupSuccess,
        averageGrade: groupGrade,
        attendanceRate: groupAttendance,
        dropoutRate: groupDropout,
        revenue: '',
      },
    ];

    return {
      columns: [
        { label: translate('colCampus'), value: 'campus' },
        { label: translate('csvColStudents'), value: 'students' },
        { label: translate('csvColSuccessRatePct'), value: 'successRate' },
        { label: translate('csvColAverageGrade'), value: 'averageGrade' },
        { label: translate('csvColAttendanceRatePct'), value: 'attendanceRate' },
        { label: translate('csvColDropoutRatePct'), value: 'dropoutRate' },
        { label: translate('csvColRevenueCollected'), value: 'revenue' },
      ],
      rows,
    };
  }, [translate]);

  const buildProgramIndicators = useCallback(() => {
    const campuses = dataRef.current;
    const rows = [];
    campuses.forEach((c) => {
      (c.byProgram || []).forEach((p) => {
        rows.push({
          program: p.programName,
          campus: c.campusName,
          students: p.studentCount,
          capacity: p.maxStudents ?? '',
          fillRate: p.maxStudents ? +((p.studentCount / p.maxStudents) * 100).toFixed(1) : '',
        });
      });
    });

    return {
      columns: [
        { label: translate('colProgram'), value: 'program' },
        { label: translate('colCampus'), value: 'campus' },
        { label: translate('csvColStudents'), value: 'students' },
        { label: translate('csvColCapacity'), value: 'capacity' },
        { label: translate('csvColFillRatePct'), value: 'fillRate' },
      ],
      rows,
    };
  }, [translate]);

  const buildRetention = useCallback(async () => {
    const campuses = dataRef.current;
    const trends = await Promise.all(campuses.map((c) => fetchEnrollmentTrend(apiFetch, c.campusId)));
    const rows = campuses.map((c, i) => ({
      campus: c.campusName,
      dropoutRate: c.dropoutRate,
      activeStudents: c.totalStudents,
      totalStudents: c.totalStudentsAll,
      entries: trends[i].map((t) => `${t.entryYear}: ${t.count}`).join(' | '),
    }));

    return {
      columns: [
        { label: translate('colCampus'), value: 'campus' },
        { label: translate('csvColDropoutRatePct'), value: 'dropoutRate' },
        { label: translate('csvColActiveStudents'), value: 'activeStudents' },
        { label: translate('csvColTotalStudents'), value: 'totalStudents' },
        { label: translate('csvColEntriesByYear'), value: 'entries' },
      ],
      rows,
    };
  }, [apiFetch, translate]);

  const buildOverduePayments = useCallback(() => {
    const campuses = dataRef.current;
    const rows = campuses.map((c) => ({
      campus: c.campusName,
      overdueCount: c.overdue?.overdueCount ?? 0,
      overdueAmount: c.overdue?.overdueAmount ?? 0,
    }));

    return {
      columns: [
        { label: translate('colCampus'), value: 'campus' },
        { label: translate('csvColOverdueInvoices'), value: 'overdueCount' },
        { label: translate('csvColOverdueAmount'), value: 'overdueAmount' },
      ],
      rows,
    };
  }, [translate]);

  const reports = [
    { key: 'campusComparison', titleKey: 'reportCampusComparison', descKey: 'reportCampusComparisonDesc', filename: 'campus-comparison.csv', build: buildCampusComparison },
    { key: 'programIndicators', titleKey: 'reportProgramIndicators', descKey: 'reportProgramIndicatorsDesc', filename: 'program-indicators.csv', build: buildProgramIndicators },
    { key: 'retention', titleKey: 'reportRetention', descKey: 'reportRetentionDesc', filename: 'retention-dropout.csv', build: buildRetention },
    { key: 'overduePayments', titleKey: 'reportOverduePayments', descKey: 'reportOverduePaymentsDesc', filename: 'overdue-payments.csv', build: buildOverduePayments },
  ].map((r) => ({
    ...r,
    onExport: async () => {
      const { columns, rows } = await r.build();
      downloadCsv(r.filename, columns, rows);
    },
  }));

  return <StrategicReportsTab kpis={kpis} reports={reports} />;
}
