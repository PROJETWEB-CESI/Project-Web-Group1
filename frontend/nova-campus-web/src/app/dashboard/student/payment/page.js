'use client';

import { useStudentDashboardData } from '@/context/StudentDashboardContext';
import PaymentTab from '@/components/student/PaymentTab';

export default function StudentPaymentPage() {
  const { payments, billingSummary, payEcheance } = useStudentDashboardData();

  return <PaymentTab payments={payments} billingSummary={billingSummary} payEcheance={payEcheance} />;
}
