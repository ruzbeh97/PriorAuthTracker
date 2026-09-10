import type { ReactNode } from "react";
import "./clinical-note.css";

interface ClinicalNotePageProps {
  headerActions?: ReactNode;
  onBack: () => void;
  onToast: (message: string) => void;
}

const clinicalSections = [
  "Patient Forms",
  "Functional Outcomes",
  "Cognitive-Communication",
  "David's Template",
  "Measurements",
  "Vitals",
  "Medications",
  "Health Status",
  "Objective Findings",
  "Diagnosis",
  "Allergies",
  "Labs",
  "Treatment Justification (KX Modifiers)",
  "Plan of Care",
  "Goals",
  "Flowsheet",
];

const chartTabs = [
  "Demographics",
  "Appointments",
  "Attachments",
  "Tasks",
  "Medications",
  "Allergies",
  "Vitals",
  "Immunizations",
  "Problem List",
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="9" cy="9" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="m13 13 3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function SideNavigation() {
  return (
    <aside className="note-side-navigation" aria-label="Primary navigation">
      <div className="note-brand">
        <span aria-hidden="true">⌁</span>
        Air
      </div>
      <nav>
        <section>
          <h2>◉ EHR <span>⌃</span></h2>
          {["Calendar", "Patients", "Inbox", "Preferences", "Interventions", "Pharmacy Requests", "Orders"].map((item) => (
            <a href="#" key={item}>{item}</a>
          ))}
        </section>
        <section>
          <h2>◇ Insights <span>⌃</span></h2>
          {["Overview", "Performance Analysis", "Revenue Analysis", "Denials Analysis", "A/R Report", "EHR Reports", "My Reports", "AI Report Builder", "Remittances Audit"].map((item) => (
            <a href="#" key={item}>{item}</a>
          ))}
        </section>
        <section>
          <h2>▣ Daily Operations <span>⌃</span></h2>
          <a href="#">Onboarding Form</a>
          <a href="#" className="is-muted">Appointments (New)</a>
        </section>
      </nav>
      <div className="note-nav-footer">
        <a href="#">▦ &nbsp; Practice Data</a>
        <div><span>JY</span><button type="button" aria-label="Help">?</button></div>
      </div>
    </aside>
  );
}

function ProductBar({ headerActions }: { headerActions?: ReactNode }) {
  return (
    <div className="note-product-bar">
      <button type="button" aria-label="Toggle navigation">◧</button>
      <label>
        <SearchIcon />
        <input type="search" placeholder="Global Search" aria-label="Global search" />
        <kbd>⌘K</kbd>
      </label>
      <div className="note-product-actions">
        {headerActions}
        <button type="button" className="note-ai-button">✦ Athelas AI</button>
      </div>
    </div>
  );
}

export function ClinicalNotePage({ headerActions, onBack, onToast }: ClinicalNotePageProps) {
  return (
    <div className="clinical-note-page">
      <SideNavigation />
      <main className="clinical-note-main">
        <ProductBar headerActions={headerActions} />

        <header className="patient-chart-header">
          <div className="patient-chart-topline">
            <div className="patient-chart-identity">
              <span className="patient-chart-avatar">H</span>
              <strong>Harry Potter</strong>
              <span>(MRN: 1327813, DOB: 01/01/1995)</span>
              <button type="button" aria-label="Patient menu">⌄</button>
              <button type="button" aria-label="Copy patient details">▢</button>
              <button type="button" aria-label="Patient documents">▣</button>
              <button type="button" aria-label="Print">▤</button>
            </div>
            <div className="patient-chart-actions">
              <button type="button" aria-label="History">↶</button>
              <button type="button" aria-label="Flag">⚑</button>
              <button type="button" className="book-appointment">▣ Book Appointment</button>
            </div>
          </div>

          <div className="patient-chart-tabs">
            <button type="button" aria-label="Back" onClick={onBack}>‹</button>
            {chartTabs.map((tab) => (
              <button
                type="button"
                key={tab}
                className={tab === "Appointments" ? "is-active" : undefined}
                onClick={tab === "Appointments" ? onBack : undefined}
              >
                {tab}
              </button>
            ))}
            <span className="chart-tab-count">0</span>
            <button type="button" aria-label="More tabs">›</button>
            <button type="button" aria-label="Open chart">▭</button>
            <button type="button" aria-label="Pin">⌖</button>
            <button type="button" aria-label="Tools">♧</button>
            <button type="button" aria-label="Messages">▰</button>
          </div>
        </header>

        <div className="encounter-toolbar">
          <div>
            <button type="button" onClick={onBack}>All Appointments</button>
            <span>›</span>
            <strong>Harry Potter</strong>
          </div>
          <div>
            <button type="button">View Encounter</button>
            <button type="button">View Claim</button>
            <button type="button">⇧ Import</button>
            <button type="button">◴ View Change History</button>
          </div>
        </div>

        <section className="encounter-summary">
          <div className="encounter-title-row">
            <h1>Broken Head</h1>
            <span>07/21/2026 - 07:00 AM</span>
            <label>Appointment Type<select defaultValue="129 Knee Test"><option>129 Knee Test</option></select></label>
            <label>Clinical Note Type<select defaultValue="Initial Evaluation"><option>Initial Evaluation</option></select></label>
            <label>ONC Clinical Note Type<select defaultValue=""><option value=""> </option></select></label>
          </div>
          <div className="encounter-metadata">
            <span>Plan of Care End Date: <strong>10/18/2026</strong></span>
            <span>Pending Visits: <strong>23</strong></span>
            <span>Prior Auth: <strong className="is-danger">No Auth</strong></span>
            <span>Primary Insurance: <strong>VERMONT MEDICARE</strong></span>
            <span>Gender: <strong>M</strong></span>
            <span>Age: <strong>31</strong></span>
            <button type="button">⌃ Expand</button>
          </div>
        </section>

        <div className="clinical-note-workspace">
          <aside className="clinical-section-nav">
            {clinicalSections.map((section, index) => (
              <button type="button" key={section} className={index === 0 ? "is-active" : undefined}>
                {section}
              </button>
            ))}
          </aside>

          <article className="clinical-note-content">
            <div className="section-picker">
              <label>Select Sections<input type="search" placeholder="Search Sections" /></label>
              <button type="button" disabled>＋ Add Sections</button>
            </div>

            <section>
              <h2>Patient Forms</h2>
              <p className="empty-state">No patient forms available.</p>
            </section>

            <section>
              <h2>Functional Outcomes</h2>
              <p className="empty-state">No functional outcome forms available. Please add a functional outcome form to view its history in this case.</p>
            </section>

            <section>
              <div className="clinical-heading-row">
                <h2>Cognitive-Communication</h2>
                <span>◷ Last updated: 07/21/2026 02:36 PM</span>
              </div>
              <div className="clinical-fields">
                <div><strong>Attention</strong><span>Add here...</span><small>·</small></div>
                <div><strong>Following Directions</strong><span>Add here...</span><small>·</small></div>
                <div><strong>Problem Solving</strong><span>Add here...</span><small>·</small></div>
              </div>
            </section>
          </article>
        </div>

        <div className="signed-note-banner" role="status">
          <div>
            <strong>This note has been signed.</strong>
            <span>To make changes, add an addendum.</span>
          </div>
          <button type="button" onClick={() => onToast("Add addendum")}>✎ &nbsp; Add Addendum</button>
        </div>
      </main>
    </div>
  );
}
