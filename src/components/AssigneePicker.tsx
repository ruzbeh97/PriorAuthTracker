import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import { ASSIGNEE_INDIVIDUALS, useUserGroups } from '../assignees';

export type AssigneePickerTab = 'all' | 'groups' | 'individuals';

const TABS: Array<{ id: AssigneePickerTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'groups', label: 'Groups' },
  { id: 'individuals', label: 'Individuals' },
];

const SEARCH_PLACEHOLDERS: Record<AssigneePickerTab, string> = {
  all: 'Search Groups or Individuals',
  groups: 'Search Groups',
  individuals: 'Search Individuals',
};

export const ASSIGNEE_PICKER_WIDTH = 444;

interface PanelProps {
  /** Names currently assigned, whether they are groups or individuals. */
  selected: string[];
  onSelect: (name: string) => void;
  /** Names that exist on the record but not in the directory, such as "Unassigned". */
  extraIndividuals?: string[];
  autoFocus?: boolean;
}

function SectionHeader({ label, tone }: { label: string; tone: 'groups' | 'individuals' }) {
  return (
    <div
      className={`px-2 font-body text-[14px] font-medium leading-[22px] text-text-secondary ${
        tone === 'groups' ? 'bg-surface-tonal' : 'bg-[#fffdf0]'
      }`}
    >
      {label}
    </div>
  );
}

function PickerRow({
  title,
  subtitle,
  isSelected,
  onClick,
}: {
  title: string;
  subtitle?: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 border-b border-outline pb-2 pl-2 pr-4 pt-1 text-left transition-colors ${
        isSelected ? 'bg-surface-active' : 'bg-white hover:bg-surface-variant'
      }`}
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-body text-[14px] font-medium leading-[22px] text-text-primary">
          {title}
        </span>
        {subtitle ? (
          <span className="truncate font-body text-[12px] font-medium leading-[18px] text-text-secondary">
            {subtitle}
          </span>
        ) : null}
      </span>
      {isSelected ? <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} /> : null}
    </button>
  );
}

export function AssigneePickerPanel({
  selected,
  onSelect,
  extraIndividuals = [],
  autoFocus = true,
}: PanelProps) {
  const groups = useUserGroups();
  const [tab, setTab] = useState<AssigneePickerTab>('all');
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  // Individuals show the groups they belong to, which is how the directory reads both ways.
  const groupsByMember = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const group of groups) {
      for (const member of group.members) {
        map.set(member, [...(map.get(member) ?? []), group.name]);
      }
    }
    return map;
  }, [groups]);

  const individuals = useMemo(() => {
    const groupNames = new Set(groups.map((group) => group.name));
    const names = [...extraIndividuals, ...ASSIGNEE_INDIVIDUALS, ...groupsByMember.keys()];
    return [...new Set(names.filter((name) => name && !groupNames.has(name)))];
  }, [extraIndividuals, groups, groupsByMember]);

  const query = search.trim().toLowerCase();
  const hits = (values: string[]) => !query || values.some((value) => value.toLowerCase().includes(query));

  const visibleGroups = tab === 'individuals' ? [] : groups.filter((group) => hits([group.name, ...group.members]));
  const visibleIndividuals =
    tab === 'groups' ? [] : individuals.filter((name) => hits([name, ...(groupsByMember.get(name) ?? [])]));

  return (
    <div className="flex items-stretch" style={{ width: ASSIGNEE_PICKER_WIDTH }}>
      <div className="flex w-[104px] shrink-0 flex-col gap-0.5 border-r border-outline bg-surface-variant px-2 py-4">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            className={`flex h-[27px] items-center rounded-md px-2 text-left font-body text-[12px] font-medium leading-[18px] transition-colors ${
              tab === entry.id ? 'bg-outline text-text-primary' : 'text-text-primary hover:bg-outline/60'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-11 shrink-0 items-center border-b border-outline p-2">
          <input
            ref={inputRef}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={SEARCH_PLACEHOLDERS[tab]}
            className="h-7 min-w-0 flex-1 rounded-lg bg-transparent px-1.5 font-body text-[14px] leading-6 text-text-primary outline-none placeholder:text-text-disabled"
          />
        </div>
        <div className="max-h-[360px] flex-1 overflow-y-auto">
          {visibleGroups.length > 0 ? (
            <>
              <SectionHeader label="Groups" tone="groups" />
              {visibleGroups.map((group) => (
                <PickerRow
                  key={group.id || group.name}
                  title={`${group.name} (${group.members.length})`}
                  subtitle={group.members.join(', ')}
                  isSelected={selectedSet.has(group.name)}
                  onClick={() => onSelect(group.name)}
                />
              ))}
            </>
          ) : null}
          {visibleIndividuals.length > 0 ? (
            <>
              <SectionHeader label="Individuals" tone="individuals" />
              {visibleIndividuals.map((name) => (
                <PickerRow
                  key={name}
                  title={name}
                  subtitle={groupsByMember.get(name)?.join(', ')}
                  isSelected={selectedSet.has(name)}
                  onClick={() => onSelect(name)}
                />
              ))}
            </>
          ) : null}
          {visibleGroups.length === 0 && visibleIndividuals.length === 0 ? (
            <div className="px-3 py-4 font-body text-[14px] leading-[22px] text-text-secondary">
              No matches for “{search.trim()}”
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** The panel anchored to a trigger and rendered above the rest of the page. */
export function AssigneePickerPopover({
  anchorRef,
  align = 'right',
  onDismiss,
  ...panelProps
}: PanelProps & {
  anchorRef: React.RefObject<HTMLElement | null>;
  align?: 'left' | 'right';
  onDismiss: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const height = 404;
    let left = align === 'right' ? rect.right - ASSIGNEE_PICKER_WIDTH : rect.left;
    left = Math.min(Math.max(8, left), window.innerWidth - ASSIGNEE_PICKER_WIDTH - 8);
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < height ? Math.max(8, rect.top - height) : rect.bottom + 4;
    setPos({ top, left });
  }, [anchorRef, align]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (ref.current?.contains(target)) return;
      // The trigger closes the picker through its own toggle.
      if (anchorRef.current?.contains(target)) return;
      onDismiss();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onDismiss, anchorRef]);

  return createPortal(
    <div
      ref={ref}
      style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999, zIndex: 9999 }}
      className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-[0px_4px_12px_rgba(0,0,0,0.08)]"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <AssigneePickerPanel {...panelProps} />
    </div>,
    document.body,
  );
}
