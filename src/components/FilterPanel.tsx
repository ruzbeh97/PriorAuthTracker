import { X } from 'lucide-react';
import type { AuthRecord } from '../types';

export interface Filters {
  status: string[];
  state: string[];
  payer: string[];
  provider: string[];
  facility: string[];
  assignedTo: string[];
  tags: string[];
}

export const EMPTY_FILTERS: Filters = {
  status: [],
  state: [],
  payer: [],
  provider: [],
  facility: [],
  assignedTo: [],
  tags: [],
};

export function isFiltersEmpty(f: Filters): boolean {
  return Object.values(f).every((arr) => arr.length === 0);
}

export function countActiveFilters(f: Filters): number {
  return Object.values(f).reduce((sum, arr) => sum + arr.length, 0);
}

export function applyFilters(records: AuthRecord[], filters: Filters): AuthRecord[] {
  return records.filter((r) => {
    if (filters.status.length > 0 && !filters.status.includes(r.status)) return false;
    if (filters.state.length > 0 && !filters.state.includes(r.state)) return false;
    if (filters.payer.length > 0 && !filters.payer.includes(r.payer.name)) return false;
    if (filters.provider.length > 0 && !filters.provider.includes(r.provider)) return false;
    if (filters.facility.length > 0 && !filters.facility.includes(r.facility)) return false;
    if (filters.assignedTo.length > 0 && !filters.assignedTo.includes(r.assignedTo)) return false;
    if (filters.tags.length > 0 && !filters.tags.some((t) => r.tags.includes(t))) return false;
    return true;
  });
}

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

const FILTER_LABELS: Record<keyof Filters, string> = {
  status: 'Status',
  state: 'State',
  payer: 'Payer',
  provider: 'Provider',
  facility: 'Facility',
  assignedTo: 'Assigned To',
  tags: 'Tags',
};

interface FilterPanelProps {
  records: AuthRecord[];
  filters: Filters;
  onChange: (filters: Filters) => void;
  onClose: () => void;
}

export default function FilterPanel({ records, filters, onChange, onClose }: FilterPanelProps) {
  const options = extractOptions(records);

  const toggle = (key: keyof Filters, value: string) => {
    const current = filters[key];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: next });
  };

  const clearAll = () => onChange(EMPTY_FILTERS);

  return (
    <div className="border-b border-outline bg-white px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-primary">Filters</span>
          {!isFiltersEmpty(filters) && (
            <button
              onClick={clearAll}
              className="text-xs font-medium text-primary hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-surface-variant transition-colors"
        >
          <X className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {(Object.keys(FILTER_LABELS) as (keyof Filters)[]).map((key) => {
          const opts = options[key];
          if (opts.length === 0) return null;
          return (
            <FilterGroup
              key={key}
              label={FILTER_LABELS[key]}
              options={opts}
              selected={filters[key]}
              onToggle={(val) => toggle(key, val)}
            />
          );
        })}
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                active
                  ? 'bg-primary text-white'
                  : 'bg-surface-variant text-text-primary hover:bg-outline'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
