export type AuthStatus = 'Active' | 'Expiring Soon' | 'Expired' | 'Needs Auth';

export type AuthState =
  | 'Needs Authorization'
  | 'Auth Requested'
  | 'Authorized'
  | 'Ready To Schedule'
  | 'Scheduled'
  | 'Schedule Attempt 1'
  | 'Schedule Attempt 2'
  | 'Schedule Attempt 3'
  | 'Archived';

export interface NoteEntry {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

export type TimelineAction =
  | { kind: 'appointment_moved'; apptDateTime: string; apptType: 'completed' | 'scheduled'; fromAuth: string; toAuth: string }
  | { kind: 'detail_changed'; field: string; from: string; to: string }
  | { kind: 'note_added'; text: string };

export interface TimelineEntry {
  id: string;
  timestamp: string;
  author: string;
  action: TimelineAction;
}

export interface AuthRecord {
  id: string;
  patient: {
    name: string;
    dob: string;
    mrn?: string;
  };
  authNumber: string;
  payer: {
    name: string;
    planId: string;
  };
  startDate: string;
  endDate: string;
  visitsAuthorized: number;
  visitsCompleted: number;
  visitsScheduled: number;
  state: AuthState;
  status: AuthStatus;
  facility: string;
  provider: string;
  assignedTo: string;
  tags: string[];
  notes: NoteEntry[];
  timeline?: TimelineEntry[];
  confidence?: 'Confirmed' | 'Pending' | 'Unverified';
  /** Episode of care this authorization belongs to, used by Case grouping. */
  caseName?: string;
  /** Present when this authorization was generated from visit-note orders. */
  orderBased?: boolean;
  orderSource?: string;
  orderGroupId?: string;
  orderCpts?: Array<{
    orderId: string;
    orderTitle: string;
    code: string;
    trackingType: 'Units';
    units: string;
    details?: Array<{
      label: string;
      value: string;
    }>;
  }>;
}

export const AUTH_STATES: AuthState[] = [
  'Needs Authorization',
  'Auth Requested',
  'Authorized',
  'Ready To Schedule',
  'Scheduled',
  'Schedule Attempt 1',
  'Schedule Attempt 2',
  'Schedule Attempt 3',
];

export const AUTH_STATES_WITH_ARCHIVED: AuthState[] = [...AUTH_STATES, 'Archived'];

export function migrateAuthState(state: string): AuthState {
  if ((AUTH_STATES_WITH_ARCHIVED as string[]).includes(state)) return state as AuthState;
  switch (state) {
    case 'Auth Requested':
    case 'In Progress':
    case 'Pending Payer Response':
    case 'Waiting for payer response':
      return 'Auth Requested';
    case 'Authorized':
    case 'Auth Approved':
      return 'Authorized';
    case 'Archived':
      return 'Archived';
    default:
      return 'Needs Authorization';
  }
}
