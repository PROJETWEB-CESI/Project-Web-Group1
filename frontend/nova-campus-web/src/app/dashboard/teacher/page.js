'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import WeekSchedule from '@/components/student/WeekSchedule';
import TeacherKpiCards from '@/components/teacher/TeacherKpiCards';
import TeacherNextCourse from '@/components/teacher/TeacherNextCourse';
import TeacherPendingGrades from '@/components/teacher/TeacherPendingGrades';
import TeacherCoursePerformance from '@/components/teacher/TeacherCoursePerformance';
import TeacherGradeDistribution from '@/components/teacher/TeacherGradeDistribution';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { apiFetch } = useApi();
  const { translate } = useLanguage();

  const [weeklyCoursesCount, setWeeklyCoursesCount] = useState(null);
  const [studentsCount, setStudentsCount]           = useState(null);
  const [avgAttendanceRate, setAvgAttendanceRate]   = useState(null);
  const [campusName, setCampusName]                 = useState(null);
  const [timetables, setTimetables]                 = useState([]);
  const [pendingGrades, setPendingGrades]           = useState([]);
  const [coursePerformance, setCoursePerformance]   = useState([]);
  const [gradeDistribution, setGradeDistribution]   = useState([]);
  const [publishing, setPublishing]                 = useState({});
  const [loading, setLoading]                       = useState(true);

  const fetchJson = useCallback(async (url) => {
    try {
      const res = await apiFetch(url);
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  }, [apiFetch]);

  useEffect(() => {
    if (!user || user.role !== 'teacher') return;

    const instructorId = user.instructorId;
    const campusId     = user.campusId;

    const loadData = async () => {
      const [campusData, rawTimetables] = await Promise.all([
        campusId    ? fetchJson(`/api/students/campuses/${campusId}`) : null,
        instructorId ? fetchJson(`/api/timetables/?instructor_id=${instructorId}`) : null,
      ]);

      if (campusData?.campusName) setCampusName(campusData.campusName);

      if (Array.isArray(rawTimetables)) {
        setTimetables(rawTimetables);
        const courseIds = [...new Set(rawTimetables.map(t => t.course_id))];
        setWeeklyCoursesCount(courseIds.length);

        if (courseIds.length > 0 && campusId) {
          const qs = `courseIds=${courseIds.join(',')}&campusId=${campusId}`;
          const [stats, pending, perf, dist] = await Promise.all([
            fetchJson(`/api/teacher/courses/stats?${qs}`),
            fetchJson(`/api/teacher/courses/pending-grades?${qs}`),
            fetchJson(`/api/teacher/courses/performance?${qs}`),
            fetchJson(`/api/teacher/courses/distribution?${qs}`),
          ]);
          if (stats) {
            setStudentsCount(stats.studentsCount);
            setAvgAttendanceRate(stats.avgAttendanceRate);
          }
          if (Array.isArray(pending)) setPendingGrades(pending);
          if (Array.isArray(perf))    setCoursePerformance(perf);
          if (Array.isArray(dist))    setGradeDistribution(dist);
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
  }, [user, fetchJson]);

  const handlePublish = async (courseId) => {
    const campusId = user?.campusId;
    if (!campusId) return;
    setPublishing(prev => ({ ...prev, [courseId]: true }));
    try {
      const res = await apiFetch(`/api/grades/course/${courseId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campusId }),
      });
      if (res.ok) {
        setPendingGrades(prev => prev.filter(c => c.courseId !== courseId));
      }
    } finally {
      setPublishing(prev => ({ ...prev, [courseId]: false }));
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">
          {user?.firstName ? `${translate('hello', { name: user.firstName })} 👋` : null}
        </h1>
        {user?.specialty && (
          <p className="text-[var(--color-text-muted)] mt-1">
            Prof. {user.specialty}{user?.department ? ` · ${user.department}` : ''}
          </p>
        )}
      </div>

      <TeacherKpiCards
        loading={loading}
        weeklyCoursesCount={weeklyCoursesCount}
        studentsCount={studentsCount}
        avgAttendanceRate={avgAttendanceRate}
        specialty={user?.specialty}
        department={user?.department}
        campusName={campusName}
      />

      <TeacherNextCourse timetables={timetables} />

      <WeekSchedule timetables={timetables} viewAllHref={null} />

      {!loading && (
        <>
          <TeacherPendingGrades
            pendingGrades={pendingGrades}
            publishing={publishing}
            onPublish={handlePublish}
          />
          <TeacherCoursePerformance coursePerformance={coursePerformance} />
          <TeacherGradeDistribution distribution={gradeDistribution} />
        </>
      )}
    </div>
  );
}
