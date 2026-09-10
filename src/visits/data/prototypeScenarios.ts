import type { AlertItem, AlertScenario, ReadinessState } from "../types/prototype";

export const alertCatalog: Record<Exclude<AlertScenario, "none" | "multiple">, AlertItem> = {
  eligibility: {
    id: "eligibility",
    title: "Eligibility could not be verified",
    description: "Required before check-in",
    actionLabel: "Check",
    severity: "blocking",
    blocking: true,
    icon: "warning",
  },
  balance: {
    id: "balance",
    title: "$40 patient balance due",
    description: "Can be collected during check-in",
    actionLabel: "Charge",
    severity: "non-blocking",
    blocking: false,
    icon: "currency",
  },
  forms: {
    id: "forms",
    title: "Required forms are incomplete",
    description: "Ask the patient to complete forms before check-in",
    actionLabel: "Send",
    severity: "blocking",
    blocking: true,
    icon: "forms",
  },
  "progress-notes": {
    id: "progress-notes",
    title: "2 progress note alerts",
    description: "Review before opening the note",
    actionLabel: "View note",
    severity: "informational",
    blocking: false,
    icon: "notes",
  },
};

export function alertsForScenario(scenario: AlertScenario): AlertItem[] {
  switch (scenario) {
    case "none":
      return [];
    case "multiple":
      return [alertCatalog.eligibility, alertCatalog.forms, alertCatalog.balance];
    default:
      return [alertCatalog[scenario]];
  }
}

/** Default readiness implied by a scenario when the pair would otherwise be inconsistent. */
export function defaultReadinessForScenario(scenario: AlertScenario): ReadinessState {
  switch (scenario) {
    case "eligibility":
    case "forms":
    case "multiple":
      return "not-ready";
    case "balance":
    case "progress-notes":
    case "none":
    default:
      return "ready";
  }
}

export function scenarioHasBlockingIssue(scenario: AlertScenario): boolean {
  return alertsForScenario(scenario).some((alert) => alert.blocking);
}
