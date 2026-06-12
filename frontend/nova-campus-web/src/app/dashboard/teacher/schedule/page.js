'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/lib/api';
import ScheduleTab from '@/components/student/ScheduleTab';

export default function TeacherSchedulePage() {
  const { user } = useAuth();
  const { apiFetch } = useApi();
  const [timetables, setTimetables] = useState([]);

  const fetchJson = useCallback(async (url) => {
    try {
      const res = await apiFetch(url);
      return res.ok ? await res.json() : null;
    } catch { return null; }
  }, [apiFetch]);

  useEffect(() => {
    if (!user?.instructorId) return;
    fetchJson(`/api/timetables/?instructor_id=${user.instructorId}`)
      .then(data => { if (Array.isArray(data)) setTimetables(data); });
  }, [user, fetchJson]);

  return <ScheduleTab timetables={timetables} />;
}
