import { useId, useState } from "react";
import type { StatusRow } from "../../types/prototype";

interface StatusSectionProps {
  rows: StatusRow[];
  readinessLabel: string;
  lastChanged: string;
  showInlineAlerts?: boolean;
  title?: string;
  onRowAction?: (label: string, row: StatusRow) => void;
}

export function StatusSection({
  rows,
  readinessLabel,
  lastChanged,
  showInlineAlerts = false,
  title = "Status",
  onRowAction,
}: StatusSectionProps) {
  const baseId = useId();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <section className="section status-section">
      <div className="section-heading">
        <h3 className="section-title">{title}</h3>
        <span className={`section-state${readinessLabel.includes("Not") ? " is-warning" : " is-success"}`}>
          {readinessLabel}
        </span>
      </div>
      <p className="section-subtitle">Last change: {lastChanged}</p>
      <dl className="detail-list">
        {rows.map((row) => {
          const controlsId = `${baseId}-${row.id}`;
          const isOpen = Boolean(expanded[row.id]);
          const highlight = showInlineAlerts && row.unresolved;

          return (
            <div
              key={row.id}
              className={`detail-row expandable-detail-row${highlight ? " is-unresolved" : ""}`}
            >
              <dt>
                <button
                  className="row-toggle"
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={controlsId}
                  onClick={() => setExpanded((prev) => ({ ...prev, [row.id]: !prev[row.id] }))}
                >
                  <span>{row.label}</span>
                  <svg aria-hidden="true" viewBox="0 0 20 20">
                    <path d="M7 8l3 3 3-3" />
                  </svg>
                </button>
              </dt>
              <dd>
                <span className={`detail-value ${row.tone}`}>
                  {row.statusIcon === "check" ? (
                    <svg className="status-icon" aria-hidden="true" viewBox="0 0 20 20">
                      <path d="M4 10l4 4 8-8" />
                    </svg>
                  ) : null}
                  {row.value}
                </span>
                {row.id === "balances" ? (
                  <button
                    className="inline-icon-button"
                    type="button"
                    aria-label="Open charge override"
                    onClick={() => onRowAction?.("Override", row)}
                  >
                    <svg aria-hidden="true" viewBox="0 0 20 20">
                      <path d="M15.5 6.5V3.8l-2 2A6 6 0 1 0 16 11" />
                    </svg>
                  </button>
                ) : null}
                {row.actions?.map((action) => (
                  <button
                    key={action.label}
                    className="minimal-button"
                    type="button"
                    onClick={() => onRowAction?.(action.label, row)}
                  >
                    {action.label}
                  </button>
                ))}
              </dd>
              {isOpen ? (
                <div className="row-expanded-content" id={controlsId}>
                  {row.plans?.map((plan) => (
                    <div key={plan.priority} className="expanded-card">
                      <div className="expanded-card-header">
                        <strong>
                          {plan.priority}: {plan.payerName}
                        </strong>
                        <span className={`detail-value ${plan.tone}`}>{plan.status}</span>
                      </div>
                      {plan.message ? <p className="expanded-message">{plan.message}</p> : null}
                      <dl className="expanded-grid">
                        <div>
                          <dt>Last run</dt>
                          <dd>{plan.lastRun}</dd>
                        </div>
                        <div>
                          <dt>Remaining visits</dt>
                          <dd>{plan.remainingVisits}</dd>
                        </div>
                        <div>
                          <dt>Policy</dt>
                          <dd>{plan.policyNumber}</dd>
                        </div>
                        <div>
                          <dt>Provider</dt>
                          <dd>{plan.provider}</dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                  {row.forms?.map((form) => (
                    <div key={form.name} className="expanded-form-row">
                      <span>{form.name}</span>
                      <span>{form.sent}</span>
                      <span className={`detail-value ${form.tone}`}>{form.status}</span>
                    </div>
                  ))}
                  {row.details?.map((detail) => (
                    <div key={detail.label} className="expanded-detail-row">
                      <span>{detail.label}</span>
                      <strong>{detail.value}</strong>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </dl>
    </section>
  );
}
