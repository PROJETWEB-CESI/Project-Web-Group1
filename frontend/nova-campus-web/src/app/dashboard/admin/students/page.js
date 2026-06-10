'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/lib/api';

import StudentsTab from '@/components/admin/StudentsTab';

export default function AdminStudentsPage() {
  const { user } = useAuth();
  const { apiFetch } = useApi();
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const campusId = user?.campusId;
    if (!campusId) return;

    apiFetch(`/api/students?campusId=${campusId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setStudents(Array.isArray(data) ? data : []))
      .catch(() => setStudents([]));
  }, [user]);

  return <StudentsTab students={students} />;
}
