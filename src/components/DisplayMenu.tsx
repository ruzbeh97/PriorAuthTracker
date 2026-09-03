import { useEffect, useRef, useState } from 'react';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronDown, CornerDownRight } from 'lucide-react';
import type { GroupingKey, GroupOrderField } from '../utils';

export type OrderField =
  | 'patient'
  | 'authNumber'
  | 'payer'
  | 'startDate'
  | 'endDate'
  | 'state'
  | 'status'
  | 'type';
export type DisplayColumn =
  | 'payer'
  | 'start'
  | 'end'
  | 'utilization'
  | 'state'
  | 'status'
  | 'type'
  | 'facility'
  | 'provider'
  | 'tags'
  | 'assignee';

export const DISPLAY_PROPERTIES: Array<{ key: DisplayColumn; label: string }> = [
  { key: 'payer', label: 'Payer' },
  { key: 'start', label: 'Start Date' },
  { key: 'end', label: 'End Date' },
  { key: 'utilization', label: 'Utilization' },
  { key: 'state', label: 'State' },
  { key: 'status', label: 'Status' },
  { key: 'type', label: 'Type' },
  { key: 'facility', label: 'Facility' },
  { key: 'provider', label: 'Provider' },
  { key: 'tags', label: 'Tags' },
  { key: 'assignee', label: 'Assignee' },
];

const ORDER_OPTIONS: Array<{ value: OrderField; label: string }> = [
  { value: 'patient', label: 'Patient' },
  { value: 'authNumber', label: 'Authorization Number' },
  { value: 'payer', label: 'Payer' },
  { value: 'startDate', label: 'Start Date' },
  { value: 'endDate', label: 'End Date' },
  { value: 'state', label: 'State' },
  { value: 'status', label: 'Status' },
  { value: 'type', label: 'Type' },
];

const GROUP_OPTIONS: Array<{ value: GroupingKey; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'patient', label: 'Patient' },
  { value: 'payer', label: 'Payer' },
  { value: 'status', label: 'Status' },
  { value: 'state', label: 'State' },
  { value: 'provider', label: 'Provider' },
  { value: 'facility', label: 'Facility' },
  { value: 'case', label: 'Case' },
];

const GROUP_ORDER_OPTIONS: Array<{ value: GroupOrderField; label: string }> = [
  { value: 'default', label: 'Default' },
  { value: 'count', label: 'Count' },
  { value: 'state', label: 'State' },
  { value: 'status', label: 'Status' },
];

export const DEFAULT_VISIBLE_COLUMNS = new Set<DisplayColumn>(DISPLAY_PROPERTIES.map((item) => item.key));

interface DisplayMenuProps {
  open: boolean;
  onClose: () => void;
  orderBy: OrderField;
  onOrderByChange: (value: OrderField) => void;
  orderDir: 'asc' | 'desc';
  onOrderDirChange: (value: 'asc' | 'desc') => void;
  grouping: GroupingKey;
  onGroupingChange: (value: GroupingKey) => void;
  groupOrder: GroupOrderField;
  onGroupOrderChange: (value: GroupOrderField) => void;
  groupDir: 'asc' | 'desc';
  onGroupDirChange: (value: 'asc' | 'desc') => void;
  includeArchived: boolean;
  onIncludeArchivedChange: (value: boolean) => void;
  visibleColumns: Set<DisplayColumn>;
  onVisibleColumnsChange: (value: Set<DisplayColumn>) => void;
}

export default function DisplayMenu({
  open,
  onClose,
  orderBy,
  onOrderByChange,
  orderDir,
  onOrderDirChange,
  grouping,
  onGroupingChange,
  groupOrder,
  onGroupOrderChange,
  groupDir,
  onGroupDirChange,
  includeArchived,
  onIncludeArchivedChange,
  visibleColumns,
  onVisibleColumnsChange,
}: DisplayMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (ref.current?.contains(target) || target.closest('[data-display-trigger]')) return;
      onClose();
    };
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, onClose]);

  if (!open) return null;

  const toggleColumn = (key: DisplayColumn) => {
    const next = new Set(visibleColumns);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onVisibleColumnsChange(next);
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-50 mt-1.5 w-[360px] rounded-xl border border-outline bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
    >
      <div className="flex items-center justify-between gap-3 py-1">
        <span className="text-sm text-text-primary">Ordering</span>
        <div className="flex items-center gap-1.5">
          <CompactSelect
            value={orderBy}
            options={ORDER_OPTIONS}
            onChange={onOrderByChange}
          />
          <button
            type="button"
            aria-label={orderDir === 'desc' ? 'Sort descending' : 'Sort ascending'}
            onClick={() => onOrderDirChange(orderDir === 'desc' ? 'asc' : 'desc')}
            className="flex size-8 items-center justify-center rounded-full border border-outline text-text-primary hover:bg-surface-variant"
          >
            {orderDir === 'desc' ? (
              <ArrowDownWideNarrow className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <ArrowUpNarrowWide className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between gap-3 py-1">
        <span className="text-sm text-text-primary">Grouping</span>
        <CompactSelect value={grouping} options={GROUP_OPTIONS} onChange={onGroupingChange} />
      </div>

      <div className="my-3 border-t border-outline" />

      <div className="mt-1 flex items-center justify-between gap-3 py-1">
        <span className="flex items-center gap-2 text-sm text-text-primary">
          <CornerDownRight className="h-4 w-4 text-text-secondary" strokeWidth={1.75} />
          Group Ordering
        </span>
        <div className="flex items-center gap-1.5">
          <CompactSelect
            value={groupOrder}
            options={GROUP_ORDER_OPTIONS}
            onChange={onGroupOrderChange}
            disabled={grouping === 'none'}
          />
          <button
            type="button"
            disabled={grouping === 'none'}
            aria-label={groupDir === 'desc' ? 'Group order descending' : 'Group order ascending'}
            onClick={() => onGroupDirChange(groupDir === 'desc' ? 'asc' : 'desc')}
            className={`flex size-8 items-center justify-center rounded-full border border-outline ${
              grouping === 'none'
                ? 'text-text-disabled'
                : 'text-text-primary hover:bg-surface-variant'
            }`}
          >
            {groupDir === 'desc' ? (
              <ArrowDownWideNarrow className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <ArrowUpNarrowWide className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      <div className="my-3 border-t border-outline" />

      <div className="flex items-center justify-between py-1">
        <span className="text-sm text-text-primary">Include archived</span>
        <button
          type="button"
          role="switch"
          aria-checked={includeArchived}
          onClick={() => onIncludeArchivedChange(!includeArchived)}
          className={`relative h-5 w-9 rounded-full transition-colors ${
            includeArchived ? 'bg-[#1132ee]' : 'bg-[#e6e6e6]'
          }`}
        >
          <span
            className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-[left] ${
              includeArchived ? 'left-[18px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      <div className="my-3 border-t border-outline" />

      <p className="mb-2 text-sm font-semibold text-text-primary">Display Properties</p>
      <div className="flex flex-wrap gap-1.5">
        {DISPLAY_PROPERTIES.map((property) => {
          const active = visibleColumns.has(property.key);
          return (
            <button
              key={property.key}
              type="button"
              onClick={() => toggleColumn(property.key)}
              className={`rounded-md px-2 py-1 text-[13px] leading-4 ${
                active
                  ? 'bg-[#ededed] text-text-primary'
                  : 'bg-white text-text-secondary ring-1 ring-inset ring-outline'
              }`}
            >
              {property.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CompactSelect<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value)?.label ?? value;

  useEffect(() => {
    if (!open || disabled) return;
    const handle = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, disabled]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
        }}
        className={`flex h-8 min-w-[132px] items-center justify-between gap-2 rounded-md border bg-white px-2.5 text-sm ${
          disabled ? 'border-outline text-text-disabled' : open ? 'border-primary text-text-primary' : 'border-outline text-text-primary'
        }`}
      >
        <span className="truncate">{selected}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-text-secondary" strokeWidth={1.75} />
      </button>
      {open && (
        <ul className="absolute right-0 top-[calc(100%+4px)] z-20 max-h-56 min-w-full overflow-y-auto rounded-md border border-outline bg-white py-1 shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex h-8 w-full items-center px-2.5 text-left text-sm ${
                  option.value === value ? 'bg-[#eceefe] text-primary' : 'text-text-primary hover:bg-surface-variant'
                }`}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
