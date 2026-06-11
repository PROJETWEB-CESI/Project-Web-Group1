'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/lib/api';

import StudentsTab from '@/components/admin/StudentsTab';

export default function AdminStudentsPage() {
  const { user } = useAuth();
  const { apiFetch } = useApi();
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    const campusId = user?.campusId;
    if (!campusId) return;

    apiFetch(`/api/students?campusId=${campusId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setStudents(Array.isArray(data) ? data : []))
      .catch(() => setStudents([]));

    apiFetch(`/api/students/programs?campusId=${campusId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPrograms(Array.isArray(data) ? data : []))
      .catch(() => setPrograms([]));
  }, [user]);

  const handleStudentCreated = (student) => {
    setStudents((prev) => [...prev, student]);
  };

  return (
    <StudentsTab
      students={students}
      campusId={user?.campusId}
      allPrograms={programs}
      onStudentCreated={handleStudentCreated}
    />
  );
}
