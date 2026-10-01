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
  | 'Archived'
  // Preferences can define extra states per user group, so any label is valid.
  | (string & {});

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
  /** Free-text notes captured on the authorization itself (create drawer + detail panel). */
  authNotes?: string;
  timeline?: TimelineEntry[];
  confidence?: 'Confirmed' | 'Pending' | 'Unverified';
  /** Episode of care this authorization belongs to, used by Case grouping. */
  caseName?: string;
  /** Present when this authorization was generated from visit-note orders. */
  orderBased?: boolean;
  orderSource?: string;
  orderGroupId?: string;
  /** Visit note the orders were placed on. */
  visitNoteId?: string;
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
  /** Units entered on the approved-CPT blocks. Order rows use their sum as Available. */
  approvedUnitEntries?: Array<{
    id: string;
    units: string;
    code?: string;
    unitTrackingType?: string;
  }>;
  /** Visits or CPT tracking chosen in the detail panel. */
  trackingMode?: 'Visits' | 'CPTs';
  /** Units entered on visit-note services for appointments linked to this authorization. */
  serviceUnitsScheduled?: number;
  serviceUnitsCompleted?: number;
  /** Present when this authorization came from a custom order built in the order manager. */
  customOrder?: {
    templateName: string;
    /** The template markup as it was filled out, replayed read-only in the detail panel. */
    templateHtml: string;
    orderType: string;
    fields: Array<{ label: string; value: string }>;
    attachments: string[];
  };
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
      // Anything else is a state configured in Preferences; keep it as written.
      return state.trim() || 'Needs Authorization';
  }
}
