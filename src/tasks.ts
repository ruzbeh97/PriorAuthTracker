import type { AuthRecord } from './types';
import { formatAuthDateFromDate } from './utils';

export type TaskPriority = 'Urgent' | 'High' | 'Medium' | 'Low' | 'No Priority';
export type TaskStatus = 'Not Started' | 'Done';
export type TaskAssigneeKind = 'person' | 'group';

export interface TaskRow {
  id: string;
  name: string;
  assignedTo: string;
  assigneeKind: TaskAssigneeKind;
  assignedBy: string;
  patient: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  type: string;
  fax: string;
  attachment: string;
  uploadedFile: boolean;
}

export const CURRENT_USER = 'Adam Smith';

export const INITIAL_TASKS: TaskRow[] = [
  {
    id: 'task-1',
    name: 'Testing',
    assignedTo: "Dr. Samimi's Staff",
    assigneeKind: 'group',
    assignedBy: CURRENT_USER,
    patient: '',
    priority: 'Urgent',
    status: 'Not Started',
    dueDate: '11/12/2024',
    type: 'Need Prior Authorization',
    fax: '',
    attachment: '',
    uploadedFile: true,
  },
  {
    id: 'task-2',
    name: 'Test Task',
    assignedTo: 'Hareet Dahya',
    assigneeKind: 'person',
    assignedBy: 'Jaime Mandela',
    patient: '',
    priority: 'High',
    status: 'Done',
    dueDate: '11/12/2024',
    type: 'Admin',
    fax: '',
    attachment: '',
    uploadedFile: false,
  },
  {
    id: 'task-3',
    name: 'get pre auth for patient',
    assignedTo: 'Ansh Mehta',
    assigneeKind: 'person',
    assignedBy: CURRENT_USER,
    patient: '',
    priority: 'Medium',
    status: 'Not Started',
    dueDate: '11/18/2024',
    type: 'Prior Auth',
    fax: '',
    attachment: '',
    uploadedFile: false,
  },
  {
    id: 'task-4',
    name: 'Referrals',
    assignedTo: "Dr. Samimi's Staff",
    assigneeKind: 'group',
    assignedBy: 'Hareet Dahya',
    patient: '',
    priority: 'Low',
    status: 'Not Started',
    dueDate: '12/01/2024',
    type: 'Faxing',
    fax: '',
    attachment: '',
    uploadedFile: false,
  },
  {
    id: 'task-5',
    name: 'Follow up on pending authorization',
    assignedTo: CURRENT_USER,
    assigneeKind: 'person',
    assignedBy: 'Jaime Mandela',
    patient: 'Jordan Reyes',
    priority: 'High',
    status: 'Not Started',
    dueDate: '09/08/2026',
    type: 'Need Prior Authorization',
    fax: '',
    attachment: 'auth-packet.pdf',
    uploadedFile: true,
  },
  {
    id: 'task-6',
    name: 'Resend failed fax',
    assignedTo: 'Admins',
    assigneeKind: 'group',
    assignedBy: CURRENT_USER,
    patient: '',
    priority: 'Urgent',
    status: 'Not Started',
    dueDate: '09/03/2026',
    type: 'Faxing',
    fax: 'failed',
    attachment: '',
    uploadedFile: false,
  },
  {
    id: 'task-7',
    name: 'Review referral packet',
    assignedTo: CURRENT_USER,
    assigneeKind: 'person',
    assignedBy: 'Ansh Mehta',
    patient: 'Diana Morales',
    priority: 'Medium',
    status: 'Done',
    dueDate: '08/22/2026',
    type: 'Admin',
    fax: '',
    attachment: '',
    uploadedFile: true,
  },
  {
    id: 'task-8',
    name: 'Schedule authorized visit',
    assignedTo: 'Hareet Dahya',
    assigneeKind: 'person',
    assignedBy: CURRENT_USER,
    patient: '',
    priority: 'No Priority',
    status: 'Done',
    dueDate: '08/15/2026',
    type: 'Prior Auth',
    fax: '',
    attachment: '',
    uploadedFile: false,
  },
];

export function parseAssigneeNames(value: string): string[] {
  return value
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name && name !== 'Unassigned');
}

function defaultDueDate(): string {
  const due = new Date();
  due.setDate(due.getDate() + 7);
  return formatAuthDateFromDate(due);
}

export function tasksFromAuthAssignment(
  record: Pick<AuthRecord, 'id' | 'patient' | 'authNumber'>,
  previousAssignedTo: string,
  nextAssignedTo: string,
): TaskRow[] {
  const previous = new Set(parseAssigneeNames(previousAssignedTo));
  const added = parseAssigneeNames(nextAssignedTo).filter((name) => !previous.has(name));
  const patient = record.patient.name;
  const dueDate = defaultDueDate();

  return added.map((name, index) => ({
    id: `task-auth-${record.id}-${name}-${Date.now()}-${index}`,
    name: patient
      ? `Complete prior authorization for ${patient}`
      : 'Complete prior authorization',
    assignedTo: name,
    assigneeKind: 'person',
    assignedBy: CURRENT_USER,
    patient,
    priority: 'High',
    status: 'Not Started',
    dueDate,
    type: 'Need Prior Authorization',
    fax: '',
    attachment: '',
    uploadedFile: false,
  }));
}
