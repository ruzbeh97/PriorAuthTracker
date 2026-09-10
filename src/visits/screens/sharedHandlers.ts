import type { AppointmentPrototypeState, AlertItem, StatusRow, VisitRow } from "../types/prototype";

export interface DrawerScreenProps {
  state: AppointmentPrototypeState;
  onToast: (message: string) => void;
  onViewNote: () => void;
  onCharge: () => void;
  onOverride: () => void;
  onPriorAuth: () => void;
  onSelectProvider: () => void;
  onEditVisitLimits: () => void;
}

export function createDrawerHandlers(
  onToast: (message: string) => void,
  state: AppointmentPrototypeState,
  onViewNote: () => void,
  onCharge: () => void,
  onOverride: () => void,
  onPriorAuth: () => void,
  onSelectProvider: () => void,
  onEditVisitLimits: () => void,
) {
  return {
    onCopyMrn: () => {
      void navigator.clipboard?.writeText(state.patient.mrn);
      onToast("MRN copied");
    },
    onCopyPhone: () => {
      void navigator.clipboard?.writeText(state.patient.phone);
      onToast("Phone copied");
    },
    onViewNote,
    onCheckIn: () => onToast("Checked in"),
    onAlertAction: (alert: AlertItem) =>
      alert.actionLabel.toLowerCase() === "view note"
        ? onViewNote()
        : onToast(`${alert.actionLabel}: ${alert.title}`),
    onStatusAction: (label: string, row: StatusRow) =>
      label.toLowerCase() === "charge"
        ? onCharge()
        : label.toLowerCase() === "override"
          ? onOverride()
          : row.id === "referrals" && label.toLowerCase() === "add"
            ? onSelectProvider()
          : onToast(`${label} · ${row.label}`),
    onVisitAction: (label: string, row: VisitRow) =>
      row.id === "prior-auth" && label.toLowerCase() === "link"
        ? onPriorAuth()
        : row.id === "visit-limits" && label.toLowerCase() === "edit"
          ? onEditVisitLimits()
        : onToast(`${label} · ${row.label}`),
  };
}
