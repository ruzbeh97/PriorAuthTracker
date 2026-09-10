import type { AppointmentPrototypeState } from "../../types/prototype";

interface PatientSummaryProps {
  state: AppointmentPrototypeState;
  variant: "compact" | "properties" | "essentials";
  onCopyMrn: () => void;
  onCopyPhone: () => void;
}

export function PatientSummary({ state, variant, onCopyMrn, onCopyPhone }: PatientSummaryProps) {
  const { patient, appointment, readinessLabel, readiness } = state;

  if (variant === "properties") {
    return (
      <section className="patient-summary inset-rule properties-summary">
        <div className="summary-title-row">
          <button className="patient-name" type="button">
            {patient.name}
            <span>, {patient.age}</span>
          </button>
          <span className={`readiness-chip ${readiness}`}>{readinessLabel}</span>
        </div>
        <p className="summary-subtitle">
          {appointment.date} · {appointment.time}
        </p>
        <div className="summary-properties">
          <p className="summary-properties-heading">Properties</p>
          <div className="summary-property">
            <span className="summary-property-label">Appointment</span>
            <span className="summary-property-value">
              {appointment.type} · {appointment.reason}
              <span className="badge">{appointment.status}</span>
            </span>
          </div>
          <div className="summary-property">
            <span className="summary-property-label">Patient</span>
            <span className="summary-property-value">
              DOB {patient.dateOfBirth} ·{" "}
              <button className="text-button" type="button" onClick={onCopyPhone}>
                {patient.phone}
              </button>
            </span>
          </div>
          <div className="summary-property">
            <span className="summary-property-label">MRN</span>
            <span className="summary-property-value">
              <button className="text-button" type="button" onClick={onCopyMrn}>
                {patient.mrn}
              </button>
            </span>
          </div>
          <div className="summary-property">
            <span className="summary-property-label">Supervising provider</span>
            <span className="summary-property-value">{appointment.supervisingProvider}</span>
          </div>
        </div>
      </section>
    );
  }

  if (variant === "essentials") {
    return (
      <section className="patient-summary inset-rule essentials-summary">
        <div className="summary-title-row">
          <div className="summary-identity">
            <button className="patient-name" type="button">
              {patient.name}
              <span>, {patient.age}</span>
            </button>
            <span className={`readiness-chip ${readiness}`}>{readinessLabel}</span>
          </div>
        </div>
        <p className="summary-subtitle">
          {appointment.date.replace(/,\s*\d{4}$/, "")} · {appointment.time}
        </p>
        <p className="summary-appointment-context">
          {appointment.type} · {appointment.reason}
        </p>
        <div className="summary-essentials">
          <div className="summary-essential">
            <span className="summary-essential-label">Date of birth</span>
            <span className="summary-essential-value">{patient.dateOfBirth}</span>
          </div>
          <div className="summary-essential">
            <span className="summary-essential-label">Phone</span>
            <button className="summary-essential-value text-button" type="button" onClick={onCopyPhone}>
              {patient.phone}
            </button>
          </div>
          <div className="summary-essential">
            <span className="summary-essential-label">MRN</span>
            <button className="summary-essential-value text-button" type="button" onClick={onCopyMrn}>
              {patient.mrn}
            </button>
          </div>
          <div className="summary-essential">
            <span className="summary-essential-label">Supervising provider</span>
            <span className="summary-essential-value">{appointment.supervisingProvider}</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="patient-summary compact-summary">
      <div className="summary-topline">
        <span className="appointment-time">
          {appointment.date} · {appointment.time}
        </span>
        <span className={`readiness-chip ${readiness}`}>{readinessLabel}</span>
      </div>
      <button className="patient-name" type="button">
        {patient.name}
        <span>, {patient.age}</span>
      </button>
      <p className="patient-dob">DOB {patient.dateOfBirth}</p>
      <p className="appointment-meta">
        {appointment.type} · {appointment.reason} ·{" "}
        <button className="text-button" type="button" onClick={onCopyPhone}>
          {patient.phone}
        </button>
      </p>
      <p className="provider-meta">
        MRN{" "}
        <button className="text-button" type="button" onClick={onCopyMrn}>
          {patient.mrn}
        </button>{" "}
        · Supervising provider: {appointment.supervisingProvider}
      </p>
    </section>
  );
}
