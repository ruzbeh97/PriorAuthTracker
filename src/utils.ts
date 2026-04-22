import type { AuthRecord } from './types';

export interface PatientGroup {
  patientKey: string;
  primary: AuthRecord;
  children: AuthRecord[];
}

export function groupByPatient(records: AuthRecord[]): PatientGroup[] {
  const map = new Map<string, AuthRecord[]>();
  const order: string[] = [];

  for (const r of records) {
    const key = `${r.patient.name}|${r.patient.dob}`;
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(r);
  }

  return order.map((key) => {
    const recs = map.get(key)!;
    return {
      patientKey: key,
      primary: recs[0],
      children: recs.slice(1),
    };
  });
}
