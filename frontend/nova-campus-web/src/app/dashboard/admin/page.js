'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/lib/api';

import DashboardTab from '@/components/admin/DashboardTab';

const ROOM_DAYS = 5; // Monday to Friday
const ROOM_HOURS = 9; // 08:00 - 17:00

export default function AdminDashboard() {
  const { user } = useAuth();
  const { apiFetch } = useApi();

  const [campus, setCampus] = useState(null);
  const [kpis, setKpis] = useState({
    totalStudents: null, occupancyRate: null, overdueCount: null, successRate: null,
  });
  const [byProgram, setByProgram] = useState([]);
  const [overduePayments, setOverduePayments] = useState([]);
  const [revenueData, setRevenueData] = useState([]);

  useEffect(() => {
    const campusId = user?.campusId;
    if (!campusId) return;

    const fetchJson = async (url) => {
      try {
        const res = await apiFetch(url);
        return res.ok ? await res.json() : null;
      } catch {
        return null;
      }
    };

    Promise.all([
      fetchJson(`/api/students/campuses/${campusId}`),
      fetchJson(`/api/students/campus/${campusId}/stats`),
      fetchJson(`/api/payments/stats?campusId=${campusId}`),
      fetchJson(`/api/payments/overdue?campusId=${campusId}`),
      fetchJson(`/api/rooms?campus_id=${campusId}`),
      fetchJson(`/api/timetables/`),
      fetchJson(`/api/payments?campusId=${campusId}`),
    ]).then(([campusData, stats, billingStats, overdue, rooms, timetables, payments]) => {
      if (campusData) setCampus(campusData);
      if (Array.isArray(stats?.byProgram)) setByProgram(stats.byProgram);
      if (Array.isArray(overdue)) setOverduePayments(overdue.slice(0, 8));

      // Room occupancy: bookings on the campus rooms vs theoretical weekly slots
      let occupancyRate = null;
      if (Array.isArray(rooms) && Array.isArray(timetables) && rooms.length > 0) {
        const roomIds = new Set(rooms.map((r) => r.room_id));
        const campusBookings = timetables.filter((t) => roomIds.has(t.room_id));
        const totalSlots = rooms.length * ROOM_DAYS * ROOM_HOURS;
        occupancyRate = totalSlots > 0 ? Math.min(100, Math.round((campusBookings.length / totalSlots) * 100)) : null;
      }

      setKpis({
        totalStudents: stats?.totalStudents ?? null,
        occupancyRate,
        overdueCount: billingStats?.overdueCount ?? null,
        successRate: stats?.successRate ?? null,
      });

      // Revenue chart: paid amounts grouped by academic year + semester
      if (Array.isArray(payments)) {
        const map = new Map();
        for (const p of payments) {
          if (p.status !== 'Paid') continue;
          const key = `${p.academic_year || '?'}-S${p.semester || '?'}`;
          map.set(key, (map.get(key) || 0) + parseFloat(p.amount || 0));
        }
        const sorted = [...map.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-6)
          .map(([key, value]) => ({ label: key.replace(/^\d{4}-(\d{4})-/, '$1-'), value: Math.round(value) }));
        setRevenueData(sorted);
      }
    });
  }, [user]);

  return (
    <DashboardTab
      campus={campus}
      kpis={kpis}
      byProgram={byProgram}
      overduePayments={overduePayments}
      revenueData={revenueData}
    />
  );
}
