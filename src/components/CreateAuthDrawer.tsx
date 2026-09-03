import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Check, ChevronDown, Plus, Trash2, X } from 'lucide-react';
import type { AuthRecord, AuthState } from '../types';
import { AUTH_STATES_WITH_ARCHIVED } from '../types';
import { mockAuthRecords } from '../data';
import { formatAuthDateFromDate } from '../utils';

export const OPEN_CREATE_AUTH_EVENT = 'patient-chart:open-create-auth';

export interface CreateAuthCpt {
  id: string;
  codes: string[];
  problemListReference: string;
  trackingType: 'Units' | 'Visits';
  units: string;
}

export interface CreateAuthForm {
  patient: string;
  patientDob: string;
  patientMrn: string;
  type: 'Pre-Certification' | 'Referral';
  authorizationNumber: string;
  insurance: string;
  referringProvider: string;
  payer: string;
  payerId: string;
  startDate: string;
  endDate: string;
  notes: string;
  tags: string;
  trackingType: 'Visits' | 'CPTs';
  visitsAuthorized: string;
  assignedTo: string;
  provider: string;
  facility: string;
  authState: AuthState | '';
  cpts: CreateAuthCpt[];
}

export type OpenCreateAuthDetail = {
  patient?: string;
  patientDob?: string;
  patientMrn?: string;
};

const PATIENT_OPTIONS = (() => {
  const seen = new Set<string>();
  const patients: Array<{ name: string; dob: string; mrn: string }> = [];
  for (const entry of [
    { name: 'Jordan Reyes', dob: '03/14/1998', mrn: '004821735' },
    ...mockAuthRecords.map((record) => ({
      name: record.patient.name,
      dob: record.patient.dob,
      mrn: record.patient.mrn ?? '',
    })),
  ]) {
    const key = `${entry.name}|${entry.dob}|${entry.mrn}`;
    if (seen.has(key)) continue;
    seen.add(key);
    patients.push(entry);
  }
  return patients.sort((a, b) => a.name.localeCompare(b.name));
})();

function patientLabel(patient: { name: string; dob: string; mrn: string }) {
  return patient.mrn ? `${patient.name} · ${patient.dob} · ${patient.mrn}` : `${patient.name} · ${patient.dob}`;
}

const INSURANCE_OPTIONS = ['Priority Health', 'California Blue Shield', 'Self-pay', 'Aetna', 'UHC', 'Cigna'];
const REFERRING_PROVIDER_OPTIONS = [
  'Dr. Sarah Johnson',
  'Dr. Michael Chen',
  'Dr. Emily Davis',
  'Dr. Robert Wilson',
  'Marcus Hale MD',
];
const PROBLEM_LIST_OPTIONS = [
  'S83.511D — Sprain of ACL of right knee, subsequent encounter',
  'S83.511A — Sprain of ACL of right knee, initial encounter',
  'M25.661 — Stiffness of right knee',
  'M62.561 — Muscle wasting and atrophy of right lower leg',
  'Z47.89 — Encounter for other orthopedic aftercare',
  'G89.18 — Other acute postprocedural pain',
];
const PROVIDER_OPTIONS = ['Marcus Hale MD', 'Dana Whitfield PA-C', 'Jon Jones', 'Sarah Adams'];
const FACILITY_OPTIONS = ['Hale Orthopedics', 'MAIN OFFICE', 'Riverside Imaging', 'Sunnybrook Hospital'];
const TAG_OPTIONS = ['Post-op', 'PT', 'OT', 'Follow-up', 'Urgent', 'New'];
const CPT_OPTIONS = [
  '97110 — Therapeutic exercises',
  '97112 — Neuromuscular reeducation',
  '97116 — Gait training',
  '97140 — Manual therapy',
  '97530 — Therapeutic activities',
  '29881 — Arthroscopy, knee, surgical',
  '20610 — Arthrocentesis, major joint',
];
const AUTH_STATE_OPTIONS: Array<{ value: AuthState; description?: string }> = AUTH_STATES_WITH_ARCHIVED.map((value) => ({ value }));

function emptyCpt(): CreateAuthCpt {
  return {
    id: `cpt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    codes: [],
    problemListReference: '',
    trackingType: 'Units',
    units: '',
  };
}

function initialForm(defaults?: OpenCreateAuthDetail): CreateAuthForm {
  return {
    patient: defaults?.patient ?? '',
    patientDob: defaults?.patientDob ?? '',
    patientMrn: defaults?.patientMrn ?? '',
    type: 'Pre-Certification',
    authorizationNumber: '',
    insurance: '',
    referringProvider: '',
    payer: '',
    payerId: '',
    startDate: '',
    endDate: '',
    notes: '',
    tags: '',
    trackingType: 'CPTs',
    visitsAuthorized: '',
    assignedTo: 'Unassigned',
    provider: '',
    facility: '',
    authState: '',
    cpts: [emptyCpt()],
  };
}

function formatDisplayDate(value: string) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return formatAuthDateFromDate(date);
}

function codeFromOption(value: string) {
  return value.split(/\s+[—-]\s+/)[0]?.trim() ?? value;
}

export function authRecordFromForm(form: CreateAuthForm): AuthRecord {
  const cpts =
    form.trackingType === 'CPTs'
      ? form.cpts.flatMap((entry) =>
          entry.codes
            .filter(Boolean)
            .map((code, index) => ({
              orderId: `${entry.id}-${index}`,
              orderTitle: entry.problemListReference
                ? `${codeFromOption(code)} · ${codeFromOption(entry.problemListReference)}`
                : code,
              code: codeFromOption(code),
              trackingType: 'Units' as const,
              units: entry.units,
            })),
        )
      : undefined;

  return {
    id: `new-${Date.now()}`,
    patient: {
      name: form.patient || 'New Patient',
      dob: form.patientDob || '',
      mrn: form.patientMrn || '',
    },
    authNumber: form.authorizationNumber,
    payer: { name: form.insurance || form.payer, planId: form.payerId },
    startDate: formatDisplayDate(form.startDate),
    endDate: formatDisplayDate(form.endDate),
    visitsAuthorized: form.trackingType === 'Visits' ? parseInt(form.visitsAuthorized, 10) || 0 : 0,
    visitsCompleted: 0,
    visitsScheduled: 0,
    state: form.authState || 'Needs Authorization',
    status: form.authorizationNumber ? 'Active' : 'Needs Auth',
    facility: form.facility || 'Hale Orthopedics',
    provider: form.provider || 'Marcus Hale MD',
    assignedTo: form.assignedTo || 'Unassigned',
    tags: [
      form.type === 'Referral' ? 'REFERRAL' : 'PRE-CERT',
      form.trackingType === 'CPTs' ? 'CPT AUTHORIZATION' : 'VISIT AUTHORIZATION',
      ...(form.referringProvider ? [form.referringProvider] : []),
      ...(form.tags ? [form.tags] : []),
    ],
    notes: form.notes
      ? [{ id: `n${Date.now()}`, text: form.notes, author: 'Adam Smith', timestamp: new Date().toISOString() }]
      : [],
    orderBased: Boolean(cpts?.length),
    orderCpts: cpts,
  };
}

interface CreateAuthDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreate: (form: CreateAuthForm) => void;
  defaults?: OpenCreateAuthDetail;
}

export default function CreateAuthDrawer({ open, onClose, onCreate, defaults }: CreateAuthDrawerProps) {
  const [form, setForm] = useState<CreateAuthForm>(() => initialForm(defaults));

  useEffect(() => {
    if (open) setForm(initialForm(defaults));
    // Snapshot patient defaults at the moment the drawer opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const update = <K extends keyof CreateAuthForm>(key: K, value: CreateAuthForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateCpt = (id: string, patch: Partial<CreateAuthCpt>) => {
    setForm((prev) => ({
      ...prev,
      cpts: prev.cpts.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    }));
  };

  const handleCreate = () => {
    onCreate(form);
    onClose();
  };

  if (!open) return null;

  const drawer = (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <button type="button" aria-label="Close create prior authorization" className="absolute inset-0 bg-black/20" onClick={onClose} />
      <aside className="relative flex h-full w-[560px] max-w-full flex-col bg-white shadow-[-8px_0_24px_rgba(0,0,0,0.12)]">
        <header className="flex shrink-0 items-center justify-between border-b border-[#e6e6e6] bg-white px-6 py-4">
          <h2 className="font-sans text-[22px] font-semibold leading-7 text-[#1a1a1a]">Create Prior Authorization</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full border border-[#d0d0d0] bg-white text-[#454545] hover:bg-[#f5f5f5]"
            aria-label="Close"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-surface-variant px-6 pb-8 pt-2">
          <div className="pt-3">
            <OutlineSelect
              label="Patient"
              required
              value={
                form.patient
                  ? patientLabel({ name: form.patient, dob: form.patientDob, mrn: form.patientMrn })
                  : ''
              }
              placeholder="Select Patient"
              options={PATIENT_OPTIONS.map(patientLabel)}
              onChange={(value) => {
                const selected = PATIENT_OPTIONS.find((patient) => patientLabel(patient) === value);
                if (!selected) return;
                setForm((prev) => ({
                  ...prev,
                  patient: selected.name,
                  patientDob: selected.dob,
                  patientMrn: selected.mrn,
                }));
              }}
            />
          </div>

          <div className="flex items-center gap-6 py-3">
            <Radio
              label="Pre-Certification"
              checked={form.type === 'Pre-Certification'}
              onSelect={() => update('type', 'Pre-Certification')}
            />
            <Radio label="Referral" checked={form.type === 'Referral'} onSelect={() => update('type', 'Referral')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <OutlineInput
              label="Authorization Number"
              required={form.type !== 'Referral'}
              value={form.authorizationNumber}
              placeholder={form.type === 'Referral' ? 'Auth # (Optional)' : 'Auth #'}
              onChange={(value) => update('authorizationNumber', value)}
            />
            {form.type === 'Referral' ? (
              <OutlineSelect
                label="Referring Provider"
                value={form.referringProvider}
                placeholder="Select a referring provider"
                options={REFERRING_PROVIDER_OPTIONS}
                onChange={(value) => update('referringProvider', value)}
              />
            ) : (
              <OutlineSelect
                label="Insurance"
                required
                value={form.insurance}
                placeholder="Insurance"
                options={INSURANCE_OPTIONS}
                onChange={(value) => update('insurance', value)}
              />
            )}
            <OutlineDate
              label="Effective Date"
              value={form.startDate}
              onChange={(value) => update('startDate', value)}
            />
            <OutlineDate
              label="Expiration Date"
              value={form.endDate}
              onChange={(value) => update('endDate', value)}
            />
          </div>

          <div className="mt-8">
            <h3 className="font-sans text-[16px] font-semibold text-[#1a1a1a]">Additional Details</h3>
            <p className="mt-0.5 text-[13px] text-[#737373]">Information about this prior authorization.</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <OutlineSelect
              label="Provider"
              value={form.provider}
              placeholder="Select Provider"
              options={PROVIDER_OPTIONS}
              onChange={(value) => update('provider', value)}
            />
            <OutlineSelect
              label="Facility"
              value={form.facility}
              placeholder="Select Facility"
              options={FACILITY_OPTIONS}
              onChange={(value) => update('facility', value)}
            />
          </div>

          <div className="mt-4">
            <OutlineTextarea label="Notes" value={form.notes} placeholder="Notes" onChange={(value) => update('notes', value)} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <OutlineSelect
              label="State"
              required
              value={form.authState}
              placeholder="Select State"
              options={AUTH_STATE_OPTIONS}
              onChange={(value) => update('authState', value as AuthState)}
            />
            <OutlineSelect
              label="Tags"
              value={form.tags}
              placeholder="Tags"
              options={TAG_OPTIONS}
              onChange={(value) => update('tags', value)}
            />
          </div>

          <div className="mt-8">
            <h3 className="font-sans text-[16px] font-semibold text-[#1a1a1a]">Tracking Type</h3>
            <div className="mt-3 flex items-center gap-6">
              <Radio
                label="Visits"
                checked={form.trackingType === 'Visits'}
                onSelect={() => update('trackingType', 'Visits')}
              />
              <Radio label="CPTs" checked={form.trackingType === 'CPTs'} onSelect={() => update('trackingType', 'CPTs')} />
            </div>
          </div>

          {form.trackingType === 'Visits' ? (
            <div className="mt-4">
              <OutlineInput
                label="# Total Visits"
                value={form.visitsAuthorized}
                placeholder="0"
                onChange={(value) => update('visitsAuthorized', value)}
              />
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {form.cpts.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-[#ececec] bg-[#fafafa] p-3">
                  <OutlineMultiSelect
                    label="CPT Codes"
                    values={entry.codes}
                    placeholder="CPT Codes"
                    options={CPT_OPTIONS}
                    onChange={(values) => updateCpt(entry.id, { codes: values })}
                  />
                  {form.type === 'Referral' && (
                    <div className="mt-3">
                      <OutlineSelect
                        label="Problem List Reference"
                        value={entry.problemListReference}
                        placeholder=""
                        options={PROBLEM_LIST_OPTIONS}
                        onChange={(value) => updateCpt(entry.id, { problemListReference: value })}
                      />
                    </div>
                  )}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <OutlineSelect
                        label="Tracking Type"
                        value={entry.trackingType}
                        placeholder="Units"
                        options={['Units', 'Visits']}
                        onChange={(value) => updateCpt(entry.id, { trackingType: value as 'Units' | 'Visits' })}
                      />
                      <p className="mt-2 text-[12px] leading-4 text-[#8a8a8a]">
                        Counts every unit of each selected CPT code used in claims
                      </p>
                    </div>
                    <OutlineInput
                      label="Units"
                      value={entry.units}
                      placeholder="Enter Units"
                      onChange={(value) => updateCpt(entry.id, { units: value })}
                    />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          cpts: prev.cpts.length === 1 ? [emptyCpt()] : prev.cpts.filter((item) => item.id !== entry.id),
                        }))
                      }
                      className="inline-flex items-center gap-1 text-[13px] font-medium text-[#d32f2f] hover:text-[#b71c1c]"
                    >
                      Remove
                      <Trash2 className="size-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, cpts: [...prev.cpts, emptyCpt()] }))}
                className="inline-flex h-9 w-fit items-center gap-1 rounded-md border border-[#1132ee] bg-white px-3 text-[14px] font-medium text-[#1132ee] hover:bg-[#f1f3fe]"
              >
                <Plus className="size-4" strokeWidth={2} />
                Add CPT
              </button>
            </div>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-5 border-t border-[#e6e6e6] bg-white px-6 py-4">
          <button type="button" onClick={onClose} className="text-[14px] font-medium text-[#1132ee] hover:underline">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="h-9 rounded-md bg-[#1132ee] px-5 text-[14px] font-medium text-white hover:bg-[#0e28be]"
          >
            Create
          </button>
        </footer>
      </aside>
    </div>
  );

  return createPortal(drawer, document.body);
}

function Radio({ label, checked, onSelect }: { label: string; checked: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className="flex items-center gap-2">
      <span
        className={`flex size-[18px] items-center justify-center rounded-full border ${
          checked ? 'border-[#1132ee]' : 'border-[#9e9e9e]'
        }`}
      >
        {checked && <span className="size-[10px] rounded-full bg-[#1132ee]" />}
      </span>
      <span className="text-[14px] text-[#1a1a1a]">{label}</span>
    </button>
  );
}

function OutlineInput({
  label,
  value,
  placeholder,
  required,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative block">
      <span className="absolute -top-2 left-3 z-[1] bg-white px-1 text-[12px] leading-4 text-[#5f5f5f]">
        {label}
        {required ? <span className="text-[#d32f2f]"> *</span> : null}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-md border border-[#c4c4c4] bg-white px-3.5 text-[14px] text-[#1a1a1a] outline-none placeholder:text-[#9e9e9e] focus:border-[#1132ee]"
      />
    </label>
  );
}

function OutlineTextarea({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative block">
      <span className="absolute -top-2 left-3 z-[1] bg-white px-1 text-[12px] leading-4 text-[#5f5f5f]">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-md border border-[#c4c4c4] bg-white px-3.5 py-3 text-[14px] text-[#1a1a1a] outline-none placeholder:text-[#9e9e9e] focus:border-[#1132ee]"
      />
    </label>
  );
}

function OutlineDate({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  // An empty date input still paints its own "mm/dd/yyyy" text, which would sit
  // under the styled placeholder, so hide the native segments until it is in use.
  const showPlaceholder = !value && !focused;

  return (
    <label className="relative block">
      <span className="absolute -top-2 left-3 z-[1] bg-white px-1 text-[12px] leading-4 text-[#5f5f5f]">{label}</span>
      <Calendar className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#737373]" strokeWidth={1.75} />
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`h-12 w-full rounded-md border border-[#c4c4c4] bg-white pl-10 pr-3 text-[14px] outline-none focus:border-[#1132ee] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 ${
          showPlaceholder ? 'text-transparent' : 'text-[#1a1a1a]'
        }`}
      />
      {showPlaceholder && (
        <span className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-[14px] text-[#9e9e9e]">
          MM/DD/YYYY
        </span>
      )}
    </label>
  );
}

function OutlineSelect({
  label,
  value,
  placeholder,
  options,
  required,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: Array<string | { value: string; description?: string }>;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const items = options.map((option) =>
    typeof option === 'string' ? { value: option } : option,
  );

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className={`relative flex h-12 w-full items-center rounded-md border bg-white px-3.5 text-left ${
          open ? 'border-[#1132ee]' : 'border-[#c4c4c4]'
        }`}
      >
        <span className="absolute -top-2 left-3 bg-white px-1 text-[12px] leading-4 text-[#5f5f5f]">
          {label}
          {required ? <span className="text-[#d32f2f]"> *</span> : null}
        </span>
        <span className={`min-w-0 flex-1 truncate text-[14px] ${value ? 'text-[#1a1a1a]' : 'text-[#9e9e9e]'}`}>
          {value || placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 text-[#737373]" strokeWidth={1.75} />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-56 overflow-y-auto rounded-md bg-white py-1 shadow-[0_4px_16px_rgba(0,0,0,0.16)]"
        >
          {items.map((option) => (
            <li key={option.value} role="option" aria-selected={option.value === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full flex-col items-start justify-center px-3.5 py-2 text-left ${
                  option.value === value ? 'bg-[#eceefe] text-[#1132ee]' : 'text-[#1a1a1a] hover:bg-[#f5f5f5]'
                }`}
              >
                <span className="text-[14px] leading-5">{option.value}</span>
                {option.description ? (
                  <span className="text-[12px] leading-4 text-[#8a8a8a]">{option.description}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OutlineMultiSelect({
  label,
  values,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  values: string[];
  placeholder: string;
  options: string[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const toggle = (option: string) => {
    onChange(values.includes(option) ? values.filter((value) => value !== option) : [...values, option]);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-multiselectable="true"
        onClick={() => setOpen((current) => !current)}
        className={`relative flex min-h-12 w-full items-center rounded-md border bg-white px-3.5 py-2 text-left ${
          open ? 'border-[#1132ee]' : 'border-[#c4c4c4]'
        }`}
      >
        <span className="absolute -top-2 left-3 bg-white px-1 text-[12px] leading-4 text-[#5f5f5f]">{label}</span>
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1 pr-2">
          {values.length === 0 ? (
            <span className="text-[14px] text-[#9e9e9e]">{placeholder}</span>
          ) : (
            values.map((value) => (
              <span
                key={value}
                className="inline-flex max-w-full items-center gap-1 rounded-md bg-[#eceefe] px-2 py-0.5 text-[12px] font-medium text-[#1132ee]"
              >
                <span className="truncate">{codeFromOption(value)}</span>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${codeFromOption(value)}`}
                  className="flex size-3.5 items-center justify-center rounded-full hover:bg-[#d7dcfa]"
                  onClick={(event) => {
                    event.stopPropagation();
                    onChange(values.filter((item) => item !== value));
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      event.stopPropagation();
                      onChange(values.filter((item) => item !== value));
                    }
                  }}
                >
                  <X className="size-3" strokeWidth={2} />
                </span>
              </span>
            ))
          )}
        </span>
        <ChevronDown className="size-4 shrink-0 text-[#737373]" strokeWidth={1.75} />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-56 overflow-y-auto rounded-md bg-white py-1 shadow-[0_4px_16px_rgba(0,0,0,0.16)]"
        >
          {options.map((option) => {
            const selected = values.includes(option);
            return (
              <li key={option} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => toggle(option)}
                  className={`flex w-full items-center gap-2 px-3.5 py-2 text-left text-[14px] ${
                    selected ? 'bg-[#eceefe] text-[#1132ee]' : 'text-[#1a1a1a] hover:bg-[#f5f5f5]'
                  }`}
                >
                  <span
                    className={`flex size-4 shrink-0 items-center justify-center rounded-[3px] border ${
                      selected ? 'border-[#1132ee] bg-[#1132ee]' : 'border-[#9e9e9e] bg-white'
                    }`}
                  >
                    {selected ? <Check className="size-3 text-white" strokeWidth={3} /> : null}
                  </span>
                  <span className="min-w-0 flex-1 leading-5">{option}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
