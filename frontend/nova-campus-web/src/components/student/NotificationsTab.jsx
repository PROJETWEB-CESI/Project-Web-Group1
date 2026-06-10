'use client';

export default function NotificationsTab({ notifs, markNotifRead, markAllRead }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Notifications</h2>
        <button
          onClick={markAllRead}
          className="text-sm px-3 py-1 border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-hover)]"
        >
          Tout marquer comme lu
        </button>
      </div>
      <div className="space-y-2">
        {notifs.length === 0 && (
          <p className="text-[var(--color-text-muted)]">Aucune notification.</p>
        )}
        {notifs.map(n => (
          <div
            key={n.id}
            className={`p-3 rounded border ${n.read ? 'border-[var(--color-border)] bg-[var(--color-bg-elev)]' : 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'}`}
          >
            <div className="flex justify-between">
              <div>
                <div className="font-medium">{n.title}</div>
                <div className="text-xs text-[var(--color-text-muted)]">{n.type} • {n.time}</div>
              </div>
              {!n.read && (
                <button onClick={() => markNotifRead(n.id)} className="text-sm text-[var(--color-primary)]">
                  Marquer lu
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
