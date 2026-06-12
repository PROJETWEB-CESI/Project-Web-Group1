'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { fetchCampusOverview, average, sum } from '@/lib/executiveData';

import ExecutiveDashboardTab from '@/components/executive/ExecutiveDashboardTab';

export default function ExecutiveDashboard() {
  const { apiFetch } = useApi();
  const { translate } = useLanguage();

  const [kpis, setKpis] = useState({
    totalStudents: null, totalRevenue: null, avgSuccessRate: null, avgDropoutRate: null,
  });
  const [campusPerformance, setCampusPerformance] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [programMix, setProgramMix] = useState([]);

  useEffect(() => {
    fetchCampusOverview(apiFetch).then((campuses) => {
      if (!campuses || campuses.length === 0) return;

      setCampusPerformance(
        campuses.map((c) => ({
          campusId: c.campusId,
          campusName: c.campusName,
          totalStudents: c.totalStudents,
          successRate: c.successRate,
          revenue: c.billing?.totalCollected ?? null,
        }))
      );

      setKpis({
        totalStudents: sum(campuses.map((c) => c.totalStudents)),
        totalRevenue: sum(campuses.map((c) => c.billing?.totalCollected)),
        avgSuccessRate: average(campuses.map((c) => c.successRate)),
        avgDropoutRate: average(campuses.map((c) => c.dropoutRate)),
      });

      // Strategic alerts: campuses underperforming vs the group average
      const groupSuccess = average(campuses.map((c) => c.successRate));
      const groupDropout = average(campuses.map((c) => c.dropoutRate));
      const newAlerts = [];
      campuses.forEach((c) => {
        if (groupSuccess !== null && c.successRate !== null && c.successRate < groupSuccess - 5) {
          newAlerts.push({
            campusName: c.campusName,
            message: `${(groupSuccess - c.successRate).toFixed(1)}% ${translate('alertLowSuccessRate')}`,
          });
        }
        if (c.overdue?.overdueAmount > 0) {
          newAlerts.push({
            campusName: c.campusName,
            message: `${Number(c.overdue.overdueAmount).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € ${translate('alertHighOverdue')}`,
          });
        }
        if (groupDropout !== null && c.dropoutRate !== null && c.dropoutRate > groupDropout + 5) {
          newAlerts.push({
            campusName: c.campusName,
            message: `${c.dropoutRate}% ${translate('alertHighDropout')}`,
          });
        }
      });
      setAlerts(newAlerts);

      // Program mix: aggregate byProgram across all campuses
      const programMap = new Map();
      campuses.forEach((c) => {
        (c.byProgram || []).forEach((p) => {
          const existing = programMap.get(p.programName) || { programName: p.programName, studentCount: 0, maxStudents: 0 };
          existing.studentCount += p.studentCount || 0;
          existing.maxStudents += p.maxStudents || 0;
          programMap.set(p.programName, existing);
        });
      });
      const mix = [...programMap.values()]
        .sort((a, b) => b.studentCount - a.studentCount)
        .slice(0, 5);
      setProgramMix(mix);
    });
  }, [apiFetch]);

  return (
    <ExecutiveDashboardTab
      kpis={kpis}
      campusPerformance={campusPerformance}
      alerts={alerts}
      programMix={programMix}
    />
  );
}
