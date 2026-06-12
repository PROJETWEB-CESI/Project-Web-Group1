'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

const BADGE_COLORS = [
  { bg: 'bg-[var(--color-course-6-soft)]', text: 'text-[var(--color-course-6)]' },
  { bg: 'bg-[var(--color-course-7-soft)]', text: 'text-[var(--color-course-7)]' },
  { bg: 'bg-[var(--color-course-3-soft)]', text: 'text-[var(--color-course-3)]' },
  { bg: 'bg-[var(--color-course-2-soft)]', text: 'text-[var(--color-course-2)]' },
  { bg: 'bg-[var(--color-course-8-soft)]', text: 'text-[var(--color-course-8)]' },
  { bg: 'bg-[var(--color-course-4-soft)]', text: 'text-[var(--color-course-4)]' },
];

function CircularGauge({ value, max = 20, size = 72 }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = value != null ? Math.min(Math.max(value / max, 0), 1) : 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${pct * circumference} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
        {value ?? '—'}
      </span>
    </div>
  );
}

export default function GradesTab({
  gradesData = [],
  enrollments = [],
  kpis = {},
  gradeStats = null,
  studentId,
  campusId,
  programName,
}) {
  const { apiFetch } = useApi();
  const { translate, isFrench } = useLanguage();
  const [expanded, setExpanded]             = useState({});
  const [courseClassAvg, setCourseClassAvg] = useState({});
  const [loadingAvg, setLoadingAvg]         = useState({});

  // Prefetch class averages for all enrolled courses at mount
  useEffect(() => {
    if (!studentId || !campusId || gradesData.length === 0) return;
    const courseIds = [...new Set(gradesData.map(g => g.courseId))];
    courseIds.forEach(courseId => {
      setLoadingAvg(prev => ({ ...prev, [courseId]: true }));
      apiFetch(`/api/grades/student/${studentId}/stats?campusId=${campusId}&courseId=${courseId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          setCourseClassAvg(prev => ({ ...prev, [courseId]: data?.classAverage ?? null }));
        })
        .catch(() => {
          setCourseClassAvg(prev => ({ ...prev, [courseId]: null }));
        })
        .finally(() => {
          setLoadingAvg(prev => ({ ...prev, [courseId]: false }));
        });
    });
  }, [studentId, campusId, gradesData]);

  // Map courseId → { courseName, credits, colorIdx }
  const courseInfoMap = {};
  enrollments.forEach(e => {
    if (!courseInfoMap[e.courseId]) {
      courseInfoMap[e.courseId] = {
        courseName: e.course?.courseName || e.courseId,
        credits:    e.course?.credits    || 0,
        colorIdx:   Object.keys(courseInfoMap).length,
      };
    }
  });

  // Group grade entries by courseId
  const grouped = {};
  gradesData.forEach(g => {
    if (!grouped[g.courseId]) grouped[g.courseId] = [];
    grouped[g.courseId].push(g);
  });

  // Enrolled courses with grades first, then any unexpected courseId
  const orderedCourseIds = [
    ...Object.keys(courseInfoMap).filter(id => grouped[id]),
    ...Object.keys(grouped).filter(id => !courseInfoMap[id]),
  ];

  // Weighted average for one course
  const getCourseAvg = (courseId) => {
    const gs = grouped[courseId] || [];
    const wSum   = gs.reduce((s, g) => s + parseFloat(g.score ?? 0) * (g.coefficient ?? 1), 0);
    const wCoeff = gs.reduce((s, g) => s + (g.coefficient ?? 1), 0);
    return wCoeff > 0 ? Math.round((wSum / wCoeff) * 10) / 10 : null;
  };

  // Expand row and lazily fetch class average for that course
  const toggleExpand = async (courseId) => {
    const opening = !expanded[courseId];
    setExpanded(prev => ({ ...prev, [courseId]: opening }));

    if (opening && courseClassAvg[courseId] === undefined && !loadingAvg[courseId]) {
      setLoadingAvg(prev => ({ ...prev, [courseId]: true }));
      try {
        const res = await apiFetch(
          `/api/grades/student/${studentId}/stats?campusId=${campusId}&courseId=${courseId}`
        );
        if (res.ok) {
          const data = await res.json();
          setCourseClassAvg(prev => ({ ...prev, [courseId]: data.classAverage ?? null }));
        }
      } catch {
        setCourseClassAvg(prev => ({ ...prev, [courseId]: null }));
      } finally {
        setLoadingAvg(prev => ({ ...prev, [courseId]: false }));
      }
    }
  };

  const average      = kpis?.average      ?? gradeStats?.average ?? null;
  const rank         = gradeStats?.rank   ?? null;
  const total        = gradeStats?.total  ?? null;
  const credits      = kpis?.credits      ?? null;
  const totalCredits = kpis?.totalCredits ?? null;

  const fmtNum = (n) => n?.toString().replace('.', ',') ?? '—';

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">{translate('gradesTitle')}</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {kpis?.currentSemesterLabel}{programName ? ` · ${programName}` : ''}
          </p>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Average with circular gauge */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 flex items-center gap-4">
          <CircularGauge value={average} max={20} size={72} />
          <div>
            <div className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              {translate('overallAverage')}
            </div>
            <div className="text-2xl font-bold mt-0.5 leading-none">
              {fmtNum(average)}
              <span className="text-sm font-normal text-[var(--color-text-muted)]"> / 20</span>
            </div>
          </div>
        </div>

        {/* Rank */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5">
          <div className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            {translate('rankInClass')}
          </div>
          <div className="text-3xl font-bold mt-2 leading-none">
            {rank ?? '—'}
            <span className="text-base font-normal text-[var(--color-text-muted)]">/{total ?? '?'}</span>
          </div>
        </div>

        {/* ECTS */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5">
          <div className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            {translate('semesterEcts')}
          </div>
          <div className="text-3xl font-bold mt-2 leading-none">
            {credits ?? '—'}
            <span className="text-base font-normal text-[var(--color-text-muted)]">/{totalCredits ?? '?'}</span>
          </div>
        </div>
      </div>

      {/* ── Subject detail ── */}
      <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="px-6 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-bg-elev)]">
          <span className="text-sm font-semibold">{translate('detailBySubject')}</span>
        </div>

        {orderedCourseIds.length === 0 && (
          <p className="px-6 py-10 text-sm text-center text-[var(--color-text-muted)]">
            {translate('noGradesAvailable')}
          </p>
        )}

        {orderedCourseIds.map((courseId, idx) => {
          const info  = courseInfoMap[courseId] ?? { courseName: courseId, credits: 0, colorIdx: idx };
          const color = BADGE_COLORS[info.colorIdx % BADGE_COLORS.length];
          const letter = info.courseName.charAt(0).toUpperCase();
          const avg      = getCourseAvg(courseId);
          const classAvg = courseClassAvg[courseId];
          const isOpen   = !!expanded[courseId];
          const evals    = (grouped[courseId] ?? []).slice().sort(
            (a, b) => new Date(a.evaluationDate) - new Date(b.evaluationDate)
          );

          return (
            <div key={courseId} className="border-b border-[var(--color-border)] last:border-b-0">
              {/* ── Subject row ── */}
              <div
                className="flex items-center px-6 py-4 cursor-pointer hover:bg-[var(--color-surface-hover)] select-none transition-colors"
                onClick={() => toggleExpand(courseId)}
              >
                {/* Colored letter badge */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mr-4 ${color.bg} ${color.text}`}
                >
                  {letter}
                </div>

                {/* Course name */}
                <div className="flex-1 text-sm font-medium min-w-0 mr-4 truncate">
                  {info.courseName}
                  <span className="text-[var(--color-text-muted)] font-normal ml-1.5 text-xs">({courseId})</span>
                </div>

                {/* Your grade */}
                <div className="text-right mr-8 shrink-0">
                  <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">{translate('yourGrade')}</div>
                  <div className="text-xl font-bold leading-tight">{fmtNum(avg)}</div>
                </div>

                {/* Class average */}
                <div className="text-right w-16 shrink-0 mr-4">
                  <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">{translate('classAvgLabel')}</div>
                  <div className="text-xl font-bold leading-tight text-[var(--color-text-muted)]">
                    {loadingAvg[courseId] ? '…' : fmtNum(classAvg)}
                  </div>
                </div>

                {/* Chevron */}
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  className={`shrink-0 text-[var(--color-text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {/* ── Evaluations table (expanded) ── */}
              {isOpen && (
                <div className="bg-[var(--color-surface)] border-t border-[var(--color-border)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide border-b border-[var(--color-border)]">
                        <th className="px-6 py-2.5 text-left font-medium w-24">{translate('colDate')}</th>
                        <th className="px-6 py-2.5 text-left font-medium">{translate('colEvaluation')}</th>
                        <th className="px-6 py-2.5 text-left font-medium w-32">{translate('colCoefficient')}</th>
                        <th className="px-6 py-2.5 text-right font-medium w-28">{translate('colGrade')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {evals.map(ev => (
                        <tr key={ev.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                          <td className="px-6 py-3 text-[var(--color-text-muted)]">
                            {ev.evaluationDate
                              ? new Date(ev.evaluationDate + 'T00:00:00').toLocaleDateString('fr-FR', {
                                  day: '2-digit', month: '2-digit',
                                })
                              : '—'}
                          </td>
                          <td className="px-6 py-3">{(!isFrench && ev.evaluationNameEn) ? ev.evaluationNameEn : ev.evaluationName}</td>
                          <td className="px-6 py-3 text-[var(--color-text-muted)]">×{ev.coefficient ?? 1}</td>
                          <td className="px-6 py-3 text-right">
                            <span className="font-bold">
                              {ev.score != null ? ev.score : '—'}
                            </span>
                            <span className="text-[var(--color-text-muted)] text-xs ml-0.5">
                              / {ev.scoreMax ?? 20}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
