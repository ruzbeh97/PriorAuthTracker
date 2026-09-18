import { useState, useRef, useEffect, useMemo, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { X, Pencil, CheckCircle, ArrowRight, ExternalLink, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, FileText, ArrowRightLeft, Edit3, User, Globe, History, Paperclip, Calendar, Upload, IdCard, PanelLeftOpen, PanelRightClose, Download, Search, Eye, Plus, Check, Trash2, MessageSquare, NotebookPen } from 'lucide-react';
import type { AuthRecord, TimelineEntry } from '../types';
import { useStateOptionsForAssignee } from '../authStates';
import UtilizationBar from './UtilizationBar';
import CopyButton from './CopyButton';
import { formatAuthDate, formatAuthDateFromDate, parseAuthDate } from '../utils';
import { ASSIGNEE_INDIVIDUALS, useAssigneeGroups } from '../assignees';
import { AssigneePickerPopover } from './AssigneePicker';

const VisitNoteReadOnlyPanel = lazy(async () => {
  const { VisitNoteReadOnlyPanel: Panel } = await import('@visit-note/patient-chart');
  return { default: Panel };
});

interface AuthDetailPanelProps {
  record: AuthRecord;
  allRecords: AuthRecord[];
  onClose?: () => void;
  onReassignVisit: (fromRecordId: string, toAuthNumber: string, type: 'completed' | 'scheduled', apptDateTime?: string) => void;
  /** Pass `silent` to apply a value without writing it to the activity timeline. */
  onDetailChange: (recordId: string, field: string, from: string, to: string, options?: { silent?: boolean }) => void;
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

const PAYER_OPTIONS = [
  'Priority Health',
  'California Blue Shield',
  'Self-pay',
  'Aetna',
  'UHC',
  'UnitedHealthcare',
  'Cigna',
  'BCBS',
  'Medicare',
  'Humana',
];

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

export default function AuthDetailPanel({ record, allRecords, onClose, onReassignVisit, onDetailChange, onAddNote, onDeleteNote, tableCollapsed, onExpandTable, separated = false }: AuthDetailPanelProps) {
  const visitsRemaining = record.visitsAuthorized - record.visitsCompleted;
  const unscheduled = Math.max(0, visitsRemaining - record.visitsScheduled);

  const [completedAppts, setCompletedAppts] = useState<ExceededAppt[]>([]);
  const [scheduledAppts, setScheduledAppts] = useState<ExceededAppt[]>([]);
  const [pendingReassignments, setPendingReassignments] = useState<PendingReassignment[]>([]);
  const [newNote, setNewNote] = useState('');
  const [trackingType, setTrackingType] = useState<'Visits' | 'CPTs'>('Visits');
  const [cptEntries, setCptEntries] = useState<CptEntry[]>([emptyCptEntry()]);
  const orderCptOptions = useMemo<CptSelectOption[]>(() => {
    const fromOrders = (record.orderCpts ?? [])
      .filter((entry) => entry.code && !CPT_CODES.some((option) => option.value === entry.code))
      .map((entry) => ({
        value: entry.code,
        description: entry.orderTitle.replace(/ \([^)]+ Order\)$/, ''),
      }));
    return [...fromOrders, ...CPT_CODES];
  }, [record.orderCpts]);
  const [portalCurrentUrl, setPortalCurrentUrl] = useState('');
  const [portalAddressValue, setPortalAddressValue] = useState('');
  const initializedForRef = useRef<string | null>(null);

  // Re-sync when the note's codes or units change, not just when a different row is picked.
  const initKey = [
    record.id,
    ...(record.orderCpts ?? []).map(
      (entry) => `${entry.orderId}:${entry.code}:${entry.units}:${JSON.stringify(entry.details ?? [])}`,
    ),
  ].join('|');

  if (initializedForRef.current !== initKey) {
    initializedForRef.current = initKey;
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
    setTrackingType(record.orderBased ? 'CPTs' : 'Visits');
    setCptEntries(
      record.orderBased && record.orderCpts?.length
        ? record.orderCpts.map((entry) => ({
            id: `cpt-${entry.orderId}`,
            code: entry.code,
            unitTrackingType: entry.trackingType,
            units: entry.units,
            details: entry.details,
          }))
        : [emptyCptEntry()],
    );
  }

  const pastDateOptions = generateExceededAppointments(8, 3, 20);
  const patientAuths = allRecords
    .filter((r) => r.patient.name === record.patient.name && r.patient.dob === record.patient.dob)
    .map((r) => r.authNumber || '--');
  const authOptions = [...new Set(patientAuths)];

  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [portalOpen, setPortalOpen] = useState(false);

  // Edits apply to the record right away so the table stays in step, but they are held here
  // until Save writes them to the activity timeline, which is also what Revert undoes.
  const [pendingEdits, setPendingEdits] = useState<Array<{ field: string; from: string; to: string }>>([]);

  useEffect(() => {
    setPendingEdits([]);
  }, [record.id]);

  const hasPendingChanges = pendingReassignments.length > 0 || pendingEdits.length > 0;

  function commitDetail(field: string, oldVal: string, newVal: string) {
    if (newVal === oldVal) return;
    onDetailChange(record.id, field, oldVal, newVal, { silent: true });
    setPendingEdits((prev) => {
      const existing = prev.find((edit) => edit.field === field);
      const from = existing ? existing.from : oldVal;
      const rest = prev.filter((edit) => edit.field !== field);
      // Editing a field back to its original value leaves nothing to save.
      return newVal === from ? rest : [...rest, { field, from, to: newVal }];
    });
  }

  function revertChanges() {
    [...pendingEdits]
      .reverse()
      .forEach((edit) => onDetailChange(record.id, edit.field, edit.to, edit.from, { silent: true }));
    setPendingEdits([]);
    setPendingReassignments([]);
  }

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

  const groupOptions = useAssigneeGroups();
  // States are configured per user group, so the list follows whoever owns this row.
  const stateOptions = useStateOptionsForAssignee(record.assignedTo, record.state);

  const assigneeOptions = useMemo(() => {
    const fromRecords = allRecords.flatMap((r) => (r.assignedTo ? r.assignedTo.split(', ').filter(Boolean) : []));
    const current = record.assignedTo ? record.assignedTo.split(', ').filter(Boolean) : [];
    return [...new Set([
      ...ASSIGNEE_INDIVIDUALS,
      ...fromRecords.filter((name) => !groupOptions.includes(name)),
      ...current.filter((name) => !groupOptions.includes(name)),
    ])].sort();
  }, [allRecords, record.assignedTo, groupOptions]);

  const payerOptions = useMemo(() => {
    const fromRecords = allRecords.map((r) => r.payer.name).filter(Boolean);
    return [...new Set([...PAYER_OPTIONS, ...fromRecords, record.payer.name].filter(Boolean))].sort();
  }, [allRecords, record.payer.name]);

  useEffect(() => {
    if (portalOpen) {
      setPortalCurrentUrl(portalUrl);
      setPortalAddressValue(portalUrl);
    }
  }, [portalUrl, portalOpen]);

  return (
    <div className={`flex h-full ${separated ? 'gap-3' : 'bg-white border border-outline rounded-r-lg overflow-hidden'} ${tableCollapsed ? 'flex-1 min-w-0' : 'shrink-0'}`}>

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
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-surface-variant transition-colors"
              title="Close panel"
            >
              <PanelRightClose className="w-4 h-4 text-text-secondary" />
            </button>
          )}
          {tableCollapsed && (
            <button
              onClick={onExpandTable}
              className="p-1 rounded hover:bg-surface-variant transition-colors"
              title="Expand table"
            >
              <PanelLeftOpen className="w-4 h-4 text-text-secondary" />
            </button>
          )}
          <h2 className="text-xl font-medium text-text-primary">
            {activeAction === 'assign'
              ? 'Patient Demographics'
              : activeAction === 'attachments'
              ? 'Attachments'
              : activeAction === 'appointments'
              ? 'Appointments'
              : activeAction === 'visit-note'
              ? 'Visit Note'
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
          <span className="w-px h-7 bg-outline" />
          <button
            disabled={!hasPendingChanges}
            onClick={() => {
              if (!hasPendingChanges) return;
              const allAppts = [...completedAppts, ...scheduledAppts];
              pendingReassignments.forEach((p) => {
                const appt = allAppts.find((a) => a.id === p.apptId);
                onReassignVisit(record.id, p.toAuthNumber, p.type, appt?.dateTime);
              });
              const reassignedIds = new Set(pendingReassignments.map((p) => p.apptId));
              setCompletedAppts((prev) => prev.filter((a) => !reassignedIds.has(a.id)));
              setScheduledAppts((prev) => prev.filter((a) => !reassignedIds.has(a.id)));
              setPendingReassignments([]);
              pendingEdits.forEach((edit) => onDetailChange(record.id, edit.field, edit.from, edit.to));
              setPendingEdits([]);
            }}
            className={`h-8 px-4 rounded-full text-sm font-medium transition-colors ${
              hasPendingChanges
                ? 'bg-primary border border-primary text-white hover:bg-primary-hover'
                : 'border border-outline text-text-disabled cursor-not-allowed'
            }`}
          >
            Save
          </button>
          {hasPendingChanges && (
            <button
              onClick={revertChanges}
              className="h-8 px-4 rounded-full border border-outline text-sm font-medium text-text-secondary transition-colors hover:bg-surface-variant"
            >
              Revert
            </button>
          )}
        </div>
      </div>

      {activeAction === 'assign' ? (
        <PatientDemographicsView record={record} />
      ) : activeAction === 'attachments' ? (
        <AttachmentsView record={record} />
      ) : activeAction === 'appointments' ? (
        <AppointmentsView record={record} />
      ) : activeAction === 'visit-note' ? (
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center">
              <p className="text-[13px] text-text-secondary">Loading visit note…</p>
            </div>
          }
        >
          <VisitNoteReadOnlyPanel />
        </Suspense>
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
            <span className="text-sm font-medium text-text-primary">Authorization Information</span>
          </div>

          <div className="flex flex-col gap-1">
            <EditableDetailRow
              label="Authorization Number"
              value={record.authNumber}
              placeholder="--"
              onChange={(v) => commitDetail('Authorization Number', record.authNumber, v)}
              copyable={!!record.authNumber}
            />
            <EditableDetailRow
              label="Payer"
              value={record.payer.name}
              onChange={(v) => commitDetail('Payer', record.payer.name, v)}
              options={payerOptions}
            />
            <DetailRow label="Payer ID" value={`${record.payer.name}IL: ${record.payer.planId}`} copyable />
            <EditableDetailRow
              label="Start Date"
              value={formatAuthDate(record.startDate, '--')}
              onChange={(v) => commitDetail('Start Date', formatAuthDate(record.startDate, '--'), v)}
              kind="date"
            />
            <EditableDetailRow
              label="End Date"
              value={formatAuthDate(record.endDate, '--')}
              onChange={(v) => commitDetail('End Date', formatAuthDate(record.endDate, '--'), v)}
              kind="date"
            />
            {!record.orderBased && (
              <div className="flex items-center gap-2 py-0.5">
                <span className="w-[150px] shrink-0 text-sm leading-[22px] text-accent-700">Tracking Type</span>
                <div className="flex items-center gap-2">
                  {(['Visits', 'CPTs'] as const).map((t) => {
                    const selected = trackingType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTrackingType(t)}
                        className={`inline-flex items-center rounded-md px-3 py-1 text-sm transition-colors ${
                          selected
                            ? t === 'Visits'
                              ? 'bg-[#e6e9fb] text-accent-700'
                              : 'bg-[#f3e6d4] text-text-primary'
                            : 'bg-[#ececec] text-text-primary'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {record.orderBased || trackingType === 'CPTs' ? (
              <>
                {cptEntries.map((entry) => (
                  <CptTrackingBlock
                    key={entry.id}
                    entry={entry}
                    codeOptions={orderCptOptions}
                    showOrderDetails={record.orderSource === 'visit-note'}
                    onChange={(next) =>
                      setCptEntries((prev) => prev.map((e) => (e.id === entry.id ? next : e)))
                    }
                    onDelete={() =>
                      setCptEntries((prev) => {
                        const remaining = prev.filter((e) => e.id !== entry.id);
                        return remaining.length > 0 ? remaining : [emptyCptEntry()];
                      })
                    }
                  />
                ))}
                {!record.orderBased && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setCptEntries((prev) => [...prev, emptyCptEntry()])}
                      className="p-0 text-primary hover:text-primary-hover transition-colors"
                      title="Add CPT"
                    >
                      <Plus className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <EditableDetailRow
                  label="Visits Authorized"
                  value={String(record.visitsAuthorized)}
                  onChange={(v) => commitDetail('Visits Authorized', String(record.visitsAuthorized), v)}
                />
                <DetailRow label="Visits Completed" value={String(record.visitsCompleted)} />
                <DetailRow label="Scheduled Visits" value={String(record.visitsScheduled)} />
                <DetailRow label="Remaining Visits" value={visitsRemaining > 0 ? `${visitsRemaining} (${unscheduled} unscheduled)` : '0'} />
                {record.confidence && (
                  <div className="flex items-center gap-2 py-0.5">
                    <span className="w-[150px] shrink-0 text-sm leading-[22px] text-accent-700">Confidence</span>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-5 h-5 text-status-active" strokeWidth={1.5} />
                      <span className="text-sm leading-[22px] text-text-disabled">{record.confidence}</span>
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="flex items-start gap-2 py-0.5">
              <span className="w-[150px] shrink-0 pt-1.5 text-sm leading-[22px] text-accent-700">Auth Notes</span>
              <AuthNotesField
                value={record.authNotes ?? ''}
                onChange={(value) => commitDetail('Auth Notes', record.authNotes ?? '', value)}
              />
            </div>
            <div className="flex items-start gap-2 py-1">
              <span className="w-[150px] shrink-0 text-sm leading-[22px] text-accent-700">State</span>
              <EditableSelect
                value={record.state}
                onChange={(value) => commitDetail('State', record.state, value)}
                options={stateOptions}
              />
            </div>
            <EditableDetailRow
              label="Assigned To"
              value={record.assignedTo}
              onChange={(v) => commitDetail('Assigned To', record.assignedTo, v)}
              options={assigneeOptions}
              groupOptions={groupOptions}
            />
            <EditableDetailRow
              label="Provider"
              value={record.provider}
              onChange={(v) => commitDetail('Provider', record.provider, v)}
              options={providerOptions}
            />
            <EditableDetailRow
              label="Facility"
              value={record.facility}
              onChange={(v) => commitDetail('Facility', record.facility, v)}
              options={facilityOptions}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-outline" />

        {record.orderBased ? (
          <div className="px-4">
            <p className="text-sm font-medium text-text-primary mb-2">CPT Codes</p>
            <div className="flex flex-wrap gap-1.5">
              {(record.orderCpts ?? []).map((entry) => (
                <span
                  key={entry.orderId}
                  title={entry.orderTitle}
                  className="inline-flex h-7 items-center rounded-lg bg-primary/10 px-2.5 text-xs font-medium text-primary"
                >
                  {entry.code || 'No CPT'}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-4">
            <p className="text-sm font-medium text-text-primary mb-2">Visit Utilization</p>
            {(record.visitsAuthorized > 0 || record.visitsCompleted > 0 || record.visitsScheduled > 0) ? (
              <UtilizationBar
                layout="row"
                authorized={record.visitsAuthorized}
                completed={record.visitsCompleted}
                scheduled={record.visitsScheduled}
              />
            ) : (
              <span className="text-sm text-text-secondary">--</span>
            )}
          </div>
        )}

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
            <p className="text-sm font-medium text-text-primary">Message</p>
            {record.notes.length > 0 && (
              <span className="text-xs text-text-secondary">({record.notes.length})</span>
            )}
          </div>

          <div className="flex flex-col gap-2 mb-3">
            <div className="flex flex-col rounded-lg border border-outline bg-white focus-within:border-primary transition-colors">
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
                placeholder="Send a message... type @ to tag a teammate"
                rows={3}
                className="w-full px-3 pt-2.5 text-xs text-text-primary bg-transparent resize-none focus:outline-none placeholder:text-text-secondary/70"
              />
              <div className="flex items-center gap-3 px-3 pb-2">
                <button
                  type="button"
                  className="p-0.5 rounded hover:bg-surface-variant transition-colors"
                  title="Attach a file"
                >
                  <Upload className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  className="p-0.5 rounded hover:bg-surface-variant transition-colors"
                  title="Translate"
                >
                  <Globe className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
                </button>
              </div>
            </div>
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
            <div className="relative pl-[30px]">
              <div className="absolute left-[8.5px] top-5 bottom-3 w-px bg-outline" />
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
        { id: 'visit-note', icon: NotebookPen, label: 'Visit Note' },
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
      <span className="w-[150px] shrink-0 text-sm leading-[22px] text-accent-700">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm leading-[22px] text-text-disabled truncate">{value}</span>
        {copyable && <CopyButton text={value} />}
      </div>
    </div>
  );
}

interface CptSelectOption {
  value: string;
  description?: string;
}

const CPT_CODES: CptSelectOption[] = [
  { value: '97110', description: 'Therapeutic exercises' },
  { value: '97112', description: 'Neuromuscular reeducation' },
  { value: '97116', description: 'Gait training' },
  { value: '97140', description: 'Manual therapy' },
  { value: '97530', description: 'Therapeutic activities' },
  { value: '97535', description: 'Self-care / home management training' },
  { value: '97750', description: 'Physical performance test' },
];
const CPT_UNIT_TYPES: CptSelectOption[] = [
  { value: 'Units' },
  { value: 'Visits' },
];

interface CptEntry {
  id: string;
  code: string;
  unitTrackingType: string;
  units: string;
  details?: Array<{
    label: string;
    value: string;
  }>;
}

function emptyCptEntry(): CptEntry {
  return { id: `cpt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, code: '', unitTrackingType: 'Units', units: '' };
}

function CptFieldSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  options: CptSelectOption[];
  onChange: (v: string) => void;
}) {
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

  const q = search.toLowerCase();
  const filtered = options.filter((o) =>
    o.value.toLowerCase().includes(q) || (o.description?.toLowerCase().includes(q) ?? false)
  );
  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-7 flex items-center justify-between gap-1 px-1.5 py-0.5 rounded-lg bg-surface-variant"
      >
        <span className={`text-sm truncate ${value ? 'text-text-primary' : 'text-[#808080]'}`}>
          {selected
            ? selected.description
              ? `${selected.value} — ${selected.description}`
              : selected.value
            : // Codes arriving from an order won't be in the local catalog, so show them verbatim.
              value || placeholder}
        </span>
        <ChevronDown className={`w-[18px] h-[18px] text-text-secondary shrink-0 ${open ? 'rotate-180' : ''}`} strokeWidth={1.5} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-outline rounded-lg shadow-lg overflow-hidden z-30">
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
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setSearch(''); }}
                  className={`w-full text-left px-2 py-1.5 transition-colors ${opt.value === value ? 'bg-primary/5 text-primary' : 'text-text-primary hover:bg-surface-variant'}`}
                >
                  <span className="block text-sm font-medium">{opt.value}</span>
                  {opt.description && (
                    <span className={`block text-xs mt-0.5 ${opt.value === value ? 'text-primary/80' : 'text-text-secondary'}`}>
                      {opt.description}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CptTrackingBlock({
  entry,
  codeOptions = CPT_CODES,
  showOrderDetails = false,
  onChange,
  onDelete,
}: {
  entry: CptEntry;
  codeOptions?: CptSelectOption[];
  showOrderDetails?: boolean;
  onChange: (next: CptEntry) => void;
  onDelete: () => void;
}) {
  const unitLabel = entry.unitTrackingType || 'Units';
  return (
    <div className="flex gap-2.5 w-full pb-0.5 border-b border-outline last:border-b-0">
      <div className="w-0.5 self-stretch rounded-full bg-primary shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col gap-2 py-4">
        <div className="flex items-center gap-4">
          <span className="w-40 shrink-0 text-sm leading-[22px] text-accent-700">CPT Code</span>
          <CptFieldSelect
            value={entry.code}
            placeholder="Select a CPT code"
            options={codeOptions}
            onChange={(code) => onChange({ ...entry, code })}
          />
        </div>
        {showOrderDetails ? (
          <div className="flex flex-col gap-2">
            {(entry.details ?? []).map((field, index) => (
              <div key={`${field.label}-${index}`} className="flex items-start gap-4">
                <span className="w-40 shrink-0 text-sm leading-[22px] text-accent-700">
                  {field.label}
                </span>
                <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm leading-[22px] text-text-disabled">
                  {field.value || '--'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-start gap-4">
              <div className="w-40 shrink-0">
                <p className="text-sm leading-[22px] text-accent-700">Tracking Type</p>
                <p className="text-xs font-medium leading-[18px] text-text-secondary">
                  {unitLabel === 'Visits'
                    ? 'Counts every visit where any of the selected CPT codes were billed'
                    : 'Counts every unit of each selected CPT code used in claims'}
                </p>
              </div>
              <CptFieldSelect
                value={entry.unitTrackingType}
                placeholder="Units"
                options={CPT_UNIT_TYPES}
                onChange={(unitTrackingType) => onChange({ ...entry, unitTrackingType })}
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="w-40 shrink-0 text-sm leading-[22px] text-accent-700">{unitLabel}</span>
              <input
                type="text"
                inputMode="numeric"
                value={entry.units}
                onChange={(e) => onChange({ ...entry, units: e.target.value.replace(/[^\d]/g, '') })}
                placeholder={`Enter ${unitLabel}`}
                className="flex-1 min-w-0 h-7 px-1.5 py-0.5 rounded-lg bg-surface-variant text-sm text-text-primary placeholder:text-[#808080] focus:outline-none"
              />
            </div>
          </>
        )}
        {!showOrderDetails && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onDelete}
              className="p-0 text-text-primary hover:text-status-expired transition-colors"
              title="Remove CPT"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const DETAIL_CONTROL =
  'min-h-[32px] rounded-md bg-[#f3f4f6] px-3 py-1.5 text-sm leading-[22px] text-text-primary outline-none transition-colors';

function AuthNotesField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);

  useEffect(() => {
    if (focused.current) return;
    setDraft(value);
  }, [value]);

  return (
    <textarea
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        onChange(e.target.value);
      }}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        setDraft(value);
      }}
      placeholder="Add notes"
      rows={2}
      className={`${DETAIL_CONTROL} min-w-0 flex-1 resize-none placeholder:text-text-secondary`}
    />
  );
}

function DetailRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="w-[150px] shrink-0 text-sm leading-[22px] text-accent-700">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm leading-[22px] text-text-disabled truncate">{value}</span>
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

function EditableDetailRow({ label, value, onChange, options, groupOptions, kind, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  copyable?: boolean;
  options?: string[];
  groupOptions?: string[];
  kind?: 'text' | 'date';
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);

  useEffect(() => {
    if (focused.current) return;
    setDraft(value);
  }, [value]);

  if (kind === 'date') {
    return (
      <div className="flex items-center gap-2 py-0.5">
        <span className="w-[150px] shrink-0 text-sm leading-[22px] text-accent-700">{label}</span>
        <DatePickerField value={value} onChange={onChange} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="w-[150px] shrink-0 text-sm leading-[22px] text-accent-700">{label}</span>
      {options ? (
        <EditableSelect value={value} onChange={onChange} options={options} groupOptions={groupOptions} />
      ) : (
        <input
          type="text"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => {
            setDraft(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => {
            focused.current = true;
          }}
          onBlur={() => {
            focused.current = false;
            setDraft(value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          className={`${DETAIL_CONTROL} flex-1 min-w-0 placeholder:text-text-secondary`}
        />
      )}
    </div>
  );
}

function parseDisplayDate(value: string): Date | null {
  return parseAuthDate(value);
}

function formatDisplayDate(date: Date): string {
  return formatAuthDateFromDate(date);
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function DatePickerField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = parseDisplayDate(value);
  const [cursor, setCursor] = useState(() => selected ?? new Date());

  useEffect(() => {
    if (!open) return;
    setCursor(parseDisplayDate(value) ?? new Date());
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const handle = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const monthLabel = cursor.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const startWeekday = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: startWeekday + daysInMonth }, (_, index) =>
    index < startWeekday ? null : index - startWeekday + 1,
  );
  while (cells.length % 7 !== 0) cells.push(null);

  const display = selected ? formatDisplayDate(selected) : formatAuthDate(value, '');

  return (
    <div ref={rootRef} className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center gap-2 ${DETAIL_CONTROL} text-left`}
      >
        <Calendar className="h-3.5 w-3.5 shrink-0 text-text-secondary" strokeWidth={1.5} />
        <span className={`min-w-0 flex-1 truncate ${display ? 'text-text-primary' : 'text-text-secondary'}`}>
          {display || 'MM/DD/YYYY'}
        </span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 w-[248px] rounded-lg border border-outline bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="flex size-7 items-center justify-center rounded-full hover:bg-surface-variant"
            >
              <ChevronLeft className="h-4 w-4 text-text-primary" strokeWidth={1.75} />
            </button>
            <span className="text-sm font-medium text-text-primary">{monthLabel}</span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="flex size-7 items-center justify-center rounded-full hover:bg-surface-variant"
            >
              <ChevronRight className="h-4 w-4 text-text-primary" strokeWidth={1.75} />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-[11px] font-medium text-text-secondary">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <span key={day} className="py-1">{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 text-center">
            {cells.map((day, index) => {
              if (!day) return <span key={`empty-${index}`} className="h-8" />;
              const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
              const isSelected = selected ? sameDay(date, selected) : false;
              const isToday = sameDay(date, new Date());
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    onChange(formatDisplayDate(date));
                    setOpen(false);
                  }}
                  className={`mx-auto flex size-8 items-center justify-center rounded-full text-xs ${
                    isSelected
                      ? 'bg-primary text-white'
                      : isToday
                        ? 'text-primary ring-1 ring-primary'
                        : 'text-text-primary hover:bg-surface-variant'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function EditableSelect({
  value,
  onChange,
  options,
  groupOptions,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  groupOptions?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Assignee fields get the shared group/individual picker instead of a flat list.
  const isAssignee = Boolean(groupOptions);

  useEffect(() => {
    if (!open || isAssignee) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, isAssignee]);

  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-1 ${DETAIL_CONTROL}`}
      >
        <span className={`flex-1 truncate text-left ${value ? '' : 'text-text-secondary'}`}>
          {value || 'Select...'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-secondary shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={1.5} />
      </button>
      {open && isAssignee ? (
        <AssigneePickerPopover
          anchorRef={triggerRef}
          align="left"
          selected={value ? value.split(', ').filter(Boolean) : []}
          extraIndividuals={options}
          onSelect={(name) => {
            onChange(name);
            setOpen(false);
          }}
          onDismiss={() => setOpen(false)}
        />
      ) : null}
      {open && !isAssignee && (
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
              filtered.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`flex w-full px-2 py-1.5 text-left text-xs ${
                    option === value ? 'bg-primary/10 text-primary' : 'text-text-primary hover:bg-surface-variant'
                  }`}
                >
                  {option}
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
      icon = <ArrowRightLeft className="w-[18px] h-[18px] text-primary" strokeWidth={1.5} />;
      description = (
        <span>
          Moved {action.apptType} appt <span className="font-medium">{action.apptDateTime}</span> from{' '}
          <span className="font-medium">{action.fromAuth}</span> to{' '}
          <span className="font-medium">{action.toAuth}</span>
        </span>
      );
      break;
    case 'detail_changed':
      icon = <Edit3 className="w-[18px] h-[18px] text-status-expiring" strokeWidth={1.5} />;
      description = (
        <span>
          Changed <span className="font-medium">{action.field}</span> from{' '}
          <span className="line-through text-text-secondary">{action.from || '--'}</span> to{' '}
          <span className="font-medium">{action.to || '--'}</span>
        </span>
      );
      break;
    case 'note_added':
      icon = <FileText className="w-[18px] h-[18px] text-status-active" strokeWidth={1.5} />;
      description = (
        <span>
          Added note: <span className="italic">&ldquo;{action.text.length > 60 ? action.text.slice(0, 60) + '...' : action.text}&rdquo;</span>
        </span>
      );
      break;
  }

  return (
    <div className="relative pb-4 last:pb-0">
      <div className="absolute left-[-30px] top-px w-[18px] h-[18px] bg-white flex items-center justify-center">
        {icon}
      </div>
      <p className="text-xs text-text-primary leading-relaxed">{description}</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-[10px] text-text-secondary">&bull;</span>
        <span className="text-[10px] text-text-secondary">{entry.author}</span>
        <span className="text-[10px] text-text-secondary">&bull;</span>
        <span className="text-[10px] text-text-secondary">{formatTimelineDate(entry.timestamp)}</span>
      </div>
    </div>
  );
}
