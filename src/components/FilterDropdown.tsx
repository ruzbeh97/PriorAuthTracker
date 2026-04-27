import { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import type { AuthRecord } from '../types';
import type { Filters } from './FilterPanel';
import { EMPTY_FILTERS, isFiltersEmpty } from './FilterPanel';

const FILTER_LABELS: Record<keyof Filters, string> = {
  status: 'Status',
  state: 'State',
  payer: 'Payer',
  provider: 'Provider',
  facility: 'Facility',
  assignedTo: 'Assigned To',
  tags: 'Tags',
};

function extractOptions(records: AuthRecord[]): Record<keyof Filters, string[]> {
  const unique = (arr: string[]) => [...new Set(arr)].sort();
  return {
    status: unique(records.map((r) => r.status)),
    state: unique(records.map((r) => r.state)),
    payer: unique(records.map((r) => r.payer.name)),
    provider: unique(records.map((r) => r.provider).filter(Boolean)),
    facility: unique(records.map((r) => r.facility).filter(Boolean)),
    assignedTo: unique(records.map((r) => r.assignedTo).filter(Boolean)),
    tags: unique(records.flatMap((r) => r.tags)),
  };
}

interface FilterDropdownProps {
  open: boolean;
  onClose: () => void;
  records: AuthRecord[];
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export default function FilterDropdown({ open, onClose, records, filters, onChange }: FilterDropdownProps) {
  const [activeCategory, setActiveCategory] = useState<keyof Filters | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const options = extractOptions(records);

  useEffect(() => {
    if (!open) setActiveCategory(null);
  }, [open]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, onClose]);

  if (!open) return null;

  const toggle = (key: keyof Filters, value: string) => {
    const current = filters[key];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: next });
  };

  const clearAll = () => {
    onChange(EMPTY_FILTERS);
    setActiveCategory(null);
  };

  const keys = (Object.keys(FILTER_LABELS) as (keyof Filters)[]).filter(
    (k) => options[k].length > 0
  );

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1.5 z-50 bg-white border border-outline rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.12)] min-w-[220px] overflow-hidden"
    >
      {activeCategory === null ? (
        <>
          <div className="px-3 py-2 border-b border-outline flex items-center justify-between">
            <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">Filter by</span>
            {!isFiltersEmpty(filters) && (
              <button onClick={clearAll} className="text-xs font-medium text-primary hover:underline">
                Clear all
              </button>
            )}
          </div>
          <div className="py-1">
            {keys.map((key) => {
              const count = filters[key].length;
              return (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-text-primary hover:bg-surface-variant transition-colors"
                >
                  <span>{FILTER_LABELS[key]}</span>
                  <div className="flex items-center gap-1.5">
                    {count > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-semibold">
                        {count}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="px-3 py-2 border-b border-outline flex items-center gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className="p-0.5 rounded hover:bg-surface-variant transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
            </button>
            <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              {FILTER_LABELS[activeCategory]}
            </span>
            {filters[activeCategory].length > 0 && (
              <button
                onClick={() => onChange({ ...filters, [activeCategory]: [] })}
                className="ml-auto text-xs font-medium text-primary hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="py-1 max-h-[280px] overflow-y-auto">
            {options[activeCategory].map((opt) => {
              const selected = filters[activeCategory].includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => toggle(activeCategory, opt)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-surface-variant transition-colors"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    selected ? 'bg-primary border-primary' : 'border-outline'
                  }`}>
                    {selected && <Check className="w-3 h-3 text-white" strokeWidth={2.5} />}
                  </div>
                  <span className={selected ? 'font-medium' : ''}>{opt}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
