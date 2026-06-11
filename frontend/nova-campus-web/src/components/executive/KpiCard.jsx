'use client';

export default function KpiCard({ label, value, icon: Icon, accent = 'text-blue-600 bg-blue-500/10', valueClassName = '' }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{label}</span>
        {Icon && (
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
            <Icon size={18} />
          </span>
        )}
      </div>
      <div className={`text-3xl font-bold text-[var(--color-text)] ${valueClassName}`}>
        {value === null || value === undefined ? <span className="opacity-30">—</span> : value}
      </div>
    </div>
  );
}
