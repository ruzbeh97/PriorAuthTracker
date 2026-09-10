import { useEffect } from "react";
import "./appointment-history.css";

interface HistoryEntry {
  date: string;
  time: string;
  field: string;
  changedBy: string;
  from: string;
  to: string;
}

const HISTORY: HistoryEntry[] = [
  {
    date: "Mon Aug 3",
    time: "10:48AM",
    field: "Status",
    changedBy: "Joanna Ye",
    from: "Checked In",
    to: "Scheduled",
  },
  {
    date: "Mon Aug 3",
    time: "10:46AM",
    field: "Status",
    changedBy: "Joanna Ye",
    from: "Scheduled",
    to: "Checked In",
  },
  {
    date: "Mon Aug 3",
    time: "10:42AM",
    field: "Rendering Provider",
    changedBy: "Joanna Ye",
    from: "Remus Lupin",
    to: "Joanna Ye",
  },
  {
    date: "Mon Aug 3",
    time: "10:40AM",
    field: "Schedule",
    changedBy: "Joanna Ye",
    from: "08/03/2026 02:00 PM → 08/03/2026 02:30 PM",
    to: "08/03/2026 11:00 AM → 08/03/2026 11:30 AM",
  },
  {
    date: "Mon Aug 3",
    time: "10:36AM",
    field: "Rendering Provider",
    changedBy: "Joanna Ye",
    from: "Joanna Ye",
    to: "Remus Lupin",
  },
];

interface AppointmentHistoryDrawerProps {
  onClose: () => void;
}

export function AppointmentHistoryDrawer({ onClose }: AppointmentHistoryDrawerProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="history-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <aside
        className="history-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
      >
        <header className="history-header">
          <h2 id="history-title">Appointment Change History</h2>
          <button type="button" className="history-close" aria-label="Close" onClick={onClose}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </header>

        <div className="history-body">
          <div className="history-section-title">
            <span className="history-section-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20">
                <path
                  d="M4 10a6 6 0 1 0 1.8-4.3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path d="M4 4v3h3" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="M10 7v3.3l2.2 1.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </span>
            <span>Changes Timeline</span>
          </div>

          <ol className="history-timeline">
            {HISTORY.map((entry, index) => (
              <li key={index} className="history-entry">
                <div className="history-when">
                  <span>{entry.date}</span>
                  <span>{entry.time}</span>
                </div>
                <div className="history-track" aria-hidden="true">
                  <span className="history-dot" />
                  {index < HISTORY.length - 1 ? <span className="history-line" /> : null}
                </div>
                <div className="history-detail">
                  <p className="history-field">{entry.field}</p>
                  <p className="history-by">
                    Changed by <strong>{entry.changedBy}</strong>
                  </p>
                  <p className="history-change">
                    Changed from <span className="history-from">{entry.from}</span> to{" "}
                    <span className="history-to">{entry.to}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}
