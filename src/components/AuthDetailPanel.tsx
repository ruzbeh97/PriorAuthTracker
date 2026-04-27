import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Pencil, CheckCircle, ArrowRight, ExternalLink, ChevronDown, FileText, ArrowRightLeft, Edit3, Check, User, Globe, History, ShieldPlus, Phone, IdCard, Paperclip, Calendar, Upload } from 'lucide-react';
import type { AuthRecord, TimelineEntry } from '../types';
import VisitsBar from './VisitsBar';
import CopyButton from './CopyButton';

interface AuthDetailPanelProps {
  record: AuthRecord;
  allRecords: AuthRecord[];
  onClose?: () => void;
  onReassignVisit: (fromRecordId: string, toAuthNumber: string, type: 'completed' | 'scheduled', apptDateTime?: string) => void;
  onDetailChange: (recordId: string, field: string, from: string, to: string) => void;
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

export default function AuthDetailPanel({ record, allRecords, onReassignVisit, onDetailChange }: AuthDetailPanelProps) {
  const visitsRemaining = record.visitsAuthorized - record.visitsCompleted;
  const unscheduled = Math.max(0, visitsRemaining - record.visitsScheduled);

  const [completedAppts, setCompletedAppts] = useState<ExceededAppt[]>([]);
  const [scheduledAppts, setScheduledAppts] = useState<ExceededAppt[]>([]);
  const [pendingReassignments, setPendingReassignments] = useState<PendingReassignment[]>([]);
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState<Record<string, string>>({});
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

  const hasPendingChanges = pendingReassignments.length > 0 || Object.keys(editFields).length > 0;

  const portalUrl = PAYER_PORTAL_URLS[record.payer.name] || `https://www.google.com/search?q=${encodeURIComponent(record.payer.name + ' provider portal')}`;

  return (
    <div className="flex shrink-0 h-full gap-3">

    <div className={`bg-white border border-outline rounded-lg flex h-full overflow-hidden ${activeAction === 'portal' ? 'w-[880px]' : 'w-[440px]'}`}>
      {activeAction === 'portal' && (
        <div className="w-[440px] shrink-0 flex flex-col border-r border-outline">
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
            <button onClick={() => setActiveAction(null)} className="p-1 rounded hover:bg-surface-variant transition-colors shrink-0" title="Close portal">
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

      <div className="w-[440px] shrink-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-outline shrink-0">
        <h2 className="text-xl font-medium text-text-primary">
          {activeAction === 'assign' ? 'Patient Demographics' : 'Authorization Details'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeAction === 'portal') {
                setActiveAction(null);
              } else {
                setPortalCurrentUrl(portalUrl);
                setPortalAddressValue(portalUrl);
                setActiveAction('portal');
              }
            }}
            className={`p-1.5 rounded-full transition-colors ${activeAction === 'portal' ? 'bg-primary/10 text-primary' : 'hover:bg-surface-variant'}`}
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
            <EditableDetailRow editing={editing} label="Assigned To" value={record.assignedTo} editValue={editFields['Assigned To']} onChange={(v) => setEditFields((p) => ({ ...p, 'Assigned To': v }))} />
            <EditableDetailRow editing={editing} label="Provider" value={record.provider} editValue={editFields['Provider']} onChange={(v) => setEditFields((p) => ({ ...p, 'Provider': v }))} />
            <EditableDetailRow editing={editing} label="Facility" value={record.facility} editValue={editFields['Facility']} onChange={(v) => setEditFields((p) => ({ ...p, 'Facility': v }))} />
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

        {/* Divider */}
        <div className="my-3 border-t border-outline" />

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
    <div className="flex flex-col items-center gap-1 px-2 py-4 border border-outline rounded-lg bg-white">
      {([
        { id: 'details', icon: CheckCircle, label: 'Authorization Details' },
        { id: 'assign', icon: User, label: 'Assign' },
        { id: 'coverage', icon: ShieldPlus, label: 'Coverage' },
        { id: 'contact', icon: Phone, label: 'Contact' },
        { id: 'id-card', icon: IdCard, label: 'ID Card' },
        { id: 'attachments', icon: Paperclip, label: 'Attachments' },
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

function PatientDemographicsView({ record }: { record: AuthRecord }) {
  const [insuranceDrawer, setInsuranceDrawer] = useState<{ open: boolean; initial?: InsuranceFormData }>({ open: false });
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
        <h3 className="text-sm font-medium text-text-secondary mb-3">General Information</h3>
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
        <h3 className="text-sm font-medium text-text-secondary mb-3">Contact Information</h3>
        <div className="flex flex-col gap-2">
          <DemoRow label="Phone Number" value={demographics.phone} copyable />
          <DemoRow label="Email" value={demographics.email} copyable />
          <DemoRow label="Home Address" value={demographics.address} copyable />
        </div>
      </div>

      <div className="py-5 border-t border-outline">
        <div className="flex items-center gap-1.5 mb-3 px-6">
          <h3 className="text-sm font-medium text-text-secondary">Episodes of Care</h3>
          <ExternalLink className="w-3.5 h-3.5 text-text-secondary" strokeWidth={1.5} />
        </div>
        <div className="overflow-x-auto">
          <table className="text-sm min-w-max w-full">
            <thead>
              <tr className="border-b border-outline">
                <th className="w-[72px] shrink-0 sticky left-0 bg-white" />
                <th className="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">Case ID</th>
                <th className="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">Case Name</th>
                <th className="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">Case Notes</th>
                <th className="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">Plan of Care End Date</th>
                <th className="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">Pending POC Visits</th>
                <th className="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">Accident Date</th>
                <th className="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">Case Rendering Provider</th>
                <th className="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">Primary Insurance</th>
                <th className="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">Secondary Insurance</th>
                <th className="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">Tertiary Insurance</th>
                <th className="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">Linked Prior Auths</th>
              </tr>
            </thead>
            <tbody>
              {episodes.map((ep, i) => (
                <tr key={i} className="border-b border-outline">
                  <td className="py-3 px-2 sticky left-0 bg-white">
                    <div className="flex items-center gap-2">
                      <Pencil className="w-3.5 h-3.5 text-text-secondary shrink-0 cursor-pointer hover:text-primary" strokeWidth={1.5} />
                      <FileText className="w-3.5 h-3.5 text-text-secondary shrink-0 cursor-pointer hover:text-primary" strokeWidth={1.5} />
                      <svg className="w-3.5 h-3.5 text-text-secondary shrink-0 cursor-pointer hover:text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-text-primary whitespace-nowrap">{ep.caseId}</td>
                  <td className="px-3 py-3 text-text-primary whitespace-nowrap">{ep.caseName}</td>
                  <td className="px-3 py-3 text-text-primary whitespace-nowrap">{ep.caseNotes}</td>
                  <td className="px-3 py-3 text-text-primary whitespace-nowrap">{ep.pocEndDate}</td>
                  <td className="px-3 py-3 text-text-primary whitespace-nowrap">{ep.pendingPocVisits}</td>
                  <td className="px-3 py-3 text-text-primary whitespace-nowrap">{ep.accidentDate}</td>
                  <td className="px-3 py-3 text-text-primary whitespace-nowrap">{ep.renderingProvider}</td>
                  <td className="px-3 py-3 text-text-primary whitespace-nowrap">{ep.primaryInsurance}</td>
                  <td className="px-3 py-3 text-text-primary whitespace-nowrap">{ep.secondaryInsurance}</td>
                  <td className="px-3 py-3 text-text-primary whitespace-nowrap">{ep.tertiaryInsurance}</td>
                  <td className="px-3 py-3 text-text-primary whitespace-nowrap">{ep.linkedAuths}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 mt-3">
          <button className="p-1 rounded-full border border-outline hover:bg-surface-variant transition-colors">
            <svg className="w-4 h-4 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
        </div>
      </div>

      <div className="py-5 border-t border-outline">
        <div className="flex items-center gap-1.5 mb-3 px-6">
          <h3 className="text-sm font-medium text-text-secondary">Insurance Providers</h3>
          <ExternalLink className="w-3.5 h-3.5 text-text-secondary" strokeWidth={1.5} />
        </div>
        <div className="overflow-x-auto">
          <table className="text-sm min-w-max w-full">
            <thead>
              <tr className="border-b border-outline">
                <th className="w-[72px] shrink-0 sticky left-0 bg-white" />
                <th className="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">UID</th>
                <th className="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">Insurance Provider</th>
                <th className="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">Status</th>
                <th className="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">Effective Date</th>
                <th className="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">Expiry Date</th>
                <th className="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">Policy Number</th>
                <th className="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">Group Number</th>
                <th className="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">Plan Type</th>
              </tr>
            </thead>
            <tbody>
              {insuranceProviders.map((ins, i) => (
                <tr key={i} className="border-b border-outline">
                  <td className="py-3 px-2 sticky left-0 bg-white">
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
                  <td className="px-3 py-3 text-text-primary whitespace-nowrap">{ins.uid}</td>
                  <td className="px-3 py-3 text-text-primary whitespace-nowrap">{ins.name}</td>
                  <td className="px-3 py-3 text-text-primary whitespace-nowrap">{ins.status}</td>
                  <td className="px-3 py-3 text-text-primary whitespace-nowrap">{ins.effectiveDate}</td>
                  <td className="px-3 py-3 text-text-primary whitespace-nowrap">{ins.expiryDate}</td>
                  <td className="px-3 py-3 text-text-primary whitespace-nowrap">{ins.policyNumber}</td>
                  <td className="px-3 py-3 text-text-primary whitespace-nowrap">{ins.groupNumber}</td>
                  <td className="px-3 py-3 text-text-primary whitespace-nowrap">{ins.planType}</td>
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

function DemoRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex items-start gap-2 py-0.5">
      <span className="w-[140px] shrink-0 text-xs text-text-secondary">{label}</span>
      <div className="flex items-center gap-1 min-w-0">
        <span className="text-xs text-text-primary">{value}</span>
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

function EditableDetailRow({ editing, label, value, editValue, onChange, copyable }: {
  editing: boolean;
  label: string;
  value: string;
  editValue?: string;
  onChange: (v: string) => void;
  copyable?: boolean;
}) {
  if (editing) {
    return (
      <div className="flex items-center gap-2 py-0.5">
        <span className="w-[150px] shrink-0 text-xs text-text-secondary">{label}</span>
        <input
          type="text"
          value={editValue ?? value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 text-xs font-medium text-text-primary border border-outline rounded px-2 py-1 focus:outline-none focus:border-primary"
        />
      </div>
    );
  }
  return <DetailRow label={label} value={value} copyable={copyable} />;
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
