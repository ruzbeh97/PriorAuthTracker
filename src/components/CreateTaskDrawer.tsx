import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronDown, Search, X } from 'lucide-react';
import { formatAuthDateFromDate } from '../utils';

export type TaskPriority = 'Urgent' | 'High' | 'Medium' | 'Low' | 'No Priority';
export type TaskStatus = 'Not Started' | 'Done';
export type TaskAssignmentMode = 'individual' | 'group';

export interface CreateTaskForm {
  title: string;
  description: string;
  assignmentMode: TaskAssignmentMode;
  assignee: string;
  patients: string[];
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  taskType: string;
  fileName: string;
}

const USER_OPTIONS = [
  'Adam Smith',
  'Hareet Dahya',
  'Ansh Mehta',
  'Jaime Mandela',
  'Ashton Roy',
  'Bailey Moon',
];

const GROUP_OPTIONS = ["Dr. Samimi's Staff", 'Admins', 'CCDA Inbox'];

const PATIENT_OPTIONS = [
  'Jordan Reyes',
  'Diana Morales',
  'Marcus Hale',
  'Nicholas Henry',
  'Harry James Potter',
];

const TASK_TYPE_OPTIONS = [
  'Need Prior Authorization',
  'Prior Auth',
  'Admin',
  'Faxing',
  'Care journey note',
  'Failed Fax',
];

const PRIORITY_OPTIONS: TaskPriority[] = ['No Priority', 'Urgent', 'High', 'Medium', 'Low'];
const STATUS_OPTIONS: TaskStatus[] = ['Not Started', 'Done'];

function emptyForm(): CreateTaskForm {
  return {
    title: '',
    description: '',
    assignmentMode: 'individual',
    assignee: '',
    patients: [],
    priority: 'No Priority',
    status: 'Not Started',
    dueDate: '',
    taskType: '',
    fileName: '',
  };
}

interface CreateTaskDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreate: (form: CreateTaskForm) => void;
}

export default function CreateTaskDrawer({ open, onClose, onCreate }: CreateTaskDrawerProps) {
  const [form, setForm] = useState<CreateTaskForm>(emptyForm);

  useEffect(() => {
    if (open) setForm(emptyForm());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const update = <K extends keyof CreateTaskForm>(key: K, value: CreateTaskForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const canCreate = form.title.trim().length > 0 && form.assignee.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate(form);
    onClose();
  };

  if (!open) return null;

  const assigneeOptions = form.assignmentMode === 'group' ? GROUP_OPTIONS : USER_OPTIONS;

  const drawer = (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <button type="button" aria-label="Close create task" className="absolute inset-0 bg-black/20" onClick={onClose} />
      <aside className="relative flex h-full w-[560px] max-w-full flex-col bg-white shadow-[-8px_0_24px_rgba(0,0,0,0.12)]">
        <header className="flex shrink-0 items-center justify-between border-b border-[#e6e6e6] bg-white px-6 py-4">
          <h2 className="font-sans text-[22px] font-semibold leading-7 text-[#1a1a1a]">Create Task</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full border border-[#d0d0d0] bg-white text-[#454545] hover:bg-[#f5f5f5]"
            aria-label="Close"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white px-6 pb-8 pt-4">
          <div className="space-y-4">
            <OutlineInput
              label="Title"
              required
              value={form.title}
              placeholder=""
              onChange={(value) => update('title', value)}
            />
            <OutlineTextarea
              label="Description"
              value={form.description}
              placeholder=""
              onChange={(value) => update('description', value)}
            />

            <div className="rounded-md border border-[#c4c4c4] bg-white">
              <div className="flex border-b border-[#e6e6e6]">
                <AssignmentTab
                  active={form.assignmentMode === 'individual'}
                  onClick={() => {
                    update('assignmentMode', 'individual');
                    update('assignee', '');
                  }}
                >
                  Assign to an Individual User
                </AssignmentTab>
                <AssignmentTab
                  active={form.assignmentMode === 'group'}
                  onClick={() => {
                    update('assignmentMode', 'group');
                    update('assignee', '');
                  }}
                >
                  Assign to a Group
                </AssignmentTab>
              </div>
              <div className="p-4">
                <SearchableOutlineSelect
                  label="Assignee"
                  required
                  value={form.assignee}
                  placeholder={
                    form.assignmentMode === 'group'
                      ? 'Search and select a group'
                      : 'Search and select a user'
                  }
                  options={assigneeOptions}
                  onChange={(value) => update('assignee', value)}
                />
              </div>
            </div>

            <SearchableOutlineSelect
              label="Patients"
              value={form.patients[0] ?? ''}
              placeholder="Search and select patients"
              options={PATIENT_OPTIONS}
              onChange={(value) => update('patients', value ? [value] : [])}
            />

            <div className="grid grid-cols-2 gap-4">
              <OutlineSelect
                label="Priority"
                required
                value={form.priority}
                placeholder="No Priority"
                options={PRIORITY_OPTIONS}
                onChange={(value) => update('priority', value as TaskPriority)}
              />
              <OutlineSelect
                label="Status"
                required
                value={form.status}
                placeholder="Not Started"
                options={STATUS_OPTIONS}
                onChange={(value) => update('status', value as TaskStatus)}
              />
            </div>

            <OutlineDate
              label="Due Date"
              value={form.dueDate}
              onChange={(value) => update('dueDate', value)}
            />

            <SearchableOutlineSelect
              label="Task Type"
              value={form.taskType}
              placeholder="Search and select a task type"
              options={TASK_TYPE_OPTIONS}
              onChange={(value) => update('taskType', value)}
            />

            <OutlineFile
              label="File"
              fileName={form.fileName}
              onChange={(value) => update('fileName', value)}
            />
          </div>
        </div>

        <footer className="flex shrink-0 items-center gap-5 border-t border-[#e6e6e6] bg-white px-6 py-4">
          <button
            type="button"
            disabled={!canCreate}
            onClick={handleCreate}
            className={`h-9 rounded-full px-5 text-[14px] font-medium ${
              canCreate
                ? 'bg-[#1132ee] text-white hover:bg-[#0e28be]'
                : 'cursor-not-allowed bg-[#e6e6e6] text-[#9e9e9e]'
            }`}
          >
            Create
          </button>
          <button type="button" onClick={onClose} className="text-[14px] font-medium text-[#1132ee] hover:underline">
            Cancel
          </button>
        </footer>
      </aside>
    </div>
  );

  return createPortal(drawer, document.body);
}

function AssignmentTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-4 py-3 text-[13px] ${
        active ? 'font-medium text-[#1132ee]' : 'text-[#737373] hover:text-[#1a1a1a]'
      }`}
    >
      {children}
      {active && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#1132ee]" />}
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
  options: string[];
  required?: boolean;
  onChange: (value: string) => void;
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
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-56 overflow-y-auto rounded-md border border-[#e6e6e6] bg-white py-1 shadow-[0_4px_16px_rgba(0,0,0,0.16)]"
        >
          {options.map((option) => (
            <li key={option} role="option" aria-selected={option === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`flex w-full items-center px-3.5 py-2 text-left text-[14px] ${
                  option === value ? 'bg-[#eceefe] text-[#1132ee]' : 'text-[#1a1a1a] hover:bg-[#f5f5f5]'
                }`}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SearchableOutlineSelect({
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
  options: string[];
  required?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setSearch('');
      inputRef.current?.focus();
    }
  }, [open]);

  const filtered = options.filter((option) => option.toLowerCase().includes(search.toLowerCase()));

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
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 overflow-hidden rounded-md border border-[#e6e6e6] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.16)]">
          <div className="flex items-center gap-2 border-b border-[#e6e6e6] px-3 py-2">
            <Search className="size-3.5 shrink-0 text-[#737373]" strokeWidth={1.75} />
            <input
              ref={inputRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent text-[14px] text-[#1a1a1a] placeholder:text-[#9e9e9e] focus:outline-none"
            />
          </div>
          <ul id={listId} role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3.5 py-2 text-[14px] text-[#9e9e9e]">No matches</li>
            ) : (
              filtered.map((option) => (
                <li key={option} role="option" aria-selected={option === value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center px-3.5 py-2 text-left text-[14px] ${
                      option === value ? 'bg-[#eceefe] text-[#1132ee]' : 'text-[#1a1a1a] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    {option}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function OutlineFile({
  label,
  fileName,
  onChange,
}: {
  label: string;
  fileName: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <span className="absolute -top-2 left-3 z-[1] bg-white px-1 text-[12px] leading-4 text-[#5f5f5f]">{label}</span>
      <div className="flex h-12 items-center gap-3 rounded-md border border-[#c4c4c4] bg-white px-3.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-[14px] font-medium text-[#1a1a1a] hover:text-[#1132ee]"
        >
          Choose File
        </button>
        <span className="truncate text-[14px] text-[#9e9e9e]">{fileName || 'No file chosen'}</span>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(event) => onChange(event.target.files?.[0]?.name ?? '')}
        />
      </div>
    </div>
  );
}

export function formatTaskDueDate(value: string) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return formatAuthDateFromDate(date);
}
