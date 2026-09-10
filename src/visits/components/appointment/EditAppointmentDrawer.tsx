import "./edit-appointment.css";

interface EditAppointmentDrawerProps {
  onClose: () => void;
  onUpdate: () => void;
}

const days = Array.from({ length: 31 }, (_, index) => index + 1);

export function EditAppointmentDrawer({ onClose, onUpdate }: EditAppointmentDrawerProps) {
  return (
    <div className="edit-appointment-overlay">
      <section className="edit-appointment-drawer" role="dialog" aria-modal="true" aria-labelledby="edit-appointment-title">
        <header>
          <h2 id="edit-appointment-title">Edit Appointment</h2>
          <div>
            <button type="button" aria-label="Open calendar">▦</button>
            <button type="button" className="edit-appointment-close" aria-label="Close edit appointment" onClick={onClose}>×</button>
          </div>
        </header>

        <div className="edit-appointment-content">
          <div className="appointment-hours-warning">
            <span aria-hidden="true">△</span>
            <p>This appointment is outside of Remus Lupin’s working hours.</p>
          </div>

          <div className="edit-appointment-grid">
            <label>
              <span>Rendering Provider *</span>
              <select defaultValue="Remus Lupin"><option>Remus Lupin</option></select>
            </label>
            <label>
              <span>Patient *</span>
              <select defaultValue="Harry Potter"><option>Harry Potter</option></select>
            </label>
            <label className="is-disabled">
              <span>Appointment Type *</span>
              <select defaultValue="Follow up" disabled><option>Follow up</option></select>
            </label>
            <label>
              <span>Facility *</span>
              <select defaultValue="Precision"><option>Precision</option></select>
            </label>
            <label className="edit-appointment-case">
              <span>Case *</span>
              <select defaultValue="S/P LT SHOULDER"><option>S/P LT SHOULDER</option></select>
            </label>
          </div>

          <section className="appointment-calendar">
            <div className="appointment-calendar-head">
              <button type="button">July 2026 <span>⌄</span></button>
              <div>
                <button type="button" aria-label="Previous month">‹</button>
                <button type="button" aria-label="Next month">›</button>
              </div>
              <span>7:00 AM</span>
            </div>
            <div className="appointment-calendar-body">
              <div className="appointment-weekdays">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
              </div>
              <div className="appointment-days">
                <i /><i /><i />
                {days.map((day) => <button type="button" className={day === 21 ? "is-selected" : undefined} key={day}>{day}</button>)}
              </div>
            </div>
          </section>

          <label className="edit-appointment-time">
            <span>Time</span>
            <input defaultValue="7:00 AM" />
          </label>
        </div>

        <footer>
          <div>
            <button type="button" className="edit-update" onClick={onUpdate}>Update</button>
            <button type="button" className="edit-cancel" onClick={onClose}>Cancel</button>
          </div>
          <label>
            <input type="checkbox" />
            Override Provider Credentialing Validation
            <span aria-label="More information">ⓘ</span>
          </label>
        </footer>
      </section>
    </div>
  );
}
