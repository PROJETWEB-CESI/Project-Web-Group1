// Builds a CSV string from an array of column definitions and rows, then
// triggers a browser download. Used by the executive reports page to export
// consolidated data without needing a backend report-generation endpoint.

function escapeCsvCell(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCsv(filename, columns, rows) {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(',');
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsvCell(typeof c.value === 'function' ? c.value(row) : row[c.value])).join(',')
  );
  const csvContent = ['﻿' + header, ...lines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
