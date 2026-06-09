'use client';

import AriaPage from '@/app/aria/page';

/**
 * "Fake" assistant page under the dashboard route.
 * This lives at /dashboard/assistant (so it receives the full dashboard layout/shell + sidebar from the parent layout).
 * It simply references/renders the real Aria page component (the canonical /aria/ route is untouched and not moved).
 * This satisfies the requirement that Aria can be accessed with the correct dashboard layout from within the student (and future role) sidebars
 * while keeping the original aria/ route exactly as-is.
 */
export default function DashboardAssistantReference() {
  // Render the real Aria UI as the main content.
  // The dashboard layout provides the surrounding header + sidebar (with student nav + outils highlighted when appropriate).
  return <AriaPage />;
}
