'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function ExecutiveDashboard() {
  const router = useRouter();
  useEffect(() => { router.replace('/aria'); }, [router]);
  return null;
}
