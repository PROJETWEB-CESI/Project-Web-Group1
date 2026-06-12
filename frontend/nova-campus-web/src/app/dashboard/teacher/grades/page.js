'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

const AVATAR_PALETTES = [
  'bg-blue-500/15 text-blue-700',
  'bg-violet-500/15 text-violet-700',
  'bg-emerald-500/15 text-emerald-700',
  'bg-amber-500/15 text-amber-700',
  'bg-rose-500/15 text-rose-700',
  'bg-cyan-500/15 text-cyan-700',
  'bg-orange-500/15 text-orange-700',
  'bg-teal-500/15 text-teal-700',
];
function paletteFor(str) {
  const h = (str || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTES[h % AVATAR_PALETTES.length];
}

function StudentAvatar({ firstName, lastName }) {
  const ini = ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || '?';
  return (
    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold select-none ${paletteFor((firstName || '') + (lastName || ''))}`}>
      {ini}
    </div>
  );
}

function ScoreCell({ grade, student, evalMeta, courseId, campusId, apiFetch, onSaved }) {
  const [value, setValue] = useState(grade?.score != null ? String(parseFloat(grade.score)) : '');
  const [status, setStatus] = useState('idle');
  const savedScore = useRef(grade?.score != null ? parseFloat(grade.score) : null);
  const gradeIdRef = useRef(grade?.id ?? null);

  useEffect(() => {
    if (grade?.score != null) setValue(String(parseFloat(grade.score)));
    savedScore.current = grade?.score != null ? parseFloat(grade.score) : null;
    gradeIdRef.current = grade?.id ?? null;
  }, [grade?.id, grade?.score]);

  const save = useCallback(async () => {
    const trimmed = value.trim();
    const num = trimmed === '' ? null : parseFloat(trimmed);
    if (num === savedScore.current) return;
    if (trimmed !== '' && (isNaN(num) || num < 0 || num > evalMeta.scoreMax)) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2500);
      return;
    }

    setStatus('saving');
    try {
      let saved;
      if (gradeIdRef.current) {
        const res = await apiFetch(`/api/grades/${gradeIdRef.current}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score: num }),
        });
        if (!res.ok) throw new Error();
        saved = await res.json();
      } else {
        const res = await apiFetch('/api/grades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: student.studentId,
            courseId,
            campusId,
            evaluationName: evalMeta.name,
            evaluationDate: evalMeta.date,
            coefficient: evalMeta.coefficient,
            scoreMax: evalMeta.scoreMax,
            score: num,
          }),
        });
        if (!res.ok) throw new Error();
        saved = await res.json();
        gradeIdRef.current = saved.id;
      }
      savedScore.current = num;
      setStatus('saved');
      onSaved(saved);
      setTimeout(() => setStatus('idle'), 2500);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [value, evalMeta, courseId, campusId, student.studentId, apiFetch, onSaved]);

  const num = value.trim() === '' ? null : parseFloat(value);
  const isInvalid = value.trim() !== '' && (isNaN(num) || num < 0 || num > evalMeta.scoreMax);

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <input
        type="number"
        min={0}
        max={evalMeta.scoreMax}
        step={0.5}
        value={value}
        placeholder="—"
        onChange={e => { setValue(e.target.value); setStatus('idle'); }}
        onBlur={save}
        onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
        className={`w-16 text-center text-sm font-semibold rounded-lg border px-2 py-1.5 outline-none transition-colors
          ${isInvalid
            ? 'border-red-400 bg-red-500/5 text-red-600'
            : status === 'saved'
            ? 'border-emerald-400 bg-emerald-500/5 text-[var(--color-text)]'
            : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:border-[var(--color-primary)]'}`}
      />
      <span className="text-xs text-[var(--color-text-muted)]">/{Math.round(evalMeta.scoreMax)}</span>
      <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
        {status === 'saving' && (
          <svg className="animate-spin w-3.5 h-3.5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {status === 'saved' && (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-emerald-500">
            <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
          </svg>
        )}
        {status === 'error' && (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-red-500">
            <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm2.78-4.22a.75.75 0 0 1-1.06 1.06L8 11.06l-1.72 1.72a.75.75 0 0 1-1.06-1.06L6.94 10 5.22 8.28a.75.75 0 0 1 1.06-1.06L8 8.94l1.72-1.72a.75.75 0 0 1 1.06 1.06L9.06 10l1.72 1.72Z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
  );
}

function EvaluationCard({ evalData, students, courseId, campusId, apiFetch, onGradeSaved, onPublish, onUnpublish, onDelete, publishing, defaultOpen }) {
  const { translate, language } = useLanguage();
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actioning, setActioning] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) { setShowMenu(false); setConfirmDelete(false); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handleUnpublish = async (e) => {
    e.stopPropagation();
    setActioning('unpublish');
    await onUnpublish(evalData.name);
    setActioning(null);
    setShowMenu(false);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setActioning('delete');
    await onDelete(evalData.name);
    setActioning(null);
    setShowMenu(false);
    setConfirmDelete(false);
  };

  const gradedCount    = students.filter(s => evalData.gradeById[s.studentId]?.score != null).length;
  const anyGrade       = students.some(s => evalData.gradeById[s.studentId]);
  const allPublished   = anyGrade && students.every(s => !evalData.gradeById[s.studentId] || evalData.gradeById[s.studentId]?.publishedAt);
  const anyUnpublished = students.some(s => evalData.gradeById[s.studentId] && !evalData.gradeById[s.studentId].publishedAt);
  const pct            = students.length > 0 ? Math.round((gradedCount / students.length) * 100) : 0;

  const status = allPublished ? 'published' : anyUnpublished ? 'pending' : 'empty';
  const stripColor = status === 'published' ? 'bg-emerald-500' : status === 'pending' ? 'bg-amber-500' : 'bg-[var(--color-border)]';
  const barColor   = status === 'published' ? 'bg-emerald-500' : status === 'pending' ? 'bg-amber-400' : 'bg-blue-500';
  const badgeCls   = status === 'published'
    ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
    : status === 'pending'
    ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]';
  const badgeLabel = status === 'published'
    ? translate('evalBadgePublished')
    : status === 'pending'
    ? translate('evalBadgePending')
    : translate('evalBadgeEmpty');

  const dateStr = evalData.date
    ? new Date(evalData.date + 'T00:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="relative rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] flex shadow-sm">
      <div className={`w-1 flex-shrink-0 rounded-l-xl ${stripColor}`} />

      <div className="flex-1 min-w-0">
        <div
          onClick={() => setIsOpen(o => !o)}
          className="w-full flex items-center gap-4 px-4 py-4 hover:bg-[var(--color-surface)] transition-colors cursor-pointer select-none"
        >
          <div className="flex-1 min-w-0">
            <div className="text-base font-bold text-[var(--color-text)] truncate">{evalData.name}</div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {dateStr && (
                <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 opacity-50">
                    <path fillRule="evenodd" d="M4 1.75a.75.75 0 0 1 1.5 0V3h5V1.75a.75.75 0 0 1 1.5 0V3A2 2 0 0 1 14 5v7.5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2V1.75Z" clipRule="evenodd" />
                  </svg>
                  {dateStr}
                </span>
              )}
              <span className="text-xs text-[var(--color-text-muted)] opacity-40">·</span>
              <span className="text-xs font-medium text-[var(--color-text-muted)]">/{Math.round(evalData.scoreMax)}</span>
              <span className="text-xs text-[var(--color-text-muted)] opacity-40">·</span>
              <span className="text-xs font-medium text-[var(--color-text-muted)]">coeff ×{evalData.coefficient}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex flex-col items-end gap-1.5 w-24">
              <div className="text-sm">
                <span className="font-extrabold text-[var(--color-text)]">{gradedCount}</span>
                <span className="text-[var(--color-text-muted)] text-xs"> / {students.length}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--color-border)]">
                <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
            </div>

            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${badgeCls}`}>
              {badgeLabel}
            </span>

            <div className="relative" ref={menuRef} onClick={e => e.stopPropagation()}>
              <button
                onClick={() => { setShowMenu(o => !o); setConfirmDelete(false); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-border)] transition-colors"
                title="Actions"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                  <path d="M8 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM8 6.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM9.5 12.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 top-9 z-20 w-52 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl py-1 overflow-hidden">
                  {anyUnpublished || allPublished ? (
                    <button
                      onClick={handleUnpublish}
                      disabled={actioning === 'unpublish'}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg-elev)] transition-colors disabled:opacity-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-amber-500 flex-shrink-0">
                        <path fillRule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z" clipRule="evenodd" />
                      </svg>
                      {actioning === 'unpublish' ? translate('evalUnpublishing') : translate('evalUnpublishGrades')}
                    </button>
                  ) : null}

                  <div className="mx-2 my-1 h-px bg-[var(--color-border)]" />

                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-500/5 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                        <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.712Z" clipRule="evenodd" />
                      </svg>
                      {translate('evalDeleteEval')}
                    </button>
                  ) : (
                    <div className="px-3 py-2.5">
                      <p className="text-xs font-semibold text-red-600 mb-2">
                        {translate('evalDeleteAllGrades')}<br />
                        <span className="font-normal text-[var(--color-text-muted)]">{translate('evalDeleteIrreversible')}</span>
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDelete}
                          disabled={actioning === 'delete'}
                          className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          {actioning === 'delete' ? translate('evalDeleting') : translate('evalConfirm')}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="flex-1 text-xs font-semibold py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elev)] transition-colors"
                        >
                          {translate('cancel')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
              className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>

        {isOpen && (
          <div className="border-t border-[var(--color-border)]">
            {anyUnpublished && (
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-500/5 border-b border-amber-500/10">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-amber-600 flex-shrink-0">
                    <path fillRule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-medium text-amber-700">{translate('evalGradesNotVisible')}</span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onPublish(); }}
                  disabled={publishing}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {publishing ? translate('evalPublishing') : translate('gradesPublishAll')}
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 px-4 py-2.5 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
              <div className="w-8 flex-shrink-0" />
              <div className="flex-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{translate('evalStudentCol')}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] pr-5">{translate('evalGradeCol')}</div>
            </div>

            {students.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">{translate('evalNoStudents')}</div>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {students.map((student, idx) => {
                  const grade = evalData.gradeById[student.studentId];
                  return (
                    <div
                      key={student.studentId}
                      className={`flex items-center gap-3 px-4 py-3 ${idx % 2 !== 0 ? 'bg-black/[0.02] dark:bg-white/[0.02]' : ''}`}
                    >
                      <StudentAvatar firstName={student.firstName} lastName={student.lastName} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[var(--color-text)] truncate">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-xs text-[var(--color-text-muted)] truncate">
                          {student.program
                            ? <>{student.program}{student.enrollmentYear ? ` · ${translate('classOf', { year: student.enrollmentYear })}` : ''}</>
                            : student.studentId}
                        </div>
                      </div>
                      {grade?.publishedAt && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0">
                          <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                        </svg>
                      )}
                      <ScoreCell
                        grade={grade}
                        student={student}
                        evalMeta={evalData}
                        courseId={courseId}
                        campusId={campusId}
                        apiFetch={apiFetch}
                        onSaved={onGradeSaved}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeacherGradesPage() {
  const { user } = useAuth();
  const { apiFetch } = useApi();
  const { translate } = useLanguage();
  const searchParams = useSearchParams();

  const [courses, setCourses]               = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [students, setStudents]             = useState([]);
  const [grades, setGrades]                 = useState([]);
  const [loading, setLoading]               = useState(true);
  const [courseLoading, setCourseLoading]   = useState(false);
  const [showNewEval, setShowNewEval]       = useState(false);
  const [newEval, setNewEval]               = useState({
    name: '', date: new Date().toISOString().slice(0, 10), scoreMax: '20', coefficient: '1',
  });
  const [pendingEvals, setPendingEvals]     = useState([]);
  const [publishing, setPublishing]         = useState(false);

  const fetchJson = useCallback(async (url) => {
    try {
      const res = await apiFetch(url);
      return res.ok ? await res.json() : null;
    } catch { return null; }
  }, [apiFetch]);

  useEffect(() => {
    if (!user?.instructorId) return;
    fetchJson(`/api/timetables/?instructor_id=${user.instructorId}`).then(timetables => {
      if (!Array.isArray(timetables)) { setLoading(false); return; }
      const map = {};
      for (const t of timetables) {
        if (!map[t.course_id]) {
          map[t.course_id] = { courseId: t.course_id, courseName: t.course?.course_name || t.course_id };
        }
      }
      const list = Object.values(map);
      setCourses(list);
      const urlCourse = searchParams.get('course');
      const initial = (urlCourse && list.find(c => c.courseId === urlCourse)) ? urlCourse : list[0]?.courseId ?? null;
      setSelectedCourseId(initial);
      setLoading(false);
    });
  }, [user, fetchJson, searchParams]);

  useEffect(() => {
    if (!selectedCourseId || !user?.campusId) return;
    let cancelled = false;
    setCourseLoading(true);
    setGrades([]);
    setStudents([]);
    setPendingEvals([]);

    Promise.all([
      fetchJson(`/api/grades/course/${selectedCourseId}?campusId=${user.campusId}`),
      fetchJson(`/api/teacher/courses/${selectedCourseId}/students?campusId=${user.campusId}`),
    ]).then(([gradesData, studentsData]) => {
      if (cancelled) return;
      if (Array.isArray(gradesData)) setGrades(gradesData);
      if (Array.isArray(studentsData)) setStudents(studentsData);
      setCourseLoading(false);
    });
    return () => { cancelled = true; };
  }, [selectedCourseId, user, fetchJson]);

  const evaluations = useMemo(() => {
    const map = {};
    for (const g of grades) {
      if (!map[g.evaluationName]) {
        map[g.evaluationName] = {
          name: g.evaluationName,
          date: g.evaluationDate,
          scoreMax: parseFloat(g.scoreMax),
          coefficient: g.coefficient,
          gradeById: {},
        };
      }
      map[g.evaluationName].gradeById[g.studentId] = g;
    }
    return Object.values(map).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [grades]);

  const allEvaluations = useMemo(() => {
    const names = new Set(evaluations.map(e => e.name));
    return [
      ...evaluations,
      ...pendingEvals.filter(p => !names.has(p.name)),
    ];
  }, [evaluations, pendingEvals]);

  const handleGradeSaved = useCallback((savedGrade) => {
    setGrades(prev => {
      const idx = prev.findIndex(g => g.id === savedGrade.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = savedGrade; return next; }
      return [...prev, savedGrade];
    });
    setPendingEvals(prev => prev.filter(p => p.name !== savedGrade.evaluationName));
  }, []);

  const handlePublish = useCallback(async () => {
    if (!selectedCourseId || !user?.campusId) return;
    setPublishing(true);
    try {
      await apiFetch(`/api/grades/course/${selectedCourseId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campusId: user.campusId }),
      });
      setGrades(prev => prev.map(g => g.publishedAt ? g : { ...g, publishedAt: new Date().toISOString() }));
    } catch {}
    setPublishing(false);
  }, [selectedCourseId, user, apiFetch]);

  const handleUnpublish = useCallback(async (evaluationName) => {
    if (!selectedCourseId || !user?.campusId) return;
    try {
      await apiFetch(`/api/grades/course/${selectedCourseId}/unpublish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campusId: user.campusId, evaluationName }),
      });
      setGrades(prev => prev.map(g =>
        g.evaluationName === evaluationName ? { ...g, publishedAt: null } : g
      ));
    } catch {}
  }, [selectedCourseId, user, apiFetch]);

  const handleDeleteEval = useCallback(async (evaluationName) => {
    if (!selectedCourseId || !user?.campusId) return;
    try {
      await apiFetch(
        `/api/grades/course/${selectedCourseId}/evaluation?campusId=${encodeURIComponent(user.campusId)}&evaluationName=${encodeURIComponent(evaluationName)}`,
        { method: 'DELETE' }
      );
      setGrades(prev => prev.filter(g => g.evaluationName !== evaluationName));
    } catch {}
  }, [selectedCourseId, user, apiFetch]);

  const handleCreateEval = useCallback(() => {
    const name = newEval.name.trim();
    if (!name || !newEval.date) return;
    const scoreMax = parseFloat(newEval.scoreMax) || 20;
    const coefficient = parseInt(newEval.coefficient) || 1;
    setPendingEvals(prev => {
      if (prev.find(p => p.name === name) || evaluations.find(e => e.name === name)) return prev;
      return [...prev, { name, date: newEval.date, scoreMax, coefficient, gradeById: {} }];
    });
    setNewEval({ name: '', date: new Date().toISOString().slice(0, 10), scoreMax: '20', coefficient: '1' });
    setShowNewEval(false);
  }, [newEval, evaluations]);

  const unpublishedCount = grades.filter(g => !g.publishedAt && g.score != null).length;

  if (loading) return (
    <div className="flex items-center justify-center h-48 text-sm text-[var(--color-text-muted)]">{translate('loading')}</div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">{translate('gradeEntry')}</h1>
        <p className="text-[var(--color-text-muted)] mt-1">{translate('gradesSubtitle')}</p>
      </div>

      {courses.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6 -mx-0.5 px-0.5">
          {courses.map(c => (
            <button
              key={c.courseId}
              onClick={() => setSelectedCourseId(c.courseId)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors border whitespace-nowrap ${
                selectedCourseId === c.courseId
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                  : 'bg-[var(--color-bg-elev)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
              }`}
            >
              {c.courseName}
            </button>
          ))}
        </div>
      )}

      {courses.length === 0 && (
        <div className="py-16 text-center text-sm text-[var(--color-text-muted)]">{translate('attNoCoursesFound')}</div>
      )}

      {selectedCourseId && (
        courseLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--color-text-muted)]">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            {translate('gradesLoadingCourse')}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                {
                  labelKey: 'gradesStatStudents',
                  value: students.length,
                  icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-blue-500"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z"/></svg>,
                  iconBg: 'bg-blue-500/10',
                },
                {
                  labelKey: 'gradesStatEvals',
                  value: allEvaluations.length,
                  icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-violet-500"><path fillRule="evenodd" d="M5.25 1A2.25 2.25 0 0 0 3 3.25v9.5A2.25 2.25 0 0 0 5.25 15h5.5A2.25 2.25 0 0 0 13 12.75v-9.5A2.25 2.25 0 0 0 10.75 1h-5.5ZM8 10a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 10Zm2.28-5.22a.75.75 0 0 1 0 1.06l-2 2a.75.75 0 0 1-1.06 0l-1-1a.75.75 0 0 1 1.06-1.06l.47.47 1.47-1.47a.75.75 0 0 1 1.06 0Z" clipRule="evenodd"/></svg>,
                  iconBg: 'bg-violet-500/10',
                },
                {
                  labelKey: 'gradesStatToPublish',
                  value: unpublishedCount,
                  icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-amber-500"><path fillRule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd"/></svg>,
                  iconBg: 'bg-amber-500/10',
                  valueColor: unpublishedCount > 0 ? 'text-amber-600' : undefined,
                },
              ].map(({ labelKey, value, icon, iconBg, valueColor }) => (
                <div key={labelKey} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)]">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>{icon}</div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{translate(labelKey)}</div>
                    <div className={`text-lg font-extrabold mt-0.5 ${valueColor || 'text-[var(--color-text)]'}`}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="text-xs text-[var(--color-text-muted)]">
                {allEvaluations.length > 0 && translate('gradesPublishedOf', {
                  published: allEvaluations.filter(e => Object.keys(e.gradeById).length > 0 && students.every(s => !e.gradeById[s.studentId] || e.gradeById[s.studentId]?.publishedAt)).length,
                  total: allEvaluations.length,
                })}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {unpublishedCount > 0 && (
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                    </svg>
                    {translate('gradesPublishAll')}
                  </button>
                )}
                <button
                  onClick={() => setShowNewEval(o => !o)}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${
                    showNewEval
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                      : 'bg-[var(--color-bg-elev)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-surface)]'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                  </svg>
                  {translate('gradesNewEval')}
                </button>
              </div>
            </div>

            {showNewEval && (
              <div className="mb-5 rounded-xl border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5 p-4">
                <h3 className="text-sm font-bold text-[var(--color-text)] mb-3">{translate('gradesNewEval')}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">{translate('gradesTitleLabel')}</label>
                    <input
                      type="text"
                      placeholder={translate('gradesTitlePlaceholder')}
                      value={newEval.name}
                      onChange={e => setNewEval(p => ({ ...p, name: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleCreateEval()}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">{translate('gradesDateLabel')}</label>
                    <input
                      type="date"
                      value={newEval.date}
                      onChange={e => setNewEval(p => ({ ...p, date: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">{translate('gradesMaxScore')}</label>
                    <input
                      type="number"
                      min={1} max={100}
                      value={newEval.scoreMax}
                      onChange={e => setNewEval(p => ({ ...p, scoreMax: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">{translate('gradesWeight')}</label>
                    <input
                      type="number"
                      min={1} max={10}
                      value={newEval.coefficient}
                      onChange={e => setNewEval(p => ({ ...p, coefficient: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowNewEval(false)}
                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elev)] transition-colors"
                  >
                    {translate('cancel')}
                  </button>
                  <button
                    onClick={handleCreateEval}
                    disabled={!newEval.name.trim() || !newEval.date}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    {translate('gradesCreateEval')}
                  </button>
                </div>
              </div>
            )}

            {allEvaluations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-[var(--color-text-muted)] opacity-40">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{translate('gradesNoEvals')}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{translate('gradesNoEvalsHint')}</p>
                </div>
                <button
                  onClick={() => setShowNewEval(true)}
                  className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                  </svg>
                  {translate('gradesNewEval')}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {allEvaluations.map(ev => (
                  <EvaluationCard
                    key={ev.name}
                    evalData={ev}
                    students={students}
                    courseId={selectedCourseId}
                    campusId={user.campusId}
                    apiFetch={apiFetch}
                    onGradeSaved={handleGradeSaved}
                    onPublish={handlePublish}
                    onUnpublish={handleUnpublish}
                    onDelete={handleDeleteEval}
                    publishing={publishing}
                    defaultOpen={pendingEvals.some(p => p.name === ev.name)}
                  />
                ))}
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
