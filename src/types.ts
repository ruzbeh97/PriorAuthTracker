export type AuthStatus = 'Active' | 'Expiring Soon' | 'Expired' | 'Needs Auth';

export type AuthState =
  | 'Not Started'
  | 'In Progress'
  | 'Auth Requested'
  | 'Pending Payer Response'
  | 'Authorized'
  | 'Auth Denied'
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
}

export const AUTH_STATES: AuthState[] = [
  'Not Started',
  'In Progress',
  'Auth Requested',
  'Pending Payer Response',
  'Authorized',
  'Auth Denied',
  'Archived',
];
