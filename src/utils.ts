import type { AuthRecord } from './types';

export interface PatientGroup {
  patientKey: string;
  primary: AuthRecord;
  children: AuthRecord[];
}

export type GroupingKey =
  | 'none'
  | 'patient'
  | 'payer'
  | 'status'
  | 'state'
  | 'provider'
  | 'facility'
  | 'case';

export type GroupOrderField = 'default' | 'count' | 'state' | 'status';

function groupingKey(record: AuthRecord, grouping: GroupingKey) {
  switch (grouping) {
    case 'none':
      return record.id;
    case 'patient':
      return `${record.patient.name}|${record.patient.dob}`;
    case 'payer':
      return record.payer.name || '—';
    case 'status':
      return record.status || '—';
    case 'provider':
      return record.provider || '—';
    case 'facility':
      return record.facility || '—';
    case 'state':
      return record.state || '—';
    case 'case':
      return record.caseName || 'No Case';
  }
}

function mostCommon(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  let winner = values[0] ?? '';
  let best = 0;
  for (const [value, count] of counts) {
    if (count > best) {
      winner = value;
      best = count;
    }
  }
  return winner;
}

export function groupRecords(
  records: AuthRecord[],
  grouping: GroupingKey = 'patient',
  groupOrder: GroupOrderField = 'default',
  groupDir: 'asc' | 'desc' = 'asc',
): PatientGroup[] {
  const map = new Map<string, AuthRecord[]>();
  const order: string[] = [];

  for (const r of records) {
    const key = groupingKey(r, grouping);
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(r);
  }

  const sorted =
    grouping === 'none'
      ? order
      : [...order].sort((a, b) => {
          const left = map.get(a)!;
          const right = map.get(b)!;
          let compared = 0;
          switch (groupOrder) {
            case 'count':
              compared = right.length - left.length || a.localeCompare(b);
              break;
            case 'state':
              compared =
                mostCommon(left.map((record) => record.state)).localeCompare(
                  mostCommon(right.map((record) => record.state)),
                ) || a.localeCompare(b);
              break;
            case 'status':
              compared =
                mostCommon(left.map((record) => record.status)).localeCompare(
                  mostCommon(right.map((record) => record.status)),
                ) || a.localeCompare(b);
              break;
            default:
              compared = a.localeCompare(b);
          }
          return groupDir === 'asc' ? compared : -compared;
        });

  return sorted.map((key) => {
    const recs = map.get(key)!;
    return {
      patientKey: key,
      primary: recs[0],
      children: recs.slice(1),
    };
  });
}

export function groupByPatient(records: AuthRecord[]): PatientGroup[] {
  return groupRecords(records, 'patient');
}

function padDatePart(value: number) {
  return value.toString().padStart(2, '0');
}

export function parseAuthDate(value: string): Date | null {
  if (!value || value.includes('--')) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parts = value.split(/[/-]/);
  if (parts.length >= 2) {
    const month = Number(parts[0]);
    const day = Number(parts[1]);
    const rawYear = parts[2] ? Number(parts[2]) : NaN;
    const year = Number.isNaN(rawYear)
      ? new Date().getFullYear()
      : rawYear < 100
        ? 2000 + rawYear
        : rawYear;
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

export function formatAuthDateFromDate(date: Date): string {
  return `${padDatePart(date.getMonth() + 1)}/${padDatePart(date.getDate())}/${date.getFullYear()}`;
}

export function formatAuthDate(value: string, emptyLabel = '--/--/----'): string {
  const parsed = parseAuthDate(value);
  if (!parsed) return emptyLabel;
  return formatAuthDateFromDate(parsed);
}

export function parseAuthDateSortValue(value: string): number {
  const parsed = parseAuthDate(value);
  return parsed ? parsed.getTime() : 0;
}
