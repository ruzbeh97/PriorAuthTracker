import { useEffect, useState } from 'react';

export type AssigneeTab = 'individuals' | 'groups';

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  members: string[];
}

export const USER_GROUPS_STORAGE_KEY = 'prior-auth:pref-user-groups';
export const USER_GROUPS_EVENT = 'prior-auth:user-groups';
export const USER_GROUPS_SEED_VERSION = '2';
export const USER_GROUPS_SEED_VERSION_KEY = 'prior-auth:pref-user-groups-seed';

export const ASSIGNEE_INDIVIDUALS = [
  'Ashton Roy',
  'Ashton Lee',
  'Bailey Moon',
  'Brad Hope',
  'Leo Wood',
  'Olivia Grace',
  'Ethan Sky',
  'Sophia Sun',
  'Noah Rain',
  'Isabella Star',
  'Caleb Stone',
  'Ava Brooks',
  'Ryan Field',
  'Hazel Cloud',
  'Dylan River',
  'Piper West',
  'Gavin Lake',
  'Violet Ash',
  'James Harden',
  'Molly Harden',
  'James Franco',
  'Natasha Smith',
  'Ronald Regin',
];

export const DEFAULT_USER_GROUPS: UserGroup[] = [
  {
    id: 'group-mri',
    name: 'MRI Authorization Team',
    description: 'Handles MRI prior authorizations',
    members: ['Bailey Moon', 'Ashton Lee', 'James Harden'],
  },
  {
    id: 'group-visco',
    name: 'Visco Authorization Team',
    description: 'Handles viscosupplementation authorizations',
    members: ['Molly Harden', 'James Franco'],
  },
  {
    id: 'group-dme',
    name: 'DME Authorization Team',
    description: 'Handles DME prior authorizations',
    members: ['James Franco', 'Natasha Smith', 'Ronald Regin'],
  },
  {
    id: 'group-referral',
    name: 'Referral Authorization Group',
    description: 'Handles referral authorizations',
    members: ['Olivia Grace', 'Leo Wood', 'Ava Brooks'],
  },
  {
    id: 'group-medication',
    name: 'Medication Authorization Team',
    description: 'Handles medication prior authorizations',
    members: ['Brad Hope', 'Sophia Sun', 'Natasha Smith'],
  },
  {
    id: 'group-lab',
    name: 'Lab Authorization Group',
    description: 'Handles lab prior authorizations',
    members: ['Ethan Sky', 'Noah Rain', 'Caleb Stone'],
  },
  {
    id: 'group-front-desk',
    name: 'Front Desk Group',
    description: 'Front desk staff',
    members: ['Piper West', 'Hazel Cloud', 'Gavin Lake', 'Violet Ash'],
  },
];

export function uniqueGroupNames(groups: UserGroup[]): string[] {
  return [...new Set(groups.map((group) => group.name).filter(Boolean))];
}

export const ASSIGNEE_GROUPS = uniqueGroupNames(DEFAULT_USER_GROUPS);

export function loadUserGroups(): UserGroup[] {
  try {
    const saved = localStorage.getItem(USER_GROUPS_STORAGE_KEY);
    if (!saved) return DEFAULT_USER_GROUPS;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? (parsed as UserGroup[]) : DEFAULT_USER_GROUPS;
  } catch {
    return DEFAULT_USER_GROUPS;
  }
}

export function loadAssigneeGroupNames(): string[] {
  return uniqueGroupNames(loadUserGroups());
}

export function saveUserGroups(groups: UserGroup[]) {
  try {
    localStorage.setItem(USER_GROUPS_STORAGE_KEY, JSON.stringify(groups));
    window.dispatchEvent(new Event(USER_GROUPS_EVENT));
  } catch {
    /* ignore quota errors */
  }
}

export function ensureUserGroupsSeeded(): UserGroup[] {
  try {
    const seedVersion = localStorage.getItem(USER_GROUPS_SEED_VERSION_KEY);
    if (seedVersion !== USER_GROUPS_SEED_VERSION) {
      localStorage.setItem(USER_GROUPS_STORAGE_KEY, JSON.stringify(DEFAULT_USER_GROUPS));
      localStorage.setItem(USER_GROUPS_SEED_VERSION_KEY, USER_GROUPS_SEED_VERSION);
      window.dispatchEvent(new Event(USER_GROUPS_EVENT));
      return DEFAULT_USER_GROUPS;
    }
  } catch {
    return DEFAULT_USER_GROUPS;
  }
  return loadUserGroups();
}

export function isAssigneeGroup(name: string) {
  return loadAssigneeGroupNames().includes(name);
}

export function useAssigneeGroups(): string[] {
  const [groups, setGroups] = useState(loadAssigneeGroupNames);

  useEffect(() => {
    const refresh = () => setGroups(loadAssigneeGroupNames());
    window.addEventListener(USER_GROUPS_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(USER_GROUPS_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return groups;
}

export function useUserGroups(): UserGroup[] {
  const [groups, setGroups] = useState(loadUserGroups);

  useEffect(() => {
    const refresh = () => setGroups(loadUserGroups());
    window.addEventListener(USER_GROUPS_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(USER_GROUPS_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return groups;
}
