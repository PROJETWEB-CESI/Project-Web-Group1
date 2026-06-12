'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

const BUCKET_COLORS = {
  '0–5':   '#ef4444',
  '5–10':  '#f97316',
  '10–14': '#3b82f6',
  '14–20': '#10b981',
};

const CustomTooltip = ({ active, payload, label }) => {
  const { translate } = useLanguage();
  if (!active || !payload?.length) return null;
  const n = payload[0].value;
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3 py-2 text-xs shadow-md">
      <div className="font-semibold text-[var(--color-text)] mb-0.5">{label}</div>
      <div className="text-[var(--color-text-muted)]">
        {translate(n === 1 ? 'pendingUnpublishedSingular' : 'pendingUnpublishedPlural', { n }).replace(' non publiée', '').replace(' non publiées', '').replace(' unpublished', '')}
        {n} {n === 1 ? translate('evalGradeCol').toLowerCase() : translate('evalGradeCol').toLowerCase() + 's'}
      </div>
    </div>
  );
};

export default function TeacherGradeDistribution({ distribution }) {
  const { translate } = useLanguage();
  const [activeCourse, setActiveCourse] = useState(0);

  if (!distribution?.length) return null;

  const current = distribution[activeCourse];

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] mt-6 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-[var(--color-text-muted)]">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
        </svg>
        <span className="text-sm font-semibold text-[var(--color-text)]">{translate('gradeDistTitle')}</span>
      </div>

      <div className="p-4">
        {distribution.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {distribution.map((c, i) => (
              <button
                key={c.courseId}
                onClick={() => setActiveCourse(i)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                  i === activeCourse
                    ? 'bg-[var(--color-primary)] text-white border-transparent'
                    : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {c.courseName}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {current.distribution.map(({ range, count }) => (
            <div key={range} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: BUCKET_COLORS[range] }} />
              <span className="text-[var(--color-text-muted)]">{range}</span>
              <span className="font-semibold text-[var(--color-text)]">{count}</span>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={current.distribution} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="gradeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="range"
              tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
              width={24}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#gradeGrad)"
              dot={{ r: 5, fill: '#3b82f6', strokeWidth: 0 }}
              activeDot={{ r: 7, fill: '#3b82f6', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
