export type ReadinessState = "ready" | "not-ready" | "ready-to-check-in";

export type AlertScenario =
  | "none"
  | "eligibility"
  | "balance"
  | "forms"
  | "progress-notes"
  | "multiple";

export type DesignDirection = string;

export type AlertSeverity = "blocking" | "non-blocking" | "informational";

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  severity: AlertSeverity;
  blocking: boolean;
  icon: "warning" | "info" | "currency" | "forms" | "notes";
}

export interface DetailPair {
  label: string;
  value: string;
  link?: boolean;
}

export interface RowAction {
  label: string;
  icon?: "send" | "currency" | "override" | "plus" | "check" | "edit" | "link" | "view" | "refresh";
}

export interface EligibilityPlan {
  priority: string;
  status: string;
  tone: "success" | "warning" | "danger" | "muted";
  message?: string;
  patientName?: string;
  dob?: string;
  payerName: string;
  lastRun: string;
  remainingVisits: string;
  clearingHouse: string;
  ranBy: string;
  policyNumber: string;
  relationship: string;
  provider: string;
  companyType: string;
  serviceType: string;
  groupNumber: string;
  insuranceCompany?: string;
  memberId?: string;
}

export interface FormItem {
  name: string;
  sent?: string;
  status: string;
  tone: "success" | "warning" | "danger" | "muted";
}

export interface StatusRow {
  id: string;
  label: string;
  value: string;
  tone: "success" | "warning" | "danger" | "muted";
  statusIcon?: "check" | "dot" | "bell";
  unresolved?: boolean;
  actions?: RowAction[];
  details?: DetailPair[];
  plans?: EligibilityPlan[];
  forms?: FormItem[];
  cardTag?: string;
  sentAt?: string;
  /** Inline right meta, e.g. "Referring Provider: Harry Potter" */
  meta?: string;
  /** Appointment Notes body under a "Patient Notes" heading */
  notesHeading?: string;
  notesBody?: string;
}

export interface VisitChip {
  label: string;
  tone: "info" | "muted";
}

/** Only green and blue paint the meter; the rest read as track behind the fill. */
export type MeterSwatch = "green" | "blue" | "pale" | "empty";

export interface MeterLegendRow {
  label: string;
  value: string;
  swatch: MeterSwatch;
}

export interface VisitMeter {
  /** Denominator for segment widths, matching the "total" legend row. */
  total: number;
  headline: string;
  subline?: string;
  periodLabel?: string;
  periodValue?: string;
  legend: MeterLegendRow[];
}

export interface VisitRow {
  id: string;
  label: string;
  value: string;
  tone: "success" | "warning" | "danger" | "muted";
  actions?: RowAction[];
  details?: DetailPair[];
  alertCount?: number;
  statusIcon?: "bell";
  chips?: VisitChip[];
  cardActions?: ("edit" | "refresh")[];
  meter?: VisitMeter;
}

export interface PatientDetails {
  name: string;
  age: number;
  dateOfBirth: string;
  phone: string;
  mrn: string;
  gender: string;
  email: string;
}

export interface AppointmentDetails {
  time: string;
  date: string;
  status: string;
  type: string;
  reason: string;
  provider: string;
  supervisingProvider: string;
  location: string;
  lastChanged: string;
  nextVisit: string;
  checkInStatus: "Checked In" | "Not Checked In";
}

export interface AttentionRow {
  id: string;
  label: string;
  value: string;
  tone: "danger" | "warning";
  statusIcon?: "dot" | "bell";
  actions?: RowAction[];
}

export interface AppointmentPrototypeState {
  patient: PatientDetails;
  appointment: AppointmentDetails;
  readiness: ReadinessState;
  alertScenario: AlertScenario;
  alerts: AlertItem[];
  statusRows: StatusRow[];
  visitRows: VisitRow[];
  attentionRows: AttentionRow[];
  statusBadge: { label: string; tone: "ready" | "attention" };
  visitsBadge: { label: string; tone: "ready" | "attention" };
  statusSubtitle: string;
  visitsSubtitle: string;
  checkInEnabled: boolean;
  checkInDisabledReason?: string;
  readinessLabel: string;
  primaryActions: "ready" | "not-ready" | "ready-to-check-in";
}

export interface PrototypeQueryState {
  design: DesignDirection;
  state: ReadinessState;
}

/** Final UT prototype uses a single design direction. */
export const DESIGN_OPTIONS: { value: DesignDirection; label: string }[] = [
  { value: "actions-first", label: "Middle" },
];

export const READINESS_OPTIONS: { value: ReadinessState; label: string }[] = [
  { value: "ready", label: "Checked In" },
  { value: "not-ready", label: "Not ready for check in" },
  { value: "ready-to-check-in", label: "Ready for check in" },
];
