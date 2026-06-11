'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

const PADDING = { top: 20, right: 16, bottom: 36, left: 36 };

function buildPath(points) {
  if (points.length < 2) return '';
  return points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');
}

function buildSmoothPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

function buildAreaPath(points, chartHeight) {
  if (points.length < 2) return '';
  const bottom = PADDING.top + chartHeight;
  let d = `M ${points[0].x} ${bottom}`;
  d += ` L ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  d += ` L ${points[points.length - 1].x} ${bottom} Z`;
  return d;
}

export default function GradeEvolutionChart({ data, classAverage = 13.1 }) {
  const { translate } = useLanguage();
  const containerRef = useRef(null);
  const [width, setWidth] = useState(500);
  const [tooltip, setTooltip] = useState(null);

  const chartData = data;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const newWidth = entry.contentRect.width || 500;
      if (newWidth !== width) {
        setWidth(newWidth);
      }
    });
    observer.observe(containerRef.current);
    // Set initial width
    const initialWidth = containerRef.current.offsetWidth || 500;
    setWidth(initialWidth);
    return () => observer.disconnect();
  }, [width]);

  const chartHeight = 100;
  const svgHeight = PADDING.top + chartHeight + PADDING.bottom;
  const chartWidth = width - PADDING.left - PADDING.right;

  if (!chartData || chartData.length < 2) {
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

  const allValues = chartData.map((d) => d.value);
  const minVal = Math.floor(Math.min(...allValues, classAverage) - 1);
  const maxVal = Math.ceil(Math.max(...allValues, classAverage) + 0.5);

  const toX = (i) => PADDING.left + (i / (chartData.length - 1)) * chartWidth;
  const toY = (v) => PADDING.top + chartHeight - ((v - minVal) / (maxVal - minVal)) * chartHeight;

  const studentPoints = chartData.map((d, i) => ({ x: toX(i), y: toY(d.value) }));
  const avgY = toY(classAverage);

  const currentValue = chartData[chartData.length - 1].value;
  const lastPoint = studentPoints[studentPoints.length - 1];

  const yTicks = [];
  for (let v = minVal; v <= maxVal; v += 2) yTicks.push(v);

  const handleMouseMove = (e) => {
    const svg = e.currentTarget;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const { x: mouseX } = pt.matrixTransform(ctm.inverse());
    const step = chartWidth / (chartData.length - 1);
    const raw = (mouseX - PADDING.left) / step;
    const idx = Math.min(chartData.length - 1, Math.max(0, Math.round(raw)));
    if (raw >= -0.5 && raw <= chartData.length - 0.5) {
      setTooltip({ idx, x: studentPoints[idx].x, y: studentPoints[idx].y, d: chartData[idx] });
    } else {
      setTooltip(null);
    }
  };

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
        <span className="text-sm text-[var(--color-text-muted)]">
          {translate('currentAvgClass', { n: classAverage.toFixed(1).replace('.', ',') })}
        </span>
      </div>

      <div ref={containerRef} className="w-full relative">
        <svg
          width={width}
          height={svgHeight}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
          style={{ display: 'block', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="grade-area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.01" />
            </linearGradient>
            <clipPath id="grade-chart-clip">
              <rect
                x={PADDING.left}
                y={PADDING.top}
                width={chartWidth}
                height={chartHeight}
              />
            </clipPath>
          </defs>

          {/* Y grid lines + ticks */}
          {yTicks.map((v) => {
            const y = toY(v);
            return (
              <g key={v}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={PADDING.left + chartWidth}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                />
                <text
                  x={PADDING.left - 6}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill="var(--color-text-muted)"
                >
                  {v}
                </text>
              </g>
            );
          })}

          {/* Class average reference line */}
          <line
            x1={PADDING.left}
            y1={avgY}
            x2={PADDING.left + chartWidth}
            y2={avgY}
            stroke="var(--color-text-muted)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            opacity={0.6}
          />

          {/* Area fill */}
          <path
            d={buildAreaPath(studentPoints, chartHeight)}
            fill="url(#grade-area-gradient)"
            clipPath="url(#grade-chart-clip)"
          />

          {/* Student line */}
          <path
            d={buildSmoothPath(studentPoints)}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots */}
          {studentPoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={tooltip?.idx === i ? 5 : 3.5}
              fill="var(--color-bg-elev)"
              stroke="var(--color-primary)"
              strokeWidth={2}
              style={{ transition: 'r 120ms' }}
            />
          ))}

          {/* Last dot accent */}
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={5}
            fill="var(--color-primary)"
          />

          {/* X axis labels */}
          {chartData.map((d, i) => (
            <text
              key={i}
              x={toX(i)}
              y={svgHeight - 6}
              textAnchor="middle"
              fontSize={10}
              fill={i === chartData.length - 1 ? 'var(--color-primary)' : 'var(--color-text-muted)'}
              fontWeight={i === chartData.length - 1 ? 600 : 400}
            >
              {d.label}
            </text>
          ))}

          {/* Tooltip */}
          {tooltip && (
            <g>
              <line
                x1={tooltip.x}
                y1={PADDING.top}
                x2={tooltip.x}
                y2={PADDING.top + chartHeight}
                stroke="var(--color-primary)"
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.5}
              />
              <rect
                x={tooltip.x + (tooltip.idx >= chartData.length - 2 ? -72 : 8)}
                y={tooltip.y - 26}
                width={64}
                height={24}
                rx={5}
                fill="var(--color-text)"
                opacity={0.9}
              />
              <text
                x={tooltip.x + (tooltip.idx >= chartData.length - 2 ? -40 : 40)}
                y={tooltip.y - 9}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                fill="var(--color-bg-elev)"
              >
                {tooltip.d.label} · {tooltip.d.value.toFixed(1).replace('.', ',')}
              </text>
            </g>
          )}
        </svg>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-1 text-xs text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-5 h-0.5 rounded bg-[var(--color-primary)]" />
            {translate('myAverage')}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-5 h-0"
              style={{
                borderTop: '1.5px dashed var(--color-text-muted)',
                opacity: 0.6,
              }}
            />
            {translate('classAverageLabel')}
          </span>
        </div>
      </div>
    </div>
  );
}
