import { useEffect, useRef, useState } from "react";
import type {
  AppointmentPrototypeState,
  FormItem,
  RowAction,
  StatusRow,
  VisitRow,
} from "../../types/prototype";
import "./actions-first.css";

function buildOpenRows(state: AppointmentPrototypeState): Record<string, boolean> {
  const reviewIds = new Set(
    state.readiness === "not-ready" ? ["balances", "reminders-forms"] : [],
  );
  const next: Record<string, boolean> = {};
  for (const row of state.statusRows) {
    next[row.id] = reviewIds.has(row.id);
  }
  // Visit rows stay collapsed unless the row itself is flagging something.
  for (const row of state.visitRows) {
    next[row.id] =
      row.tone === "warning" || row.tone === "danger" || Boolean(row.alertCount);
  }
  return next;
}

export interface DrawerScreenProps {
  state: AppointmentPrototypeState;
  onToast: (message: string) => void;
  onClose: () => void;
  onViewNote: () => void;
  onCharge: () => void;
  onOverride: () => void;
  onPriorAuth: () => void;
  onSelectProvider: () => void;
  onEditVisitLimits: () => void;
  onEditAppointment: () => void;
  onCheckIn: () => void;
  onSendForms: () => void;
  onViewHistory: () => void;
  onViewSchedule: () => void;
  actionPlacement?: "middle" | "bottom";
}

const MATERIAL_ICONS: Record<string, string> = {
  currency: "attach_money",
  send: "send",
  edit: "edit",
  link: "link",
  refresh: "refresh",
  plus: "add",
  check: "check",
  copy: "content_copy",
  mail: "mail",
  more: "more_vert",
  info: "info",
  warning: "warning",
  chevron: "expand_more",
  wand: "auto_awesome",
  sparkle: "auto_awesome",
  doc: "description",
  flag: "flag",
  close: "close",
  bell: "notifications",
  history: "history",
  calendar: "calendar_today",
};

function Icon({
  name,
  className,
}: {
  name:
    | NonNullable<RowAction["icon"]>
    | "copy"
    | "mail"
    | "more"
    | "info"
    | "warning"
    | "chevron"
    | "wand"
    | "sparkle"
    | "doc"
    | "flag"
    | "close"
    | "bell"
    | "history"
    | "calendar";
  className?: string;
}) {
  const glyph = MATERIAL_ICONS[name] ?? "circle";
  return (
    <span className={`material-symbols-rounded af-mi${className ? ` ${className}` : ""}`} aria-hidden="true">
      {glyph}
    </span>
  );
}

function RowStatus({
  value,
  tone,
  statusIcon,
}: {
  value: string;
  tone: StatusRow["tone"] | VisitRow["tone"];
  statusIcon?: StatusRow["statusIcon"] | VisitRow["statusIcon"] | "dot";
}) {
  if (!value && statusIcon !== "dot") {
    return null;
  }

  if (statusIcon === "dot") {
    return (
      <span className={`af-row-status tone-${tone}`}>
        <span className="af-status-dot" aria-hidden="true" />
        {value}
      </span>
    );
  }

  if (statusIcon === "check") {
    return (
      <span className={`af-row-status tone-${tone}`}>
        <Icon name="check" />
        {value}
      </span>
    );
  }

  if (statusIcon === "bell") {
    return (
      <span className={`af-row-status tone-${tone}`}>
        <Icon name="bell" />
        {value}
      </span>
    );
  }

  return <span className={`af-row-status tone-${tone}`}>{value}</span>;
}

function ActionPill({
  action,
  onClick,
}: {
  action: RowAction;
  onClick: () => void;
}) {
  const label =
    action.icon === "currency" && action.label === "Charge" ? "$ Charge" : action.label;

  // Design: Check is a compact outline pill (no underline, no leading icon).
  const showIcon =
    Boolean(action.icon) &&
    action.icon !== "currency" &&
    action.icon !== "check" &&
    action.label !== "Check";

  return (
    <button
      className="af-pill"
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {showIcon ? <Icon name={action.icon!} /> : null}
      <span>{label}</span>
    </button>
  );
}

function ExpandedStatus({ row, onSendForms }: { row: StatusRow; onSendForms: () => void }) {
  if (row.plans?.length) {
    return (
      <div className="af-expanded">
        {row.plans.map((plan) => (
          <div key={plan.priority} className="af-card">
            <div className="af-card-topline">
              <div className="af-card-tags">
                <span className={`af-tag priority-${plan.priority.toLowerCase()}`}>{plan.priority}</span>
                <span className={`af-tag tone-${plan.tone}`}>
                  {plan.tone === "success" ? <Icon name="check" /> : null}
                  {plan.tone === "muted" ? <Icon name="info" /> : null}
                  {plan.status}
                </span>
              </div>
              <div className="af-card-icons">
                <button type="button" aria-label="Edit">
                  <Icon name="edit" />
                </button>
                <button type="button" aria-label="Refresh">
                  <Icon name="refresh" />
                </button>
                <button type="button" aria-label="Documents">
                  <Icon name="doc" />
                </button>
                <button type="button" aria-label="Flag">
                  <Icon name="flag" />
                </button>
              </div>
            </div>
            <div className="af-kv-list">
              {plan.patientName ? (
                <div>
                  <span>Patient Name</span>
                  <strong>{plan.patientName}</strong>
                </div>
              ) : null}
              {plan.dob ? (
                <div>
                  <span>DOB</span>
                  <strong>{plan.dob}</strong>
                </div>
              ) : null}
              <div>
                <span>{plan.patientName ? "Insurance Company" : "Payer Name"}</span>
                <strong>{plan.insuranceCompany || plan.payerName}</strong>
              </div>
              <div>
                <span>Company Type</span>
                <strong>{plan.companyType}</strong>
              </div>
              {plan.memberId ? (
                <div>
                  <span>Member ID</span>
                  <strong>{plan.memberId}</strong>
                </div>
              ) : null}
              <div>
                <span>Remaining Visits</span>
                <strong>{plan.remainingVisits}</strong>
              </div>
              <div>
                <span>Clearing House</span>
                <strong>{plan.clearingHouse}</strong>
              </div>
              <div>
                <span>Ran By</span>
                <strong>{plan.ranBy}</strong>
              </div>
              {!plan.patientName ? (
                <div>
                  <span>Last Run</span>
                  <strong>{plan.lastRun}</strong>
                </div>
              ) : null}
            </div>
            <div className="af-card-divider" />
            <div className="af-kv-list">
              <div>
                <span>Policy Number</span>
                <strong>{plan.policyNumber}</strong>
              </div>
              <div>
                <span>Relationship</span>
                <strong>{plan.relationship}</strong>
              </div>
              <div>
                <span>Provider</span>
                <strong>{plan.provider}</strong>
              </div>
              <div>
                <span>Service Type</span>
                <strong>{plan.serviceType}</strong>
              </div>
              <div>
                <span>Group Number</span>
                <strong>{plan.groupNumber}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (row.forms?.length) {
    return (
      <div className="af-expanded">
        <div className="af-card">
          <div className="af-card-topline">
            <span />
            <div className="af-card-icons">
              <button type="button" aria-label="Send" onClick={onSendForms}>
                <Icon name="send" />
              </button>
              <button type="button" aria-label="Refresh">
                <Icon name="refresh" />
              </button>
              <button type="button" aria-label="Documents">
                <Icon name="doc" />
              </button>
              <button type="button" aria-label="Flag">
                <Icon name="flag" />
              </button>
            </div>
          </div>
          <div className="af-form-list">
            {row.forms.map((form: FormItem) => (
              <div key={form.name} className="af-form-row">
                <span>{form.name}</span>
                <strong className={`tone-${form.tone} af-form-status`}>
                  {form.tone === "success" ? <Icon name="check" /> : null}
                  {form.tone === "danger" ? <Icon name="close" /> : null}
                  {form.status}
                </strong>
              </div>
            ))}
          </div>
          {row.sentAt ? (
            <>
              <div className="af-card-divider" />
              <div className="af-kv-list">
                <div>
                  <span>Sent at</span>
                  <strong>{row.sentAt}</strong>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  if (row.id === "appointment-notes") {
    return (
      <div className="af-expanded">
        <div className="af-card af-notes-card">
          <div className="af-kv-list">
            {row.details?.map((detail) => (
              <div key={detail.label}>
                <span>{detail.label}</span>
                <strong>{detail.value}</strong>
              </div>
            ))}
          </div>
          {row.notesBody ? (
            <div className="af-notes-block">
              <p className="af-notes-heading">{row.notesHeading ?? "Patient Notes"}</p>
              <p className="af-notes-body">{row.notesBody}</p>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="af-expanded">
      <div className="af-card">
        <div className="af-card-topline">
          <div className="af-card-tags">
            {row.cardTag ? (
              <span
                className={`af-tag${
                  row.id === "referrals"
                    ? row.cardTag === "Linked"
                      ? " tone-success"
                      : " tone-muted"
                    : " tone-balance"
                }`}
              >
                {row.id === "referrals" && row.cardTag === "Linked" ? <Icon name="check" /> : null}
                {row.cardTag}
              </span>
            ) : null}
          </div>
          <div className="af-card-icons">
            {row.id === "balances" ? (
              <button type="button" className="is-assist" aria-label="Athelas AI">
                <Icon name="sparkle" />
              </button>
            ) : null}
            <button type="button" aria-label="Edit">
              <Icon name="edit" />
            </button>
            <button type="button" aria-label="Refresh">
              <Icon name="refresh" />
            </button>
          </div>
        </div>
        <div className="af-kv-list">
          {row.details?.map((detail) => (
            <div key={detail.label}>
              <span>{detail.label}</span>
              <strong className={detail.link ? "is-link" : undefined}>{detail.value}</strong>
            </div>
          ))}
        </div>
        {row.sentAt ? (
          <>
            <div className="af-card-divider" />
            <div className="af-kv-list">
              <div>
                <span>Sent at</span>
                <strong>{row.sentAt}</strong>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function InfoGlyph() {
  return <Icon name="info" className="af-info-glyph" />;
}

function VisitMeterCard({
  row,
  onEdit,
  onRefresh,
}: {
  row: VisitRow;
  onEdit: () => void;
  onRefresh: () => void;
}) {
  const meter = row.meter!;

  // Each band is drawn as a full-width-from-left pill holding the running total,
  // then overlaid by the next-smallest, so every junction keeps a rounded cap.
  let running = 0;
  const bands = meter.legend
    .filter((entry) => entry.swatch !== "empty")
    .map((entry) => {
      running += Number(entry.value);
      return {
        label: entry.label,
        swatch: entry.swatch,
        percent: Math.min(100, (running / meter.total) * 100),
      };
    })
    .reverse();

  return (
    <div className="af-card af-visit-card">
      {row.chips?.length || row.cardActions?.length ? (
        <div className="af-visit-topline">
          <div className="af-visit-chips">
            {row.chips?.map((chip) => (
              <span key={chip.label} className={`af-visit-chip tone-${chip.tone}`}>
                {chip.label}
              </span>
            ))}
          </div>
          {row.cardActions?.length ? (
            <div className="af-card-icons">
              {row.cardActions.includes("edit") ? (
                <button type="button" aria-label={`Edit ${row.label}`} onClick={onEdit}>
                  <Icon name="edit" />
                </button>
              ) : null}
              {row.cardActions.includes("refresh") ? (
                <button type="button" aria-label={`Refresh ${row.label}`} onClick={onRefresh}>
                  <Icon name="refresh" />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="af-visit-headline">{meter.headline}</p>
      {meter.subline ? <p className="af-visit-subline">{meter.subline}</p> : null}

      {meter.periodLabel ? (
        <div className="af-visit-period">
          <span>
            {meter.periodLabel}
            <InfoGlyph />
          </span>
          <strong>{meter.periodValue}</strong>
        </div>
      ) : null}

      <div className="af-meter" role="img" aria-label={meter.headline}>
        {bands.map((band) => (
          <span
            key={band.label}
            className={`af-meter-fill swatch-${band.swatch}`}
            style={{ width: `${band.percent}%` }}
          />
        ))}
      </div>

      <div className="af-legend">
        {meter.legend.map((entry) => (
          <div key={entry.label} className="af-legend-row">
            <span className={`af-swatch swatch-${entry.swatch}`} aria-hidden="true" />
            <span className="af-legend-label">
              {entry.label}
              <InfoGlyph />
            </span>
            <strong>{entry.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Actions first — primary actions directly under patient information. */
export function AppointmentDrawerScreen({
  state,
  onToast,
  onClose,
  onViewNote,
  onCharge,
  onOverride,
  onPriorAuth,
  onSelectProvider,
  onEditVisitLimits,
  onEditAppointment,
  onCheckIn,
  onSendForms,
  onViewHistory,
  onViewSchedule,
  actionPlacement = "middle",
}: DrawerScreenProps) {
  const [openRows, setOpenRows] = useState<Record<string, boolean>>(() => buildOpenRows(state));
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const { patient, appointment } = state;

  useEffect(() => {
    setOpenRows(buildOpenRows(state));
    setHighlightedRowId(null);
    setMoreMenuOpen(false);
  }, [state.readiness]);

  useEffect(() => {
    if (!moreMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!moreMenuRef.current?.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMoreMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [moreMenuOpen]);

  function toggle(id: string) {
    setOpenRows((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function copy(label: string, value: string) {
    void navigator.clipboard?.writeText(value);
    onToast(`${label} copied`);
  }

  function runAction(label: string, rowLabel: string) {
    if (label.toLowerCase() === "send" && rowLabel === "Reminders/Forms") {
      onSendForms();
      return;
    }
    if (label.toLowerCase() === "charge") {
      onCharge();
      return;
    }
    if (label.toLowerCase() === "override") {
      onOverride();
      return;
    }
    if (label.toLowerCase() === "add" && rowLabel === "Referrals") {
      onSelectProvider();
      return;
    }
    onToast(`${label} · ${rowLabel}`);
  }

  function runVisitAction(label: string, row: VisitRow) {
    if (row.id === "prior-auth") {
      onPriorAuth();
      return;
    }
    if (row.id === "visit-limits") {
      onEditVisitLimits();
      return;
    }
    onToast(`${label} · ${row.label}`);
  }

  function jumpToSection(rowId: string) {
    setOpenRows((prev) => ({ ...prev, [rowId]: true }));
    setHighlightedRowId(rowId);
    window.requestAnimationFrame(() => {
      document.getElementById(`af-row-${rowId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
    window.setTimeout(() => {
      setHighlightedRowId((current) => (current === rowId ? null : current));
    }, 1600);
  }

  const balanceAttention = state.statusRows.find((row) => row.id === "balances");
  const formsAttention = state.statusRows.find((row) => row.id === "reminders-forms");

  const bottomActions = actionPlacement === "bottom";

  return (
    <div
      className={`af-screen${bottomActions ? " is-bottom-actions" : ""}${
        state.primaryActions === "ready"
          ? " is-ready-state"
          : state.primaryActions === "ready-to-check-in"
            ? " is-ready-to-check-in-state"
            : " is-not-ready-state"
      }`}
    >
      <div className="af-top">
        <header className="af-header">
          <h2>Appointment Detail Drawer</h2>
          <button type="button" className="af-icon-btn" aria-label="Close drawer" onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>

        <section className="af-patient">
          <div className="af-topline">
            <span className="af-time">{appointment.time}</span>
            <div className="af-topline-right">
              <div className="af-icon-cluster">
                <button
                  type="button"
                  className="af-icon-btn"
                  aria-label="Message patient"
                  onClick={() => onToast("Message patient")}
                >
                  <Icon name="mail" />
                </button>
                <div className="af-more-menu-wrap" ref={moreMenuRef}>
                  <button
                    type="button"
                    className="af-icon-btn"
                    aria-label="More actions"
                    aria-haspopup="menu"
                    aria-expanded={moreMenuOpen}
                    onClick={() => setMoreMenuOpen((open) => !open)}
                  >
                    <Icon name="more" />
                  </button>
                  {moreMenuOpen ? (
                    <div className="af-more-menu" role="menu">
                      {[
                        "Edit Appointment",
                        "Add Follow-Up",
                        "Undo Check-in",
                        "Cancel",
                        "Archive",
                        "No Show",
                        "Reschedule Appointment",
                        "See Schedule",
                      ].map((label) => (
                        <button
                          type="button"
                          role="menuitem"
                          key={label}
                          onClick={() => {
                            setMoreMenuOpen(false);
                            if (label === "Edit Appointment") {
                              onEditAppointment();
                            } else {
                              onToast(label);
                            }
                          }}
                        >
                          {label}
                        </button>
                      ))}
                      <div className="af-more-menu-divider" role="separator" />
                      {["View Transactions", "View Charges", "RCM Patient Profile"].map((label) => (
                        <button
                          type="button"
                          role="menuitem"
                          key={label}
                          onClick={() => {
                            setMoreMenuOpen(false);
                            onToast(label);
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="af-badges">
                <span className="af-badge">{appointment.status}</span>
                <span
                  className={`af-badge ${appointment.checkInStatus === "Checked In" ? "is-success" : "is-warning"}`}
                >
                  {appointment.checkInStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="af-identity">
            <button
              className="af-patient-name"
              type="button"
              title="Back to calendar"
              onClick={onClose}
            >
              <span className="af-patient-name-link">{patient.name}</span>
              <span className="af-patient-age">, {patient.age}</span>
            </button>
            <p className="af-meta-line">
              <span>{patient.dateOfBirth}</span>
              <span className="af-sep" aria-hidden="true">
                •
              </span>
              <span>{patient.gender}</span>
              <span className="af-sep" aria-hidden="true">
                •
              </span>
              <span className="af-meta-group">
                <span>
                  MRN: <span className="af-numeric-meta">{patient.mrn}</span>
                </span>
                <button
                  type="button"
                  className="af-icon-btn inline"
                  aria-label="Copy MRN"
                  onClick={() => copy("MRN", patient.mrn)}
                >
                  <Icon name="copy" />
                </button>
              </span>
            </p>
          </div>

          <div className="af-details">
            <p className="af-meta-line">
              <span>{appointment.reason}</span>
              <span className="af-sep" aria-hidden="true">
                •
              </span>
              <span>{appointment.type}</span>
              <span className="af-sep" aria-hidden="true">
                •
              </span>
              <span>{appointment.location}</span>
              <span className="af-sep" aria-hidden="true">
                •
              </span>
              <span className="af-meta-group">
                <span>{patient.phone}</span>
                <button
                  type="button"
                  className="af-icon-btn inline"
                  aria-label="Copy phone"
                  onClick={() => copy("Phone", patient.phone)}
                >
                  <Icon name="copy" />
                </button>
              </span>
            </p>
            <p className="af-provider">Supervising Provider: {appointment.supervisingProvider}</p>
          </div>
        </section>

        {state.primaryActions === "ready" ? (
          !bottomActions ? (
            <section className="af-actions">
              <button className="af-btn-secondary" type="button" onClick={onEditAppointment}>
                Edit
              </button>
              <button className="af-btn-primary" type="button" onClick={onViewNote}>
                View Note
              </button>
            </section>
          ) : null
        ) : state.primaryActions === "ready-to-check-in" ? (
          <section className="af-attention af-ready-check-in" aria-label="Ready to check in">
            <div className="af-attention-heading">
              <Icon name="check" />
              <span>Ready for check in</span>
            </div>
            {!bottomActions ? (
              <div className="af-actions nested">
                <button className="af-btn-secondary" type="button" onClick={onEditAppointment}>
                  Edit
                </button>
                <button className="af-btn-primary" type="button" onClick={onCheckIn}>
                  Check In
                </button>
              </div>
            ) : null}
          </section>
        ) : (
          <section className="af-attention" aria-label="Items to review before check in">
            <div className="af-attention-heading">
              <Icon name="close" />
              <span>Not ready for check in</span>
            </div>

            <div className="af-attention-list">
              {balanceAttention ? (
                <button
                  type="button"
                  className="af-attention-row"
                  onClick={() => jumpToSection("balances")}
                >
                  <span className="af-attention-label">Balances</span>
                  <div className="af-row-right">
                    <RowStatus
                      value={balanceAttention.value}
                      tone={balanceAttention.tone}
                      statusIcon={balanceAttention.statusIcon}
                    />
                    {balanceAttention.actions?.map((action) => (
                      <ActionPill
                        key={action.label}
                        action={action}
                        onClick={() => runAction(action.label, "Balances")}
                      />
                    ))}
                  </div>
                </button>
              ) : null}

              {formsAttention ? (
                <button
                  type="button"
                  className="af-attention-row"
                  onClick={() => jumpToSection("reminders-forms")}
                >
                  <span className="af-attention-label">Reminders/Forms</span>
                  <div className="af-row-right">
                    <RowStatus
                      value={formsAttention.value}
                      tone={formsAttention.tone}
                      statusIcon={formsAttention.statusIcon}
                    />
                    {formsAttention.actions?.map((action) => (
                      <ActionPill
                        key={action.label}
                        action={action}
                        onClick={() => runAction(action.label, "Reminders/Forms")}
                      />
                    ))}
                  </div>
                </button>
              ) : null}
            </div>

            {!bottomActions ? (
              <div className="af-actions nested">
                <button className="af-btn-secondary" type="button" onClick={onEditAppointment}>
                  Edit
                </button>
                <button className="af-btn-primary" type="button" onClick={onCheckIn}>
                  Check In
                </button>
              </div>
            ) : null}
          </section>
        )}
      </div>

      {bottomActions && state.primaryActions === "ready" ? (
        <div className="af-section-rule" aria-hidden="true" />
      ) : null}

      <div className="af-status-visits">
        <section className="af-section">
          <div className="af-section-title-row">
            <h3>Status</h3>
            <div className="af-section-badge-group">
              <button
                type="button"
                className="af-section-glyph-btn"
                aria-label="View appointment change history"
                onClick={onViewHistory}
              >
                <Icon name="history" className="af-section-glyph" />
              </button>
              <span className={`af-section-badge tone-${state.statusBadge.tone}`}>
                {state.statusBadge.tone === "attention" ? <Icon name="warning" /> : null}
                {state.statusBadge.label}
              </span>
            </div>
          </div>
          <p className="af-section-sub">{state.statusSubtitle}</p>

          <div className="af-rows">
            {state.statusRows.map((row) => {
              const isOpen = Boolean(openRows[row.id]);
              return (
                <div
                  key={row.id}
                  id={`af-row-${row.id}`}
                  className={`af-row${isOpen ? " is-open" : ""}${highlightedRowId === row.id ? " is-targeted" : ""}`}
                >
                  <div className="af-row-main">
                    <button
                      className="af-row-toggle"
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => toggle(row.id)}
                    >
                      <span>{row.label}</span>
                      <Icon name="chevron" />
                    </button>
                    <div className="af-row-right">
                      {row.value ? (
                        <RowStatus value={row.value} tone={row.tone} statusIcon={row.statusIcon} />
                      ) : null}
                      {row.meta ? <span className="af-row-meta">{row.meta}</span> : null}
                      {row.actions?.map((action) => (
                        <ActionPill
                          key={action.label}
                          action={action}
                          onClick={() => runAction(action.label, row.label)}
                        />
                      ))}
                    </div>
                  </div>
                  {isOpen ? <ExpandedStatus row={row} onSendForms={onSendForms} /> : null}
                </div>
              );
            })}
          </div>
        </section>

        <div className="af-section-rule" aria-hidden="true" />

        <section className="af-section af-visits-section">
          <div className="af-section-title-row">
            <h3>Visits</h3>
            <div className="af-section-badge-group">
              <button
                type="button"
                className="af-section-glyph-btn"
                aria-label="View schedule"
                onClick={onViewSchedule}
              >
                <Icon name="calendar" className="af-section-glyph" />
              </button>
              <span className={`af-section-badge tone-${state.visitsBadge.tone}`}>
                {state.visitsBadge.tone === "attention" ? <Icon name="warning" /> : null}
                {state.visitsBadge.label}
              </span>
            </div>
          </div>
          <p className="af-section-sub">{state.visitsSubtitle}</p>

          <div className="af-rows">
            {state.visitRows.map((row) => {
              const isOpen = Boolean(openRows[row.id]);
              return (
                <div
                  key={row.id}
                  id={`af-row-${row.id}`}
                  className={`af-row${isOpen ? " is-open" : ""}${highlightedRowId === row.id ? " is-targeted" : ""}`}
                >
                  <div className="af-row-main">
                    <button
                      className="af-row-toggle"
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => toggle(row.id)}
                    >
                      <span>{row.label}</span>
                      <Icon name="chevron" />
                    </button>
                    <div className="af-row-right">
                      <RowStatus value={row.value} tone={row.tone} statusIcon={row.statusIcon} />
                      {row.actions?.map((action) => (
                        <ActionPill
                          key={action.label}
                          action={action}
                          onClick={() => runVisitAction(action.label, row)}
                        />
                      ))}
                    </div>
                  </div>
                  {isOpen && row.meter ? (
                    <div className="af-expanded">
                      <VisitMeterCard
                        row={row}
                        onEdit={() =>
                          row.id === "prior-auth" ? onPriorAuth() : onEditVisitLimits()
                        }
                        onRefresh={() => onToast(`Refreshed · ${row.label}`)}
                      />
                    </div>
                  ) : null}
                  {isOpen && !row.meter && row.details?.length ? (
                    <div className="af-expanded">
                      <div className="af-card">
                        {row.id === "progress-note-alerts" ? (
                          <div className="af-alert-list">
                            {row.details.map((detail) => (
                              <div key={detail.label} className="af-alert-item">
                                <span className="af-alert-icon" aria-hidden="true">
                                  i
                                </span>
                                <p className="af-alert-copy">
                                  <strong>{detail.label}:</strong> {detail.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="af-kv-list af-kv-info">
                            {row.details.map((detail) => (
                              <div key={detail.label}>
                                <span>
                                  {detail.label}
                                  <InfoGlyph />
                                </span>
                                <strong>{detail.value}</strong>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {bottomActions ? (
        <footer className="af-bottom-actions">
          {state.primaryActions === "ready" ? (
            <>
              <button className="af-btn-primary" type="button" onClick={onViewNote}>
                View Note
              </button>
              <button className="af-btn-secondary" type="button" onClick={onEditAppointment}>
                Edit
              </button>
            </>
          ) : (
            <>
              <button className="af-btn-primary" type="button" onClick={onCheckIn}>
                Check In
              </button>
              <button className="af-btn-secondary" type="button" onClick={onEditAppointment}>
                Edit
              </button>
            </>
          )}
        </footer>
      ) : null}
    </div>
  );
}
