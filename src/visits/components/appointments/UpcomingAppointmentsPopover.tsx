import { useEffect, useMemo } from "react";
import "./upcoming-appointments.css";

interface UpcomingAppointmentsPopoverProps {
  patientName: string;
  provider: string;
  facility: string;
  onClose: () => void;
  onPrint: () => void;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface UpcomingVisit {
  date: string;
  dayOfWeek: string;
  startTime: string;
}

/** The recurring plan of care is Tuesdays at 12:00 PM and Thursdays at 12:10 PM. */
function buildUpcomingVisits(): UpcomingVisit[] {
  const visits: UpcomingVisit[] = [];
  const cursor = new Date(2026, 7, 11);
  const end = new Date(2026, 9, 1);

  while (cursor <= end) {
    const day = cursor.getDay();
    visits.push({
      date: `${String(cursor.getMonth() + 1).padStart(2, "0")}/${String(
        cursor.getDate(),
      ).padStart(2, "0")}/${cursor.getFullYear()}`,
      dayOfWeek: DAY_NAMES[day],
      startTime: day === 2 ? "12:00 PM" : "12:10 PM",
    });
    cursor.setDate(cursor.getDate() + (day === 2 ? 2 : 5));
  }

  return visits;
}

export function UpcomingAppointmentsPopover({
  patientName,
  provider,
  facility,
  onClose,
  onPrint,
}: UpcomingAppointmentsPopoverProps) {
  const visits = useMemo(buildUpcomingVisits, []);

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
      className="upcoming-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="upcoming-popover"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upcoming-title"
      >
        <header className="upcoming-header">
          <h2 id="upcoming-title">Appointments</h2>
          <button type="button" className="upcoming-print" aria-label="Print" onClick={onPrint}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M6 7.5V3.5h8v4M6 14.5H4.5v-5h11v5H14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <rect
                x="6"
                y="12"
                width="8"
                height="4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
          </button>
        </header>

        <div className="upcoming-body">
          <p className="upcoming-subtitle">{patientName} Upcoming Appointments</p>

          <div className="upcoming-table-wrap">
            <table className="upcoming-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day of Week</th>
                  <th>Start Time</th>
                  <th>Provider</th>
                  <th>Facility</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((visit) => (
                  <tr key={visit.date}>
                    <td>{visit.date}</td>
                    <td>{visit.dayOfWeek}</td>
                    <td>{visit.startTime}</td>
                    <td>{provider}</td>
                    <td>{facility}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
