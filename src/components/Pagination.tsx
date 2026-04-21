import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

export default function Pagination({ page, rowsPerPage, totalRecords, onPageChange, onRowsPerPageChange }: PaginationProps) {
  const startRecord = (page - 1) * rowsPerPage + 1;
  const endRecord = Math.min(page * rowsPerPage, totalRecords);
  const totalPages = Math.ceil(totalRecords / rowsPerPage);

  return (
    <div className="flex items-center justify-end px-5 py-2 h-[60px] border-t border-outline bg-white shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-primary whitespace-nowrap">Rows per page :</span>
          <select
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
            className="appearance-none bg-white border border-outline rounded px-2 py-1 text-sm text-text-primary pr-6 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30 w-[80px]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 6px center',
            }}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <span className="text-sm text-text-primary whitespace-nowrap">
          {startRecord}-{endRecord} of {totalRecords} records
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1 rounded hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5 text-text-primary" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1 rounded hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5 text-text-primary" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
