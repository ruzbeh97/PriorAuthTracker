import type { AppointmentDetails, PatientDetails, VisitRow } from "../types/prototype";

export const baselinePatient: PatientDetails = {
  name: "Harry Potter",
  age: 36,
  dateOfBirth: "Jan 1, 1980",
  phone: "123-456-7890",
  mrn: "1234567",
  gender: "Male",
  email: "harry.potter@example.test",
};

export const baselineAppointment: AppointmentDetails = {
  time: "10:00-10:30AM",
  date: "Monday, August 3, 2026",
  status: "Scheduled",
  type: "Follow Up",
  reason: "S/P LT SHOULDER",
  provider: "Remus Lupin, PT",
  supervisingProvider: "Albus Dumbledore",
  location: "MAIN OFFICE",
  lastChanged: "Ron",
  nextVisit: "Thu, Sep 3 12:10PM",
  checkInStatus: "Checked In",
};

/** Plan of care counts drive both the row label and its meter. */
export const PLAN_OF_CARE_TOTAL = 24;
export const PLAN_OF_CARE_USED = 1;
export const PLAN_OF_CARE_REMAINING = PLAN_OF_CARE_TOTAL - PLAN_OF_CARE_USED;

/** Headline figure for the Visits section, independent of any single limit. */
export const VISITS_REMAINING = 8;

const VISIT_LIMIT_TOTAL = 50;
const VISIT_LIMIT_COMPLETED = 19;
const VISIT_LIMIT_SCHEDULED = 6;
const VISIT_LIMIT_AVAILABLE =
  VISIT_LIMIT_TOTAL - VISIT_LIMIT_COMPLETED - VISIT_LIMIT_SCHEDULED;

const PRIOR_AUTH_TOTAL = 20;
const PRIOR_AUTH_CLAIMED = 5;
const PRIOR_AUTH_COMPLETED = 14;
const PRIOR_AUTH_SCHEDULED = 3;

export const baselineVisitRows: VisitRow[] = [
  {
    id: "visit-limits",
    label: `Visit Limits (visit 20 of ${VISIT_LIMIT_TOTAL})`,
    value: "",
    tone: "muted",
    actions: [{ label: "Add", icon: "plus" }],
    chips: [{ label: "30 remain after this appointment", tone: "info" }],
    cardActions: ["edit", "refresh"],
    meter: {
      total: VISIT_LIMIT_TOTAL,
      headline: `Visit 20 of ${VISIT_LIMIT_TOTAL}`,
      subline: `${VISIT_LIMIT_AVAILABLE} available to schedule • 5 future scheduled`,
      legend: [
        { label: "Visits Completed", value: String(VISIT_LIMIT_COMPLETED), swatch: "green" },
        { label: "Scheduled", value: String(VISIT_LIMIT_SCHEDULED), swatch: "blue" },
        { label: "Available to Schedule", value: String(VISIT_LIMIT_AVAILABLE), swatch: "pale" },
        { label: "Visit Limit (total allowed)", value: String(VISIT_LIMIT_TOTAL), swatch: "empty" },
      ],
    },
  },
  {
    id: "prior-auth",
    label: "Prior Auth",
    value: "",
    tone: "muted",
    chips: [
      { label: "Primary Prior Auth", tone: "info" },
      { label: "Exp. Date: 07/01/26", tone: "muted" },
    ],
    meter: {
      total: PRIOR_AUTH_TOTAL,
      headline: `Visit 15 of ${PRIOR_AUTH_TOTAL}`,
      subline: `${PRIOR_AUTH_SCHEDULED} available to schedule • 3 future scheduled`,
      legend: [
        { label: "Claimed", value: String(PRIOR_AUTH_CLAIMED), swatch: "green" },
        { label: "Completed", value: String(PRIOR_AUTH_COMPLETED), swatch: "blue" },
        { label: "Scheduled", value: String(PRIOR_AUTH_SCHEDULED), swatch: "pale" },
        { label: "Total Visits on Prior Auth", value: String(PRIOR_AUTH_TOTAL), swatch: "empty" },
      ],
    },
  },
  {
    id: "plan-of-care",
    label: `Plan of Care (${PLAN_OF_CARE_REMAINING} remaining)`,
    value: "",
    tone: "muted",
    chips: [
      { label: `${PLAN_OF_CARE_REMAINING} remain after this appointment`, tone: "info" },
      { label: "92 days left", tone: "muted" },
    ],
    cardActions: ["refresh"],
    meter: {
      total: PLAN_OF_CARE_TOTAL,
      headline: `Visit ${PLAN_OF_CARE_USED} of ${PLAN_OF_CARE_TOTAL}`,
      periodLabel: "POC period",
      periodValue: "05/12/2025 - 12/12/2025",
      legend: [
        { label: "Visits Used", value: String(PLAN_OF_CARE_USED), swatch: "green" },
        { label: "Visits Remaining", value: String(PLAN_OF_CARE_REMAINING), swatch: "pale" },
        { label: "Total Visits", value: String(PLAN_OF_CARE_TOTAL), swatch: "empty" },
      ],
    },
  },
  {
    id: "medicare",
    label: "Medicare Threshold ($2,480.00 remaining)",
    value: "",
    tone: "muted",
    details: [
      { label: "Medicare Threshold Remaining", value: "$2,480.00" },
      { label: "Medicare Threshold Used", value: "$0.00" },
      { label: "Annual Medicare Threshold", value: "$2,480.00" },
      { label: "Other Medicare Threshold Used", value: "$0.00" },
    ],
  },
  {
    id: "progress-note-alerts",
    label: "Progress Note Alerts",
    value: "1 Alert",
    tone: "warning",
    alertCount: 1,
    statusIcon: "bell",
    details: [
      {
        label: "Progress Note Required",
        value: "A progress note is required every 2 days, and it's been 5 days since the last one.",
      },
    ],
  },
];
