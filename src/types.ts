export type AuthStatus = 'Active' | 'Expiring Soon' | 'Expired' | 'Needs Auth';

export type AuthState =
  | 'Not Started'
  | 'In Progress'
  | 'Auth Requested'
  | 'Pending Payer Response'
  | 'Authorized'
  | 'Auth Denied'
  | 'Archived';

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
  notes: string;
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
