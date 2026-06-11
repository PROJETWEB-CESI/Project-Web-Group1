'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/lib/api';
import WeekSchedule from '@/components/student/WeekSchedule';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { apiFetch } = useApi();

  const [weeklyCoursesCount, setWeeklyCoursesCount] = useState(null);
  const [studentsCount, setStudentsCount]           = useState(null);
  const [avgAttendanceRate, setAvgAttendanceRate]   = useState(null);
  const [campusName, setCampusName]                 = useState(null);
  const [timetables, setTimetables]                 = useState([]);
  const [loading, setLoading]                       = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'teacher') return;

    const instructorId = user.instructorId;
    const campusId     = user.campusId;

    const fetchJson = async (url) => {
      try {
        const res = await apiFetch(url);
        return res.ok ? await res.json() : null;
      } catch {
        return null;
      }
    };

    const loadData = async () => {
      const [campusData, rawTimetables] = await Promise.all([
        campusId ? fetchJson(`/api/students/campuses/${campusId}`) : null,
        instructorId ? fetchJson(`/api/timetables/?instructor_id=${instructorId}`) : null,
      ]);

      if (campusData?.campusName) setCampusName(campusData.campusName);

      if (Array.isArray(rawTimetables)) {
        setTimetables(rawTimetables);
        const courseIds = [...new Set(rawTimetables.map(t => t.course_id))];
        setWeeklyCoursesCount(courseIds.length);

        if (courseIds.length > 0 && campusId) {
          const stats = await fetchJson(
            `/api/teacher/courses/stats?courseIds=${courseIds.join(',')}&campusId=${campusId}`
          );
          if (stats) {
            setStudentsCount(stats.studentsCount);
            setAvgAttendanceRate(stats.avgAttendanceRate);
          }
        } else {
          setStudentsCount(0);
        }
      } else {
        setWeeklyCoursesCount(0);
        setStudentsCount(0);
      }

      setLoading(false);
    };

    loadData();
  }, [user]);

  const fullName   = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
  const specialty  = user?.specialty  || null;
  const department = user?.department || null;
  const dash       = '—';

  const kpiClass   = 'rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4';
  const labelClass = 'text-xs text-[var(--color-text-muted)] uppercase tracking-wide';
  const valueClass = 'text-3xl font-semibold mt-2';

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        Bonjour {fullName}
      </h1>
      {specialty && (
        <p className="text-[var(--color-text-muted)] mb-6">
          Prof. {specialty}
        </p>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className={kpiClass}>
          <div className={labelClass}>MES COURS HEBDO</div>
          <div className={valueClass}>
            {loading ? dash : weeklyCoursesCount ?? dash}
          </div>
        </div>

        <div className={kpiClass}>
          <div className={labelClass}>ÉTUDIANTS ENCADRÉS</div>
          <div className={valueClass}>
            {loading ? dash : studentsCount ?? dash}
          </div>
        </div>

        <div className={kpiClass}>
          <div className={labelClass}>PRÉSENCE MOYENNE</div>
          <div className={valueClass}>
            {loading
              ? dash
              : avgAttendanceRate != null
              ? `${avgAttendanceRate}%`
              : dash}
          </div>
        </div>

        <div className={kpiClass}>
          <div className={labelClass}>SPÉCIALITÉ</div>
          {specialty ? (
            <>
              <div className="text-lg font-semibold mt-2">{specialty}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">
                {[department ? `Dépt. ${department}` : null, campusName]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </>
          ) : (
            <div className={valueClass}>{dash}</div>
          )}
        </div>
      </div>

      <WeekSchedule timetables={timetables} viewAllHref={null} />
    </div>
  );
}
