'use client';

import { useLanguage } from '@/context/LanguageContext';
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const student = payload.find(p => p.dataKey === 'value');
  const cls = payload.find(p => p.dataKey === 'classAverage');
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3 py-2 text-xs shadow-md">
      <div className="font-semibold text-[var(--color-text)] mb-1">{label}</div>
      {student?.value != null && (
        <div className="text-[var(--color-primary)]">
          {student.value.toFixed(1).replace('.', ',')} / 20
        </div>
      )}
      {cls?.value != null && (
        <div className="text-[var(--color-text-muted)]">
          classe : {cls.value.toFixed(1).replace('.', ',')} / 20
        </div>
      )}
    </div>
  );
};

export default function GradeEvolutionChart({ data }) {
  const { translate } = useLanguage();

  if (!data || data.length < 2) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-[var(--color-text)]">{translate('gradeEvolutionTitle')}</span>
          <span className="text-xs text-[var(--color-text-muted)]">{translate('lastFiveSemesters')}</span>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">
          {translate('notEnoughDataChart')}
        </p>
      </div>
    );
  }

  const last = data[data.length - 1];
  const currentValue = last.value;
  const currentClassAvg = last.classAverage;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[var(--color-text)]">{translate('gradeEvolutionTitle')}</span>
        <span className="text-xs text-[var(--color-text-muted)]">{translate('lastFiveSemesters')}</span>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-semibold text-[var(--color-text)]">
          {currentValue.toFixed(1).replace('.', ',')}
        </span>
        {currentClassAvg != null && (
          <span className="text-sm text-[var(--color-text-muted)]">
            {translate('currentAvgClass', { n: currentClassAvg.toFixed(1).replace('.', ',') })}
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={130}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradeEvolutionGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="var(--color-primary)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={['auto', 'auto']}
            allowDecimals={false}
            tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
            axisLine={false}
            tickLine={false}
            width={28}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }} />

          <Line
            type="monotone"
            dataKey="classAverage"
            stroke="var(--color-text-muted)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            opacity={0.6}
            dot={false}
            activeDot={false}
            connectNulls
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-primary)"
            strokeWidth={2.5}
            fill="url(#gradeEvolutionGrad)"
            dot={{ r: 3.5, fill: 'var(--color-bg-elev)', stroke: 'var(--color-primary)', strokeWidth: 2 }}
            activeDot={{ r: 5, fill: 'var(--color-primary)', strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-1 text-xs text-[var(--color-text-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-5 h-0.5 rounded bg-[var(--color-primary)]" />
          {translate('myAverage')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-5 h-0" style={{ borderTop: '1.5px dashed var(--color-text-muted)', opacity: 0.6 }} />
          {translate('classAverageLabel')}
        </span>
      </div>
    </div>
  );
}
