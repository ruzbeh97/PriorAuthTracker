import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Pencil, CheckCircle, ArrowRight, ExternalLink, ChevronDown, ChevronUp, FileText, ArrowRightLeft, Edit3, User, Globe, History, Paperclip, Calendar, Upload, IdCard, PanelRightClose, Download, Search, Eye, Plus, Check, Trash2, MessageSquare } from 'lucide-react';
import type { AuthRecord, TimelineEntry } from '../types';
import VisitsBar from './VisitsBar';
import CopyButton from './CopyButton';

interface AuthDetailPanelProps {
  record: AuthRecord;
  allRecords: AuthRecord[];
  onClose?: () => void;
  onReassignVisit: (fromRecordId: string, toAuthNumber: string, type: 'completed' | 'scheduled', apptDateTime?: string) => void;
  onDetailChange: (recordId: string, field: string, from: string, to: string) => void;
  onAddNote?: (recordId: string, text: string) => void;
  onDeleteNote?: (recordId: string, noteId: string) => void;
  tableCollapsed?: boolean;
  onExpandTable?: () => void;
  separated?: boolean;
}

const PAYER_PORTAL_URLS: Record<string, string> = {
  'BCBS': 'https://www.availity.com/',
  'UHC': 'https://www.uhcprovider.com/',
  'Aetna': 'https://www.availity.com/',
  'Cigna': 'https://cignaforhcp.cigna.com/',
  'Medicare': 'https://www.cms.gov/',
  'Humana': 'https://www.availity.com/',
  'Medicaid': 'https://www.medicaid.gov/',
};

const STATUS_DOT_COLORS: Record<string, string> = {
  'Active': 'bg-status-active',
  'Expiring Soon': 'bg-status-expiring',
  'Expired': 'bg-status-expired',
  'Needs Auth': 'bg-status-needs-auth',
};

function generateExceededAppointments(count: number, startMonth: number, startDay: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const day = startDay + i;
    return `${startMonth}/${day} 11:00 am`;
  });
}


interface ExceededAppt {
  id: string;
  dateTime: string;
}

interface PendingReassignment {
  apptId: string;
  toAuthNumber: string;
  type: 'completed' | 'scheduled';
}

export default function AuthDetailPanel({ record, allRecords, onReassignVisit, onDetailChange, onAddNote, onDeleteNote, tableCollapsed, onExpandTable, separated = false }: AuthDetailPanelProps) {
  const visitsRemaining = record.visitsAuthorized - record.visitsCompleted;
  const unscheduled = Math.max(0, visitsRemaining - record.visitsScheduled);

  const [completedAppts, setCompletedAppts] = useState<ExceededAppt[]>([]);
  const [scheduledAppts, setScheduledAppts] = useState<ExceededAppt[]>([]);
  const [pendingReassignments, setPendingReassignments] = useState<PendingReassignment[]>([]);
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const [newNote, setNewNote] = useState('');
  const [portalCurrentUrl, setPortalCurrentUrl] = useState('');
  const [portalAddressValue, setPortalAddressValue] = useState('');
  const initializedForRef = useRef<string | null>(null);

  if (initializedForRef.current !== record.id) {
    initializedForRef.current = record.id;
    const completedOverage = Math.max(0, record.visitsCompleted - record.visitsAuthorized);
    const totalExceeded = record.visitsCompleted + record.visitsScheduled > record.visitsAuthorized;
    if (totalExceeded && completedOverage > 0) {
      setCompletedAppts(
        generateExceededAppointments(completedOverage, 3, 28).map((dt, i) => ({ id: `c-${i}`, dateTime: dt }))
      );
    } else {
      setCompletedAppts([]);
    }
    if (totalExceeded && record.visitsScheduled > 0) {
      setScheduledAppts(
        generateExceededAppointments(record.visitsScheduled, 3, 28 + completedOverage).map((dt, i) => ({ id: `s-${i}`, dateTime: dt }))
      );
    } else {
      setScheduledAppts([]);
    }
  }

  const pastDateOptions = generateExceededAppointments(8, 3, 20);
  const patientAuths = allRecords
    .filter((r) => r.patient.name === record.patient.name && r.patient.dob === record.patient.dob)
    .map((r) => r.authNumber || '--');
  const authOptions = [...new Set(patientAuths)];

  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [portalOpen, setPortalOpen] = useState(false);

  const hasPendingChanges = pendingReassignments.length > 0 || Object.keys(editFields).length > 0;

  const portalUrl = PAYER_PORTAL_URLS[record.payer.name] || `https://www.google.com/search?q=${encodeURIComponent(record.payer.name + ' provider portal')}`;

  const providerOptions = useMemo(() => {
    const seed = ['Jon Jones', 'Sarah Adams', 'Dr. Li'];
    const fromRecords = allRecords.map((r) => r.provider).filter(Boolean);
    return [...new Set([...seed, ...fromRecords, record.provider].filter(Boolean))].sort();
  }, [allRecords, record.provider]);

  const facilityOptions = useMemo(() => {
    const seed = ['Sunnybrook Hospital', 'Riverside Clinic', 'Westside Rehab'];
    const fromRecords = allRecords.map((r) => r.facility).filter(Boolean);
    return [...new Set([...seed, ...fromRecords, record.facility].filter(Boolean))].sort();
  }, [allRecords, record.facility]);

  const assigneeOptions = useMemo(() => {
    const seed = ['Jaime Mandela', 'Emma Smith', 'Adam Smith'];
    const fromRecords = allRecords.flatMap((r) => (r.assignedTo ? r.assignedTo.split(', ').filter(Boolean) : []));
    const current = record.assignedTo ? record.assignedTo.split(', ').filter(Boolean) : [];
    return [...new Set([...seed, ...fromRecords, ...current])].sort();
  }, [allRecords, record.assignedTo]);

  useEffect(() => {
    if (portalOpen) {
      setPortalCurrentUrl(portalUrl);
      setPortalAddressValue(portalUrl);
    }
  }, [portalUrl, portalOpen]);

  return (
    <div className={`flex h-full ${separated ? 'gap-3' : 'bg-white border border-outline overflow-hidden'} ${tableCollapsed ? 'flex-1 min-w-0' : 'shrink-0'}`}>

    <div className={`flex h-full overflow-hidden ${separated ? 'bg-white border border-outline rounded-lg' : ''} ${tableCollapsed ? 'flex-1 min-w-0' : portalOpen ? 'w-[880px]' : 'w-[440px]'}`}>
      {portalOpen && (
        <div className={`${tableCollapsed ? 'flex-1 min-w-0' : 'w-[440px] shrink-0'} flex flex-col border-r border-outline`}>
          <div className="flex items-center gap-2 px-3 py-2 border-b border-outline shrink-0">
            <div className="flex-1 flex items-center bg-[#f5f5f5] border border-outline rounded-full overflow-hidden">
              <input
                type="text"
                value={portalAddressValue}
                onChange={(e) => setPortalAddressValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    let url = portalAddressValue.trim();
                    if (!url) return;
                    if (!/^https?:\/\//i.test(url)) {
                      url = /^[a-z0-9-]+\.[a-z]{2,}/i.test(url) ? `https://${url}` : `https://www.google.com/search?q=${encodeURIComponent(url)}`;
                    }
                    setPortalCurrentUrl(url);
                    setPortalAddressValue(url);
                  }
                }}
                placeholder="Search or enter URL"
                className="flex-1 min-w-0 text-xs text-text-primary px-3 py-1.5 focus:outline-none bg-transparent"
              />
              <button
                onClick={() => {
                  let url = portalAddressValue.trim();
                  if (!url) return;
                  if (!/^https?:\/\//i.test(url)) {
                    url = /^[a-z0-9-]+\.[a-z]{2,}/i.test(url) ? `https://${url}` : `https://www.google.com/search?q=${encodeURIComponent(url)}`;
                  }
                  setPortalCurrentUrl(url);
                  setPortalAddressValue(url);
                }}
                className="p-1.5 hover:bg-surface-variant transition-colors shrink-0"
              >
                <ArrowRight className="w-3.5 h-3.5 text-text-secondary" strokeWidth={1.5} />
              </button>
            </div>
            <a href={portalCurrentUrl} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-surface-variant transition-colors shrink-0" title="Open in new tab">
              <ExternalLink className="w-3.5 h-3.5 text-text-secondary" strokeWidth={1.5} />
            </a>
            <button onClick={() => setPortalOpen(false)} className="p-1 rounded hover:bg-surface-variant transition-colors shrink-0" title="Close portal">
              <X className="w-3.5 h-3.5 text-text-secondary" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex-1 bg-[#f5f5f5]">
            <iframe
              src={portalCurrentUrl}
              title={`${record.payer.name} Portal`}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        </div>
      )}

      <div className={`${tableCollapsed ? 'flex-1 min-w-0' : 'w-[440px] shrink-0'} flex flex-col overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-outline shrink-0">
        <div className="flex items-center gap-3">
          {tableCollapsed && (
            <button
              onClick={onExpandTable}
              className="p-1 rounded hover:bg-surface-variant transition-colors"
              title="Expand table"
            >
              <PanelRightClose className="w-5 h-5 text-text-secondary" />
            </button>
          )}
          <h2 className="text-xl font-medium text-text-primary">
            {activeAction === 'assign'
              ? 'Patient Demographics'
              : activeAction === 'attachments'
              ? 'Attachments'
              : activeAction === 'appointments'
              ? 'Appointments'
              : 'Authorization Details'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPortalOpen((prev) => {
                if (!prev) {
                  setPortalCurrentUrl(portalUrl);
                  setPortalAddressValue(portalUrl);
                }
                return !prev;
              });
            }}
            className={`p-1.5 rounded-full transition-colors ${portalOpen ? 'bg-primary/10 text-primary' : 'hover:bg-surface-variant'}`}
            title="Open payer portal"
          >
            <Globe className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (hasPendingChanges) {
                const allAppts = [...completedAppts, ...scheduledAppts];
                pendingReassignments.forEach((p) => {
                  const appt = allAppts.find((a) => a.id === p.apptId);
                  onReassignVisit(record.id, p.toAuthNumber, p.type, appt?.dateTime);
                });
                const reassignedIds = new Set(pendingReassignments.map((p) => p.apptId));
                setCompletedAppts((prev) => prev.filter((a) => !reassignedIds.has(a.id)));
                setScheduledAppts((prev) => prev.filter((a) => !reassignedIds.has(a.id)));
                setPendingReassignments([]);

                Object.entries(editFields).forEach(([field, value]) => {
                  const rec = record as unknown as Record<string, unknown>;
                  const originalValue = String(rec[field] ?? '');
                  if (value !== originalValue) {
                    onDetailChange(record.id, field, originalValue, value);
                  }
                });
                setEditing(false);
                setEditFields({});
              }
            }}
            className={`h-8 px-4 rounded-full text-sm font-medium transition-colors ${
              hasPendingChanges
                ? 'bg-primary border border-primary text-white hover:bg-primary-hover'
                : 'border border-outline text-text-secondary hover:bg-surface-variant'
            }`}
          >
            Save
          </button>
        </div>
      </div>

      {activeAction === 'assign' ? (
        <PatientDemographicsView record={record} />
      ) : activeAction === 'attachments' ? (
        <AttachmentsView record={record} />
      ) : activeAction === 'appointments' ? (
        <AppointmentsView record={record} />
      ) : (
      <div className="flex-1 overflow-y-auto py-4">
        {/* Patient header */}
        <div className="px-4 pb-2">
          <p className="text-sm font-medium text-text-primary">{record.patient.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT_COLORS[record.status] || 'bg-gray-400'}`} />
              <span className="text-sm text-text-primary">{record.status}</span>
            </div>
            <span className="px-2 py-0.5 bg-primary/10 rounded-lg text-xs font-medium text-primary">
              {record.state}
            </span>
            {record.patient.mrn && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-text-primary">{record.patient.mrn}</span>
                <CopyButton text={record.patient.mrn} />
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="text-xs text-text-primary">DOB: {record.patient.dob}</span>
              <CopyButton text={record.patient.dob} />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-outline" />

        {/* Details section */}
        <div className="px-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-text-primary">Details</span>
            <button
              onClick={() => {
                if (editing) {
                  Object.entries(editFields).forEach(([field, newVal]) => {
                    let oldVal = '';
                    switch (field) {
                      case 'Authorization Number': oldVal = record.authNumber || '--'; break;
                      case 'Payer': oldVal = record.payer.name; break;
                      case 'Start Date': oldVal = record.startDate || '--'; break;
                      case 'End Date': oldVal = record.endDate || '--'; break;
                      case 'Assigned To': oldVal = record.assignedTo; break;
                      case 'Provider': oldVal = record.provider; break;
                      case 'Facility': oldVal = record.facility; break;
                    }
                    if (newVal !== oldVal) onDetailChange(record.id, field, oldVal, newVal);
                  });
                  setEditFields({});
                } else {
                  setEditFields({
                    'Authorization Number': record.authNumber || '',
                    'Payer': record.payer.name,
                    'Start Date': record.startDate || '',
                    'End Date': record.endDate || '',
                    'Assigned To': record.assignedTo,
                    'Provider': record.provider,
                    'Facility': record.facility,
                  });
                }
                setEditing((e) => !e);
              }}
              className="p-1 rounded-full hover:bg-surface-variant transition-colors"
            >
              {editing
                ? <CheckCircle className="w-4 h-4 text-status-active" strokeWidth={1.5} />
                : <Pencil className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />}
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <EditableDetailRow editing={editing} label="Authorization Number" value={record.authNumber || '--'} editValue={editFields['Authorization Number']} onChange={(v) => setEditFields((p) => ({ ...p, 'Authorization Number': v }))} copyable={!!record.authNumber} />
            <EditableDetailRow editing={editing} label="Payer" value={record.payer.name} editValue={editFields['Payer']} onChange={(v) => setEditFields((p) => ({ ...p, 'Payer': v }))} copyable />
            <DetailRow label="Payer ID" value={`${record.payer.name}IL: ${record.payer.planId}`} copyable />
            <EditableDetailRow editing={editing} label="Start Date" value={record.startDate || '--'} editValue={editFields['Start Date']} onChange={(v) => setEditFields((p) => ({ ...p, 'Start Date': v }))} />
            <EditableDetailRow editing={editing} label="End Date" value={record.endDate || '--'} editValue={editFields['End Date']} onChange={(v) => setEditFields((p) => ({ ...p, 'End Date': v }))} />
            <DetailRow label="Visits Authorized" value={String(record.visitsAuthorized)} />
            <DetailRow label="Visits Completed" value={String(record.visitsCompleted)} />
            <DetailRow label="Future Visits Scheduled" value={String(record.visitsScheduled)} />
            <DetailRow label="Visits Remaining" value={visitsRemaining > 0 ? `${visitsRemaining} (${unscheduled} unscheduled)` : '0'} />
            {record.confidence && (
              <div className="flex items-center gap-2 py-0.5">
                <span className="w-[150px] shrink-0 text-xs text-text-secondary">Confidence</span>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-5 h-5 text-status-active" strokeWidth={1.5} />
                  <span className="text-xs font-medium text-text-primary">{record.confidence}</span>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2 py-1">
              <span className="w-[150px] shrink-0 text-xs text-text-secondary">State</span>
              <span className="px-2 py-0.5 bg-primary/10 rounded-lg text-xs font-medium text-primary">
                {record.state}
              </span>
            </div>
            <EditableDetailRow editing={editing} label="Assigned To" value={record.assignedTo} editValue={editFields['Assigned To']} onChange={(v) => setEditFields((p) => ({ ...p, 'Assigned To': v }))} options={assigneeOptions} />
            <EditableDetailRow editing={editing} label="Provider" value={record.provider} editValue={editFields['Provider']} onChange={(v) => setEditFields((p) => ({ ...p, 'Provider': v }))} options={providerOptions} />
            <EditableDetailRow editing={editing} label="Facility" value={record.facility} editValue={editFields['Facility']} onChange={(v) => setEditFields((p) => ({ ...p, 'Facility': v }))} options={facilityOptions} />
          </div>
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-outline" />

        {/* Visit Utilization */}
        <div className="px-4">
          <p className="text-sm font-medium text-text-primary mb-2">Visit Utilization</p>
          {(record.visitsAuthorized > 0 || record.visitsCompleted > 0 || record.visitsScheduled > 0) ? (
            <VisitsBar
              authorized={record.visitsAuthorized}
              completed={record.visitsCompleted}
              scheduled={record.visitsScheduled}
            />
          ) : (
            <span className="text-sm text-text-secondary">--</span>
          )}
        </div>

        {/* Completed Appointments section */}
        {completedAppts.length > 0 && (
          <div className="px-4">
            <div className="flex items-center gap-2 px-0 py-1">
              <span className="flex-1 text-sm font-medium text-status-expired">
                Completed Appointments (exceeded)
              </span>
              <ArrowRight className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
              <span className="flex-1 text-sm font-medium text-text-primary">Authorization</span>
            </div>
            {completedAppts.map((appt) => {
              const pending = pendingReassignments.find((p) => p.apptId === appt.id);
              return (
                <AppointmentRow
                  key={appt.id}
                  dateTime={appt.dateTime}
                  authNumber={pending?.toAuthNumber ?? (record.authNumber || '--')}
                  dateOptions={pastDateOptions}
                  authOptions={authOptions}
                  onAuthChange={(newAuth) => {
                    setPendingReassignments((prev) => {
                      const without = prev.filter((p) => p.apptId !== appt.id);
                      const currentAuth = record.authNumber || '--';
                      if (newAuth === currentAuth) return without;
                      return [...without, { apptId: appt.id, toAuthNumber: newAuth, type: 'completed' }];
                    });
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Scheduled Appointments section */}
        {scheduledAppts.length > 0 && (
          <div className="px-4 mt-2">
            <div className="flex items-center gap-2 px-0 py-1">
              <span className="flex-1 text-sm font-medium text-[#f27573]">
                Scheduled Appointments (exceeded)
              </span>
              <ArrowRight className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
              <span className="flex-1 text-sm font-medium text-text-primary">Authorization</span>
            </div>
            {scheduledAppts.map((appt) => {
              const pending = pendingReassignments.find((p) => p.apptId === appt.id);
              return (
                <AppointmentRow
                  key={appt.id}
                  dateTime={appt.dateTime}
                  authNumber={pending?.toAuthNumber ?? (record.authNumber || '--')}
                  dateOptions={pastDateOptions}
                  authOptions={authOptions}
                  onAuthChange={(newAuth) => {
                    setPendingReassignments((prev) => {
                      const without = prev.filter((p) => p.apptId !== appt.id);
                      const currentAuth = record.authNumber || '--';
                      if (newAuth === currentAuth) return without;
                      return [...without, { apptId: appt.id, toAuthNumber: newAuth, type: 'scheduled' }];
                    });
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Divider */}
        <div className="my-3 border-t border-outline" />

        {/* Notes */}
        <div className="px-4">
          <div className="flex items-center gap-1.5 mb-2">
            <p className="text-sm font-medium text-text-primary">Notes</p>
            {record.notes.length > 0 && (
              <span className="text-xs text-text-secondary">({record.notes.length})</span>
            )}
          </div>

          <div className="flex flex-col gap-2 mb-3">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  const trimmed = newNote.trim();
                  if (trimmed && onAddNote) {
                    onAddNote(record.id, trimmed);
                    setNewNote('');
                  }
                }
              }}
              placeholder="Add a note..."
              rows={2}
              className="w-full px-2.5 py-2 text-xs text-text-primary bg-white border border-outline rounded resize-none focus:outline-none focus:border-primary placeholder:text-text-secondary/60"
            />
            <div className="flex items-center justify-end">
              <button
                onClick={() => {
                  const trimmed = newNote.trim();
                  if (trimmed && onAddNote) {
                    onAddNote(record.id, trimmed);
                    setNewNote('');
                  }
                }}
                disabled={!newNote.trim() || !onAddNote}
                className="px-3 py-1 text-xs font-medium text-white bg-primary rounded-full hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add Note
              </button>
            </div>
          </div>

          {record.notes.length === 0 ? (
            <div className="flex items-center gap-2 text-text-secondary py-2">
              <MessageSquare className="w-3.5 h-3.5 opacity-40" strokeWidth={1.5} />
              <p className="text-xs">No notes yet.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {[...record.notes]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((note) => (
                  <div key={note.id} className="group flex gap-2 py-2 border-b border-outline/60 last:border-b-0">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-primary">
                        {note.author.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-text-primary">{note.author}</span>
                        <span className="text-[10px] text-text-secondary">{formatTimelineDate(note.timestamp)}</span>
                      </div>
                      <p className="text-xs text-text-primary mt-0.5 leading-relaxed whitespace-pre-wrap wrap-break-word">{note.text}</p>
                    </div>
                    {onDeleteNote && (
                      <button
                        onClick={() => onDeleteNote(record.id, note.id)}
                        className="p-1 rounded hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 shrink-0 self-start"
                        title="Delete note"
                      >
                        <Trash2 className="w-3 h-3 text-text-secondary hover:text-status-expired" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-outline" />

        {/* Activity Timeline */}
        <div className="px-4">
          <p className="text-sm font-medium text-text-primary mb-3">Activity Timeline</p>
          {(record.timeline || []).length === 0 ? (
            <p className="text-xs text-text-secondary">No activity recorded yet.</p>
          ) : (
            <div className="relative pl-10">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-outline" />
              {[...(record.timeline || [])].reverse().map((entry) => (
                <TimelineItem key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>

        <div className="h-6" />
      </div>
      )}
    </div>
    </div>

    {/* Side icon strip */}
    <div className={`flex flex-col items-center gap-1 px-2 py-4 ${separated ? 'border border-outline rounded-lg bg-white' : 'border-l border-outline'}`}>
      {([
        { id: 'details', icon: CheckCircle, label: 'Authorization Details' },
        { id: 'assign', icon: User, label: 'Assign' },
        { id: 'attachments', icon: Paperclip, label: 'Attachments' },
        { id: 'appointments', icon: Calendar, label: 'Appointments' },
      ] as const).map(({ id, icon: Icon, label }) => {
        const isActive = id === 'details' ? !activeAction || activeAction === 'details' : activeAction === id;
        return (
          <button
            key={id}
            onClick={() => {
              if (id === 'details') {
                setActiveAction(null);
              } else {
                setActiveAction((prev) => prev === id ? null : id);
              }
            }}
            title={label}
            className={`p-3 rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-surface-variant'}`}
          >
            <Icon className="w-6 h-6" strokeWidth={1.5} />
          </button>
        );
      })}
    </div>
    </div>
  );
}

interface InsuranceFormData {
  insuranceCompany: string;
  policyNumber: string;
  policyHolder: string;
  groupNumber: string;
  planType: string;
  effectiveDate: string;
  expiryDate: string;
  priorAuthRequired: boolean;
}

interface CaseFormData {
  caseName: string;
  primaryInsurance: string;
  secondaryInsurance: string;
  tertiaryInsurance: string;
  referringProvider: string;
  referral: string;
  supervisingProvider: string;
  caseOwningProvider: string;
  providerRequested: boolean;
  caseNotes: string;
}

function PatientDemographicsView({ record }: { record: AuthRecord }) {
  const [insuranceDrawer, setInsuranceDrawer] = useState<{ open: boolean; initial?: InsuranceFormData }>({ open: false });
  const [caseDrawer, setCaseDrawer] = useState<{ open: boolean; initial?: CaseFormData }>({ open: false });
  const patientName = record.patient.name;
  const mrn = record.patient.mrn || '---';
  const dob = record.patient.dob;

  const dobDate = new Date(dob);
  const age = isNaN(dobDate.getTime()) ? '--' : String(Math.floor((Date.now() - dobDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)));

  const demographics = {
    gender: 'Female',
    primaryCareProvider: record.provider || 'Steven Young',
    ssn: '998-49-599',
    referralSource: 'Walk-In',
    phone: '(585) 882 4567',
    email: `${patientName.replace(/\s+/g, '.')}@gmail.com`,
    address: '7 Parnelt Dr Churchville NY, 14425',
  };

  const episodes = [
    { caseId: '2277008-8897', caseName: 'Balance Gait Wol', caseNotes: 'PT eval complete', pocEndDate: '06/15/2026', pendingPocVisits: 8, accidentDate: '--', renderingProvider: 'Steven Young', primaryInsurance: 'BCBS PPO', secondaryInsurance: '--', tertiaryInsurance: '--', linkedAuths: 'AUTH-AET_4001' },
    { caseId: '2277008-8897', caseName: 'Balance Gait Wol', caseNotes: 'Follow-up needed', pocEndDate: '07/20/2026', pendingPocVisits: 12, accidentDate: '01/05/2026', renderingProvider: 'Jon Jones', primaryInsurance: 'Aetna HMO', secondaryInsurance: 'BCBS PPO', tertiaryInsurance: '--', linkedAuths: 'AUTH-AET_6000' },
  ];

  const insuranceProviders = [
    { uid: '1748895456', name: 'Blue Cross Blue Shield', status: 'Active', effectiveDate: '01/01/2026', expiryDate: '12/31/2026', policyNumber: 'POL-889922', groupNumber: 'GRP-445521', planType: 'PPO' },
    { uid: '1564589753', name: 'Aetna', status: 'Active', effectiveDate: '03/01/2026', expiryDate: '02/28/2027', policyNumber: 'POL-334455', groupNumber: 'GRP-112233', planType: 'HMO' },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5">
        <h3 className="text-sm font-medium text-text-primary mb-3">General Information</h3>
        <div className="flex flex-col gap-2">
          <DemoRow label="Patient Name" value={patientName} copyable />
          <DemoRow label="MRN" value={mrn} copyable />
          <DemoRow label="DOB" value={dob} copyable />
          <DemoRow label="Age" value={age} copyable />
          <DemoRow label="Gender" value={demographics.gender} />
          <DemoRow label="Primary Care Provider" value={demographics.primaryCareProvider} />
          <DemoRow label="SSN" value={demographics.ssn} />
          <DemoRow label="Referral Source" value={demographics.referralSource} />
        </div>
      </div>

      <div className="px-6 py-5 border-t border-outline">
        <h3 className="text-sm font-medium text-text-primary mb-3">Contact Information</h3>
        <div className="flex flex-col gap-2">
          <DemoRow label="Phone Number" value={demographics.phone} copyable />
          <DemoRow label="Email" value={demographics.email} copyable />
          <DemoRow label="Home Address" value={demographics.address} copyable />
        </div>
      </div>

      <div className="py-5 border-t border-outline">
        <div className="flex items-center gap-1.5 mb-3 px-6">
          <h3 className="text-sm font-medium text-text-primary">Episodes of Care</h3>
          <ExternalLink className="w-3.5 h-3.5 text-text-secondary" strokeWidth={1.5} />
        </div>
        <div className="overflow-x-auto border border-outline rounded-lg mx-6">
          <table className="text-sm min-w-max w-full">
            <thead className="bg-surface-variant">
              <tr className="text-left text-xs font-medium text-text-secondary">
                <th className="w-[72px] shrink-0 sticky left-0 bg-surface-variant py-2.5 px-3" />
                <th className="py-2.5 px-3 whitespace-nowrap">Case ID</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Case Name</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Case Notes</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Plan of Care End Date</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Pending POC Visits</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Accident Date</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Case Rendering Provider</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Primary Insurance</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Secondary Insurance</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Tertiary Insurance</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Linked Prior Auths</th>
              </tr>
            </thead>
            <tbody>
              {episodes.map((ep, i) => (
                <tr key={i} className="border-t border-outline hover:bg-surface-variant/40">
                  <td className="py-2.5 px-3 sticky left-0 bg-white">
                    <div className="flex items-center gap-2">
                      <Pencil
                        className="w-3.5 h-3.5 text-text-secondary shrink-0 cursor-pointer hover:text-primary"
                        strokeWidth={1.5}
                        onClick={() => setCaseDrawer({
                          open: true,
                          initial: {
                            caseName: ep.caseName,
                            primaryInsurance: ep.primaryInsurance === '--' ? '' : ep.primaryInsurance,
                            secondaryInsurance: ep.secondaryInsurance === '--' ? '' : ep.secondaryInsurance,
                            tertiaryInsurance: ep.tertiaryInsurance === '--' ? '' : ep.tertiaryInsurance,
                            referringProvider: ep.renderingProvider,
                            referral: '',
                            supervisingProvider: '',
                            caseOwningProvider: '',
                            providerRequested: false,
                            caseNotes: ep.caseNotes,
                          }
                        })}
                      />
                      <FileText className="w-3.5 h-3.5 text-text-secondary shrink-0 cursor-pointer hover:text-primary" strokeWidth={1.5} />
                      <svg className="w-3.5 h-3.5 text-text-secondary shrink-0 cursor-pointer hover:text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{ep.caseId}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{ep.caseName}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{ep.caseNotes}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{ep.pocEndDate}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{ep.pendingPocVisits}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{ep.accidentDate}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{ep.renderingProvider}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{ep.primaryInsurance}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{ep.secondaryInsurance}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{ep.tertiaryInsurance}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{ep.linkedAuths}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 mt-3">
          <button
            onClick={() => setCaseDrawer({ open: true })}
            className="p-1 rounded-full border border-outline hover:bg-surface-variant transition-colors"
          >
            <svg className="w-4 h-4 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
        </div>
      </div>

      <div className="py-5 border-t border-outline">
        <div className="flex items-center gap-1.5 mb-3 px-6">
          <h3 className="text-sm font-medium text-text-primary">Insurance Providers</h3>
          <ExternalLink className="w-3.5 h-3.5 text-text-secondary" strokeWidth={1.5} />
        </div>
        <div className="overflow-x-auto border border-outline rounded-lg mx-6">
          <table className="text-sm min-w-max w-full">
            <thead className="bg-surface-variant">
              <tr className="text-left text-xs font-medium text-text-secondary">
                <th className="w-[72px] shrink-0 sticky left-0 bg-surface-variant py-2.5 px-3" />
                <th className="py-2.5 px-3 whitespace-nowrap">UID</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Insurance Provider</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Effective Date</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Expiry Date</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Policy Number</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Group Number</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Plan Type</th>
              </tr>
            </thead>
            <tbody>
              {insuranceProviders.map((ins, i) => (
                <tr key={i} className="border-t border-outline hover:bg-surface-variant/40">
                  <td className="py-2.5 px-3 sticky left-0 bg-white">
                    <div className="flex items-center gap-2">
                      <Pencil
                        className="w-3.5 h-3.5 text-text-secondary shrink-0 cursor-pointer hover:text-primary"
                        strokeWidth={1.5}
                        onClick={() => setInsuranceDrawer({
                          open: true,
                          initial: {
                            insuranceCompany: ins.name,
                            policyNumber: ins.policyNumber,
                            policyHolder: 'SELF',
                            groupNumber: ins.groupNumber,
                            planType: ins.planType,
                            effectiveDate: ins.effectiveDate,
                            expiryDate: ins.expiryDate,
                            priorAuthRequired: false,
                          },
                        })}
                      />
                      <FileText className="w-3.5 h-3.5 text-text-secondary shrink-0 cursor-pointer hover:text-primary" strokeWidth={1.5} />
                      <History className="w-3.5 h-3.5 text-text-secondary shrink-0 cursor-pointer hover:text-primary" strokeWidth={1.5} />
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{ins.uid}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{ins.name}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{ins.status}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{ins.effectiveDate}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{ins.expiryDate}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{ins.policyNumber}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{ins.groupNumber}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{ins.planType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 mt-3">
          <button
            onClick={() => setInsuranceDrawer({ open: true })}
            className="p-1 rounded-full border border-outline hover:bg-surface-variant transition-colors"
          >
            <svg className="w-4 h-4 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
        </div>
      </div>

      {insuranceDrawer.open && (
        <AddInsuranceDrawer
          onClose={() => setInsuranceDrawer({ open: false })}
          initialData={insuranceDrawer.initial}
        />
      )}
      {caseDrawer.open && (
        <NewCaseDrawer
          onClose={() => setCaseDrawer({ open: false })}
          initialData={caseDrawer.initial}
        />
      )}
    </div>
  );
}

interface Attachment {
  id: string;
  type: 'Patient' | 'Provider' | 'Payer' | 'Internal';
  name: string;
  documentDate: string;
  uploadedBy: string;
  tags: string[];
}

const ATTACHMENT_TYPE_STYLES: Record<Attachment['type'], string> = {
  Patient: 'bg-[#e4f1d8] text-[#2f6a1b]',
  Provider: 'bg-[#e0ebff] text-[#1b3f9a]',
  Payer: 'bg-[#fde8c6] text-[#7a4c00]',
  Internal: 'bg-[#e8e2fb] text-[#4b2c94]',
};

const MOCK_ATTACHMENTS: Attachment[] = Array.from({ length: 12 }, (_, i) => ({
  id: `att-${i + 1}`,
  type: 'Patient',
  name: 'File Name.PDF',
  documentDate: '02/02/2026',
  uploadedBy: 'Jane Doe',
  tags: [],
}));

function AttachmentsView({ record: _record }: { record: AuthRecord }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [tagValue, setTagValue] = useState('');

  const attachments = MOCK_ATTACHMENTS;
  const filtered = attachments.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(a => a.id)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5">
        <div className="flex items-center gap-1.5 mb-3">
          <h3 className="text-sm font-medium text-text-primary">Add Attachments</h3>
          <ExternalLink className="w-3.5 h-3.5 text-text-secondary" strokeWidth={1.5} />
        </div>
        <div className="border border-dashed border-outline rounded-lg px-6 py-6 flex items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center">
            <Upload className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
          </div>
          <span className="text-sm text-text-secondary">drop files here or</span>
          <button className="text-sm font-medium text-primary hover:underline">Browse Files</button>
        </div>
      </div>

      <div className="px-6 pb-5">
        <fieldset className="border border-outline rounded px-3 pb-2 pt-1 relative">
          <legend className="text-xs text-text-secondary px-1">Add New Tag</legend>
          <div className="flex items-center">
            <input
              type="text"
              value={tagValue}
              onChange={e => setTagValue(e.target.value)}
              className="flex-1 text-sm text-text-primary outline-none bg-transparent"
            />
            <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />
          </div>
        </fieldset>
      </div>

      <div className="px-6 pb-5">
        <div className="flex items-center gap-1.5 mb-3">
          <h3 className="text-sm font-medium text-text-primary">Attachments</h3>
          <ExternalLink className="w-3.5 h-3.5 text-text-secondary" strokeWidth={1.5} />
        </div>

        <div className="flex items-center justify-between mb-3">
          <button
            className={`p-1.5 rounded hover:bg-surface-variant transition-colors ${selectedIds.size === 0 ? 'opacity-50' : ''}`}
            title="Download selected"
          >
            <Download className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
          </button>
          <div className="relative flex-1 max-w-[240px] ml-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" strokeWidth={1.5} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full pl-8 pr-7 py-1.5 text-sm border border-outline rounded bg-white text-text-primary outline-none focus:border-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto border border-outline rounded-lg">
          <table className="text-sm min-w-max w-full">
            <thead className="bg-surface-variant">
              <tr className="text-left text-xs font-medium text-text-secondary">
                <th className="py-2.5 px-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-outline accent-text-primary"
                  />
                </th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Document Date</th>
                <th className="py-2.5 px-3">Uploaded By</th>
                <th className="py-2.5 px-3">Tags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((att) => (
                <tr key={att.id} className="border-t border-outline hover:bg-surface-variant/40">
                  <td className="py-2.5 px-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(att.id)}
                      onChange={() => toggleOne(att.id)}
                      className="w-4 h-4 rounded border-outline accent-text-primary"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ATTACHMENT_TYPE_STYLES[att.type]}`}>
                      {att.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{att.name}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{att.documentDate}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{att.uploadedBy}</td>
                  <td className="py-2.5 px-3 text-text-secondary whitespace-nowrap">{att.tags.length === 0 ? '--' : att.tags.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface Appointment {
  id: string;
  dateTime: string;
  status: 'Checked In' | 'Scheduled' | 'Completed' | 'Cancelled' | 'No Show';
  case: string;
  caseId: string;
  clinicalNoteType: string;
  appointmentType: string;
  provider: string;
  insurance: string;
  facility: string;
  caseTags: string[];
}

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'appt-1', dateTime: '04/28/2026 09:15 AM', status: 'Scheduled', case: 'Lower Back', caseId: '232314', clinicalNoteType: 'Re-evaluation', appointmentType: 'Therapeutic Exercise', provider: 'Ansh Mehta', insurance: 'BCBS PPO', facility: 'MAIN OFFICE', caseTags: ['WC'] },
  { id: 'appt-2', dateTime: '04/22/2026 02:00 PM', status: 'Checked In', case: 'Lower Back', caseId: '232314', clinicalNoteType: 'Daily Note', appointmentType: 'Manual Therapy', provider: 'Ansh Mehta', insurance: 'BCBS PPO', facility: 'MAIN OFFICE', caseTags: [] },
  { id: 'appt-3', dateTime: '04/15/2026 10:30 AM', status: 'Completed', case: 'Lower Back', caseId: '232314', clinicalNoteType: 'Daily Note', appointmentType: 'Therapeutic Exercise', provider: 'Ansh Mehta', insurance: 'BCBS PPO', facility: 'MAIN OFFICE', caseTags: [] },
  { id: 'appt-4', dateTime: '04/08/2026 04:45 PM', status: 'No Show', case: 'Knee Rehab', caseId: '198432', clinicalNoteType: '-', appointmentType: 'Aqua Therapy', provider: 'Vaidehi Shah', insurance: 'CIGNA PPO', facility: 'WESTSIDE REHAB', caseTags: ['Telehealth'] },
  { id: 'appt-5', dateTime: '03/30/2026 11:00 AM', status: 'Completed', case: 'Lower Back', caseId: '232314', clinicalNoteType: 'Progress Report', appointmentType: 'Manual Therapy', provider: 'Ansh Mehta', insurance: 'BCBS PPO', facility: 'MAIN OFFICE', caseTags: [] },
  { id: 'appt-6', dateTime: '03/24/2026 08:30 AM', status: 'Cancelled', case: 'new case', caseId: '361021', clinicalNoteType: '-', appointmentType: 'Initial Evaluation', provider: 'Vaidehi Shah', insurance: 'CIGNA PPO', facility: 'MAIN OFFICE', caseTags: [] },
  { id: 'appt-7', dateTime: '03/18/2026 01:15 PM', status: 'Completed', case: 'Lower Back', caseId: '232314', clinicalNoteType: 'Daily Note', appointmentType: 'Therapeutic Exercise', provider: 'Ansh Mehta', insurance: 'BCBS PPO', facility: 'MAIN OFFICE', caseTags: [] },
  { id: 'appt-8', dateTime: '03/10/2026 07:00 AM', status: 'Checked In', case: 'Lower Back', caseId: '232314', clinicalNoteType: 'Initial Evaluation', appointmentType: '129 Knee Test', provider: 'Ansh Mehta', insurance: 'SELF-PAY (NO INSURANCE)', facility: 'MAIN OFFICE', caseTags: [] },
  { id: 'appt-9', dateTime: '02/28/2026 03:00 PM', status: 'Completed', case: 'Knee Rehab', caseId: '198432', clinicalNoteType: 'Daily Note', appointmentType: 'Aqua Block', provider: 'Vaidehi Shah', insurance: 'CIGNA PPO', facility: 'WESTSIDE REHAB', caseTags: [] },
  { id: 'appt-10', dateTime: '02/20/2026 03:40 PM', status: 'Scheduled', case: 'new case', caseId: '361021', clinicalNoteType: '-', appointmentType: 'Aqua Block', provider: 'Vaidehi Shah', insurance: 'CIGNA PPO', facility: 'MAIN OFFICE', caseTags: [] },
  { id: 'appt-11', dateTime: '02/12/2026 09:00 AM', status: 'Completed', case: 'Lower Back', caseId: '232314', clinicalNoteType: 'Daily Note', appointmentType: 'Manual Therapy', provider: 'Ansh Mehta', insurance: 'BCBS PPO', facility: 'MAIN OFFICE', caseTags: [] },
  { id: 'appt-12', dateTime: '02/05/2026 10:45 AM', status: 'Completed', case: 'Lower Back', caseId: '232314', clinicalNoteType: 'Initial Evaluation', appointmentType: 'Initial Evaluation', provider: 'Ansh Mehta', insurance: 'BCBS PPO', facility: 'MAIN OFFICE', caseTags: ['WC'] },
];

function AppointmentStatusChip({ status }: { status: Appointment['status'] }) {
  switch (status) {
    case 'Checked In':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#e6f2d9] text-[#4f7326] whitespace-nowrap">
          <Check className="w-3 h-3" strokeWidth={2.5} />
          Checked In
        </span>
      );
    case 'Scheduled':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-outline text-text-primary whitespace-nowrap">
          Scheduled
        </span>
      );
    case 'Completed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#e0ebff] text-[#1b3f9a] whitespace-nowrap">
          <Check className="w-3 h-3" strokeWidth={2.5} />
          Completed
        </span>
      );
    case 'No Show':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#fde8c6] text-[#7a4c00] whitespace-nowrap">
          No Show
        </span>
      );
    case 'Cancelled':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#fde2e1] text-[#a8302d] whitespace-nowrap">
          Cancelled
        </span>
      );
  }
}

function AppointmentsView({ record: _record }: { record: AuthRecord }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = MOCK_APPOINTMENTS.filter((a) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return [a.dateTime, a.status, a.case, a.caseId, a.clinicalNoteType, a.appointmentType, a.provider, a.insurance, a.facility]
      .some((v) => v.toLowerCase().includes(q));
  });

  const sorted = [...filtered].sort((a, b) => {
    const ad = new Date(a.dateTime).getTime();
    const bd = new Date(b.dateTime).getTime();
    return sortDir === 'asc' ? ad - bd : bd - ad;
  });

  const allSelected = sorted.length > 0 && selectedIds.size === sorted.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(sorted.map((a) => a.id)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5">
        <div className="flex items-center gap-1.5 mb-3">
          <h3 className="text-sm font-medium text-text-primary">Appointments</h3>
          <ExternalLink className="w-3.5 h-3.5 text-text-secondary" strokeWidth={1.5} />
        </div>

        <div className="flex items-center justify-between mb-3">
          <button
            className={`p-1.5 rounded hover:bg-surface-variant transition-colors ${selectedIds.size === 0 ? 'opacity-50' : ''}`}
            title="Download selected"
          >
            <Download className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
          </button>
          <div className="relative flex-1 max-w-[240px] ml-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" strokeWidth={1.5} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full pl-8 pr-7 py-1.5 text-sm border border-outline rounded bg-white text-text-primary outline-none focus:border-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto border border-outline rounded-lg">
          <table className="text-sm min-w-max w-full">
            <thead className="bg-surface-variant">
              <tr className="text-left text-xs font-medium text-text-secondary">
                <th className="py-2.5 px-3 w-10 sticky left-0 bg-surface-variant z-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-outline accent-text-primary"
                  />
                </th>
                <th className="py-2.5 px-3 sticky left-10 bg-surface-variant whitespace-nowrap w-[120px] z-10" />
                <th className="py-2.5 px-3 whitespace-nowrap">
                  <button
                    onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                    className="inline-flex items-center gap-1 hover:text-text-primary transition-colors"
                  >
                    Date/Time
                    {sortDir === 'asc' ? (
                      <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.5} />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} />
                    )}
                  </button>
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Case</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Case ID</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Clinical Note Type</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Appointment Type</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Provider</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Insurance</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Facility</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Case Tags</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((appt) => (
                <tr key={appt.id} className="border-t border-outline hover:bg-surface-variant/40">
                  <td className="py-2.5 px-3 w-10 sticky left-0 bg-white z-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(appt.id)}
                      onChange={() => toggleOne(appt.id)}
                      className="w-4 h-4 rounded border-outline accent-text-primary"
                    />
                  </td>
                  <td className="py-2.5 px-3 sticky left-10 bg-white w-[120px] z-10">
                    <div className="flex items-center gap-2">
                      <button title="Edit" className="text-text-secondary hover:text-primary transition-colors">
                        <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                      <button title="View" className="text-text-secondary hover:text-primary transition-colors">
                        <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                      <button title="History" className="text-text-secondary hover:text-primary transition-colors">
                        <History className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                      <button title="Add" className="text-text-secondary hover:text-primary transition-colors">
                        <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{appt.dateTime}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <AppointmentStatusChip status={appt.status} />
                      <button title="Calendar" className="text-text-secondary hover:text-primary transition-colors">
                        <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                      {appt.status === 'Checked In' ? (
                        <button title="Open" className="text-text-secondary hover:text-primary transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      ) : (
                        <button title="Confirm" className="text-text-secondary hover:text-primary transition-colors">
                          <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{appt.case}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{appt.caseId}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{appt.clinicalNoteType}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{appt.appointmentType}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{appt.provider}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{appt.insurance}</td>
                  <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">{appt.facility}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {appt.caseTags.length === 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-outline/40 text-text-secondary">No tags</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-outline text-text-primary">{appt.caseTags.join(', ')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const INSURANCE_COMPANIES = ['Aetna', 'Blue Cross Blue Shield', 'Cigna', 'Humana', 'Kaiser Permanente', 'Medicare', 'Medicaid', 'UnitedHealthcare', 'Self-pay'];
const POLICY_HOLDERS = ['SELF', 'SPOUSE', 'CHILD', 'OTHER'];
const PLAN_TYPES = ['SELF PAY', 'PPO', 'HMO', 'EPO', 'POS', 'HDHP', 'Medicare', 'Medicaid'];

function AddInsuranceDrawer({ onClose, initialData }: { onClose: () => void; initialData?: InsuranceFormData }) {
  const isEdit = !!initialData;
  const [form, setForm] = useState<InsuranceFormData>({
    insuranceCompany: initialData?.insuranceCompany ?? '',
    policyNumber: initialData?.policyNumber ?? '',
    policyHolder: initialData?.policyHolder ?? 'SELF',
    groupNumber: initialData?.groupNumber ?? '',
    planType: initialData?.planType ?? 'SELF PAY',
    effectiveDate: initialData?.effectiveDate ?? '',
    expiryDate: initialData?.expiryDate ?? '',
    priorAuthRequired: initialData?.priorAuthRequired ?? false,
  });

  const update = (field: string, value: string | boolean) => setForm((prev) => ({ ...prev, [field]: value }));

  return createPortal(
    <div className="fixed inset-0 z-9999 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[520px] h-full bg-white shadow-[-4px_0_20px_rgba(0,0,0,0.1)] flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline shrink-0">
          <h2 className="text-xl font-medium text-text-primary">{isEdit ? 'Edit Insurance' : 'Add Insurance'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant transition-colors">
            <X className="w-6 h-6 text-text-secondary" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="border border-outline rounded-lg p-6 flex flex-col gap-5">
            <div>
              <label className="text-xs text-text-secondary">Insurance company</label>
              <div className="relative mt-1">
                <select
                  value={form.insuranceCompany}
                  onChange={(e) => update('insuranceCompany', e.target.value)}
                  className="w-full h-12 px-3 border border-outline rounded-lg text-sm text-text-primary appearance-none bg-white focus:outline-none focus:border-primary"
                >
                  <option value=""></option>
                  {INSURANCE_COMPANIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
              </div>
              <p className="text-xs text-text-secondary mt-1">If no insurance, select &quot;Self-pay&quot;</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-secondary">Policy number</label>
                <input
                  type="text"
                  value={form.policyNumber}
                  onChange={(e) => update('policyNumber', e.target.value)}
                  className="w-full h-12 px-3 mt-1 border border-outline rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary">Policy holder</label>
                <div className="relative mt-1">
                  <select
                    value={form.policyHolder}
                    onChange={(e) => update('policyHolder', e.target.value)}
                    className="w-full h-12 px-3 border border-outline rounded-lg text-sm text-text-primary appearance-none bg-white focus:outline-none focus:border-primary"
                  >
                    {POLICY_HOLDERS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-secondary">Group number</label>
                <input
                  type="text"
                  value={form.groupNumber}
                  onChange={(e) => update('groupNumber', e.target.value)}
                  className="w-full h-12 px-3 mt-1 border border-outline rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary">Plan type</label>
                <div className="relative mt-1">
                  <select
                    value={form.planType}
                    onChange={(e) => update('planType', e.target.value)}
                    className="w-full h-12 px-3 border border-outline rounded-lg text-sm text-text-primary appearance-none bg-white focus:outline-none focus:border-primary"
                  >
                    {PLAN_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-secondary">Effective date</label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" strokeWidth={1.5} />
                  <input
                    type="text"
                    placeholder="MM/DD/YYYY"
                    value={form.effectiveDate}
                    onChange={(e) => update('effectiveDate', e.target.value)}
                    className="w-full h-12 pl-9 pr-3 border border-outline rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-text-secondary">Expiry date</label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" strokeWidth={1.5} />
                  <input
                    type="text"
                    placeholder="MM/DD/YYYY"
                    value={form.expiryDate}
                    onChange={(e) => update('expiryDate', e.target.value)}
                    className="w-full h-12 pl-9 pr-3 border border-outline rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => update('priorAuthRequired', !form.priorAuthRequired)}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.priorAuthRequired ? 'bg-primary' : 'bg-outline'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.priorAuthRequired ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm text-text-primary">Prior Auth Required on Submission</span>
            </div>

            <div className="border-2 border-dashed border-outline rounded-lg p-6 flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-primary" strokeWidth={1.5} />
                <span className="text-sm font-medium text-text-primary">Drop Files Here</span>
                <span className="text-sm text-text-secondary">Or</span>
                <button className="px-4 py-1.5 border border-outline rounded-full text-sm font-medium text-text-primary hover:bg-surface-variant transition-colors">
                  Browse Files
                </button>
              </div>
              <p className="text-xs text-text-secondary">Upload Insurance Card (PDF, PNG, or JPG) (max. 4.2MB)</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 shrink-0">
          <button
            onClick={onClose}
            className="w-full h-12 bg-primary rounded-lg text-base font-medium text-white hover:bg-primary-hover transition-colors"
          >
            Submit
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const REFERRING_PROVIDERS = ['Dr. Sarah Johnson', 'Dr. Michael Chen', 'Dr. Emily Davis', 'Dr. Robert Wilson'];
const SUPERVISING_PROVIDERS = ['Dr. Alan Brooks', 'Dr. Lisa Park', 'Dr. James Miller', 'Dr. Karen Lee'];
const CASE_OWNING_PROVIDERS = ['Dr. Sarah Johnson', 'Dr. Michael Chen', 'Dr. Emily Davis', 'Dr. Robert Wilson'];
const REFERRAL_OPTIONS = ['No referrals available'];

function NewCaseDrawer({ onClose, initialData }: { onClose: () => void; initialData?: CaseFormData }) {
  const isEdit = !!initialData;
  const [caseName, setCaseName] = useState(initialData?.caseName ?? '');
  const [primaryInsurance, setPrimaryInsurance] = useState(initialData?.primaryInsurance ?? '');
  const [secondaryInsurance, setSecondaryInsurance] = useState(initialData?.secondaryInsurance ?? '');
  const [tertiaryInsurance, setTertiaryInsurance] = useState(initialData?.tertiaryInsurance ?? '');
  const [referringProvider, setReferringProvider] = useState(initialData?.referringProvider ?? '');
  const [referral, setReferral] = useState(initialData?.referral ?? '');
  const [supervisingProvider, setSupervisingProvider] = useState(initialData?.supervisingProvider ?? '');
  const [caseOwningProvider, setCaseOwningProvider] = useState(initialData?.caseOwningProvider ?? '');
  const [providerRequested, setProviderRequested] = useState(initialData?.providerRequested ?? false);
  const [caseNotes, setCaseNotes] = useState(initialData?.caseNotes ?? '');

  return createPortal(
    <div className="fixed inset-0 z-9999 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[480px] h-full bg-white shadow-xl animate-slide-in flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline">
          <h2 className="text-lg font-semibold text-text-primary">{isEdit ? 'Edit Case' : 'New Case'}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-variant transition-colors">
            <svg className="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <fieldset className="border border-outline rounded px-3 pb-3 pt-1">
            <legend className="text-xs text-text-secondary px-1">Case Name</legend>
            <input
              type="text"
              value={caseName}
              onChange={e => setCaseName(e.target.value)}
              className="w-full text-sm text-text-primary outline-none bg-transparent"
            />
          </fieldset>

          <div>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-base font-semibold text-text-primary">Insurance</h3>
              <button className="text-sm text-text-secondary opacity-50">+ Add Insurance</button>
            </div>
            <div className="space-y-4">
              <fieldset className="border border-outline rounded px-3 pb-3 pt-1">
                <legend className="text-xs text-text-secondary px-1">Primary Insurance</legend>
                <div className="flex items-center">
                  <select
                    value={primaryInsurance}
                    onChange={e => setPrimaryInsurance(e.target.value)}
                    className="w-full text-sm text-text-primary outline-none bg-transparent appearance-none"
                  >
                    <option value="">Select primary insurance</option>
                    {INSURANCE_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />
                </div>
              </fieldset>

              <fieldset className="border border-dashed border-outline rounded px-3 pb-3 pt-1">
                <legend className="text-xs text-text-secondary px-1">Secondary Insurance</legend>
                <div className="flex items-center">
                  <select
                    value={secondaryInsurance}
                    onChange={e => setSecondaryInsurance(e.target.value)}
                    className="w-full text-sm text-text-secondary outline-none bg-transparent appearance-none"
                  >
                    <option value="">Select secondary insurance</option>
                    {INSURANCE_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />
                </div>
              </fieldset>

              <fieldset className="border border-dashed border-outline rounded px-3 pb-3 pt-1">
                <legend className="text-xs text-text-secondary px-1">Tertiary Insurance</legend>
                <div className="flex items-center">
                  <select
                    value={tertiaryInsurance}
                    onChange={e => setTertiaryInsurance(e.target.value)}
                    className="w-full text-sm text-text-secondary outline-none bg-transparent appearance-none"
                  >
                    <option value="">Select tertiary insurance</option>
                    {INSURANCE_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />
                </div>
              </fieldset>

              <div className="flex items-center gap-2">
                <fieldset className="border border-outline rounded px-3 pb-3 pt-1 flex-1">
                  <legend className="text-xs text-text-secondary px-1">Select a referring provider</legend>
                  <div className="flex items-center">
                    <select
                      value={referringProvider}
                      onChange={e => setReferringProvider(e.target.value)}
                      className="w-full text-sm text-text-primary outline-none bg-transparent appearance-none"
                    >
                      <option value="">Select a referring provider</option>
                      {REFERRING_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />
                  </div>
                </fieldset>
                <button className="p-2 border border-outline rounded hover:bg-surface-variant transition-colors shrink-0">
                  <IdCard className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              <fieldset className="border border-outline rounded px-3 pb-3 pt-1">
                <legend className="text-xs text-text-secondary px-1">Referral</legend>
                <div className="flex items-center">
                  <select
                    value={referral}
                    onChange={e => setReferral(e.target.value)}
                    className="w-full text-sm text-text-secondary outline-none bg-transparent appearance-none"
                  >
                    <option value="">No referrals available</option>
                    {REFERRAL_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />
                </div>
              </fieldset>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-text-primary mb-3">Supervising Provider</h3>
            <fieldset className="border border-outline rounded px-3 pb-3 pt-1">
              <legend className="text-xs text-text-secondary px-1 sr-only">Supervising provider</legend>
              <div className="flex items-center">
                <select
                  value={supervisingProvider}
                  onChange={e => setSupervisingProvider(e.target.value)}
                  className="w-full text-sm text-text-primary outline-none bg-transparent appearance-none"
                >
                  <option value="">Select supervising provider</option>
                  {SUPERVISING_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />
              </div>
            </fieldset>
          </div>

          <div>
            <h3 className="text-base font-semibold text-text-primary mb-3">Case Owning Provider</h3>
            <fieldset className="border border-outline rounded px-3 pb-3 pt-1">
              <legend className="text-xs text-text-secondary px-1 sr-only">Case owning provider</legend>
              <div className="flex items-center">
                <select
                  value={caseOwningProvider}
                  onChange={e => setCaseOwningProvider(e.target.value)}
                  className="w-full text-sm text-text-primary outline-none bg-transparent appearance-none"
                >
                  <option value="">Select case owning provider</option>
                  {CASE_OWNING_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />
              </div>
            </fieldset>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={providerRequested}
              onChange={e => setProviderRequested(e.target.checked)}
              className="w-4 h-4 rounded border-outline text-primary accent-text-primary"
            />
            <span className="text-sm text-text-primary">Was a provider specifically requested?</span>
          </label>

          <div>
            <h3 className="text-base font-semibold text-text-primary mb-3">Notes</h3>
            <fieldset className="border border-outline rounded px-3 pb-3 pt-1">
              <legend className="text-xs text-text-secondary px-1">Case notes</legend>
              <textarea
                value={caseNotes}
                onChange={e => setCaseNotes(e.target.value)}
                rows={3}
                className="w-full text-sm text-text-primary outline-none bg-transparent resize-y"
              />
            </fieldset>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-4 border-t border-outline">
          <button
            className="px-5 py-2 text-sm font-medium rounded bg-surface-variant text-text-secondary opacity-60"
          >
            {isEdit ? 'Save' : 'Create'}
          </button>
          <button
            onClick={onClose}
            className="text-sm font-medium text-primary hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function DemoRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="w-[150px] shrink-0 text-xs text-text-secondary">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs font-medium text-text-primary truncate">{value}</span>
        {copyable && <CopyButton text={value} />}
      </div>
    </div>
  );
}

function DetailRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="w-[150px] shrink-0 text-xs text-text-secondary">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs font-medium text-text-primary truncate">{value}</span>
        {copyable && <CopyButton text={value} />}
      </div>
    </div>
  );
}

function AppointmentRow({ dateTime, authNumber, dateOptions, authOptions, onAuthChange }: {
  dateTime: string;
  authNumber: string;
  dateOptions: string[];
  authOptions: string[];
  onAuthChange: (newAuth: string) => void;
}) {
  const [selectedDate, setSelectedDate] = useState(dateTime);
  const [selectedAuth, setSelectedAuth] = useState(authNumber);
  const [openDrop, setOpenDrop] = useState<'date' | 'auth' | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) setOpenDrop(null);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div className="flex items-center gap-2 py-1" ref={rowRef}>
      {/* Date dropdown */}
      <div className="flex-1 relative">
        <button
          onClick={() => setOpenDrop((p) => p === 'date' ? null : 'date')}
          className="w-full flex items-center h-9 pl-3 pr-2 border border-outline rounded-md bg-white hover:border-primary/40 transition-colors"
        >
          <span className="flex-1 text-sm text-text-primary text-left truncate">{selectedDate}</span>
          <ChevronDown className={`w-5 h-5 text-text-secondary transition-transform ${openDrop === 'date' ? 'rotate-180' : ''}`} strokeWidth={1.5} />
        </button>
        {openDrop === 'date' && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-outline rounded-md shadow-lg max-h-[200px] overflow-y-auto z-30">
            {dateOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => { setSelectedDate(opt); setOpenDrop(null); }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${opt === selectedDate ? 'bg-primary/5 text-primary font-medium' : 'text-text-primary hover:bg-surface-variant'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      <ArrowRight className="w-5 h-5 text-text-secondary shrink-0" strokeWidth={1.5} />

      {/* Auth dropdown */}
      <div className="flex-1 relative">
        <button
          onClick={() => setOpenDrop((p) => p === 'auth' ? null : 'auth')}
          className="w-full flex items-center h-9 pl-3 pr-2 border border-outline rounded-md bg-white hover:border-primary/40 transition-colors"
        >
          <span className="flex-1 text-sm text-text-primary text-left truncate">{selectedAuth}</span>
          <ChevronDown className={`w-5 h-5 text-text-secondary transition-transform ${openDrop === 'auth' ? 'rotate-180' : ''}`} strokeWidth={1.5} />
        </button>
        {openDrop === 'auth' && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-outline rounded-md shadow-lg max-h-[200px] overflow-y-auto z-30">
            {authOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  if (opt !== selectedAuth) {
                    setSelectedAuth(opt);
                    onAuthChange(opt);
                  }
                  setOpenDrop(null);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${opt === selectedAuth ? 'bg-primary/5 text-primary font-medium' : 'text-text-primary hover:bg-surface-variant'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EditableDetailRow({ editing, label, value, editValue, onChange, copyable, options }: {
  editing: boolean;
  label: string;
  value: string;
  editValue?: string;
  onChange: (v: string) => void;
  copyable?: boolean;
  options?: string[];
}) {
  if (editing) {
    return (
      <div className="flex items-center gap-2 py-0.5">
        <span className="w-[150px] shrink-0 text-xs text-text-secondary">{label}</span>
        {options ? (
          <EditableSelect value={editValue ?? value} onChange={onChange} options={options} />
        ) : (
          <input
            type="text"
            value={editValue ?? value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 min-w-0 text-xs font-medium text-text-primary border border-outline rounded px-2 py-1 focus:outline-none focus:border-primary"
          />
        )}
      </div>
    );
  }
  return <DetailRow label={label} value={value} copyable={copyable} />;
}

function EditableSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-1 text-xs font-medium text-text-primary border rounded px-2 py-1 bg-white transition-colors ${open ? 'border-primary' : 'border-outline hover:border-primary/40'}`}
      >
        <span className={`flex-1 truncate text-left ${value ? '' : 'text-text-secondary'}`}>
          {value || 'Select...'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-secondary shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={1.5} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-outline rounded shadow-lg overflow-hidden z-30">
          <div className="flex items-center gap-1.5 border-b border-outline px-2 py-1.5">
            <Search className="w-3 h-3 text-text-secondary shrink-0" strokeWidth={1.5} />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 min-w-0 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none bg-transparent"
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-text-secondary">No matches</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false); setSearch(''); }}
                  className={`w-full text-left px-2 py-1.5 text-xs transition-colors ${opt === value ? 'bg-primary/5 text-primary font-medium' : 'text-text-primary hover:bg-surface-variant'}`}
                >
                  {opt}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimelineDate(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  const min = m.toString().padStart(2, '0');
  return `${month}/${day} ${hour}:${min} ${ampm}`;
}

function TimelineItem({ entry }: { entry: TimelineEntry }) {
  const { action } = entry;

  let icon: React.ReactNode;
  let description: React.ReactNode;

  switch (action.kind) {
    case 'appointment_moved':
      icon = <ArrowRightLeft className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />;
      description = (
        <span>
          Moved {action.apptType} appt <span className="font-medium">{action.apptDateTime}</span> from{' '}
          <span className="font-medium">{action.fromAuth}</span> to{' '}
          <span className="font-medium">{action.toAuth}</span>
        </span>
      );
      break;
    case 'detail_changed':
      icon = <Edit3 className="w-3.5 h-3.5 text-status-expiring" strokeWidth={1.5} />;
      description = (
        <span>
          Changed <span className="font-medium">{action.field}</span> from{' '}
          <span className="line-through text-text-secondary">{action.from || '--'}</span> to{' '}
          <span className="font-medium">{action.to || '--'}</span>
        </span>
      );
      break;
    case 'note_added':
      icon = <FileText className="w-3.5 h-3.5 text-status-active" strokeWidth={1.5} />;
      description = (
        <span>
          Added note: <span className="italic">&ldquo;{action.text.length > 60 ? action.text.slice(0, 60) + '...' : action.text}&rdquo;</span>
        </span>
      );
      break;
  }

  return (
    <div className="relative pb-5 last:pb-0">
      <div className="absolute left-[-40px] top-0.5 w-[22px] h-[22px] rounded-full bg-white border-2 border-outline flex items-center justify-center">
        {icon}
      </div>
      <p className="text-xs text-text-primary leading-relaxed">{description}</p>
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-[10px] text-text-secondary">{entry.author}</span>
        <span className="text-[10px] text-text-secondary">&middot;</span>
        <span className="text-[10px] text-text-secondary">{formatTimelineDate(entry.timestamp)}</span>
      </div>
    </div>
  );
}
