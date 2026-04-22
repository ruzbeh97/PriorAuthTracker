import { ChevronDown, ChevronUp, ExternalLink, Copy, Pencil, Trash2, MessageSquare } from 'lucide-react';
import type { AuthRecord, AuthState } from '../types';
import { groupByPatient } from '../utils';
import VisitsBar from './VisitsBar';
import StatusBadge from './StatusBadge';
import StateSelect from './StateSelect';

interface AuthTableProps {
  records: AuthRecord[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  expandedPatients: Set<string>;
  onToggleExpand: (patientKey: string) => void;
  onStateChange: (id: string, state: AuthState) => void;
  onNotesClick: (recordId: string) => void;
  onRowClick: (recordId: string) => void;
  activeRecordId: string | null;
}

const COLUMNS = [
  { key: 'patient', label: 'Patient', width: 'min-w-[120px] w-[145px]' },
  { key: 'authNumber', label: 'Auth #', width: 'min-w-[120px] w-[160px]' },
  { key: 'payer', label: 'Payer', width: 'min-w-[80px] w-[105px]' },
  { key: 'start', label: 'Start', width: 'min-w-[60px] w-[92px]' },
  { key: 'end', label: 'End', width: 'min-w-[60px] w-[92px]' },
  { key: 'visits', label: 'Visits', width: 'min-w-[100px] w-[120px]' },
  { key: 'state', label: 'State', width: 'min-w-[120px] w-[178px]' },
  { key: 'status', label: 'Status', width: 'min-w-[70px] w-[92px]' },
  { key: 'facility', label: 'Facility', width: 'min-w-[100px] w-[140px]' },
  { key: 'provider', label: 'Provider', width: 'min-w-[90px] w-[120px]' },
  { key: 'assignedTo', label: 'Assigned To', width: 'min-w-[90px] w-[120px]' },
  { key: 'tags', label: 'Tags', width: 'min-w-[100px] w-[160px]' },
  { key: 'notes', label: 'Notes', width: 'min-w-[120px] w-[280px]' },
];

export default function AuthTable({
  records,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  expandedPatients,
  onToggleExpand,
  onStateChange,
  onNotesClick,
  onRowClick,
  activeRecordId,
}: AuthTableProps) {
  const allSelected = records.length > 0 && selectedIds.size === records.length;
  const someSelected = selectedIds.size > 0 && !allSelected;
  const groups = groupByPatient(records);

  return (
    <div className="flex-1 min-w-0 overflow-x-auto overflow-y-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="bg-surface-variant border-b border-outline w-11 h-9" />
            <th className="bg-surface-variant border-b border-outline w-11 h-9 p-2">
              <div className="flex items-center justify-end">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={onToggleSelectAll}
                  className="w-[18px] h-[18px] rounded-sm border-2 border-[#666] accent-primary cursor-pointer"
                />
              </div>
            </th>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`bg-surface-variant border-b border-outline ${col.width} h-9 px-4 py-2 text-left text-sm font-medium text-text-primary whitespace-nowrap overflow-hidden text-ellipsis`}
              >
                {col.label}
              </th>
            ))}
            <th className="bg-surface-variant border-b border-outline sticky right-0 z-20 w-[92px] min-w-[92px] h-9 px-4 py-2 text-left text-sm font-medium text-text-primary whitespace-nowrap shadow-[-6px_0_12px_rgba(0,0,0,0.18)]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const hasChildren = group.children.length > 0;
            const isExpanded = expandedPatients.has(group.patientKey);

            return (
              <PatientGroupRows
                key={group.patientKey}
                primary={group.primary}
                children={group.children}
                hasChildren={hasChildren}
                isExpanded={isExpanded}
                patientKey={group.patientKey}
                selectedIds={selectedIds}
                onToggleSelect={onToggleSelect}
                onToggleExpand={() => onToggleExpand(group.patientKey)}
                onStateChange={onStateChange}
                onNotesClick={onNotesClick}
                onRowClick={onRowClick}
                activeRecordId={activeRecordId}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PatientGroupRows({
  primary,
  children,
  hasChildren,
  isExpanded,
  patientKey: _patientKey,
  selectedIds,
  onToggleSelect,
  onToggleExpand,
  onStateChange,
  onNotesClick,
  onRowClick,
  activeRecordId,
}: {
  primary: AuthRecord;
  children: AuthRecord[];
  hasChildren: boolean;
  isExpanded: boolean;
  patientKey: string;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleExpand: () => void;
  onStateChange: (id: string, state: AuthState) => void;
  onNotesClick: (recordId: string) => void;
  onRowClick: (recordId: string) => void;
  activeRecordId: string | null;
}) {
  return (
    <>
      <TableRow
        record={primary}
        selected={selectedIds.has(primary.id)}
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        isChild={false}
        isActive={activeRecordId === primary.id}
        onToggleSelect={() => onToggleSelect(primary.id)}
        onToggleExpand={onToggleExpand}
        onStateChange={(s) => onStateChange(primary.id, s)}
        onNotesClick={() => onNotesClick(primary.id)}
        onRowClick={() => onRowClick(primary.id)}
      />
      {isExpanded &&
        children.map((child) => (
          <TableRow
            key={child.id}
            record={child}
            selected={selectedIds.has(child.id)}
            hasChildren={false}
            isExpanded={false}
            isChild={true}
            isActive={activeRecordId === child.id}
            onToggleSelect={() => onToggleSelect(child.id)}
            onToggleExpand={() => {}}
            onStateChange={(s) => onStateChange(child.id, s)}
            onNotesClick={() => onNotesClick(child.id)}
            onRowClick={() => onRowClick(child.id)}
          />
        ))}
    </>
  );
}

function TableRow({
  record,
  selected,
  hasChildren,
  isExpanded,
  isChild,
  isActive,
  onToggleSelect,
  onToggleExpand,
  onStateChange,
  onNotesClick,
  onRowClick,
}: {
  record: AuthRecord;
  selected: boolean;
  hasChildren: boolean;
  isExpanded: boolean;
  isChild: boolean;
  isActive: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onStateChange: (s: AuthState) => void;
  onNotesClick: () => void;
  onRowClick: () => void;
}) {
  const ExpandIcon = isExpanded ? ChevronUp : ChevronDown;

  const rowBg = isActive
    ? 'bg-primary/[0.06]'
    : isChild
      ? 'bg-surface-variant/40'
      : selected
        ? 'bg-primary/[0.03]'
        : 'bg-white hover:bg-surface-variant/50';

  return (
    <tr className={`border-b border-outline transition-colors cursor-pointer ${rowBg}`} onClick={onRowClick}>
      {/* Expand toggle */}
      <td className="px-2 py-4">
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); onToggleExpand(); }} className="p-1 rounded-full hover:bg-surface-variant transition-colors">
            <ExpandIcon className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
          </button>
        ) : isChild ? (
          <div className="w-7 flex justify-center">
            <div className="w-px h-full min-h-[20px] bg-outline" />
          </div>
        ) : null}
      </td>

      {/* Checkbox */}
      <td className="px-2 py-4">
        <div className="flex items-center justify-end">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="w-[18px] h-[18px] rounded-sm border-2 border-[#666] accent-primary cursor-pointer"
          />
        </div>
      </td>

      {/* Patient */}
      <td className="px-4 py-4">
        {isChild ? (
          <div className="pl-2 text-sm text-text-secondary italic">
            {record.patient.name}
          </div>
        ) : (
          <div className="flex flex-col">
            <a href="#" className="text-sm font-medium text-primary hover:underline">{record.patient.name}</a>
            <div className="flex items-center gap-1 text-xs text-text-primary">
              <span>DOB: {record.patient.dob}</span>
              <button className="hover:text-primary transition-colors">
                <Copy className="w-3 h-3" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}
      </td>

      {/* Auth # */}
      <td className="px-4 py-4">
        {record.authNumber ? (
          <div className="flex items-center gap-1">
            <span className="text-sm text-text-primary">{record.authNumber}</span>
            <button className="hover:text-primary transition-colors">
              <Copy className="w-3 h-3 text-text-secondary" strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <span className="text-sm text-text-secondary">--</span>
        )}
      </td>

      {/* Payer */}
      <td className="px-4 py-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-text-primary">{record.payer.name}</span>
            <button className="hover:text-primary transition-colors">
              <ExternalLink className="w-3 h-3 text-text-secondary" strokeWidth={1.5} />
            </button>
          </div>
          <span className="text-xs text-text-primary">ID: {record.payer.planId}</span>
        </div>
      </td>

      {/* Start */}
      <td className="px-4 py-4">
        <span className="text-sm text-text-primary">{record.startDate || '--'}</span>
      </td>

      {/* End */}
      <td className="px-4 py-4">
        <span className="text-sm text-text-primary">{record.endDate || '--'}</span>
      </td>

      {/* Visits */}
      <td className="px-4 py-4">
        {(record.visitsAuthorized > 0 || record.visitsCompleted > 0 || record.visitsScheduled > 0) ? (
          <VisitsBar
            authorized={record.visitsAuthorized}
            completed={record.visitsCompleted}
            scheduled={record.visitsScheduled}
          />
        ) : (
          <span className="text-sm text-text-secondary">--</span>
        )}
      </td>

      {/* State */}
      <td className="px-4 py-4">
        <StateSelect value={record.state} onChange={onStateChange} />
      </td>

      {/* Status */}
      <td className="px-4 py-4">
        <StatusBadge status={record.status} />
      </td>

      {/* Facility */}
      <td className="px-4 py-4">
        <span className="text-sm text-text-primary truncate block max-w-[130px]">{record.facility}</span>
      </td>

      {/* Provider */}
      <td className="px-4 py-4">
        <span className="text-sm text-text-primary">{record.provider}</span>
      </td>

      {/* Assigned To */}
      <td className="px-4 py-4">
        <span className="text-sm text-text-primary">{record.assignedTo}</span>
      </td>

      {/* Tags */}
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-1">
          {record.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      </td>

      {/* Notes */}
      <td className="px-4 py-4">
        <button
          onClick={onNotesClick}
          className="flex items-start gap-1.5 text-left group/note w-full"
        >
          <MessageSquare className="w-3.5 h-3.5 text-text-secondary shrink-0 mt-0.5 group-hover/note:text-primary transition-colors" strokeWidth={1.5} />
          <span className="text-sm text-text-primary line-clamp-2 group-hover/note:text-primary transition-colors">
            {record.notes.length > 0
              ? record.notes[record.notes.length - 1].text
              : 'Add a note...'}
          </span>
          {record.notes.length > 1 && (
            <span className="text-[11px] text-text-secondary bg-surface-variant rounded-full px-1.5 py-0.5 shrink-0 mt-0.5">
              +{record.notes.length - 1}
            </span>
          )}
        </button>
      </td>

      {/* Actions — sticky right */}
      <td className={`px-4 py-4 sticky right-0 z-10 shadow-[-6px_0_12px_rgba(0,0,0,0.18)] ${isActive ? 'bg-[#ededff]' : isChild ? 'bg-[#f9f9f9]' : selected ? 'bg-[#f5f6ff]' : 'bg-white'}`}>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded hover:bg-surface-variant transition-colors">
            <Pencil className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
          </button>
          <button className="p-1 rounded hover:bg-red-50 transition-colors">
            <Trash2 className="w-4 h-4 text-text-secondary hover:text-status-expired" strokeWidth={1.5} />
          </button>
        </div>
      </td>
    </tr>
  );
}
