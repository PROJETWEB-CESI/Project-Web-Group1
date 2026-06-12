'use client';

export default function KpiCard({
  label,
  value,
  icon: Icon,
  accent = 'text-[var(--color-course-6)] bg-[var(--color-course-6-soft)]',
  topBar = 'from-[var(--color-course-6)] to-[var(--color-course-5)]',
  valueClassName = '',
}) {
  return (
    <div className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 overflow-hidden hover:shadow-md hover:border-[var(--color-border-strong)] transition-all duration-200">
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${topBar}`} />

      <div className="flex items-start justify-between gap-2 mb-4 mt-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--color-text-muted)] leading-tight pr-1">
          {label}
        </span>
        {Icon && (
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
            <Icon size={18} />
          </span>
        )}
      </div>

      <div className={`text-[2.125rem] font-extrabold leading-none text-[var(--color-text)] ${valueClassName}`}>
        {value === null || value === undefined ? (
          <span className="opacity-20 text-2xl font-light">—</span>
        ) : (
          value
        )}
      </div>
    </div>
  );
}
