'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/lib/api';
import { fetchCampusOverview, average, sum } from '@/lib/executiveData';

import ProgramIndicatorsTab from '@/components/executive/ProgramIndicatorsTab';

export default function ProgramIndicators() {
  const { apiFetch } = useApi();

  const [kpis, setKpis] = useState({ totalPrograms: null, totalStudents: null, avgFillRate: null });
  const [programs, setPrograms] = useState([]);
  const [topFilled, setTopFilled] = useState([]);
  const [needsRecruitment, setNeedsRecruitment] = useState([]);

  useEffect(() => {
    fetchCampusOverview(apiFetch).then((campuses) => {
      if (!campuses || campuses.length === 0) return;

      const flat = [];
      campuses.forEach((c) => {
        (c.byProgram || []).forEach((p) => {
          flat.push({
            campusId: c.campusId,
            campusName: c.campusName,
            programId: p.programId,
            programName: p.programName,
            studentCount: p.studentCount,
            maxStudents: p.maxStudents,
            fillRate: p.maxStudents ? +((p.studentCount / p.maxStudents) * 100).toFixed(1) : null,
          });
        });
      });
      flat.sort((a, b) => (b.fillRate ?? -1) - (a.fillRate ?? -1));
      setPrograms(flat);

      const withFillRate = flat.filter((p) => p.fillRate !== null);
      setTopFilled([...withFillRate].sort((a, b) => b.fillRate - a.fillRate).slice(0, 5));
      setNeedsRecruitment([...withFillRate].sort((a, b) => a.fillRate - b.fillRate).slice(0, 5));

      setKpis({
        totalPrograms: flat.length,
        totalStudents: sum(flat.map((p) => p.studentCount)),
        avgFillRate: average(withFillRate.map((p) => p.fillRate)),
      });
    });
  }, [apiFetch]);

  return (
    <ProgramIndicatorsTab kpis={kpis} programs={programs} topFilled={topFilled} needsRecruitment={needsRecruitment} />
  );
}
