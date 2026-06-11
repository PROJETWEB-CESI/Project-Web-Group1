'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';

// ── Static icon shapes (language-independent) ─────────────────────────────────

const TYPE_ICONS = {
  timetable: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
  ),
  deadline: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
  ),
  absence: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  announcement: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
    </svg>
  ),
  grade: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  ),
};

// ── Composant ─────────────────────────────────────────────────────────────────

export default function NotificationsTab({ notifs, markNotifRead, markAllRead }) {
  const { translate, isFrench } = useLanguage();
  const pickTitle = (n) => (!isFrench && n.titleEn) ? n.titleEn : n.title;
  const pickBody  = (n) => (!isFrench && n.bodyEn)  ? n.bodyEn  : n.body;
  const [activeFilter, setActiveFilter] = useState('all');

  const typeConfig = {
    timetable: {
      label: translate('notifTypeTimetable'),
      filterLabel: translate('filterTimetable'),
      iconBg: 'bg-[var(--color-course-1-soft)]',
      iconColor: 'var(--color-course-1)',
      badgeBg: 'bg-[var(--color-course-1-soft)]',
      badgeText: 'text-[var(--color-course-1)]',
      icon: TYPE_ICONS.timetable,
    },
    deadline: {
      label: translate('notifTypeDeadline'),
      filterLabel: translate('filterDeadlines'),
      iconBg: 'bg-[var(--color-primary-soft)]',
      iconColor: 'var(--color-primary)',
      badgeBg: 'bg-[var(--color-primary-soft)]',
      badgeText: 'text-[var(--color-primary)]',
      icon: TYPE_ICONS.deadline,
    },
    absence: {
      label: translate('notifTypeAbsence'),
      filterLabel: translate('absences'),
      iconBg: 'bg-[var(--color-success)]/10',
      iconColor: 'var(--color-success)',
      badgeBg: 'bg-[var(--color-success)]/10',
      badgeText: 'text-[var(--color-success)]',
      icon: TYPE_ICONS.absence,
    },
    announcement: {
      label: translate('notifTypeAnnouncement'),
      filterLabel: translate('filterAnnouncements'),
      iconBg: 'bg-[var(--color-accent-soft)]',
      iconColor: 'var(--color-accent)',
      badgeBg: 'bg-[var(--color-accent-soft)]',
      badgeText: 'text-[var(--color-accent)]',
      icon: TYPE_ICONS.announcement,
    },
    grade: {
      label: translate('notifTypeGrade'),
      filterLabel: translate('filterNotes'),
      iconBg: 'bg-[var(--color-success)]/10',
      iconColor: 'var(--color-success)',
      badgeBg: 'bg-[var(--color-success)]/10',
      badgeText: 'text-[var(--color-success)]',
      icon: TYPE_ICONS.grade,
    },
  };

  const filters = [
    { id: 'all',          label: translate('filterAll') },
    { id: 'unread',       label: translate('filterUnread') },
    { id: 'timetable',    label: translate('filterTimetable') },
    { id: 'deadline',     label: translate('filterDeadlines') },
    { id: 'grade',        label: translate('filterNotes') },
    { id: 'absence',      label: translate('absences') },
    { id: 'announcement', label: translate('filterAnnouncements') },
  ];

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours   = Math.floor(diff / 3600000);
    const days    = Math.floor(diff / 86400000);
    if (minutes < 60)  return translate('timeAgoMin', { n: minutes });
    if (hours   < 24)  return translate('timeAgoH',   { n: hours });
    return translate('timeAgoDay', { n: days });
  };

  const buildSubtitle = (ns) => {
    const unread = ns.filter(n => !n.read).length;
    if (unread === 0) return translate('allCaughtUp');
    const types = [...new Set(
      ns.filter(n => !n.read).map(n => typeConfig[n.type]?.filterLabel?.toLowerCase())
    )].filter(Boolean).slice(0, 3);
    const unreadStr = translate('unreadCount', { n: unread });
    return types.length ? `${unreadStr} · ${types.join(', ')}` : unreadStr;
  };

  const counts = useMemo(() => {
    const c = { all: notifs.length, unread: 0 };
    for (const n of notifs) {
      if (!n.read) {
        c.unread = (c.unread || 0) + 1;
        c[n.type] = (c[n.type] || 0) + 1;
      }
    }
    return c;
  }, [notifs]);

  const filtered = useMemo(() => {
    if (activeFilter === 'all')    return notifs;
    if (activeFilter === 'unread') return notifs.filter(n => !n.read);
    return notifs.filter(n => n.type === activeFilter);
  }, [notifs, activeFilter]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-semibold">{translate('notifications')}</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {buildSubtitle(notifs)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-elev)] hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            {translate('markAllAsRead')}
          </button>
        </div>
      </div>

      {/* Body: sidebar + list */}
      <div className="flex gap-4 items-start">

        {/* Sidebar filtre */}
        <aside className="hidden md:block w-48 shrink-0 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-elev)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] tracking-wide">{translate('filterLabel')}</span>
          </div>
          <ul className="py-1">
            {filters.map(f => {
              const count = counts[f.id] ?? 0;
              const active = activeFilter === f.id;
              return (
                <li key={f.id}>
                  <button
                    onClick={() => setActiveFilter(f.id)}
                    className={[
                      'w-full flex justify-between items-center px-4 py-2 text-sm transition-colors',
                      active
                        ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-medium'
                        : 'text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]',
                    ].join(' ')}
                  >
                    <span>{f.label}</span>
                    {count > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]' : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Liste des notifications */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {filtered.length === 0 ? (
            <div className="border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-elev)] px-6 py-10 text-center text-sm text-[var(--color-text-muted)]">
              {translate('noNotificationsInCategory')}
            </div>
          ) : filtered.map(n => {
            const cfg = typeConfig[n.type] ?? typeConfig.announcement;
            return (
              <div
                key={n.id}
                className={[
                  'border rounded-xl px-4 py-3.5 transition-colors',
                  n.read
                    ? 'border-[var(--color-border)] bg-[var(--color-bg-elev)]'
                    : 'border-[var(--color-primary-soft-strong)] bg-[var(--color-primary-soft)]',
                ].join(' ')}
              >
                <div className="flex items-start gap-3">
                  {/* Icône */}
                  <div className={`flex-none w-8 h-8 rounded-full flex items-center justify-center ${cfg.iconBg}`} style={{ color: cfg.iconColor }}>
                    {cfg.icon}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}>
                        {cfg.label}
                      </span>
                      {n.source && (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {n.source}
                          {!n.read && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] align-middle" />}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-text)] leading-snug">
                      {pickTitle(n)}
                    </p>
                    {n.body && (
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-2">
                        {pickBody(n)}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-none flex flex-col items-end gap-2">
                    <span className="text-xs text-[var(--color-text-subtle)] whitespace-nowrap">
                      {timeAgo(n.createdAt)}
                    </span>
                    {!n.read && (
                      <button
                        onClick={() => markNotifRead(n.id)}
                        className="text-xs px-2.5 py-1 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text)]"
                      >
                        {translate('markRead')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
