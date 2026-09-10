import type { AlertItem } from "../../types/prototype";

interface AlertRowProps {
  alert: AlertItem;
  onAction: (alert: AlertItem) => void;
}

function AlertIcon({ icon }: { icon: AlertItem["icon"] }) {
  if (icon === "currency") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20">
        <path d="M10 2v16M13 5.5c-.7-.7-1.7-1-3-1-1.8 0-3 .9-3 2.3 0 3.4 6 1.7 6 5.4 0 1.4-1.2 2.3-3 2.3-1.3 0-2.5-.4-3.3-1.2" />
      </svg>
    );
  }
  if (icon === "forms") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20">
        <path d="M5 3h7l3 3v11H5V3zm7 0v3h3" />
      </svg>
    );
  }
  if (icon === "notes") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20">
        <path d="M4 3h12v14H4V3zm3 4h6M7 10h6M7 13h4" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M10 3l8 14H2L10 3zm0 5v4M10 14h.01" />
    </svg>
  );
}

export function AlertRow({ alert, onAction }: AlertRowProps) {
  return (
    <div
      className={`alert-row severity-${alert.severity}${alert.blocking ? " is-blocking" : ""}`}
      role="status"
      aria-label={`${alert.severity} alert: ${alert.title}`}
    >
      <span className="alert-row-icon" aria-hidden="true">
        <AlertIcon icon={alert.icon} />
      </span>
      <div className="alert-row-copy">
        <strong>{alert.title}</strong>
        <span>{alert.description}</span>
        <span className="alert-severity-label">
          {alert.blocking ? "Blocking" : alert.severity === "informational" ? "Informational" : "Non-blocking"}
        </span>
      </div>
      <button className="alert-row-action" type="button" onClick={() => onAction(alert)}>
        <span>{alert.actionLabel}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M8 5l5 5-5 5" />
        </svg>
      </button>
    </div>
  );
}

interface AlertListProps {
  alerts: AlertItem[];
  onAction: (alert: AlertItem) => void;
  compact?: boolean;
}

export function AlertList({ alerts, onAction, compact = false }: AlertListProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className={`alert-list${compact ? " is-compact" : ""}`}>
      {alerts.map((alert) => (
        <AlertRow key={alert.id} alert={alert} onAction={onAction} />
      ))}
    </div>
  );
}
