import { useState, useCallback, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, CheckCircle, Filter, SlidersHorizontal, Download, Plus, X, User, UserPlus, Circle, Pencil, Trash2, PanelLeftClose } from 'lucide-react';
import { mockAuthRecords } from '../data';
import { groupByPatient } from '../utils';
import FilterDropdown from './FilterDropdown';
import { applyFilters, EMPTY_FILTERS, isFiltersEmpty } from './FilterPanel';
import type { Filters } from './FilterPanel';
import BulkActions from './BulkActions';
import AuthDetailPanel from './AuthDetailPanel';
import type { AuthRecord, AuthState, TimelineEntry } from '../types';
import type { PatientGroup } from '../utils';

interface VisitsBarV2Props {
  authorized: number;
  completed: number;
  scheduled: number;
}

function VisitsBarV2({ authorized, completed, scheduled }: VisitsBarV2Props) {
  if (authorized === 0 && completed === 0 && scheduled === 0) {
    return <span className="text-sm text-text-primary">-</span>;
  }

  const total = Math.max(authorized, completed + scheduled);
  const exceeded = completed + scheduled > authorized;
  const exceededCount = exceeded ? completed + scheduled - authorized : 0;

  const completedPct = total > 0 ? (completed / total) * 100 : 0;
  const scheduledPct = total > 0 ? (scheduled / total) * 100 : 0;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center gap-[5.6px] text-[10px] leading-[15.4px] whitespace-nowrap">
        <span className={`font-bold ${exceeded ? 'text-[#ee4744]' : 'text-[#1566b7]'}`}>
          {completed} done
        </span>
        <span className={`font-medium ${exceeded ? 'text-[#f6a3a2]' : 'text-[#a4ccf4]'}`}>
          {scheduled} sched
        </span>
        <span className="font-medium text-text-secondary">/ {authorized}</span>
      </div>

      {exceeded ? (
        <div className="relative w-[106px] h-[13px] rounded-[8px] border-[0.7px] border-[#e91916] overflow-hidden">
          <div className="absolute inset-y-0 left-0 bg-[#f6a3a2] rounded-[8px]" style={{ width: '100%' }} />
          <div className="absolute inset-y-0 left-0 bg-[#ee4744] rounded-[8px]" style={{ width: `${completedPct}%` }} />
          <div className="absolute inset-y-0 left-0 bg-[#d9d9d9] rounded-[8px]" style={{ width: `${Math.min((authorized / total) * 100, completedPct)}%` }} />
        </div>
      ) : (
        <div className="relative w-[106px] h-[13px] rounded-[8px] border-[0.7px] border-[#8c8c8c] overflow-hidden">
          <div className="absolute inset-y-[0.7px] left-[0.7px] bg-[#a4ccf4] rounded-[8px]" style={{ width: `${Math.min(completedPct + scheduledPct, 100) * 0.87}%` }} />
          <div className="absolute inset-y-[0.7px] left-[0.7px] bg-[#1566b7] rounded-[8px]" style={{ width: `${completedPct * 0.75}%` }} />
        </div>
      )}

      <div className="flex items-center justify-between w-full">
        {exceeded ? (
          <span className="text-[10px] leading-[15.4px] text-text-secondary">{exceededCount} Exceeded</span>
        ) : (
          <>
            <CheckCircle className="w-[13.3px] h-[13.3px] text-[#479e4c]" strokeWidth={2} />
            <span className="text-[10px] leading-[15.4px] text-text-secondary">{Math.max(authorized - completed - scheduled, 0)} open</span>
          </>
        )}
      </div>
    </div>
  );
}

function StateChip({ state }: { state: string }) {
  if (state === 'Authorized') {
    return (
      <span className="inline-flex items-center px-2 h-7 rounded-lg bg-[#e6f2d9] text-[12px] font-medium leading-[18px] text-[#4f7326]">
        Authorized
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 h-7 rounded-lg bg-outline text-[12px] font-medium leading-[18px] text-text-primary whitespace-nowrap">
      {state}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'Active' ? 'bg-[#479e4c]' : status === 'Expired' ? 'bg-[#ee4744]' : 'bg-[#f59e0b]';
  return (
    <div className="flex items-center gap-2">
      <div className={`w-[10px] h-[10px] rounded-full ${color}`} />
      <span className="text-sm font-medium text-text-primary whitespace-nowrap">{status}</span>
    </div>
  );
}

const TEAM_MEMBERS = [
  { name: 'Ashton Roy', color: 'bg-[#d1e6fa]' },
  { name: 'Bailey Moon', color: 'bg-[#e2daf1]' },
  { name: 'Brad Hope', color: 'bg-[#ffd099]' },
  { name: 'Leo Wood', color: 'bg-[#e2daf1]' },
  { name: 'Olivia Grace', color: 'bg-[#e2daf1]' },
  { name: 'Ethan Sky', color: 'bg-[#e2daf1]' },
  { name: 'Sophia Sun', color: 'bg-[#e2daf1]' },
  { name: 'Noah Rain', color: 'bg-[#e2daf1]' },
  { name: 'Isabella Star', color: 'bg-[#e2daf1]' },
  { name: 'Caleb Stone', color: 'bg-[#e2daf1]' },
  { name: 'Ava Brooks', color: 'bg-[#e2daf1]' },
  { name: 'Ryan Field', color: 'bg-[#e2daf1]' },
  { name: 'Hazel Cloud', color: 'bg-[#e2daf1]' },
  { name: 'Dylan River', color: 'bg-[#e2daf1]' },
  { name: 'Piper West', color: 'bg-[#e2daf1]' },
  { name: 'Gavin Lake', color: 'bg-[#e2daf1]' },
  { name: 'Violet Ash', color: 'bg-[#e2daf1]' },
];

const TEAM_COLOR_MAP = Object.fromEntries(TEAM_MEMBERS.map((m) => [m.name, m.color]));
const FALLBACK_COLORS = ['bg-[#d1e6fa]', 'bg-[#e2daf1]', 'bg-[#ffd099]', 'bg-[#d1fae5]'];

function AvatarGroup({ assignedTo }: { assignedTo: string }) {
  const people = assignedTo ? assignedTo.split(', ').filter(Boolean) : [];

  if (people.length === 0) {
    return (
      <div className="flex items-center justify-end">
        <div className="w-[26px] h-[26px] rounded-full border-2 border-dashed border-black/20 flex items-center justify-center text-text-secondary">
          <UserPlus className="w-3.5 h-3.5" strokeWidth={1.5} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end -space-x-2">
      {people.map((name, i) => {
        const initial = name.charAt(0).toUpperCase();
        const color = TEAM_COLOR_MAP[name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
        return (
          <div
            key={name}
            className={`w-[26px] h-[26px] rounded-full border-2 border-white flex items-center justify-center ${color}`}
          >
            <span className="text-sm font-medium text-[#0f0f0f]">{initial}</span>
          </div>
        );
      })}
    </div>
  );
}

function AssigneeDropdown({
  assignedTo,
  onAssign,
  onClose,
  triggerRef,
  onSelectionChange,
}: {
  assignedTo: string;
  onAssign: (names: string[]) => void;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onSelectionChange: (selected: Set<string>) => void;
}) {
  const [search, setSearch] = useState('');
  const assigned = useMemo(() => new Set(assignedTo ? assignedTo.split(', ') : []), [assignedTo]);
  const [selected, setSelected] = useState<Set<string>>(new Set(assigned));
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownWidth = 240;
      let left = rect.right - dropdownWidth;
      if (left < 8) left = 8;
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow < 420 ? Math.max(8, rect.top - 420) : rect.bottom + 4;
      setPos({ top, left });
    }
  }, [triggerRef]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onAssign([...selected]);
        onClose();
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [selected, onAssign, onClose]);

  const extraMembers = useMemo(() => {
    const teamNames = new Set(TEAM_MEMBERS.map((m) => m.name));
    return [...assigned]
      .filter((name) => !teamNames.has(name))
      .map((name, i) => ({ name, color: FALLBACK_COLORS[i % FALLBACK_COLORS.length] }));
  }, [assigned]);

  const allMembers = useMemo(() => [...extraMembers, ...TEAM_MEMBERS], [extraMembers]);

  const filtered = allMembers.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      onSelectionChange(next);
      return next;
    });
  };

  return createPortal(
    <div
      ref={ref}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
      className="bg-white border border-black/10 rounded-lg shadow-[0px_4px_12px_rgba(0,0,0,0.08)] w-[240px] overflow-hidden"
    >
      <div className="flex items-start pb-1.5 pl-[18px] pr-2.5 pt-2.5 border-b border-black/10">
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Assign to..."
          className="flex-1 text-sm text-text-primary placeholder:text-text-tertiary leading-9 h-9 focus:outline-none bg-transparent"
        />
      </div>
      <div className="flex flex-col gap-1 px-2 pt-2.5 pb-2 max-h-[360px] overflow-y-auto">
        {filtered.map((member) => {
          const isSelected = selected.has(member.name);
          const initial = member.name.charAt(0);
          return (
            <button
              key={member.name}
              onClick={() => toggle(member.name)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg w-full hover:bg-surface-variant transition-colors"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${member.color}`}>
                <span className="text-sm font-medium text-[#0f0f0f]">{initial}</span>
              </div>
              <span className="flex-1 text-sm text-text-secondary truncate text-left">{member.name}</span>
              {isSelected ? (
                <div className="w-[18px] h-[18px] rounded-sm bg-primary flex items-center justify-center shrink-0">
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ) : (
                <div className="w-[18px] h-[18px] rounded-sm border-2 border-black/40 bg-white shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
}

function AssigneeCell({
  record,
  isOpen,
  onToggle,
  onAssign,
  onClose,
}: {
  record: AuthRecord;
  isOpen: boolean;
  onToggle: () => void;
  onAssign: (names: string[]) => void;
  onClose: () => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const initial = useMemo(() => new Set(record.assignedTo ? record.assignedTo.split(', ') : []), [record.assignedTo]);
  const [liveSelected, setLiveSelected] = useState<Set<string>>(initial);

  useEffect(() => {
    setLiveSelected(new Set(record.assignedTo ? record.assignedTo.split(', ') : []));
  }, [record.assignedTo]);

  const displayName = [...liveSelected].join(', ');

  return (
    <div className="relative">
      <button ref={btnRef} onClick={onToggle} className="cursor-pointer">
        <AvatarGroup assignedTo={isOpen ? displayName : record.assignedTo} />
      </button>
      {isOpen && (
        <AssigneeDropdown
          assignedTo={record.assignedTo}
          onAssign={onAssign}
          onClose={onClose}
          triggerRef={btnRef}
          onSelectionChange={setLiveSelected}
        />
      )}
    </div>
  );
}

const FILTER_CATEGORY_LABELS: Record<keyof Filters, string> = {
  status: 'Status',
  state: 'State',
  payer: 'Payer',
  provider: 'Provider',
  facility: 'Facility',
  assignedTo: 'Assignee',
  tags: 'Tags',
};

function FilterCategoryIcon({ category }: { category: keyof Filters }) {
  switch (category) {
    case 'assignedTo':
      return <User className="w-3.5 h-3.5" />;
    case 'status':
      return <Circle className="w-3.5 h-3.5" />;
    default:
      return <Filter className="w-3.5 h-3.5" />;
  }
}

function SurfacedFilterPill({
  category,
  value,
  onRemove,
}: {
  category: keyof Filters;
  value: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center h-7 border border-outline rounded-full bg-white overflow-hidden">
      <div className="flex items-center gap-1.5 pl-2.5 pr-3 py-1.5">
        <FilterCategoryIcon category={category} />
        <span className="text-xs font-bold text-text-primary tracking-[0.1px]">
          {FILTER_CATEGORY_LABELS[category]}
        </span>
      </div>
      <div className="w-px h-full bg-[#d9d9d9]" />
      <div className="flex items-center gap-1 pl-2.5 pr-1.5 py-1.5">
        <span className="text-xs font-medium text-text-primary tracking-[0.1px]">is</span>
        <ChevronDown className="w-4 h-4 text-text-secondary" />
      </div>
      <div className="w-px h-full bg-[#d9d9d9]" />
      <div className="flex items-center gap-1 pl-2.5 pr-1.5 py-1.5">
        <span className="text-xs font-medium text-text-primary tracking-[0.1px]">{value}</span>
        <ChevronDown className="w-4 h-4 text-text-secondary" />
      </div>
      <div className="w-px h-full bg-[#d9d9d9]" />
      <button
        onClick={onRemove}
        className="flex items-center justify-center px-1 h-full hover:bg-surface-variant transition-colors"
      >
        <X className="w-[18px] h-[18px] text-text-secondary" />
      </button>
    </div>
  );
}

const TABLE_COLUMNS_FULL = [
  { key: 'patient', label: 'Patient', width: 'w-[145px]' },
  { key: 'authNumber', label: 'Auth #', width: 'w-[160px]' },
  { key: 'payer', label: 'Payer', width: 'w-[105px]' },
  { key: 'start', label: 'Start', width: 'w-[93px]' },
  { key: 'end', label: 'End', width: 'w-[93px]' },
  { key: 'visits', label: 'Visits', width: 'w-[120px]' },
  { key: 'state', label: 'State', width: 'w-[107px]' },
  { key: 'status', label: 'Status', width: 'w-[92px]' },
  { key: 'facility', label: 'Facility', width: 'w-[160px]' },
  { key: 'provider', label: 'Provider', width: 'w-[132px]' },
  { key: 'tags', label: 'Tags', width: 'w-[167px]' },
  { key: 'notes', label: 'Notes', width: 'flex-1 min-w-[120px]' },
];

const TABLE_COLUMNS_COMPACT = [
  { key: 'patient', label: 'Patient', width: 'w-[145px]' },
  { key: 'authNumber', label: 'Auth #', width: 'w-[160px]' },
  { key: 'payer', label: 'Payer', width: 'w-[105px]' },
  { key: 'start', label: 'Start', width: 'w-[93px]' },
  { key: 'end', label: 'End', width: 'w-[93px]' },
  { key: 'visits', label: 'Visits', width: 'w-[120px]' },
];

interface SavedView {
  id: string;
  name: string;
  filters: Filters;
}

interface PriorAuthTracker2Props {
  onSelectedRecordChange?: (record: AuthRecord | null, index: number, total: number) => void;
  registerNavigate?: (fn: (dir: 'prev' | 'next') => void) => void;
  registerClearSelection?: (fn: () => void) => void;
}

export default function PriorAuthTracker2({ onSelectedRecordChange, registerNavigate, registerClearSelection }: PriorAuthTracker2Props) {
  const [records, setRecords] = useState<AuthRecord[]>(mockAuthRecords);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set(['Diana Morales|06/14/1998']));
  const [activeTab, setActiveTab] = useState<'pre-certs' | 'referrals'>('pre-certs');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [saveViewMode, setSaveViewMode] = useState(false);
  const [viewName, setViewName] = useState('');
  const [contextMenuViewId, setContextMenuViewId] = useState<string | null>(null);
  const [renamingViewId, setRenamingViewId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [activeScorecard, setActiveScorecard] = useState<'needs-auth' | 'expiring-soon' | 'expired' | null>(null);
  const [assigneeDropdownId, setAssigneeDropdownId] = useState<string | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [tableCollapsed, setTableCollapsed] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenuViewId(null);
      }
    };
    if (contextMenuViewId) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [contextMenuViewId]);

  const baseFilteredRecords = useMemo(() => applyFilters(records, filters), [records, filters]);

  const needsAuth = baseFilteredRecords.filter((r) => r.status === 'Needs Auth').length;
  const expiringSoon = baseFilteredRecords.filter((r) => r.status === 'Expiring Soon').length;
  const expired = baseFilteredRecords.filter((r) => r.status === 'Expired').length;

  const filteredRecords = useMemo(() => {
    if (!activeScorecard) return baseFilteredRecords;
    const statusMap = { 'needs-auth': 'Needs Auth', 'expiring-soon': 'Expiring Soon', 'expired': 'Expired' } as const;
    return baseFilteredRecords.filter((r) => r.status === statusMap[activeScorecard]);
  }, [baseFilteredRecords, activeScorecard]);

  const groups = useMemo(() => groupByPatient(filteredRecords), [filteredRecords]);
  const flatRecordIds = useMemo(() => {
    const ids: string[] = [];
    groups.forEach((g) => {
      ids.push(g.primary.id);
      g.children.forEach((c) => ids.push(c.id));
    });
    return ids;
  }, [groups]);
  const selectedRecord = useMemo(() => selectedRecordId ? records.find((r) => r.id === selectedRecordId) ?? null : null, [selectedRecordId, records]);

  const selectedRecordIndex = selectedRecordId ? flatRecordIds.indexOf(selectedRecordId) : -1;

  useEffect(() => {
    onSelectedRecordChange?.(selectedRecord, selectedRecordIndex + 1, flatRecordIds.length);
  }, [selectedRecord, selectedRecordIndex, flatRecordIds.length, onSelectedRecordChange]);

  useEffect(() => {
    if (!selectedRecord) return;
    const patientKey = `${selectedRecord.patient.name}|${selectedRecord.patient.dob}`;
    const group = groups.find((g) => g.patientKey === patientKey);
    if (group && group.children.some((c) => c.id === selectedRecord.id)) {
      setExpandedPatients((prev) => {
        if (prev.has(patientKey)) return prev;
        const next = new Set(prev);
        next.add(patientKey);
        return next;
      });
    }
  }, [selectedRecord, groups]);

  const navigateRecord = useCallback((direction: 'prev' | 'next') => {
    if (selectedRecordIndex < 0) return;
    const newIndex = direction === 'prev' ? selectedRecordIndex - 1 : selectedRecordIndex + 1;
    if (newIndex >= 0 && newIndex < flatRecordIds.length) {
      setSelectedRecordId(flatRecordIds[newIndex]);
    }
  }, [selectedRecordIndex, flatRecordIds]);

  useEffect(() => {
    registerNavigate?.(navigateRecord);
  }, [registerNavigate, navigateRecord]);

  useEffect(() => {
    registerClearSelection?.(() => { setSelectedRecordId(null); setTableCollapsed(false); });
  }, [registerClearSelection]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === filteredRecords.length) return new Set();
      return new Set(filteredRecords.map((r) => r.id));
    });
  }, [filteredRecords]);

  const handleToggleExpand = useCallback((patientKey: string) => {
    setExpandedPatients((prev) => {
      const next = new Set(prev);
      if (next.has(patientKey)) next.delete(patientKey);
      else next.add(patientKey);
      return next;
    });
  }, []);

  const handleAssignRecord = useCallback((recordId: string, names: string[]) => {
    setRecords((prev) => prev.map((r) => (r.id === recordId ? { ...r, assignedTo: names.join(', ') } : r)));
  }, []);

  const handleReassignVisit = useCallback((
    fromRecordId: string,
    toAuthNumber: string,
    type: 'completed' | 'scheduled',
    apptDateTime?: string,
  ) => {
    const now = new Date().toISOString();
    setRecords((prev) => {
      const fromRecord = prev.find((r) => r.id === fromRecordId);
      if (!fromRecord) return prev;
      const toRecord = prev.find((r) =>
        r.patient.name === fromRecord.patient.name &&
        r.patient.dob === fromRecord.patient.dob &&
        (toAuthNumber === '--' ? !r.authNumber : r.authNumber === toAuthNumber) &&
        r.id !== fromRecordId
      );
      if (!toRecord) return prev;
      const fromEntry: TimelineEntry = { id: `tl-${Date.now()}-f`, timestamp: now, author: 'Adam Smith', action: { kind: 'appointment_moved', apptDateTime: apptDateTime || '', apptType: type, fromAuth: fromRecord.authNumber || '--', toAuth: toAuthNumber } };
      const toEntry: TimelineEntry = { id: `tl-${Date.now()}-t`, timestamp: now, author: 'Adam Smith', action: { kind: 'appointment_moved', apptDateTime: apptDateTime || '', apptType: type, fromAuth: fromRecord.authNumber || '--', toAuth: toAuthNumber } };
      return prev.map((r) => {
        if (r.id === fromRecord.id) {
          return { ...r, ...(type === 'completed' ? { visitsCompleted: Math.max(0, r.visitsCompleted - 1) } : { visitsScheduled: Math.max(0, r.visitsScheduled - 1) }), timeline: [...(r.timeline || []), fromEntry] };
        }
        if (r.id === toRecord.id) {
          return { ...r, ...(type === 'completed' ? { visitsCompleted: r.visitsCompleted + 1 } : { visitsScheduled: r.visitsScheduled + 1 }), timeline: [...(r.timeline || []), toEntry] };
        }
        return r;
      });
    });
  }, []);

  const handleDetailChange = useCallback((recordId: string, field: string, from: string, to: string) => {
    const now = new Date().toISOString();
    const entry: TimelineEntry = { id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: now, author: 'Adam Smith', action: { kind: 'detail_changed', field, from, to } };
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== recordId) return r;
        const updated = { ...r, timeline: [...(r.timeline || []), entry] };
        switch (field) {
          case 'Authorization Number': updated.authNumber = to; break;
          case 'Assigned To': updated.assignedTo = to; break;
          case 'Provider': updated.provider = to; break;
          case 'Facility': updated.facility = to; break;
          case 'Start Date': updated.startDate = to; break;
          case 'End Date': updated.endDate = to; break;
          case 'Payer': updated.payer = { ...r.payer, name: to }; break;
        }
        return updated;
      })
    );
  }, []);

  const handleClearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleBulkAssignOwner = useCallback((owner: string) => {
    setRecords((prev) => prev.map((r) => (selectedIds.has(r.id) ? { ...r, assignedTo: owner } : r)));
  }, [selectedIds]);

  const handleBulkChangeState = useCallback((state: AuthState) => {
    setRecords((prev) => prev.map((r) => (selectedIds.has(r.id) ? { ...r, state } : r)));
  }, [selectedIds]);

  const handleBulkAddTags = useCallback((tags: string[]) => {
    setRecords((prev) => prev.map((r) => {
      if (!selectedIds.has(r.id)) return r;
      return { ...r, tags: [...new Set([...r.tags, ...tags])] };
    }));
  }, [selectedIds]);

  const handleBulkAddNote = useCallback((text: string) => {
    setRecords((prev) => prev.map((r) => {
      if (!selectedIds.has(r.id)) return r;
      return { ...r, notes: [...r.notes, { id: `n${Date.now()}-${r.id}`, text, author: 'Adam Smith', timestamp: new Date().toISOString() }] };
    }));
  }, [selectedIds]);

  const handleBulkArchive = useCallback(() => {
    setRecords((prev) => prev.map((r) => (selectedIds.has(r.id) ? { ...r, state: 'Archived' as AuthState } : r)));
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleBulkDelete = useCallback(() => {
    setRecords((prev) => prev.filter((r) => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
  }, [selectedIds]);

  const allOwners = useMemo(() => [...new Set(records.map((r) => r.assignedTo).filter(Boolean))].sort(), [records]);
  const allTags = useMemo(() => [...new Set(records.flatMap((r) => r.tags))].sort(), [records]);

  const isDetailOpen = !!selectedRecord;
  const TABLE_COLUMNS = isDetailOpen ? TABLE_COLUMNS_COMPACT : TABLE_COLUMNS_FULL;

  const allSelected = filteredRecords.length > 0 && selectedIds.size === filteredRecords.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <main className="flex flex-1 min-w-0 min-h-0 bg-surface-variant relative overflow-hidden p-4 gap-3">
      <div className={`flex flex-col min-h-0 min-w-0 bg-white rounded-lg overflow-hidden relative transition-all duration-200 ${isDetailOpen ? (tableCollapsed ? 'w-0 opacity-0 pointer-events-none p-0 border-0' : 'flex-1') : 'flex-1'}`}>
      {isDetailOpen && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline shrink-0">
          <span className="text-base font-medium text-text-primary">Authorization Table</span>
          <button
            onClick={() => setTableCollapsed(true)}
            className="p-1 rounded hover:bg-surface-variant transition-colors"
            title="Collapse table"
          >
            <PanelLeftClose className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      )}

      {!isDetailOpen && (
      <>
      {/* Scorecards */}
      <div className="flex gap-3 items-start pt-8 pb-4 px-4">
        {([
          { key: 'needs-auth' as const, label: 'Needs Authorization', count: needsAuth, sub: 'Missing Authorizations' },
          { key: 'expiring-soon' as const, label: 'Expiring Soon', count: expiringSoon, sub: '<7 days or <2 visits' },
          { key: 'expired' as const, label: 'Expired', count: expired, sub: 'Needs Authorization' },
        ]).map((card) => (
          <button
            key={card.key}
            onClick={() => setActiveScorecard((prev) => (prev === card.key ? null : card.key))}
            className={`flex flex-col gap-1 items-start p-5 rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.06)] w-[217px] text-left transition-colors ${
              activeScorecard === card.key
                ? 'bg-[#e7eafd] border-2 border-primary'
                : 'bg-white border border-outline hover:border-primary/40'
            }`}
          >
            <span className="text-sm font-medium text-text-primary">{card.label}</span>
            <span className="text-[32px] leading-[38px] text-text-primary">{card.count}</span>
            <span className="text-sm font-medium text-text-secondary">{card.sub}</span>
          </button>
        ))}
      </div>

      {/* Tab Bar / Top Header */}
      <div className="flex items-center justify-between border-b border-outline px-3 pr-4">
        <div className="flex items-center py-3">
          <div className="flex gap-2 items-center">
            <button
              onClick={() => { setActiveTab('pre-certs'); setActiveViewId(null); setEditingViewId(null); setFilters(EMPTY_FILTERS); setActiveScorecard(null); }}
              className={`px-2 py-0.5 rounded-lg text-sm font-medium leading-6 ${
                activeTab === 'pre-certs' && !activeViewId
                  ? 'bg-[#e7eafd] text-primary'
                  : 'text-text-secondary hover:bg-surface-variant'
              }`}
            >
              Pre-Certification
            </button>
            <button
              onClick={() => { setActiveTab('referrals'); setActiveViewId(null); setEditingViewId(null); setFilters(EMPTY_FILTERS); setActiveScorecard(null); }}
              className={`px-2 py-0.5 rounded-lg text-sm font-medium leading-6 ${
                activeTab === 'referrals' && !activeViewId
                  ? 'bg-[#e7eafd] text-primary'
                  : 'text-text-secondary hover:bg-surface-variant'
              }`}
            >
              Referrals
            </button>
            <div className="w-px h-7 bg-outline" />
            {savedViews.map((view) => (
              <div key={view.id} className="relative">
                {renamingViewId === view.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && renameValue.trim()) {
                        setSavedViews((prev) => prev.map((v) => v.id === view.id ? { ...v, name: renameValue.trim() } : v));
                        setRenamingViewId(null);
                      }
                      if (e.key === 'Escape') setRenamingViewId(null);
                    }}
                    onBlur={() => {
                      if (renameValue.trim()) {
                        setSavedViews((prev) => prev.map((v) => v.id === view.id ? { ...v, name: renameValue.trim() } : v));
                      }
                      setRenamingViewId(null);
                    }}
                    className="px-2 py-0.5 rounded-lg text-sm font-medium leading-6 border border-primary w-24 focus:outline-none"
                  />
                ) : (
                  <button
                    onClick={() => {
                      if (activeViewId === view.id) {
                        setContextMenuViewId(contextMenuViewId === view.id ? null : view.id);
                      } else {
                        setActiveViewId(view.id);
                        setFilters(view.filters);
                        setEditingViewId(null);
                        setContextMenuViewId(null);
                        setActiveScorecard(null);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenuViewId(view.id);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-sm font-medium leading-6 ${
                      activeViewId === view.id
                        ? 'bg-[#e7eafd] text-primary'
                        : 'text-text-secondary hover:bg-surface-variant'
                    }`}
                  >
                    {view.name}
                  </button>
                )}
                {contextMenuViewId === view.id && (
                  <div
                    ref={contextMenuRef}
                    className="absolute top-full left-0 mt-1 z-50 bg-white border border-black/10 rounded-lg shadow-[0px_4px_12px_rgba(0,0,0,0.08)] min-w-[160px] overflow-hidden"
                  >
                    <div className="flex flex-col gap-1 px-2 py-2.5">
                      <button
                        onClick={() => {
                          setActiveViewId(view.id);
                          setFilters(view.filters);
                          setEditingViewId(view.id);
                          setViewName(view.name);
                          setContextMenuViewId(null);
                        }}
                        className="flex items-center gap-2 pl-2.5 pr-1 py-1.5 rounded-lg w-full hover:bg-surface-variant transition-colors"
                      >
                        <Pencil className="w-5 h-5 text-text-secondary" />
                        <span className="text-sm font-medium text-text-secondary">Edit View</span>
                      </button>
                      <button
                        onClick={() => {
                          const id = `view-${Date.now()}`;
                          setSavedViews((prev) => [...prev, { id, name: `${view.name} (copy)`, filters: { ...view.filters } }]);
                          setContextMenuViewId(null);
                        }}
                        className="flex items-center gap-2 pl-2.5 pr-1 py-1.5 rounded-lg w-full hover:bg-surface-variant transition-colors"
                      >
                        <svg className="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                        <span className="text-sm font-medium text-text-secondary">Duplicate</span>
                      </button>
                      <div className="h-px bg-black/10 -mx-0.5 my-1" />
                      <button
                        onClick={() => {
                          setSavedViews((prev) => prev.filter((v) => v.id !== view.id));
                          if (activeViewId === view.id) {
                            setActiveViewId(null);
                            setFilters(EMPTY_FILTERS);
                          }
                          setContextMenuViewId(null);
                        }}
                        className="flex items-center gap-2 pl-2.5 pr-1 py-1.5 rounded-lg w-full hover:bg-surface-variant transition-colors"
                      >
                        <Trash2 className="w-5 h-5 text-text-secondary" />
                        <span className="text-sm font-medium text-text-secondary">Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <button className="flex items-center gap-1 h-7 pl-3.5 pr-2.5 py-[3px] border border-primary rounded-l-full text-sm font-medium text-primary">
              <Download className="w-4 h-4" />
              <span>Download Filtered View</span>
            </button>
            <button className="flex items-center justify-center w-7 h-7 border border-l-0 border-primary rounded-r-full">
              <ChevronDown className="w-[18px] h-[18px] text-primary" />
            </button>
          </div>
          <button className="flex items-center gap-1.5 h-7 px-3.5 py-[3px] bg-primary rounded-full text-sm font-medium text-white">
            <Plus className="w-3.5 h-3.5" />
            <span>Create Authorization</span>
          </button>
        </div>
      </div>

      {/* Save/Edit View Inline Bar */}
      {(saveViewMode || editingViewId) && (
        <div className="flex items-center justify-between border-b border-outline px-3 pr-4 py-3">
          <div className="flex items-center">
            <input
              type="text"
              autoFocus
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && viewName.trim()) {
                  if (editingViewId) {
                    setSavedViews((prev) => prev.map((v) => v.id === editingViewId ? { ...v, name: viewName.trim(), filters } : v));
                    setEditingViewId(null);
                  } else {
                    const id = `view-${Date.now()}`;
                    setSavedViews((prev) => [...prev, { id, name: viewName.trim(), filters }]);
                    setActiveViewId(id);
                    setSaveViewMode(false);
                  }
                }
                if (e.key === 'Escape') { setSaveViewMode(false); setEditingViewId(null); }
              }}
              placeholder="Name your view..."
              className="h-7 w-[212px] px-2 border border-text-primary rounded text-sm placeholder:text-[#b3b3b3] focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSaveViewMode(false); setEditingViewId(null); }}
              className="flex items-center h-7 px-3.5 py-[3px] border border-primary rounded-full text-sm font-medium text-primary hover:bg-[#e7eafd] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!viewName.trim()) return;
                if (editingViewId) {
                  setSavedViews((prev) => prev.map((v) => v.id === editingViewId ? { ...v, name: viewName.trim(), filters } : v));
                  setEditingViewId(null);
                } else {
                  const id = `view-${Date.now()}`;
                  setSavedViews((prev) => [...prev, { id, name: viewName.trim(), filters }]);
                  setActiveViewId(id);
                  setSaveViewMode(false);
                }
              }}
              className="flex items-center h-7 px-3.5 py-[3px] bg-primary rounded-full text-sm font-medium text-white hover:bg-primary-hover transition-colors"
            >
              Save View
            </button>
          </div>
        </div>
      )}

      {/* Filter / Display Bar — only show when no saved view is active, or when editing a view */}
      {(!activeViewId || editingViewId) && (
      <div className="flex items-center justify-between border-b border-outline px-3 pr-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className={`flex items-center gap-1.5 px-3 py-0.5 border rounded-full text-xs font-bold tracking-[0.1px] transition-colors ${
                filterOpen
                  ? 'border-primary bg-[#e7eafd] text-primary'
                  : 'border-[#f0f0f0] bg-white text-text-primary'
              }`}
            >
              <Filter className="w-[18px] h-[18px]" />
              <span>Filter</span>
            </button>
            <FilterDropdown
              open={filterOpen}
              onClose={() => setFilterOpen(false)}
              records={records}
              filters={filters}
              onChange={setFilters}
            />
          </div>

          {/* Active Filter Pills */}
          {(Object.keys(filters) as (keyof Filters)[]).map((key) =>
            filters[key].map((value) => (
              <SurfacedFilterPill
                key={`${key}-${value}`}
                category={key}
                value={value}
                onRemove={() => {
                  const next = filters[key].filter((v) => v !== value);
                  setFilters({ ...filters, [key]: next });
                }}
              />
            ))
          )}
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 h-7 px-3.5 py-[3px] border border-outline rounded-full bg-white text-sm font-medium text-text-primary">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Display</span>
          </button>
          {!isFiltersEmpty(filters) && (
            <>
              <div className="w-px h-7 bg-outline" />
              <button
                onClick={() => { setFilters(EMPTY_FILTERS); setEditingViewId(null); }}
                className="text-xs font-bold text-primary tracking-[0.1px] px-2.5 py-0.5 rounded-full hover:bg-[#e7eafd] transition-colors"
              >
                Clear
              </button>
              {!editingViewId && (
                <button
                  onClick={() => { setSaveViewMode(true); setViewName(''); }}
                  className="flex items-center h-7 px-3.5 py-[3px] border border-outline rounded-full bg-white text-sm font-medium text-text-primary hover:bg-surface-variant transition-colors"
                >
                  Save View
                </button>
              )}
            </>
          )}
        </div>
      </div>
      )}

      </>
      )}

      {/* Data Table */}
      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        <div className="flex-1 min-w-0 overflow-auto">
          <table className="w-full border-collapse min-w-max">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="bg-surface-variant border-b border-outline w-11 h-9" />
                <th className="bg-surface-variant border-b border-outline h-9 pl-2 pr-1 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={handleToggleSelectAll}
                    className="w-[18px] h-[18px] rounded-sm border-2 border-[#666] accent-primary cursor-pointer"
                  />
                </th>
                {TABLE_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`bg-surface-variant border-b border-outline ${col.width} h-9 px-4 py-2 text-left text-sm font-medium text-text-primary whitespace-nowrap`}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="bg-surface-variant border-b border-l border-outline w-[100px] h-9 px-4 py-2 text-right text-sm font-medium text-text-primary whitespace-nowrap sticky right-0 shadow-[-2px_0_4px_rgba(0,0,0,0.08)]">
                  Assignee
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group: PatientGroup) => {
                const patientKey = group.patientKey;
                const allRecords = [group.primary, ...group.children];
                const isExpanded = expandedPatients.has(patientKey);
                const hasMultiple = allRecords.length > 1;

                return allRecords.map((record, idx) => {
                  const isPrimary = idx === 0;
                  const isChild = !isPrimary;
                  const showRow = isPrimary || (hasMultiple && isExpanded);
                  if (!showRow) return null;

                  const isChildRow = isChild && hasMultiple && isExpanded;
                  const rowBg = isChildRow ? 'bg-surface-variant' : 'bg-white';

                  const isSelected = selectedRecordId === record.id;

                  return (
                    <tr
                      key={record.id}
                      ref={isSelected ? (el) => el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) : undefined}
                      onClick={() => setSelectedRecordId((prev) => prev === record.id ? null : record.id)}
                      className={`${rowBg} border-b border-outline h-12 hover:bg-[#f0f4ff] transition-colors cursor-pointer ${isSelected ? 'bg-[#f0f4ff]!' : ''}`}
                    >
                      {/* Expand */}
                      <td className="px-2 py-4 w-11" onClick={(e) => e.stopPropagation()}>
                        {isPrimary && hasMultiple ? (
                          <button
                            onClick={() => handleToggleExpand(patientKey)}
                            className="p-1 rounded-full hover:bg-outline/40"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-text-primary" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-text-primary" />
                            )}
                          </button>
                        ) : null}
                      </td>

                      {/* Checkbox */}
                      <td className="pl-2 pr-1 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(record.id)}
                          onChange={() => handleToggleSelect(record.id)}
                          className="w-[18px] h-[18px] rounded-sm border-2 border-[#666] accent-primary cursor-pointer"
                        />
                      </td>

                      {/* Patient */}
                      <td className="pl-2 pr-4 py-4 w-[145px]">
                        <span className="text-sm text-[#1566b7] truncate block">{record.patient.name}</span>
                      </td>

                      {/* Auth # */}
                      <td className="px-4 py-4 w-[160px]">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-text-primary truncate">
                            {record.authNumber || '-------------------'}
                          </span>
                          {record.authNumber && (
                            <svg width="10" height="12" viewBox="0 0 10 12" fill="none" className="shrink-0 opacity-60">
                              <path d="M7 0H1C0.45 0 0 0.45 0 1V8.5H1V1H7V0ZM9 2H3C2.45 2 2 2.45 2 3V11C2 11.55 2.45 12 3 12H9C9.55 12 10 11.55 10 11V3C10 2.45 9.55 2 9 2ZM9 11H3V3H9V11Z" fill="#666"/>
                            </svg>
                          )}
                        </div>
                      </td>

                      {/* Payer */}
                      <td className="px-4 py-4 w-[105px]">
                        <span className="text-sm text-[#1566b7] truncate block">{record.payer.name}</span>
                      </td>

                      {/* Start */}
                      <td className="px-4 py-4 w-[93px]">
                        <span className="text-sm text-text-primary truncate block">
                          {record.startDate || '--/--'}
                        </span>
                      </td>

                      {/* End */}
                      <td className="px-4 py-4 w-[93px]">
                        <span className="text-sm text-text-primary truncate block">
                          {record.endDate || '--/--'}
                        </span>
                      </td>

                      {/* Visits */}
                      <td className="px-4 py-4 w-[120px]">
                        <VisitsBarV2
                          authorized={record.visitsAuthorized}
                          completed={record.visitsCompleted}
                          scheduled={record.visitsScheduled}
                        />
                      </td>

                      {!isDetailOpen && (
                        <>
                        <td className="px-4 py-2 w-[107px]">
                          <StateChip state={record.state} />
                        </td>
                        <td className="px-4 py-4 w-[92px]">
                          <StatusDot status={record.status} />
                        </td>
                        <td className="px-4 py-4 w-[160px]">
                          <span className="text-sm text-text-primary truncate block">{record.facility}</span>
                        </td>
                        <td className="px-4 py-4 w-[132px]">
                          <span className="text-sm text-text-primary truncate block w-[100px]">{record.provider}</span>
                        </td>
                        <td className="px-4 py-4 w-[167px]">
                          <div className="flex items-center gap-1 flex-wrap">
                            {record.tags.length > 0 ? (
                              <span className="inline-flex items-center px-2 h-7 rounded-lg bg-outline text-[12px] font-medium leading-[18px] text-text-primary whitespace-nowrap">
                                WC AUTHORIZATION
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-4 flex-1 min-w-[120px]">
                          <span className="text-sm text-text-primary truncate block">
                            {record.notes.length > 0
                              ? `${record.notes[0].text} - 3/12 3:45pm`
                              : ''}
                          </span>
                        </td>
                        </>
                      )}

                      {/* Assignee (sticky) */}
                      <td className={`px-4 py-2 w-[100px] text-right sticky right-0 ${rowBg} border-l border-outline shadow-[-2px_0_4px_rgba(0,0,0,0.08)]`}>
                        <AssigneeCell
                          record={record}
                          isOpen={assigneeDropdownId === record.id}
                          onToggle={() => setAssigneeDropdownId((prev) => (prev === record.id ? null : record.id))}
                          onAssign={(names) => handleAssignRecord(record.id, names)}
                          onClose={() => setAssigneeDropdownId(null)}
                        />
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>

      <BulkActions
        selectedCount={selectedIds.size}
        onClear={handleClearSelection}
        onAssignOwner={handleBulkAssignOwner}
        onChangeState={handleBulkChangeState}
        onAddTags={handleBulkAddTags}
        onAddNote={handleBulkAddNote}
        onArchive={handleBulkArchive}
        onDelete={handleBulkDelete}
        owners={allOwners}
        allTags={allTags}
      />
      </div>

      {selectedRecord && (
        <AuthDetailPanel
          record={selectedRecord}
          allRecords={records}
          onClose={() => { setSelectedRecordId(null); setTableCollapsed(false); }}
          onReassignVisit={handleReassignVisit}
          onDetailChange={handleDetailChange}
          tableCollapsed={tableCollapsed}
          onExpandTable={() => setTableCollapsed(false)}
        />
      )}
    </main>
  );
}
