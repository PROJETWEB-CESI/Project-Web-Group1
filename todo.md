# NovaCampus Student Pages Implementation Todo

This file tracks the work for implementing the student dashboard pages (and eventually other roles) as per the project requirements from the mockups and specifications.

**Key Constraints from User:**
- Only work on students pages for now.
- Single path for student dashboard: `/dashboard/student` (no sub-routes like /schedule). Only the content inside the main area of the dashboard layout changes when navigating between sections (use client-side state or query params for tab/section switching to avoid full page loads while keeping the shell/sidebar).
- Use current CSS design tokens from globals.css for fidelity (colors may differ slightly from mockups; do not hardcode or copy mockup colors exactly).
- The pages should be the "final" implementation (functional, not placeholder/mockup copies). Prepare for backend integration.
- Backend for the pages will be done (more details later); for now, update seeding of test users/data so all needed data for front and back is present for the student test account.
- Aria (AI Assistant): Current route `/aria/` must stay as-is (do not move/rename). Ensure it can use the dashboard shell/layout when accessed from student sidebar. Suggestion: create a "fake" page under dashboard (e.g. /dashboard/assistant or similar) that references/renders the real /aria page content while inside the dashboard layout context.
- Commit current changes on feature/frontend branch first.
- Switch to (or use) a new branch `feature/student-pages` for this work (front + back using services). Any service updates go in this branch.
- Follow AGENT.md and DEVELOPMENT.md strictly (English, sync-gitkeep before commits, full docker for testing, reuse, no "finished", conventional commits, etc.).
- Update test user seeding (in iam-service and relevant services like academic, scheduling, billing) to provide realistic data for student pages (timetable, grades, absences, history/semesters, payments, notifications, etc.).

## Preparation (must do first)
- [ ] Confirm on feature/frontend, run `.\scripts\sync-gitkeep.ps1`, commit any current unstaged changes with conventional English message (no "finished").
- [ ] Switch to new branch: `git checkout -b feature/student-pages` (or checkout if exists from prior).
- [ ] Create this todo.md in project root (done).
- [ ] Re-read AGENT.md and DEVELOPMENT.md to ensure compliance for heavy work (branching, commits, testing with full docker, seeding, reuse, etc.).
- [ ] Verify current student stubs and sidebar code.

## Routing, Layout & Navigation (Single Path for Students)
- [ ] Update DashboardSidebar.jsx: For student role, make all 7 items ("dashboard", "schedule", "grades", "absences", "history", "payment", "notifications") link to the single `/dashboard/student` (use `?tab=xxx` or `?section=xxx` query for switching). Highlight active based on current query param (use useSearchParams since client).
- [ ] Update ProfileMenu.jsx if it has student links: point relevant ones to `/dashboard/student?tab=...`.
- [ ] Refactor `app/dashboard/student/page.js` (the single path): Client component that reads query param (useSearchParams) or internal state to render only the matching section's content in the main area. The dashboard layout shell (sidebar + header) stays mounted; only main content swaps (no full page reload).
- [ ] Sections to support (match user spec + mockups):
  - dashboard (main KPIs, next course, weekly overview, tasks, Aria suggestions)
  - schedule (timetable/emploi du temps view)
  - grades (notes & évaluations)
  - absences
  - history (academic history: entry to school, semesters past/future, inscriptions, etc.)
  - payment (paiements & scolarité)
  - notifications
- [ ] Add sub-navigation or rely on sidebar for switching within the single page.
- [ ] Ensure guard in dashboard/layout.js still works for /dashboard/student (single path per role).

## Aria / Assistant Handling
- [ ] Do not change the real `/aria/` route or its page (`app/aria/page.js`).
- [ ] In student sidebar (and ProfileMenu for consistency), the "Assistant Aria (IA)" / "Aria Assistant (AI)" item should link to `/aria`.
- [ ] To ensure it uses the correct dashboard layout/shell when accessed from within dashboard context: Create a "fake" page e.g. `app/dashboard/assistant/page.js` (or similar) that simply references/renders the real Aria content (e.g. by importing and using the main Aria UI component if extracted, or by client redirect with note, or by re-using the Aria component inside the layout's main area). Update sidebar link for student to prefer the fake if it provides the shell, or keep /aria and ensure aria page can detect logged-in and optionally render with shell (prefer fake to not touch aria route).
- [ ] Later when doing full roles, apply similar for other users' access to Aria.

## Fidelity, Styling & "Final" Pages
- [ ] Use ONLY current design tokens from `globals.css` (`:root`, `.dark`, `.high-contrast`): --color-bg, --color-surface, --color-primary, --color-text, --color-on-primary, --color-border, --color-error, etc. Do not introduce new colors or copy mockup hex exactly if they differ.
- [ ] Make pages the final functional versions (not mockup copies or stubs): Real-looking data, interactions (buttons that update local state, forms, lists, etc.), good UX.
- [ ] Match mockup structure/layout as closely as possible (KPIs cards, tables, filters, action buttons, side panels for suggestions, status badges, etc.) but with our tokens and reusable components.
- [ ] Bilingual: Use `translate()` / `t()` from LanguageContext for all user-facing text. Add keys as needed.
- [ ] Reuse shared components (Button, Input, etc.) and avoid duplication.
- [ ] Accessibility: Proper labels, ARIA, keyboard support per project RGAA goals.
- [ ] No full page loads for intra-student navigation (achieved via single path + content swap in main).

## Data & Seeding Updates (for Back + Front)
- [ ] Update seeding of test users (primarily in `services/iam-service/src/index.js` and related) so the student test account has associated data.
- [ ] Ensure/create data in relevant services for student pages to work (since using services for back):
  - Scheduling-service: rooms, timetables/schedule for the student.
  - Academic-service: grades, absences, student history/inscriptions/semesters, courses.
  - Billing-service: payments/invoices for the student.
  - (Possibly reporting or others for notifications if modeled there; or add simple notifications seed/logic.)
- [ ] If services need schema/models/routes updates for the data, make the changes in this `feature/student-pages` branch.
- [ ] Use ENABLE_TEST_CREDENTIALS logic to seed the demo data for test student (idempotent, like current user seed).
- [ ] For frontend during dev: Fall back to rich mock data in the student page if backend data not yet fully wired (but aim for back integration).
- [ ] Test data should allow the student pages to display realistic content (e.g. multiple semesters for history, several courses/grades/absences/payments/notifs, a weekly schedule).

## Students Pages Implementation (Only These for Now)
- [ ] Implement all 7 sections inside the single `/dashboard/student` page with final fidelity and functionality.
  - Dashboard: Summary KPIs (moyenne, presence, etc.), next course, this week overview, tasks to come, Aria suggestions.
  - Schedule: Timetable view (week grid or list matching mockup).
  - Grades: Overall + per subject details, averages, evaluations list.
  - Absences: Stats (taux presence, total, non-justifiees), history table, justify/upload flow (local state + update).
  - History: Entry year, validated semesters progress, full parcours (past/future semesters), inscriptions table per semester with presence/note/status.
  - Payment: Solde, echeancier list with status, pay action (updates state), documents.
  - Notifications: List with types/filters, unread count (sync with NotificationContext for live), mark as read / all read.
- [ ] Make interactions functional (e.g. "Payer", "Justifier", "Mark read" update UI/state immediately; "live" feel).
- [ ] Integrate with existing NotificationContext for the notifications section and badge.
- [ ] Use mock/realistic data (student-specific for the test account "Léa Moreau" or equivalent from seed).
- [ ] After sections, wire any simple API calls if services are ready (e.g. fetch schedule from /api/scheduling or via gateway).

## Testing & Quality
- [ ] Use full `docker compose up -d --build` (or --force-recreate for seeding changes) for all testing.
- [ ] Test exclusively with student test credential (login, navigate all sections via sidebar using single path, interact, check no full reloads, data displays, protection for other roles).
- [ ] Verify theme (light/dark/high-contrast) and language (EN/FR) work on the pages.
- [ ] Check console for errors, accessibility basics.
- [ ] Update any shared (e.g. LanguageContext keys, NotificationContext if needed).
- [ ] Before any commit: run sync-gitkeep.ps1, conventional English commit message on the student-pages branch.
- [ ] No work on teacher/admin/exec or other roles yet.

## Later / Notes
- Backend details for pages (real CRUD, auth checks, etc.) will come with more info from user.
- Once students done and reviewed, repeat pattern for other roles (with their single paths).
- Keep AGENT/DEVELOPMENT rules: English, reuse, full stack testing, etc.
- Update this todo.md as items are done (mark complete, add notes).

Start only after the preparation steps. Only students pages in this phase.