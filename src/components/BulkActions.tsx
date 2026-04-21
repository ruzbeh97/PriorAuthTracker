import { Archive, Check, X, ChevronDown } from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  onClear: () => void;
}

export default function BulkActions({ selectedCount, onClear }: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="absolute bottom-[68px] left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-0 bg-white border border-outline rounded-lg shadow-[0px_4px_16px_rgba(0,0,0,0.12)] px-0 h-[52px]">
        <div className="flex items-center h-full">
          <span className="text-base font-medium text-text-primary px-5 whitespace-nowrap">
            {selectedCount} Selected
          </span>
          <div className="w-px h-9 bg-outline" />
        </div>

        <div className="flex items-center gap-2 px-4">
          <SelectButton label="Assign Owner" />
          <SelectButton label="State" />
          <SelectButton label="Tag(s)" />
          <button className="inline-flex items-center gap-1.5 px-3 h-9 rounded border border-outline text-sm font-medium text-text-primary hover:bg-surface-variant transition-colors">
            Add Note
          </button>
          <button className="p-2 rounded hover:bg-surface-variant transition-colors">
            <Archive className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
          </button>
          <span className="text-sm font-medium text-primary cursor-pointer hover:underline">More</span>
        </div>

        <div className="w-px h-9 bg-outline" />
        <div className="flex items-center gap-1 px-3">
          <button className="p-1.5 rounded hover:bg-green-50 transition-colors">
            <Check className="w-5 h-5 text-status-active" strokeWidth={2} />
          </button>
          <button onClick={onClear} className="p-1.5 rounded hover:bg-red-50 transition-colors">
            <X className="w-5 h-5 text-text-secondary" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="relative">
          <div className="bg-white border border-outline rounded-t px-2 py-0 text-[11px] text-text-secondary font-medium">
            Bulk Actions
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectButton({ label }: { label: string }) {
  return (
    <button className="inline-flex items-center gap-1 px-3 h-9 rounded border border-outline text-sm text-text-primary hover:bg-surface-variant transition-colors">
      {label}
      <ChevronDown className="w-3.5 h-3.5 text-text-secondary" strokeWidth={2} />
    </button>
  );
}
