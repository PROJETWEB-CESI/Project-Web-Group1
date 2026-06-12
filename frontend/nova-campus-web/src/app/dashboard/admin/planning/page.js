'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/lib/api';

import PlanningTab from '@/components/admin/PlanningTab';

// Two timetable entries overlap if they share the same day/semester/year
// and their time ranges intersect
function timesOverlap(a, b) {
  return a.day_of_week === b.day_of_week
    && a.semester === b.semester
    && a.academic_year === b.academic_year
    && a.start_time < b.end_time
    && b.start_time < a.end_time;
}

// Detects room and instructor double-bookings among the campus's timetables
function findConflicts(timetables) {
  const conflicts = [];
  for (let i = 0; i < timetables.length; i++) {
    for (let j = i + 1; j < timetables.length; j++) {
      const a = timetables[i];
      const b = timetables[j];
      if (a.schedule_id === b.schedule_id) continue;
      if (!timesOverlap(a, b)) continue;
      if (a.room_id && a.room_id === b.room_id) {
        conflicts.push({ type: 'room', a, b });
      } else if (a.instructor_id && a.instructor_id === b.instructor_id) {
        conflicts.push({ type: 'instructor', a, b });
      }
    }
  }
  return conflicts;
}

export default function AdminPlanningPage() {
  const { user } = useAuth();
  const { apiFetch } = useApi();
  const [rooms, setRooms] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => {
    const campusId = user?.campusId;
    if (!campusId) return;

    const fetchJson = async (url) => {
      try {
        const res = await apiFetch(url);
        return res.ok ? await res.json() : [];
      } catch {
        return [];
      }
    };

    Promise.all([
      fetchJson(`/api/rooms?campus_id=${campusId}`),
      fetchJson(`/api/timetables/`),
    ]).then(([campusRooms, allTimetables]) => {
      const roomIds = new Set(campusRooms.map((r) => r.room_id));
      const campusTimetables = allTimetables.filter((t) => roomIds.has(t.room_id));
      setRooms(campusRooms);
      setTimetables(campusTimetables);
      setConflicts(findConflicts(campusTimetables));
    });
  }, [user]);

  return <PlanningTab rooms={rooms} timetables={timetables} conflicts={conflicts} />;
}
