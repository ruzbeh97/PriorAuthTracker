import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { calendarData, type CalendarAppointment } from "../../data/calendarData";
import { applySelectedAppointment, buildPrototypeState } from "../../data/buildPrototypeState";
import type { ReadinessState } from "../../types/prototype";
import { AppointmentPopover, type PopoverAnchor } from "./AppointmentPopover";

interface CalendarShellProps {
  onOpenDrawer: (appointment: CalendarAppointment) => void;
  readiness: ReadinessState;
  headerActions?: ReactNode;
  onEditAppointment?: () => void;
  onCharge?: () => void;
  onPriorAuth?: () => void;
  onViewNote?: () => void;
  onToast?: (message: string) => void;
}

interface HoveredAppointment {
  appointment: CalendarAppointment;
  anchor: PopoverAnchor;
}

interface CardStatus {
  eligibilityOk: boolean;
  balanceDue: boolean;
  formsIncomplete: boolean;
  alertCount: number;
}

/** Surfaces the drawer's readiness signals on the card so staff can triage before opening it. */
function buildCardStatus(
  appointment: CalendarAppointment,
  readiness: ReadinessState,
): CardStatus {
  const state = applySelectedAppointment(buildPrototypeState(readiness), appointment);
  const eligibility = state.statusRows.find((row) => row.id === "eligibility");
  const balances = state.statusRows.find((row) => row.id === "balances");
  const forms = state.statusRows.find((row) => row.id === "reminders-forms");

  return {
    eligibilityOk: eligibility?.tone === "success",
    balanceDue: /due:/i.test(balances?.value ?? ""),
    formsIncomplete: forms?.tone !== "success",
    alertCount: state.visitRows.reduce((total, row) => total + (row.alertCount ?? 0), 0),
  };
}

function StatusIcons({ status }: { status: CardStatus }) {
  return (
    <span className="appointment-card-icons" aria-hidden="true">
      {status.eligibilityOk ? (
        <svg viewBox="0 0 14 14">
          <circle cx="7" cy="7" r="5.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path
            d="M4.6 7.2l1.7 1.7 3.1-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 14 14">
          <circle cx="7" cy="7" r="5.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path
            d="M7 4.3v3.2l2 1.3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {status.balanceDue ? <span className="card-glyph-text">$</span> : null}
      {status.formsIncomplete ? (
        <svg viewBox="0 0 14 14">
          <path
            d="M2.8 4.4h8.4M2.8 7h8.4M2.8 9.6h5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      ) : null}
      {status.alertCount > 0 ? <span className="card-count">+{status.alertCount}</span> : null}
    </span>
  );
}

function VerifiedTick() {
  return (
    <svg className="calendar-card-tick" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2 6.4l2.6 2.6L10 3.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function FacilityLine({ facility }: { facility: string }) {
  return (
    <span className="calendar-card-facility">
      <svg viewBox="0 0 14 14" aria-hidden="true">
        <path
          d="M7 1.9c2 0 3.5 1.5 3.5 3.4 0 2.4-3.5 5.8-3.5 5.8S3.5 7.7 3.5 5.3C3.5 3.4 5 1.9 7 1.9z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <circle cx="7" cy="5.3" r="1.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      <span>{facility}</span>
    </span>
  );
}

function AppointmentCard({
  appointment,
  readiness,
  onOpenDrawer,
  onHover,
  onHoverEnd,
}: {
  appointment: CalendarAppointment;
  readiness: ReadinessState;
  onOpenDrawer: (appointment: CalendarAppointment) => void;
  onHover: (appointment: CalendarAppointment, element: HTMLElement) => void;
  onHoverEnd: () => void;
}) {
  const reason = [appointment.caseName, appointment.type].filter(Boolean).join(" • ");
  const status = useMemo(
    () => buildCardStatus(appointment, readiness),
    [appointment, readiness],
  );

  const style = {
    gridColumn: appointment.day + 1,
    gridRow: `${appointment.startRow} / span ${appointment.span}`,
  } as const;

  const cancelled = appointment.status.toUpperCase() === "CANCELED";
  const classes = [
    "calendar-appointment",
    appointment.variant,
    appointment.half ? `is-half is-half-${appointment.half}` : "",
    cancelled ? "is-cancelled" : "",
    "is-interactive",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`appointment-wrapper${appointment.half ? ` is-half-${appointment.half}` : ""}`}
      style={style}
    >
      <button
        className={classes}
        type="button"
        aria-haspopup="dialog"
        aria-label={`${appointment.patient}, ${appointment.status}${appointment.time ? `, ${appointment.time}` : ""}`}
        onClick={() => onOpenDrawer(appointment)}
        onMouseEnter={(event) => onHover(appointment, event.currentTarget)}
        onFocus={(event) => onHover(appointment, event.currentTarget)}
        onMouseLeave={onHoverEnd}
        onBlur={onHoverEnd}
      >
        <span className="calendar-card-topline">
          <strong>
            {appointment.patient}
            {appointment.verified ? <VerifiedTick /> : null}
          </strong>
          {appointment.time ? <small>{appointment.time}</small> : null}
        </span>
        {reason ? <small className="calendar-card-reason">{reason}</small> : null}
        <span className="calendar-card-footer">
          {appointment.facility ? (
            <FacilityLine facility={appointment.facility} />
          ) : (
            <span className="calendar-card-status">{appointment.status}</span>
          )}
          <StatusIcons status={status} />
        </span>
      </button>
    </div>
  );
}

export function CalendarShell({
  onOpenDrawer,
  readiness,
  headerActions,
  onEditAppointment,
  onCharge,
  onPriorAuth,
  onViewNote,
  onToast,
}: CalendarShellProps) {
  const [hovered, setHovered] = useState<HoveredAppointment | null>(null);
  const hideTimer = useRef<number | undefined>(undefined);

  const showPopover = (appointment: CalendarAppointment, element: HTMLElement) => {
    window.clearTimeout(hideTimer.current);
    const rect = element.getBoundingClientRect();
    setHovered({
      appointment,
      anchor: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right },
    });
  };

  const queueHide = () => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setHovered(null), 140);
  };

  const cancelHide = () => window.clearTimeout(hideTimer.current);

  const closePopover = () => {
    window.clearTimeout(hideTimer.current);
    setHovered(null);
  };

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  // A fixed-position popover would drift away from its card once the grid scrolls.
  useEffect(() => {
    if (!hovered) {
      return;
    }
    window.addEventListener("scroll", closePopover, true);
    window.addEventListener("resize", closePopover);
    return () => {
      window.removeEventListener("scroll", closePopover, true);
      window.removeEventListener("resize", closePopover);
    };
  }, [hovered]);

  const popoverState = useMemo(() => {
    if (!hovered) {
      return null;
    }
    const base = buildPrototypeState(readiness);
    return applySelectedAppointment(base, hovered.appointment);
  }, [hovered, readiness]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--calendar-day-count",
      String(calendarData.columns.length),
    );
    document.documentElement.style.setProperty(
      "--calendar-row-count",
      String(calendarData.rowCount),
    );
  }, []);

  return (
    <div className="app-shell">
      <main className="calendar-shell" aria-label="Scheduling calendar">
        <header className="calendar-toolbar">
          <div className="calendar-navigation">
            <button className="toolbar-button toolbar-today" type="button">
              Today
            </button>
            <button className="toolbar-nav-arrow" type="button" aria-label="Previous day">
              <svg aria-hidden="true" viewBox="0 0 16 16">
                <path d="M9.75 3.5L5.25 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            <button className="toolbar-nav-arrow" type="button" aria-label="Next day">
              <svg aria-hidden="true" viewBox="0 0 16 16">
                <path d="M6.25 3.5L10.75 8l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            <h1>
              Friday <span>Aug</span>
            </h1>
            {headerActions}
          </div>

          <div className="calendar-view-controls">
            <div className="view-toggle view-toggle-icons" aria-label="Calendar layout">
              <button className="is-selected" type="button" aria-label="Grid layout">
                <svg aria-hidden="true" viewBox="0 0 16 16">
                  <rect x="2.5" y="3" width="11" height="10.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M2.5 6.25h11M5.75 2v2M10.25 2v2" fill="none" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </button>
              <button type="button" aria-label="List layout">
                <svg aria-hidden="true" viewBox="0 0 16 16">
                  <path d="M6 4.25h7.5M6 8h7.5M6 11.75h7.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M3 4.25h.01M3 8h.01M3 11.75h.01" fill="none" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </button>
            </div>

            <div className="view-toggle" aria-label="Calendar range">
              <button className="is-selected" type="button">
                Day
              </button>
              <button type="button">Week</button>
              <button type="button">Month</button>
              <button type="button">
                Compact
                <svg className="toolbar-chevron" aria-hidden="true" viewBox="0 0 12 12">
                  <path d="M3 4.5L6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </button>
            </div>

            <button className="toolbar-plain-icon" type="button" aria-label="Column layout">
              <svg aria-hidden="true" viewBox="0 0 16 16">
                <rect x="2.5" y="3" width="11" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <path d="M2.5 6.5h11M8 6.5v6.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>
          </div>

          <div className="calendar-actions">
            <button className="clear-button" type="button">
              Clear
            </button>
            <button className="toolbar-plain-icon" type="button" aria-label="Filters">
              <svg aria-hidden="true" viewBox="0 0 16 16">
                <path d="M2.5 4.5h11M4.5 8h7M6.5 11.5h3" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            <button className="toolbar-plain-icon" type="button" aria-label="Providers">
              <svg aria-hidden="true" viewBox="0 0 16 16">
                <circle cx="6.75" cy="5.25" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <path d="M2.5 13c0-2.2 1.9-3.6 4.25-3.6 1 0 1.9.25 2.6.7" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="12" cy="11.5" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>
            <button className="toolbar-plain-icon" type="button" aria-label="Saved views">
              <svg aria-hidden="true" viewBox="0 0 16 16">
                <path d="M4 2.75h8v10.5L8 10.5l-4 2.75V2.75z" fill="none" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>
            <div className="toolbar-split-button">
              <button type="button" aria-label="Add appointment">
                <svg aria-hidden="true" viewBox="0 0 16 16">
                  <path d="M8 3.5v9M3.5 8h9" fill="none" stroke="currentColor" strokeWidth="1.7" />
                </svg>
              </button>
              <button type="button" aria-label="More add options">
                <svg aria-hidden="true" viewBox="0 0 12 12">
                  <path d="M3 4.5L6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <div className="calendar">
          <div className="provider-corner" />
          <div className="provider-headings">
            {calendarData.columns.map((column, index) => (
              <div key={`provider-${index}`}>
                <span className="provider-name">{column.provider}</span>
                <small aria-label={`${column.appointmentCount} appointments`}>
                  <svg aria-hidden="true" viewBox="0 0 12 12">
                    <circle cx="6" cy="4" r="2" fill="none" stroke="currentColor" strokeWidth="1" />
                    <path
                      d="M2 10c0-2 1.8-3.2 4-3.2S10 8 10 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                    />
                  </svg>
                  {column.appointmentCount}
                </small>
              </div>
            ))}
          </div>
          <div className="calendar-times" aria-hidden="true">
            {calendarData.hourLabels.map((label, index) => (
              <span
                key={label}
                style={{ top: `${(index / (calendarData.rowCount / 2)) * 100}%` }}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="calendar-body">
            {calendarData.columns.map((column, index) => (
              <div
                key={`unavailable-${index}`}
                className="calendar-unavailable"
                style={{
                  gridColumn: index + 1,
                  gridRow: `1 / span ${column.unavailableUntilRow}`,
                }}
                aria-hidden="true"
              >
                <span>Not Available</span>
              </div>
            ))}

            {calendarData.appointments.map((appointment) => (
              <AppointmentCard
                key={`${appointment.patient}-${appointment.day}-${appointment.startRow}`}
                appointment={appointment}
                readiness={readiness}
                onOpenDrawer={onOpenDrawer}
                onHover={showPopover}
                onHoverEnd={queueHide}
              />
            ))}

            <div
              className="calendar-now-line"
              style={{ top: `${calendarData.nowOffset * 100}%` }}
              aria-hidden="true"
            />
          </div>
        </div>
      </main>

      {hovered && popoverState
        ? createPortal(
            <AppointmentPopover
              state={popoverState}
              anchor={hovered.anchor}
              onPointerEnter={cancelHide}
              onPointerLeave={queueHide}
              onOpenDrawer={() => {
                closePopover();
                onOpenDrawer(hovered.appointment);
              }}
              onEditAppointment={() => {
                closePopover();
                onEditAppointment?.();
              }}
              onCharge={() => {
                closePopover();
                onCharge?.();
              }}
              onPriorAuth={() => {
                closePopover();
                onPriorAuth?.();
              }}
              onViewNote={() => {
                closePopover();
                onViewNote?.();
              }}
              onToast={(message) => onToast?.(message)}
            />,
            document.body,
          )
        : null}
    </div>
  );
}
