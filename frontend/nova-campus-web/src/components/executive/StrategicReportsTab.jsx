'use client';

import { useState } from 'react';
import { Building2, BookOpen, AlertCircle, FileWarning, Download, Eye, FilePieChart, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import Button from '@/components/shared/Button';
import ScrollShadow from '@/components/shared/ScrollShadow';
import useBackdropClose from '@/hooks/useBackdropClose';
import KpiCard from './KpiCard';

const REPORT_ICONS = {
  campusComparison: Building2,
  programIndicators: BookOpen,
  retention: AlertCircle,
  overduePayments: FileWarning,
};

const REPORT_ACCENTS = {
  campusComparison: 'text-[var(--color-course-6)] bg-[var(--color-course-6-soft)]',
  programIndicators: 'text-[var(--color-course-7)] bg-[var(--color-course-7-soft)]',
  retention: 'text-[var(--color-course-2)] bg-[var(--color-course-2-soft)]',
  overduePayments: 'text-[var(--color-error)] bg-[color-mix(in_oklch,var(--color-error)_10%,transparent)]',
};

function formatEuro(value) {
  if (value === null || value === undefined) return null;
  return `${Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`;
}

export default function StrategicReportsTab({ kpis, reports }) {
  const { translate } = useLanguage();
  const [preview, setPreview] = useState(null);

  const handleView = async (report) => {
    const { columns, rows } = await report.build();
    setPreview({ title: translate(report.titleKey), columns, rows });
  };

  const backdropProps = useBackdropClose(() => setPreview(null));

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">{translate('reportsTitle')}</h1>
      <p className="text-[var(--color-text-muted)] mb-6">{translate('reportsSubtitle')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label={translate('kpiCampusCount')}
          value={kpis.campusCount}
          icon={Building2}
          accent="text-[var(--color-course-6)] bg-[var(--color-course-6-soft)]"
        />
        <KpiCard
          label={translate('kpiProgramCount')}
          value={kpis.programCount}
          icon={BookOpen}
          accent="text-[var(--color-course-7)] bg-[var(--color-course-7-soft)]"
        />
        <KpiCard
          label={translate('kpiOverdueAmount')}
          value={formatEuro(kpis.overdueAmount)}
          icon={AlertCircle}
          accent="text-[var(--color-error)] bg-[color-mix(in_oklch,var(--color-error)_10%,transparent)]"
          valueClassName="text-[var(--color-error)]"
        />
        <KpiCard
          label={translate('kpiOverdueInvoices')}
          value={kpis.overdueCount}
          icon={FileWarning}
          accent="text-[var(--color-course-2)] bg-[var(--color-course-2-soft)]"
        />
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
          <FilePieChart size={16} className="text-[var(--color-text-muted)]" />
          <span className="text-sm font-semibold text-[var(--color-text)]">{translate('reportLibraryTitle')}</span>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {reports.map((r) => {
            const Icon = REPORT_ICONS[r.key];
            return (
              <div key={r.key} className="flex items-center gap-4 px-4 py-4">
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${REPORT_ACCENTS[r.key]}`}>
                  <Icon size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[var(--color-text)]">{translate(r.titleKey)}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{translate(r.descKey)}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => handleView(r)}>
                    <Eye size={14} className="mr-1.5" />
                    {translate('viewCsv')}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={r.onExport}>
                    <Download size={14} className="mr-1.5" />
                    {translate('exportCsv')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" {...backdropProps}>
          <div className="w-fit max-w-[95vw] min-w-[min(28rem,95vw)] max-h-[80vh] flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
              <span className="text-sm font-semibold text-[var(--color-text)]">{preview.title}</span>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                aria-label={translate('close')}
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-auto p-0">
              {preview.rows.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">{translate('noPreviewData')}</p>
              ) : (
                <ScrollShadow>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                        {preview.columns.map((c) => (
                          <th key={c.label} className="px-4 py-2 font-normal whitespace-nowrap">{c.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, i) => (
                        <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                          {preview.columns.map((c) => (
                            <td key={c.label} className="px-4 py-2.5 whitespace-nowrap">
                              {typeof c.value === 'function' ? c.value(row) : row[c.value]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollShadow>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
