import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
import CsvButton from './CsvButton';
import type { CsvColumn } from '../utils/csv';

export interface SortableColumn<T> {
  id: string;
  header: string;
  accessor: (row: T) => string | number | null | undefined;
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface SortState {
  id: string;
  direction: 'asc' | 'desc';
}

interface SortableTableProps<T> {
  rows: T[];
  columns: SortableColumn<T>[];
  getRowKey: (row: T) => string;
  filterPlaceholder?: string;
  csvFilename?: string;
  initialSort?: SortState;
  sortState?: SortState;
  onSortChange?: (sort: SortState) => void;
}

export default function SortableTable<T>({
  rows,
  columns,
  getRowKey,
  filterPlaceholder = 'Filter visible rows',
  csvFilename,
  initialSort,
  sortState,
  onSortChange,
}: SortableTableProps<T>) {
  const [filter, setFilter] = useState('');
  const [internalSort, setInternalSort] = useState<SortState>(
    initialSort ?? {
      id: columns[0]?.id ?? '',
      direction: 'asc',
    },
  );
  const sort = sortState ?? internalSort;

  const visibleRows = useMemo(() => {
    const term = filter.trim().toLowerCase();
    const filtered = term
      ? rows.filter((row) =>
          columns.some((column) => String(column.accessor(row) ?? '').toLowerCase().includes(term)),
        )
      : rows;

    const sortColumn = columns.find((column) => column.id === sort.id);
    if (!sortColumn) return filtered;

    return [...filtered].sort((a, b) => {
      const left = sortColumn.accessor(a);
      const right = sortColumn.accessor(b);
      const leftNumber = Number(left);
      const rightNumber = Number(right);
      const result =
        left !== '' &&
        right !== '' &&
        !Number.isNaN(leftNumber) &&
        !Number.isNaN(rightNumber)
          ? leftNumber - rightNumber
          : String(left ?? '').localeCompare(String(right ?? ''), undefined, { numeric: true });

      return sort.direction === 'asc' ? result : -result;
    });
  }, [columns, filter, rows, sort]);

  const csvColumns: CsvColumn<T>[] = columns.map((column) => ({
    header: column.header,
    getValue: column.accessor,
  }));

  function toggleSort(columnId: string) {
    const nextSort: SortState =
      sort.id === columnId
        ? { id: columnId, direction: sort.direction === 'asc' ? 'desc' : 'asc' }
        : { id: columnId, direction: 'asc' };

    if (onSortChange) {
      onSortChange(nextSort);
    } else {
      setInternalSort(nextSort);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input w-full pl-9"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder={filterPlaceholder}
          />
        </label>
        {csvFilename ? <CsvButton filename={csvFilename} rows={visibleRows} columns={csvColumns} /> : null}
      </div>

      <div className="panel overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                {columns.map((column) => {
                  const active = sort.id === column.id;
                  const Icon = !active ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown;
                  return (
                    <th key={column.id} className={`whitespace-nowrap px-4 py-3 ${column.className ?? ''}`}>
                      <button
                        className="inline-flex items-center gap-1 font-semibold"
                        onClick={() => toggleSort(column.id)}
                      >
                        {column.header}
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {visibleRows.map((row) => (
                <tr key={getRowKey(row)} className="hover:bg-slate-50 dark:hover:bg-slate-800/70">
                  {columns.map((column) => (
                    <td key={column.id} className={`whitespace-nowrap px-4 py-3 ${column.className ?? ''}`}>
                      {column.render ? column.render(row) : column.accessor(row)}
                    </td>
                  ))}
                </tr>
              ))}
              {!visibleRows.length ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                    No rows match the current filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
