import { useLayoutEffect, useRef, useState } from "react";
import type { AppointmentPrototypeState } from "../../types/prototype";
import "./appointment-popover.css";

const POPOVER_WIDTH = 320;
const ANCHOR_GAP = 10;
const VIEWPORT_EDGE = 12;

export interface PopoverAnchor {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface AppointmentPopoverProps {
  state: AppointmentPrototypeState;
  anchor: PopoverAnchor;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onOpenDrawer: () => void;
  onEditAppointment: () => void;
  onCharge: () => void;
  onPriorAuth: () => void;
  onViewNote: () => void;
  onToast: (message: string) => void;
}

type AlertTone = "warning" | "danger";

interface PopoverAlert {
  id: string;
  tone: AlertTone;
  icon: "eligibility" | "plan" | "currency";
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" />
      <path d="M3 5.5l7 5 7-5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 5.75V10l2.75 1.75" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="7.25" />
      <path d="M6.75 10.25l2.25 2.25 4.25-4.75" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 2.5l6 2v4.6c0 3.4-2.5 5.9-6 6.9-3.5-1-6-3.5-6-6.9V4.5z" />
      <path d="M10 7.5v4M8 9.5h4" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6.5 12.5L10 16l3.5-3.5" />
      <path d="M6.5 7.5L10 4l3.5 3.5" />
    </svg>
  );
}

function AlertIcon({ kind }: { kind: PopoverAlert["icon"] }) {
  if (kind === "plan") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <rect x="3" y="4.5" width="14" height="12" rx="2" />
        <path d="M3 8h14M7 3v3M13 3v3M7.75 12l1.5 1.5 3-3.25" />
      </svg>
    );
  }
  if (kind === "currency") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10 3v14M13 6.25c-.6-.9-1.7-1.4-3-1.4-1.8 0-3 .95-3 2.35 0 3.2 6.2 1.7 6.2 4.9 0 1.5-1.35 2.5-3.2 2.5-1.5 0-2.7-.6-3.3-1.6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 2.75l7.25 7.25L10 17.25 2.75 10z" />
      <path d="M10 6.75v4M10 13.1h.01" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M13.4 3.6l3 3L7.8 15.2 4 16l.8-3.8z" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M12 3.5h4.5V8M8 16.5H3.5V12M16.5 3.5L11 9M3.5 16.5L9 11" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6 8l4 4 4-4" />
    </svg>
  );
}

function buildAlerts(
  state: AppointmentPrototypeState,
  onCharge: () => void,
): PopoverAlert[] {
  const alerts: PopoverAlert[] = [];

  const eligibility = state.statusRows.find((row) => row.id === "eligibility");
  if (eligibility && eligibility.tone !== "success") {
    alerts.push({
      id: "eligibility",
      tone: "warning",
      icon: "eligibility",
      message: "Patient eligibility is unclear",
    });
  }

  const planOfCare = state.visitRows.find((row) => row.id === "plan-of-care");
  const visitsRemaining = planOfCare?.details?.find(
    (detail) => detail.label === "Visits Remaining",
  )?.value;
  if (visitsRemaining) {
    alerts.push({
      id: "plan-of-care",
      tone: "warning",
      icon: "plan",
      message: `${visitsRemaining} visits remaining on plan of care`,
    });
  }

  const balances = state.statusRows.find((row) => row.id === "balances");
  const amountDue = balances?.value.match(/Due:\s*(\$[\d,.]+)/i)?.[1];
  if (amountDue) {
    alerts.push({
      id: "balances",
      tone: "danger",
      icon: "currency",
      message: `Total Amount Due: ${amountDue}`,
      actionLabel: "Charge",
      onAction: onCharge,
    });
  }

  return alerts;
}

export function AppointmentPopover({
  state,
  anchor,
  onPointerEnter,
  onPointerLeave,
  onOpenDrawer,
  onEditAppointment,
  onCharge,
  onPriorAuth,
  onViewNote,
  onToast,
}: AppointmentPopoverProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");

  const { patient, appointment } = state;
  const checkedIn = appointment.checkInStatus === "Checked In";

  const eligibility = state.statusRows.find((row) => row.id === "eligibility");
  const eligibilityPending = eligibility ? eligibility.tone !== "success" : false;
  const payer = eligibility?.plans?.[0]?.insuranceCompany ?? eligibility?.plans?.[0]?.payerName;

  const priorAuth = state.visitRows.find((row) => row.id === "prior-auth");
  const priorAuthNumber = priorAuth?.details?.find(
    (detail) => detail.label === "Total Visits at Prior Auth",
  )?.value;
  const hasPriorAuthNumber = Boolean(priorAuthNumber && priorAuthNumber !== "N/A");

  const alerts = buildAlerts(state, onCharge);

  const left = Math.min(
    Math.max((anchor.left + anchor.right) / 2 - POPOVER_WIDTH / 2, VIEWPORT_EDGE),
    window.innerWidth - POPOVER_WIDTH - VIEWPORT_EDGE,
  );
  const caretOffset = Math.min(
    Math.max((anchor.left + anchor.right) / 2 - left, 20),
    POPOVER_WIDTH - 20,
  );

  useLayoutEffect(() => {
    const height = cardRef.current?.offsetHeight ?? 0;
    const fitsBelow = anchor.bottom + ANCHOR_GAP + height <= window.innerHeight - VIEWPORT_EDGE;
    const fitsAbove = anchor.top - ANCHOR_GAP - height >= VIEWPORT_EDGE;
    setPlacement(!fitsBelow && fitsAbove ? "top" : "bottom");
  }, [anchor.top, anchor.bottom, state]);

  const height = cardRef.current?.offsetHeight ?? 0;
  const top =
    placement === "bottom" ? anchor.bottom + ANCHOR_GAP : anchor.top - ANCHOR_GAP - height;

  return (
    <div
      ref={cardRef}
      className={`appointment-popover is-${placement}`}
      role="dialog"
      aria-label={`${patient.name} appointment preview`}
      style={{
        top: Math.max(top, VIEWPORT_EDGE),
        left,
        width: POPOVER_WIDTH,
        ["--popover-caret" as string]: `${caretOffset}px`,
      }}
      onMouseEnter={onPointerEnter}
      onMouseLeave={onPointerLeave}
    >
      <span className="popover-caret" aria-hidden="true" />

      <div className="popover-section popover-header">
        <span className="popover-time">{appointment.time}</span>
        <div className="popover-header-end">
          <button
            type="button"
            className="popover-icon-button"
            aria-label="Message patient"
            onClick={() => onToast("Message patient")}
          >
            <MailIcon />
          </button>
          <span className="popover-chip">{appointment.status}</span>
        </div>
      </div>

      <div className="popover-section popover-identity">
        <h3 className="popover-name">
          <button type="button" onClick={() => onToast("Open patient chart")}>
            {patient.name}
          </button>
          <span>, {patient.age}</span>
        </h3>
        <p className="popover-dob">{patient.dateOfBirth}</p>
        <p className="popover-context">
          <span>{appointment.reason}</span>
          <span className="popover-sep" aria-hidden="true">
            •
          </span>
          <span>{appointment.type}</span>
          <span className="popover-sep" aria-hidden="true">
            •
          </span>
          <span>{appointment.location}</span>
          <span className="popover-sep" aria-hidden="true">
            •
          </span>
          <span>{patient.phone}</span>
        </p>
        <p className="popover-provider">
          Supervising Provider: {appointment.supervisingProvider}
        </p>
      </div>

      <div className="popover-section popover-eligibility">
        <div className="popover-eligibility-row">
          <span className={`popover-eligibility-state${eligibilityPending ? " is-pending" : ""}`}>
            {eligibilityPending ? <ClockIcon /> : <CheckCircleIcon />}
            {eligibility?.value ?? "Active"}
          </span>
          <button type="button" className="popover-link" onClick={onOpenDrawer}>
            View Details
          </button>
        </div>
        {payer ? (
          <p className="popover-payer">
            <ShieldIcon />
            {payer}
          </p>
        ) : null}
      </div>

      <div className="popover-section">
        <div className="popover-section-title">
          <h4>Prior Authorization</h4>
          <button
            type="button"
            className="popover-collapse"
            aria-label="Collapse prior authorization"
            onClick={() => onToast("Prior Authorization")}
          >
            <CollapseIcon />
          </button>
        </div>
        <p className="popover-field-label">Number</p>
        {hasPriorAuthNumber ? (
          <p className="popover-field-value">{priorAuthNumber}</p>
        ) : (
          <button type="button" className="popover-link" onClick={onPriorAuth}>
            Add
          </button>
        )}
      </div>

      <div className="popover-section popover-next-visit">
        <h4>Next Visit</h4>
        <span>{appointment.nextVisit}</span>
      </div>

      {alerts.length ? (
        <div className="popover-section">
          <div className="popover-section-title">
            <h4>Alerts</h4>
            <button
              type="button"
              className="popover-collapse"
              aria-label="Collapse alerts"
              onClick={() => onToast("Alerts")}
            >
              <CollapseIcon />
            </button>
          </div>
          <div className="popover-alerts">
            {alerts.map((alert) => (
              <div key={alert.id} className={`popover-alert tone-${alert.tone}`}>
                <AlertIcon kind={alert.icon} />
                <span>{alert.message}</span>
                {alert.actionLabel ? (
                  <button type="button" className="popover-link" onClick={alert.onAction}>
                    {alert.actionLabel}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="popover-section popover-footer">
        <div className="popover-split-button">
          <button
            type="button"
            onClick={() => (checkedIn ? onViewNote() : onToast("Checked in"))}
          >
            {checkedIn ? "View Note" : "Check In"}
          </button>
          <span className="popover-split-divider" aria-hidden="true" />
          <button
            type="button"
            aria-label="More check in options"
            onClick={() => onToast("More options")}
          >
            <ChevronIcon />
          </button>
        </div>
        <div className="popover-footer-actions">
          <button
            type="button"
            className="popover-round-button"
            aria-label="Edit appointment"
            onClick={onEditAppointment}
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            className="popover-round-button"
            aria-label="Open appointment details"
            onClick={onOpenDrawer}
          >
            <ExpandIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
