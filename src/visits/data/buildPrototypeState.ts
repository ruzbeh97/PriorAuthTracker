import {
  VISITS_REMAINING,
  baselineAppointment,
  baselinePatient,
  baselineVisitRows,
} from "./appointmentData";
import type { CalendarAppointment } from "./calendarData";
import type {
  AppointmentPrototypeState,
  EligibilityPlan,
  FormItem,
  ReadinessState,
  StatusRow,
  VisitRow,
} from "../types/prototype";

function eligibilityPlans(): EligibilityPlan[] {
  return [
    {
      priority: "Primary",
      status: "Active",
      tone: "success",
      patientName: "Harry Potter",
      dob: "Jan 1, 1980",
      insuranceCompany: "Hogwarts",
      companyType: "Blue Shield",
      memberId: "HP-001122",
      payerName: "Hogwarts",
      lastRun: "07/29/2026",
      remainingVisits: "123",
      clearingHouse: "Waystar",
      ranBy: "Aryan",
      policyNumber: "POL-77881",
      relationship: "SELF",
      provider: "Jessica Mckinnon",
      serviceType: "Professional Physician Visit",
      groupNumber: "None",
    },
    {
      priority: "Secondary",
      status: "Inconclusive",
      tone: "muted",
      payerName: "Hogwarts Supplemental",
      lastRun: "12/19/2025",
      remainingVisits: "123",
      clearingHouse: "Waystar",
      ranBy: "Aryan",
      policyNumber: "POL-99002",
      relationship: "SELF",
      provider: "Jessica Mckinnon",
      companyType: "Blue Shield",
      serviceType: "Professional Physician Visit",
      groupNumber: "None",
    },
  ];
}

function formsList(missing: boolean): FormItem[] {
  return [
    { name: "Identity Verification", status: "Completed", tone: "success" },
    { name: "Financial Policy", status: "Completed", tone: "success" },
    { name: "Photo and Social Media Release Form", status: "Completed", tone: "success" },
    {
      name: "Medical History",
      status: missing ? "Missing" : "Completed",
      tone: missing ? "danger" : "success",
    },
    { name: "Insurance Update Attachment", status: "Completed", tone: "success" },
  ];
}

function appointmentNotesRow(): StatusRow {
  return {
    id: "appointment-notes",
    label: "Appointment Notes",
    value: "",
    tone: "muted",
    details: [
      { label: "Type", value: "Admin Progress Note" },
      { label: "ICD-10 Codes", value: "No codes selected" },
    ],
    notesHeading: "Patient Notes",
    notesBody:
      "PATIENT HAS REALLY BAD LOWER BACK PAIN NEED TO BE EXTRA CAREFUL DURING TREATMENT Individual Out of Pocket: $6000 Individual Out of Pocket remaining: $3832.46",
  };
}

function buildStatusRows(readiness: ReadinessState): StatusRow[] {
  const notReady = readiness === "not-ready";

  if (notReady) {
    // Matches Not Checked In / review design frame
    return [
      {
        id: "eligibility",
        label: "Eligibility",
        value: "Active",
        tone: "success",
        statusIcon: "check",
        plans: eligibilityPlans(),
      },
      {
        id: "balances",
        label: "Balances",
        value: "Due: $40",
        tone: "danger",
        statusIcon: "dot",
        unresolved: true,
        cardTag: "Outstanding Balances",
        actions: [
          { label: "Override", icon: "refresh" },
          { label: "Charge", icon: "currency" },
        ],
        details: [
          { label: "Copay", value: "$40" },
          { label: "Deductible remaining", value: "$250" },
          { label: "Coinsurance", value: "20%" },
          { label: "Outstanding balance", value: "$40" },
          { label: "Last payment", value: "July 12 - $40" },
        ],
      },
      {
        id: "reminders-forms",
        label: "Reminders/Forms",
        value: "1 incomplete",
        tone: "warning",
        unresolved: true,
        actions: [{ label: "Send", icon: "send" }],
        forms: formsList(true),
        sentAt: "07/27/2026 11:26AM",
      },
      {
        id: "referrals",
        label: "Referrals",
        value: "No referrals",
        tone: "muted",
        actions: [{ label: "Add", icon: "plus" }],
        cardTag: "Not Linked",
        details: [
          { label: "Referral Number", value: "-" },
          { label: "Referring Provider", value: "-" },
        ],
        sentAt: "07/27/2026 11:26AM",
      },
      appointmentNotesRow(),
    ];
  }

  return [
    {
      id: "eligibility",
      label: "Eligibility",
      value: "Active",
      tone: "success",
      statusIcon: "check",
      plans: eligibilityPlans(),
    },
    {
      id: "balances",
      label: "Balances",
      value: "Paid: $40",
      tone: "success",
      statusIcon: "check",
      cardTag: "Outstanding Balances",
      actions: [
        { label: "Override", icon: "refresh" },
        { label: "Charge", icon: "currency" },
      ],
      details: [
        { label: "Copay", value: "$40" },
        { label: "Deductible remaining", value: "$250" },
        { label: "Coinsurance", value: "20%" },
        { label: "Outstanding balance", value: "$25" },
        { label: "Last payment", value: "July 12 - $40" },
      ],
    },
    {
      id: "reminders-forms",
      label: "Reminders/Forms",
      value: "Complete",
      tone: "success",
      statusIcon: "check",
      actions: [{ label: "Send", icon: "send" }],
      forms: formsList(false),
      sentAt: "07/27/2026 11:26AM",
    },
    {
      id: "referrals",
      label: "Referrals",
      value: "Linked",
      tone: "success",
      statusIcon: "check",
      cardTag: "Linked",
      actions: [{ label: "Add", icon: "plus" }],
      details: [
        { label: "Referral Number", value: "L SHOULDER", link: true },
        { label: "Referring Provider", value: "Harry Potter", link: true },
      ],
    },
    appointmentNotesRow(),
  ];
}

function buildVisitRows(): VisitRow[] {
  return baselineVisitRows.map((row) => ({
    ...row,
    details: row.details ? [...row.details] : undefined,
    actions: row.actions ? [...row.actions] : undefined,
    chips: row.chips ? [...row.chips] : undefined,
    cardActions: row.cardActions ? [...row.cardActions] : undefined,
    meter: row.meter ? { ...row.meter, legend: [...row.meter.legend] } : undefined,
  }));
}

/** A section is only "Ready" when none of its rows are still flagged. */
function sectionBadge(rows: { tone: StatusRow["tone"]; unresolved?: boolean }[]) {
  const flagged = rows.some(
    (row) => row.tone === "warning" || row.tone === "danger" || row.unresolved,
  );
  return flagged
    ? ({ label: "Needs your attention", tone: "attention" } as const)
    : ({ label: "Ready", tone: "ready" } as const);
}

export function buildPrototypeState(readiness: ReadinessState): AppointmentPrototypeState {
  const notReady = readiness === "not-ready";
  const readyToCheckIn = readiness === "ready-to-check-in";
  const statusRows = buildStatusRows(readiness);
  const visitRows = buildVisitRows();

  return {
    patient: baselinePatient,
    appointment: {
      ...baselineAppointment,
      checkInStatus: readiness === "ready" ? "Checked In" : "Not Checked In",
    },
    readiness,
    alertScenario: "none",
    alerts: [],
    statusRows,
    visitRows,
    attentionRows: [],
    statusBadge: sectionBadge(statusRows),
    visitsBadge: sectionBadge(visitRows),
    statusSubtitle: "Last Updated on Aug 3rd 10:48am",
    visitsSubtitle: `${VISITS_REMAINING} visits remaining`,
    checkInEnabled: readiness !== "ready",
    checkInDisabledReason: undefined,
    readinessLabel: notReady
      ? "Not ready for check in"
      : readyToCheckIn
        ? "Ready for check in"
        : "Checked In",
    primaryActions: notReady ? "not-ready" : readyToCheckIn ? "ready-to-check-in" : "ready",
  };
}

/**
 * Check-in is tracked separately in its own badge, so a calendar card that reports
 * "Checked In" must not overwrite the scheduling status and contradict it.
 */
function schedulingStatus(status: string, fallback: string): string {
  if (!status || status === "Checked In") {
    return fallback;
  }
  return status;
}

export function applySelectedAppointment(
  state: AppointmentPrototypeState,
  appointment: CalendarAppointment,
): AppointmentPrototypeState {
  return {
    ...state,
    patient: {
      ...state.patient,
      name: appointment.patient,
    },
    appointment: {
      ...state.appointment,
      time: appointment.time
        ? appointment.time.replace(/\s*-\s*/g, "-").replace(/am/gi, "AM").replace(/pm/gi, "PM")
        : state.appointment.time,
      status: schedulingStatus(appointment.status, state.appointment.status),
      type: appointment.type || state.appointment.type,
      reason: appointment.caseName || state.appointment.reason,
      location: appointment.location || state.appointment.location,
    },
  };
}
