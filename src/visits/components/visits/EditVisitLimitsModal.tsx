import { useEffect, useState } from "react";
import "./edit-visit-limits.css";

interface EditVisitLimitsModalProps {
  onClose: () => void;
  onSave: () => void;
}

export function EditVisitLimitsModal({ onClose, onSave }: EditVisitLimitsModalProps) {
  const [customStartDate, setCustomStartDate] = useState(false);

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
      className="visit-limits-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section className="visit-limits-modal" role="dialog" aria-modal="true" aria-labelledby="visit-limits-title">
        <header>
          <h2 id="visit-limits-title">Create Total Annual Visits / Plan Year Start</h2>
        </header>

        <div className="visit-limits-form">
          <label className="visit-limits-field">
            <span>Service Type *</span>
            <select aria-label="Service Type" defaultValue=""><option value=""> </option></select>
          </label>
          <label className="visit-limits-field">
            <span>Total Annual Visits *</span>
            <input aria-label="Total Annual Visits" inputMode="numeric" />
          </label>

          <label className="custom-date-toggle">
            <span>Use Custom Plan Year Start Date</span>
            <input
              type="checkbox"
              checked={customStartDate}
              onChange={(event) => setCustomStartDate(event.target.checked)}
            />
            <i aria-hidden="true" />
          </label>

          <div className="default-plan-date">
            <span aria-hidden="true">□</span>
            <p>
              {customStartDate ? "Select custom plan year start date" : "Using default plan year start date: 01/01/2026"}
            </p>
          </div>
        </div>

        <footer>
          <button type="button" className="visit-limits-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="visit-limits-save" onClick={onSave}>Save</button>
        </footer>
      </section>
    </div>
  );
}
