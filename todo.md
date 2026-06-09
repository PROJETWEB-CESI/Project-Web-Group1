# Student Pages Implementation Plan (feature/student-pages branch)

**IMPORTANT (per user and AGENT.md):**
- This branch was created fresh from up-to-date develop (git checkout develop; git pull origin develop; git checkout -B feature/student-pages).
- ONLY students pages work in this phase.
- Single path only: /dashboard/student (no sub-routes like /schedule). Only the content inside the main area of the dashboard layout changes when switching sections (use ?tab= query param + client-side conditional rendering in the page component so layout/shell stays mounted, no full page loads).
- Use current CSS design tokens from globals.css for fidelity (do not copy mockup colors if different).
- Pages are the FINAL functional versions (not mocks or placeholders). Real interactions, realistic data.
- Backend for pages later (more info from user); for now update seeding of test users + notes in services so data for student pages is present (timetable, grades, absences, history, payments, notifications for the test student).
- Aria: route /aria/ stays untouched. Use "fake" page under dashboard (e.g. /dashboard/assistant) that references the real aria page so student sidebar can access it with the dashboard shell.
- Follow AGENT.md and DEVELOPMENT.md strictly: always check branch first, run .\scripts\sync-gitkeep.ps1 before every commit, conventional English commit messages (NO AI-sentences, no "per user request", no justifications, no "followed rules", short descriptive), English everywhere, reuse, full docker for testing, etc.
- Redo all student pages work from scratch on this fresh branch.
- Commit only on this branch after proper updates.

## Preparation (done)
- [x] Switched to develop, pulled origin develop to make fully up to date.
- [x] Deleted old feature/student-pages.
- [x] Created brand new feature/student-pages from develop using -B (as if first time).
- [x] Confirmed on feature/student-pages, clean status, at latest develop commit.
- [x] This todo.md written in root.

## Branch & Git Hygiene (ongoing)
- [ ] Always `git branch --show-current` before any edit or commit.
- [ ] Run `.\scripts\sync-gitkeep.ps1` before every commit.
- [ ] Conventional commits only, e.g. "feat(frontend): single-path student dashboard..." (no AI fluff).
- [ ] Only commit student-pages work on this branch.

## Routing & Single Path for Students
- [ ] Update DashboardSidebar.jsx (student role section):
  - All 7 items link to `/dashboard/student?tab=xxx` (dashboard, schedule, grades, absences, history, payment, notifications).
  - Add `tab: 'xxx'` to items.
  - Update isActive to handle tab query for /dashboard/student (use useSearchParams).
  - Assistant Aria links to `/dashboard/assistant` (the fake).
- [ ] Update ProfileMenu.jsx student links similarly if present (to single path).
- [ ] Ensure dashboard layout guard allows /dashboard/student (single path per role).

## Aria Handling (without moving /aria/)
- [ ] Create `app/dashboard/assistant/page.js` as thin "fake" that references/renders the real Aria content from `app/aria/page.js` (so it gets the dashboard layout/shell when accessed from sidebar, while /aria/ route remains exactly as-is and untouched).

## Student Pages (single /dashboard/student only)
- [ ] Completely implement `app/dashboard/student/page.js` as the single page:
  - Use useSearchParams for current tab (default 'dashboard').
  - Only main content area changes (no sub pages, no full reloads).
  - 7 sections matching user spec + mockups, using ONLY current globals.css tokens for fidelity.
  - Final/functional: realistic data (will be backed by seeded service data), interactions (e.g. justify, pay, mark read - local state updates, sync with NotificationContext for live notifs).
  - Sections:
    - dashboard: KPIs, next course, weekly, tasks, Aria suggestions.
    - schedule: timetable grid (week view).
    - grades: overall + per subject details + export.
    - absences: stats + history table + justify flow.
    - history: entry, semester parcours, inscriptions table.
    - payment: solde, echeancier + pay action.
    - notifications: list with filters + mark read (integrates live with NotificationContext).
  - Bilingual via translate().
  - Good UX matching mockups structure (cards, tables, buttons, badges) but with our tokens and shared components where possible.
- [ ] Remove or ignore old sub student pages (consolidate to single path).

## Data & Seeding (for back + front to work)
- [ ] Update iam-service/src/index.js test users: use realistic "Léa Moreau" for student, add comments about needed data for student pages.
- [ ] Add/update seeding notes or logic in academic-service, scheduling-service, billing-service (when ENABLE_TEST_CREDENTIALS) to provide data for the test student (courses, grades, absences, history/semesters, timetable, payments, notifications).
- [ ] Frontend uses mock data initially, prepared to switch to real backend data.

## Other
- [ ] Add any new translate keys in LanguageContext.js for student sections.
- [ ] Integrate NotificationContext in notifications section and sidebar badge.
- [ ] Test only with student test credential on full docker (login, navigate all sections via sidebar using single path + ?tab, interactions, no full reloads, protection, themes, language).
- [ ] Update todo.md as progress is made (mark items, add notes).
- [ ] Before any commit: sync-gitkeep, clean conventional message.

## Commits (on this branch only)
- [ ] Initial branch creation (already done).
- [ ] Commit sidebar + routing + fake assistant + single student page implementation.
- [ ] Commit seeding updates.
- [ ] Any follow-up (e.g. more interactions, translate keys).

Start redoing the code changes now that we are on the fresh correct branch.

All work ONLY for students pages. No other roles.