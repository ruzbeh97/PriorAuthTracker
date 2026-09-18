import { useEffect, useState } from 'react';
import { loadUserGroups } from './assignees';

export interface AuthStateConfig {
  id: string;
  name: string;
  description: string;
  color: string;
  /** Groups this state is offered to. Empty means every group can use it. */
  groups: string[];
}

export const AUTH_STATE_CONFIG_KEY = 'prior-auth:pref-auth-states';
export const AUTH_STATE_CONFIG_EVENT = 'prior-auth:auth-state-config';

const SEED_VERSION = '2';
const SEED_VERSION_KEY = 'prior-auth:pref-auth-states-seed';

export const STATE_COLOR_OPTIONS = [
  '#4caf50',
  '#e53935',
  '#1e88e5',
  '#fb8c00',
  '#8e24aa',
  '#00897b',
  '#8c8c8c',
];

/**
 * Shared states seed the workflow every group starts from; the group-scoped ones
 * below show how a team can add steps that only matter to their own queue.
 */
export const DEFAULT_AUTH_STATE_CONFIG: AuthStateConfig[] = [
  {
    id: 'state-needs-authorization',
    name: 'Needs Authorization',
    description: 'The authorization number is not available yet',
    color: '#e53935',
    groups: [],
  },
  {
    id: 'state-auth-requested',
    name: 'Auth Requested',
    description: 'Sent a message to the payer requesting the authorization',
    color: '#1e88e5',
    groups: [],
  },
  {
    id: 'state-authorized',
    name: 'Authorized',
    description: 'When patient has received an auth number from the payer',
    color: '#4caf50',
    groups: [],
  },
  {
    id: 'state-ready-to-schedule',
    name: 'Ready To Schedule',
    description: 'Authorization is in hand and the visit can be booked',
    color: '#00897b',
    groups: [],
  },
  {
    id: 'state-scheduled',
    name: 'Scheduled',
    description: 'The authorized visit is on the calendar',
    color: '#8e24aa',
    groups: [],
  },
  {
    id: 'state-schedule-attempt-1',
    name: 'Schedule Attempt 1',
    description: 'First outreach to the patient to book the visit',
    color: '#fb8c00',
    groups: [],
  },
  {
    id: 'state-schedule-attempt-2',
    name: 'Schedule Attempt 2',
    description: 'Second outreach to the patient to book the visit',
    color: '#fb8c00',
    groups: [],
  },
  {
    id: 'state-schedule-attempt-3',
    name: 'Schedule Attempt 3',
    description: 'Final outreach to the patient to book the visit',
    color: '#fb8c00',
    groups: [],
  },
  {
    id: 'state-peer-to-peer',
    name: 'Peer-to-Peer Required',
    description: 'Payer asked for a peer-to-peer review before approving imaging',
    color: '#8e24aa',
    groups: ['MRI Authorization Team'],
  },
  {
    id: 'state-series-approval',
    name: 'Series Approval Pending',
    description: 'Waiting on approval for the full injection series',
    color: '#1e88e5',
    groups: ['Visco Authorization Team'],
  },
  {
    id: 'state-vendor-confirmation',
    name: 'Vendor Confirmation Pending',
    description: 'Waiting on the DME vendor to confirm the item and pricing',
    color: '#fb8c00',
    groups: ['DME Authorization Team'],
  },
  {
    id: 'state-buy-and-bill',
    name: 'Buy & Bill Review',
    description: 'Checking whether the drug is buy and bill or pharmacy benefit',
    color: '#00897b',
    groups: ['Medication Authorization Team'],
  },
  {
    id: 'state-medical-necessity',
    name: 'Medical Necessity Review',
    description: 'Collecting chart notes that support the ordered lab panel',
    color: '#8e24aa',
    groups: ['Lab Authorization Group'],
  },
  {
    id: 'state-specialist-matching',
    name: 'Specialist Matching',
    description: 'Finding an in-network specialist for the referral',
    color: '#1e88e5',
    groups: ['Referral Authorization Group'],
  },
  {
    id: 'state-patient-contact',
    name: 'Patient Contact Needed',
    description: 'Front desk needs to reach the patient before this can move',
    color: '#fb8c00',
    groups: ['Front Desk Group', 'Referral Authorization Group'],
  },
];

function normalize(states: AuthStateConfig[]): AuthStateConfig[] {
  return states.map((state) => ({
    ...state,
    groups: Array.isArray(state.groups) ? state.groups.filter(Boolean) : [],
  }));
}

export function loadAuthStateConfig(): AuthStateConfig[] {
  try {
    const saved = localStorage.getItem(AUTH_STATE_CONFIG_KEY);
    if (!saved) return DEFAULT_AUTH_STATE_CONFIG;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length
      ? normalize(parsed as AuthStateConfig[])
      : DEFAULT_AUTH_STATE_CONFIG;
  } catch {
    return DEFAULT_AUTH_STATE_CONFIG;
  }
}

export function saveAuthStateConfig(states: AuthStateConfig[]) {
  try {
    localStorage.setItem(AUTH_STATE_CONFIG_KEY, JSON.stringify(states));
    window.dispatchEvent(new Event(AUTH_STATE_CONFIG_EVENT));
  } catch {
    /* ignore quota errors */
  }
}

export function ensureAuthStatesSeeded(): AuthStateConfig[] {
  try {
    if (localStorage.getItem(SEED_VERSION_KEY) !== SEED_VERSION) {
      localStorage.setItem(AUTH_STATE_CONFIG_KEY, JSON.stringify(DEFAULT_AUTH_STATE_CONFIG));
      localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
      window.dispatchEvent(new Event(AUTH_STATE_CONFIG_EVENT));
      return DEFAULT_AUTH_STATE_CONFIG;
    }
  } catch {
    return DEFAULT_AUTH_STATE_CONFIG;
  }
  return loadAuthStateConfig();
}

export function useAuthStateConfig(): AuthStateConfig[] {
  const [states, setStates] = useState(loadAuthStateConfig);

  useEffect(() => {
    const refresh = () => setStates(loadAuthStateConfig());
    window.addEventListener(AUTH_STATE_CONFIG_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(AUTH_STATE_CONFIG_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return states;
}

/**
 * A record reaches a group's states either by being assigned to the group itself
 * or by being assigned to somebody who belongs to it.
 */
export function groupsForAssignee(assignedTo: string): string[] {
  const names = assignedTo ? assignedTo.split(', ').map((name) => name.trim()).filter(Boolean) : [];
  if (names.length === 0) return [];
  return loadUserGroups()
    .filter((group) => names.includes(group.name) || group.members.some((member) => names.includes(member)))
    .map((group) => group.name);
}

export function statesForAssignee(states: AuthStateConfig[], assignedTo: string): AuthStateConfig[] {
  const groups = groupsForAssignee(assignedTo);
  return states.filter((state) => state.groups.length === 0 || state.groups.some((group) => groups.includes(group)));
}

/** State names a record may move to, always including whatever it is set to today. */
export function useStateOptionsForAssignee(assignedTo: string, currentState?: string): string[] {
  const states = useAuthStateConfig();
  const names = statesForAssignee(states, assignedTo).map((state) => state.name);
  return currentState && !names.includes(currentState) ? [currentState, ...names] : names;
}

export function useAllStateNames(): string[] {
  return useAuthStateConfig().map((state) => state.name);
}

function hexToRgb(hex: string): [number, number, number] | null {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  if (full.length !== 6) return null;
  const parsed = Number.parseInt(full, 16);
  if (Number.isNaN(parsed)) return null;
  return [(parsed >> 16) & 255, (parsed >> 8) & 255, parsed & 255];
}

/** Chip styling for a state: a wash of its color behind a darkened version of it. */
export function stateChipStyle(color: string | undefined) {
  const rgb = color ? hexToRgb(color) : null;
  if (!rgb) return undefined;
  const [r, g, b] = rgb;
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.16)`,
    color: `rgb(${Math.round(r * 0.62)}, ${Math.round(g * 0.62)}, ${Math.round(b * 0.62)})`,
  };
}
