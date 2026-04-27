import { useState, useEffect } from 'react';
import { X, ChevronDown, Calendar } from 'lucide-react';

interface CreateAuthForm {
  patient: string;
  type: 'Pre-Certification' | 'Referral';
  authorizationNumber: string;
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
}

const INITIAL_FORM: CreateAuthForm = {
  patient: '',
  type: 'Pre-Certification',
  authorizationNumber: '',
  payer: '',
  payerId: '',
  startDate: '',
  endDate: '',
  notes: '',
  tags: '',
  trackingType: 'Visits',
  visitsAuthorized: '',
  assignedTo: 'Jaime Mandela',
  provider: 'Jon Jones',
  facility: 'Sunnybrook Hospital',
};

interface CreateAuthDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreate: (form: CreateAuthForm) => void;
}

export type { CreateAuthForm };

export default function CreateAuthDrawer({ open, onClose, onCreate }: CreateAuthDrawerProps) {
  const [form, setForm] = useState<CreateAuthForm>(INITIAL_FORM);

  useEffect(() => {
    if (open) setForm(INITIAL_FORM);
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const update = <K extends keyof CreateAuthForm>(key: K, value: CreateAuthForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleCreate = () => {
    onCreate(form);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="flex shrink-0 h-full gap-3">
    <div className="w-[440px] bg-white border border-outline rounded-lg flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-outline shrink-0">
          <h2 className="text-xl font-medium text-text-primary">Create Prior Authorization</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full border border-outline hover:bg-surface-variant transition-colors"
          >
            <X className="w-6 h-6 text-text-secondary" strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="flex flex-col gap-2 px-4">
            {/* Patient */}
            <FormRow label="Patient">
              <SelectInput value={form.patient} placeholder="Patient" onChange={(v) => update('patient', v)} options={['Pepe Johnson', 'Diana Morales', 'Xavier Nielson', 'Maria Chen', 'Robert Kim', 'Aisha Patel']} />
            </FormRow>
          </div>

          {/* Divider */}
          <Divider />

          <div className="flex flex-col gap-2 px-4">
            {/* Type toggle */}
            <div className="flex gap-1 items-center">
              <TogglePill label="Pre-Certification" active={form.type === 'Pre-Certification'} onClick={() => update('type', 'Pre-Certification')} />
              <TogglePill label="Referral" active={form.type === 'Referral'} onClick={() => update('type', 'Referral')} />
            </div>

            <FormRow label="Authorization Number">
              <TextInput value={form.authorizationNumber} placeholder="Add here" onChange={(v) => update('authorizationNumber', v)} />
            </FormRow>

            <FormRow label="Payer">
              <SelectInput value={form.payer} placeholder="Option" onChange={(v) => update('payer', v)} options={['BCBS', 'UHC', 'Aetna', 'Cigna', 'Humana']} />
            </FormRow>

            <FormRow label="Payer ID">
              <TextInput value={form.payerId} placeholder="Add here" onChange={(v) => update('payerId', v)} />
            </FormRow>

            <FormRow label="Start Date">
              <DateInput value={form.startDate} onChange={(v) => update('startDate', v)} />
            </FormRow>

            <FormRow label="End Date">
              <DateInput value={form.endDate} onChange={(v) => update('endDate', v)} />
            </FormRow>

            <FormRow label="Notes">
              <TextInput value={form.notes} placeholder="Add here" onChange={(v) => update('notes', v)} />
            </FormRow>

            <FormRow label="Tags">
              <SelectInput value={form.tags} placeholder="Select Tag" onChange={(v) => update('tags', v)} options={['PT', 'OT', 'SLP', 'Follow-up', 'Urgent', 'New', 'Review']} />
            </FormRow>
          </div>

          {/* Divider */}
          <Divider />

          <div className="flex flex-col gap-2 px-4">
            {/* Tracking type toggle */}
            <div className="flex gap-1 items-center">
              <TogglePill label="Visits" active={form.trackingType === 'Visits'} onClick={() => update('trackingType', 'Visits')} />
              <TogglePill label="CPTs" active={form.trackingType === 'CPTs'} onClick={() => update('trackingType', 'CPTs')} />
            </div>

            <FormRow label="Visits Authorized">
              <TextInput value={form.visitsAuthorized} placeholder="Add here" onChange={(v) => update('visitsAuthorized', v)} type="number" />
            </FormRow>
          </div>

          {/* Divider */}
          <Divider />

          <div className="flex flex-col gap-1 px-4">
            <FormRow label="Assigned To">
              <SelectInput value={form.assignedTo} placeholder="Jaime Mandela" onChange={(v) => update('assignedTo', v)} options={['Jaime Mandela', 'Emma Smith', 'Adam Smith']} />
            </FormRow>

            <FormRow label="Provider">
              <SelectInput value={form.provider} placeholder="Jon Jones" onChange={(v) => update('provider', v)} options={['Jon Jones', 'Sarah Adams', 'Dr. Li']} />
            </FormRow>

            <FormRow label="Facility">
              <SelectInput value={form.facility} placeholder="Sunnybrook Hospital" onChange={(v) => update('facility', v)} options={['Sunnybrook Hospital', 'Riverside Clinic', 'Westside Rehab']} />
            </FormRow>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 py-5 border-t border-outline shrink-0">
          <button
            onClick={handleCreate}
            className="px-4 py-[7px] h-9 bg-primary rounded-full text-sm font-medium text-white hover:bg-primary-hover transition-colors"
          >
            Create
          </button>
          <button
            onClick={onClose}
            className="px-4 py-[7px] h-9 rounded-full text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            Cancel
          </button>
      </div>
    </div>

    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-[160px] shrink-0 py-[2px]">
        <span className="text-base font-medium text-[#0a1e8f] leading-5">{label}</span>
      </div>
      {children}
    </div>
  );
}

function TextInput({ value, placeholder, onChange, type = 'text' }: { value: string; placeholder: string; onChange: (v: string) => void; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-7 min-w-[76px] px-1.5 py-0.5 rounded-lg text-sm text-text-primary bg-transparent placeholder:text-[#808080] focus:outline-none focus:bg-surface-variant/50 transition-colors"
    />
  );
}

function SelectInput({ value, placeholder, onChange, options }: { value: string; placeholder: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none h-7 pl-1.5 pr-6 py-0.5 rounded-lg text-sm bg-surface-variant text-text-primary cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" strokeWidth={1.5} />
    </div>
  );
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="mm/dd/yyyy"
        className="h-7 min-w-[120px] pl-1.5 pr-8 py-0.5 rounded-lg text-sm text-text-primary bg-transparent placeholder:text-[#808080] focus:outline-none focus:bg-surface-variant/50 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
      />
      <Calendar className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" strokeWidth={1.5} />
    </div>
  );
}

function TogglePill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-7 px-2 py-0.5 rounded-lg text-sm text-center transition-colors ${
        active
          ? 'bg-[#f1f3fe] border border-[#405bf2] text-primary'
          : 'border border-black/20 text-text-secondary hover:bg-surface-variant'
      }`}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <div className="my-2 mx-4 h-px bg-outline" />;
}
