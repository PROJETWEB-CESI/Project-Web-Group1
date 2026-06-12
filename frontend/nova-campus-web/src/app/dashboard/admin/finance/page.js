'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/lib/api';

import FinanceTab from '@/components/admin/FinanceTab';

export default function AdminFinancePage() {
  const { user } = useAuth();
  const { apiFetch } = useApi();
  const [payments, setPayments] = useState([]);
  const [billingStats, setBillingStats] = useState(null);

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
      fetchJson(`/api/payments?campusId=${campusId}`),
      fetchJson(`/api/payments/stats?campusId=${campusId}`),
      fetchJson(`/api/payments/overdue?campusId=${campusId}`),
    ]).then(([allPayments, stats, overdue]) => {
      setBillingStats(stats);
      if (!Array.isArray(allPayments)) return;

      // Merge dunning stage info from the overdue list into the full payment list
      const dunningMap = new Map((overdue || []).map((o) => [o.payment_id, o.dunningStage]));
      setPayments(allPayments.map((p) => ({ ...p, dunningStage: dunningMap.get(p.payment_id) || null })));
    });
  }, [user]);

  return <FinanceTab payments={payments} billingStats={billingStats} />;
}
