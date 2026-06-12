'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/lib/api';
import { fetchCampusOverview, fetchEnrollmentTrend, average } from '@/lib/executiveData';

import CampusIndicatorsTab from '@/components/executive/CampusIndicatorsTab';

export default function CampusIndicators() {
  const { apiFetch } = useApi();

  const [campuses, setCampuses] = useState([]);
  const [groupAverages, setGroupAverages] = useState({});
  const [trendYears, setTrendYears] = useState([]);
  const [trendByCampus, setTrendByCampus] = useState({});

  useEffect(() => {
    fetchCampusOverview(apiFetch).then(async (data) => {
      if (!data || data.length === 0) return;
      setCampuses(data);

      setGroupAverages({
        totalStudents: average(data.map((c) => c.totalStudents), 0),
        successRate: average(data.map((c) => c.successRate)),
        averageGrade: average(data.map((c) => c.averageGrade), 2),
        attendanceRate: average(data.map((c) => c.attendanceRate)),
        dropoutRate: average(data.map((c) => c.dropoutRate)),
      });

      const trends = await Promise.all(data.map((c) => fetchEnrollmentTrend(apiFetch, c.campusId)));
      const yearsSet = new Set();
      const byCampus = {};
      data.forEach((c, i) => {
        const map = {};
        trends[i].forEach((row) => {
          map[row.entryYear] = row.count;
          yearsSet.add(row.entryYear);
        });
        byCampus[c.campusId] = map;
      });
      setTrendByCampus(byCampus);
      setTrendYears([...yearsSet].sort());
    });
  }, [apiFetch]);

  return (
    <CampusIndicatorsTab
      campuses={campuses}
      groupAverages={groupAverages}
      trendYears={trendYears}
      trendByCampus={trendByCampus}
    />
  );
}
