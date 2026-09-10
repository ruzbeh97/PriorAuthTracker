import { useId, useState } from "react";
import type { VisitRow } from "../../types/prototype";

interface VisitsSectionProps {
  rows: VisitRow[];
  title?: string;
  onRowAction?: (label: string, row: VisitRow) => void;
}

export function VisitsSection({ rows, title = "Visits", onRowAction }: VisitsSectionProps) {
  const baseId = useId();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <section className="section visits-section">
      <div className="section-heading">
        <h3 className="section-title">{title}</h3>
      </div>
      <dl className="detail-list">
        {rows.map((row) => {
          const controlsId = `${baseId}-${row.id}`;
          const isOpen = Boolean(expanded[row.id]);
          return (
            <div key={row.id} className="detail-row expandable-detail-row">
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
                  {row.value}
                  {typeof row.alertCount === "number" && row.alertCount > 0
                    ? ` · ${row.alertCount} ${row.alertCount === 1 ? "alert" : "alerts"}`
                    : ""}
                </span>
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
