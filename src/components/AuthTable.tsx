import { ChevronDown, ChevronUp, ExternalLink, Copy, Pencil, Trash2 } from 'lucide-react';
import type { AuthRecord, AuthState } from '../types';
import VisitsBar from './VisitsBar';
import StatusBadge from './StatusBadge';
import StateSelect from './StateSelect';

interface AuthTableProps {
  records: AuthRecord[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onStateChange: (id: string, state: AuthState) => void;
}

const COLUMNS = [
  { key: 'patient', label: 'Patient', width: 'w-[145px]' },
  { key: 'authNumber', label: 'Auth #', width: 'w-[160px]' },
  { key: 'payer', label: 'Payer', width: 'w-[105px]' },
  { key: 'start', label: 'Start', width: 'w-[92px]' },
  { key: 'end', label: 'End', width: 'w-[92px]' },
  { key: 'visits', label: 'Visits', width: 'w-[120px]' },
  { key: 'state', label: 'State', width: 'w-[178px]' },
  { key: 'status', label: 'Status', width: 'w-[92px]' },
  { key: 'facility', label: 'Facility', width: 'w-[160px]' },
  { key: 'actions', label: 'Actions', width: 'w-[92px]' },
];

export default function AuthTable({
  records,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  expandedId,
  onToggleExpand,
  onStateChange,
}: AuthTableProps) {
  const allSelected = records.length > 0 && selectedIds.size === records.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <div className="flex-1 overflow-x-auto overflow-y-auto">
      <table className="w-full min-w-[1200px] border-collapse">
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
                className={`bg-surface-variant border-b border-outline ${col.width} h-9 px-4 py-2 text-left text-sm font-medium text-text-primary whitespace-nowrap`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <TableRow
              key={record.id}
              record={record}
              selected={selectedIds.has(record.id)}
              expanded={expandedId === record.id}
              onToggleSelect={() => onToggleSelect(record.id)}
              onToggleExpand={() => onToggleExpand(record.id)}
              onStateChange={(s) => onStateChange(record.id, s)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableRow({
  record,
  selected,
  expanded,
  onToggleSelect,
  onToggleExpand,
  onStateChange,
}: {
  record: AuthRecord;
  selected: boolean;
  expanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onStateChange: (s: AuthState) => void;
}) {
  const ExpandIcon = expanded ? ChevronUp : ChevronDown;

  return (
    <tr className={`border-b border-outline transition-colors ${selected ? 'bg-primary/[0.03]' : 'bg-white hover:bg-surface-variant/50'}`}>
      <td className="px-2 py-4">
        <button onClick={onToggleExpand} className="p-1 rounded-full hover:bg-surface-variant transition-colors">
          <ExpandIcon className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
        </button>
      </td>
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
        <div className="flex flex-col">
          <a href="#" className="text-sm font-medium text-primary hover:underline">{record.patient.name}</a>
          <div className="flex items-center gap-1 text-xs text-text-primary">
            <span>DOB: {record.patient.dob}</span>
            <button className="hover:text-primary transition-colors">
              <Copy className="w-3 h-3" strokeWidth={1.5} />
            </button>
          </div>
        </div>
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
        {record.visitsAuthorized > 0 ? (
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
        <span className="text-sm text-text-primary truncate block max-w-[140px]">{record.facility}</span>
      </td>

      {/* Actions */}
      <td className="px-4 py-4">
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
