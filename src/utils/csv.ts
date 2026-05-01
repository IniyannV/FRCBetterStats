export interface CsvColumn<T> {
  header: string;
  getValue: (row: T) => string | number | null | undefined;
}

function escapeCsv(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function downloadCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]) {
  const csv = [
    columns.map((column) => escapeCsv(column.header)).join(','),
    ...rows.map((row) => columns.map((column) => escapeCsv(column.getValue(row))).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
