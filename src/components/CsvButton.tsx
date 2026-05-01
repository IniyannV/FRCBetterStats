import { Download } from 'lucide-react';
import { CsvColumn, downloadCsv } from '../utils/csv';

interface CsvButtonProps<T> {
  filename: string;
  rows: T[];
  columns: CsvColumn<T>[];
}

export default function CsvButton<T>({ filename, rows, columns }: CsvButtonProps<T>) {
  return (
    <button className="btn" onClick={() => downloadCsv(filename, rows, columns)}>
      <Download className="h-4 w-4" />
      CSV
    </button>
  );
}
