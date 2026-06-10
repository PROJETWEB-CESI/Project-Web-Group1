// Shared course color palette for schedule/timetable/planning views (admin, student, teacher, ...).
// Colors are theme tokens (light/dark/high-contrast variants defined in globals.css), so they stay
// theme-accurate while giving each course its own distinguishable color.
const COURSE_PALETTE = [
  { bg: 'bg-[var(--color-course-1-soft)]', border: 'border-l-[var(--color-course-1)]', text: 'text-[var(--color-course-1)]' },
  { bg: 'bg-[var(--color-course-2-soft)]', border: 'border-l-[var(--color-course-2)]', text: 'text-[var(--color-course-2)]' },
  { bg: 'bg-[var(--color-course-3-soft)]', border: 'border-l-[var(--color-course-3)]', text: 'text-[var(--color-course-3)]' },
  { bg: 'bg-[var(--color-course-4-soft)]', border: 'border-l-[var(--color-course-4)]', text: 'text-[var(--color-course-4)]' },
  { bg: 'bg-[var(--color-course-5-soft)]', border: 'border-l-[var(--color-course-5)]', text: 'text-[var(--color-course-5)]' },
  { bg: 'bg-[var(--color-course-6-soft)]', border: 'border-l-[var(--color-course-6)]', text: 'text-[var(--color-course-6)]' },
  { bg: 'bg-[var(--color-course-7-soft)]', border: 'border-l-[var(--color-course-7)]', text: 'text-[var(--color-course-7)]' },
  { bg: 'bg-[var(--color-course-8-soft)]', border: 'border-l-[var(--color-course-8)]', text: 'text-[var(--color-course-8)]' },
];

// Theme-token variant for exams/special sessions, kept separate from the course palette.
export const EXAM_COLOR = { bg: 'bg-[var(--color-error)]/10', border: 'border-l-[var(--color-error)]', text: 'text-[var(--color-error)]' };

// Deterministic hash so the same course_id always maps to the same palette entry,
// regardless of which page/component renders it or in what order courses appear.
function hashCourseId(courseId) {
  const str = String(courseId || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Returns the { bg, border, text } palette entry for a given course_id.
export function getCourseColor(courseId) {
  return COURSE_PALETTE[hashCourseId(courseId) % COURSE_PALETTE.length];
}
