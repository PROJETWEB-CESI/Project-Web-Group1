'use client';

import AriaPage from '@/app/aria/page';

/**
 * "Fake" assistant page under the dashboard route.
 * Lives at /dashboard/assistant so it receives the full dashboard layout/shell + sidebar.
 * Simply references/renders the real Aria page component.
 * The canonical /aria/ route is untouched and not moved.
 * This allows the student (and future role) sidebar "Assistant Aria (IA)" link to use the correct dashboard layout.
 */
export default function DashboardAssistantReference() {
  return <AriaPage />;
}
