'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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

const STATUS_CONFIG = {
  present: {
    labelKey: 'statusPresent',
    shortLabel: 'P',
    active: 'bg-emerald-500 text-white border-emerald-500',
    inactive: 'bg-transparent text-emerald-700 border-emerald-300 hover:bg-emerald-500/10',
    strip: 'bg-emerald-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
        <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
      </svg>
    ),
  },
  late: {
    labelKey: 'statusLate',
    shortLabel: 'L',
    active: 'bg-amber-500 text-white border-amber-500',
    inactive: 'bg-transparent text-amber-700 border-amber-300 hover:bg-amber-500/10',
    strip: 'bg-amber-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
        <path fillRule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z" clipRule="evenodd" />
      </svg>
    ),
  },
  absent: {
    labelKey: 'statusAbsent',
    shortLabel: 'A',
    active: 'bg-red-500 text-white border-red-500',
    inactive: 'bg-transparent text-red-600 border-red-300 hover:bg-red-500/10',
    strip: 'bg-red-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
        <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm2.78-4.22a.75.75 0 0 1-1.06 1.06L8 11.06l-1.72 1.72a.75.75 0 0 1-1.06-1.06L6.94 10 5.22 8.28a.75.75 0 0 1 1.06-1.06L8 8.94l1.72-1.72a.75.75 0 0 1 1.06 1.06L9.06 10l1.72 1.72Z" clipRule="evenodd" />
      </svg>
    ),
  },
};

function StatusToggle({ value, onChange }) {
  const { translate } = useLanguage();
  return (
    <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden flex-shrink-0">
      {['present', 'late', 'absent'].map((s) => {
        const cfg = STATUS_CONFIG[s];
        const isActive = value === s;
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            title={translate(cfg.labelKey)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold border-r last:border-r-0 border-[var(--color-border)] transition-colors ${isActive ? cfg.active : cfg.inactive}`}
          >
            {cfg.icon}
            <span className="hidden sm:inline">{translate(cfg.labelKey)}</span>
            <span className="sm:hidden">{cfg.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

function StudentRow({ student, status, justificationNote, recordId, onStatusChange, onJustify, idx }) {
  const { translate } = useLanguage();
  const [showJustify, setShowJustify] = useState(false);
  const [justifyText, setJustifyText] = useState(justificationNote || '');
  const [justifying, setJustifying] = useState(false);

  const needsJustify = status === 'absent' || status === 'late';
  const isJustified = !!justificationNote;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.present;

  return (
    <div className={`flex flex-col ${idx % 2 !== 0 ? 'bg-black/[0.02] dark:bg-white/[0.02]' : ''}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-0.5 h-8 rounded-full flex-shrink-0 transition-colors ${cfg.strip}`} />

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

        <div className="flex items-center gap-2 flex-shrink-0">
          {needsJustify && recordId && (
            <button
              onClick={() => setShowJustify(o => !o)}
              title={isJustified ? translate('attJustifiedProvided') : translate('attAddJustification')}
              className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border transition-colors ${
                isJustified
                  ? 'bg-blue-500/10 text-blue-700 border-blue-300'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--color-bg-elev)]'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Zm2 0h8v8H4V4Zm1 1.5a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5A.75.75 0 0 1 5 5.5Zm0 3a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 5 8.5Z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">{isJustified ? translate('attJustified') : translate('attJustify')}</span>
            </button>
          )}
          <StatusToggle value={status} onChange={onStatusChange} />
        </div>
      </div>

      {showJustify && recordId && (
        <div className="px-4 pb-3 ml-10">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={translate('attReasonPlaceholder')}
              value={justifyText}
              onChange={e => setJustifyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !justifying && handleJustify()}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors"
            />
            <button
              onClick={async () => {
                if (!justifyText.trim() || justifying) return;
                setJustifying(true);
                await onJustify(recordId, justifyText.trim());
                setJustifying(false);
                setShowJustify(false);
              }}
              disabled={!justifyText.trim() || justifying}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-40"
            >
              {justifying ? '…' : translate('attSubmit')}
            </button>
            <button
              onClick={() => setShowJustify(false)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elev)] transition-colors"
            >
              {translate('cancel')}
            </button>
          </div>
          {justificationNote && (
            <p className="mt-1.5 text-xs text-blue-700 italic">{translate('attCurrentJustification')} {justificationNote}</p>
          )}
        </div>
      )}
    </div>
  );
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function dayNameOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return DAY_NAMES[new Date(y, m - 1, d).getDay()];
}

export default function TeacherAttendancePage() {
  const { user } = useAuth();
  const { apiFetch } = useApi();
  const { translate, language } = useLanguage();

  const today = new Date().toISOString().slice(0, 10);
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';

  const [courses, setCourses] = useState([]);
  const [courseDays, setCourseDays] = useState({});
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [sessionDate, setSessionDate] = useState(today);
  const [students, setStudents] = useState([]);
  const [existingRecords, setExistingRecords] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

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
      const days = {};
      for (const t of timetables) {
        if (!map[t.course_id]) {
          map[t.course_id] = { courseId: t.course_id, courseName: t.course?.course_name || t.course_id };
          days[t.course_id] = new Set();
        }
        if (t.day_of_week) days[t.course_id].add(t.day_of_week);
      }
      const list = Object.values(map);
      setCourses(list);
      setCourseDays(days);
      setSelectedCourseId(list[0]?.courseId ?? null);
      setLoading(false);
    });
  }, [user, fetchJson]);

  useEffect(() => {
    if (!selectedCourseId || !user?.campusId || !sessionDate) return;
    let cancelled = false;
    setSessionLoading(true);

    Promise.all([
      fetchJson(`/api/teacher/courses/${selectedCourseId}/students?campusId=${user.campusId}`),
      fetchJson(`/api/attendance/course/${selectedCourseId}?campusId=${user.campusId}&sessionDate=${sessionDate}`),
    ]).then(([studentsData, attendanceData]) => {
      if (cancelled) return;
      const sts = Array.isArray(studentsData) ? studentsData : [];
      const att = Array.isArray(attendanceData) ? attendanceData : [];
      setStudents(sts);
      setExistingRecords(att);

      const attMap = {};
      for (const r of att) attMap[r.studentId] = r.status;
      const initialStatuses = {};
      for (const s of sts) initialStatuses[s.studentId] = attMap[s.studentId] || 'present';
      setStatuses(initialStatuses);
      setSavedAt(att.length > 0 ? att[0].updatedAt || att[0].createdAt : null);
      setSessionLoading(false);
    });
    return () => { cancelled = true; };
  }, [selectedCourseId, sessionDate, user, fetchJson]);

  const recordById = useMemo(() => {
    const map = {};
    for (const r of existingRecords) map[r.studentId] = r;
    return map;
  }, [existingRecords]);

  const handleStatusChange = (studentId, newStatus) => {
    setStatuses(prev => ({ ...prev, [studentId]: newStatus }));
    setSavedAt(null);
  };

  const handleJustify = useCallback(async (recordId, note) => {
    try {
      const res = await apiFetch(`/api/attendance/${recordId}/justify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ justificationNote: note }),
      });
      if (res.ok) {
        const updated = await res.json();
        setExistingRecords(prev => prev.map(r => r.id === recordId ? updated : r));
      }
    } catch {}
  }, [apiFetch]);

  const handleSave = useCallback(async () => {
    if (!selectedCourseId || !user?.campusId || students.length === 0) return;
    setSaving(true);
    try {
      const records = students.map(s => ({
        studentId: s.studentId,
        courseId: selectedCourseId,
        campusId: user.campusId,
        sessionDate,
        status: statuses[s.studentId] || 'present',
      }));
      const res = await apiFetch('/api/attendance/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });
      if (res.ok) {
        const saved = await res.json();
        setExistingRecords(Array.isArray(saved) ? saved : []);
        setSavedAt(new Date().toISOString());
      }
    } catch {}
    setSaving(false);
  }, [selectedCourseId, user, sessionDate, students, statuses, apiFetch]);

  const stats = useMemo(() => {
    const vals = Object.values(statuses);
    return {
      present: vals.filter(v => v === 'present').length,
      late: vals.filter(v => v === 'late').length,
      absent: vals.filter(v => v === 'absent').length,
      total: vals.length,
    };
  }, [statuses]);

  const hasExisting = existingRecords.length > 0;

  const hasSession = useMemo(() => {
    if (!selectedCourseId || !sessionDate) return false;
    const days = courseDays[selectedCourseId];
    if (!days || days.size === 0) return true;
    return days.has(dayNameOf(sessionDate));
  }, [selectedCourseId, sessionDate, courseDays]);

  if (loading) return (
    <div className="flex items-center justify-center h-48 text-sm text-[var(--color-text-muted)]">{translate('loading')}</div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">{translate('attTitle')}</h1>
        <p className="text-[var(--color-text-muted)] mt-1">{translate('attSubtitle')}</p>
      </div>

      {courses.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6 -mx-0.5 px-0.5">
          {courses.map(c => (
            <button
              key={c.courseId}
              onClick={() => { setSelectedCourseId(c.courseId); setSavedAt(null); }}
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
        <>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0">
                <path fillRule="evenodd" d="M4 1.75a.75.75 0 0 1 1.5 0V3h5V1.75a.75.75 0 0 1 1.5 0V3A2 2 0 0 1 14 5v7.5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2V1.75Z" clipRule="evenodd" />
              </svg>
              <label className="text-sm font-semibold text-[var(--color-text)] whitespace-nowrap">{translate('attSessionOn')}</label>
              <input
                type="date"
                value={sessionDate}
                onChange={e => { setSessionDate(e.target.value); setSavedAt(null); }}
                className="px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors"
              />
              {sessionDate === today && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">{translate('attToday')}</span>
              )}
            </div>

            {hasSession && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {savedAt && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                    </svg>
                    {hasExisting ? translate('attAttendanceSaved') : translate('attSaved')}
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || students.length === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      {translate('attSaving')}
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                      </svg>
                      {hasExisting ? translate('attUpdate') : translate('attSaveAttendance')}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {hasSession && <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { labelKey: 'attStatPresent', value: stats.present, color: 'text-emerald-600', bg: 'bg-emerald-500/10', icon: STATUS_CONFIG.present.icon },
              { labelKey: 'attStatLate', value: stats.late, color: 'text-amber-600', bg: 'bg-amber-500/10', icon: STATUS_CONFIG.late.icon },
              { labelKey: 'attStatAbsent', value: stats.absent, color: 'text-red-600', bg: 'bg-red-500/10', icon: STATUS_CONFIG.absent.icon },
            ].map(({ labelKey, value, color, bg, icon }) => (
              <div key={labelKey} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)]">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg} ${color}`}>{icon}</div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{translate(labelKey)}</div>
                  <div className={`text-lg font-extrabold mt-0.5 ${color}`}>{value}</div>
                </div>
              </div>
            ))}
          </div>}

          {!hasSession ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)]">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-[var(--color-text-muted)] opacity-40">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">{translate('attNoSessionTitle')}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  {new Date(...sessionDate.split('-').map(Number).map((v, i) => i === 1 ? v - 1 : v)).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
          ) : sessionLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--color-text-muted)]">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {translate('loading')}
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)]">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-[var(--color-text-muted)] opacity-40">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">{translate('attNoStudentsTitle')}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{translate('attNoStudentsBody')}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                <div className="w-0.5 flex-shrink-0" />
                <div className="w-8 flex-shrink-0" />
                <div className="flex-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{translate('attStudentCol')}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] pr-1">{translate('attStatusCol')}</div>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)]/50 border-b border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-text-muted)] mr-1">{translate('attMarkAll')}</span>
                {['present', 'late', 'absent'].map(s => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        const next = {};
                        for (const st of students) next[st.studentId] = s;
                        setStatuses(next);
                        setSavedAt(null);
                      }}
                      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-colors ${cfg.inactive}`}
                    >
                      {cfg.icon}
                      {translate(cfg.labelKey)}
                    </button>
                  );
                })}
              </div>

              <div className="divide-y divide-[var(--color-border)]">
                {students.map((student, idx) => (
                  <StudentRow
                    key={student.studentId}
                    student={student}
                    status={statuses[student.studentId] || 'present'}
                    justificationNote={recordById[student.studentId]?.justificationNote}
                    recordId={recordById[student.studentId]?.id}
                    onStatusChange={s => handleStatusChange(student.studentId, s)}
                    onJustify={handleJustify}
                    idx={idx}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-text-muted)]">
                  {translate(students.length === 1 ? 'attStudentSingular' : 'attStudentPlural', { n: students.length })}
                  {stats.total > 0 && ` · ${translate('attAttendancePct', { pct: Math.round((stats.present / stats.total) * 100) })}`}
                </span>
                <button
                  onClick={handleSave}
                  disabled={saving || students.length === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {saving ? translate('attSaving') : hasExisting ? translate('attUpdate') : translate('attSaveAttendance')}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
