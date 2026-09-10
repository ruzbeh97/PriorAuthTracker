import './PreferencesSidebar.css'

const PREFERENCE_SECTIONS = [
  {
    label: 'General',
    items: ['Alert Rules', 'Appointment Types', 'Calendar', 'General', 'Marketing', 'Tags'],
  },
  {
    label: 'Clinical',
    items: ['Chart Note', 'Facesheets', 'ICD10', 'Measurements', 'Order Sets', 'Rooms', 'Text Snippets'],
    activeItem: 'Text Snippets',
  },
  {
    label: 'Administrative',
    items: ['Faxing', 'Kiosk Configs', 'Portal Configs', 'Tasks', 'Prior Authorization Tracker'],
  },
  {
    label: 'Billing & Orders',
    items: ['Codes', 'Insurance'],
  },
  {
    label: 'Users & Access',
    items: ['Provider', 'User Groups'],
  },
]

interface PreferencesSidebarProps {
  onClose: () => void
}

function PreferencesSidebar({ onClose }: PreferencesSidebarProps) {
  return (
    <div className="preferences-sidebar">
      <div className="preferences-sidebar-header">
        <button className="preferences-back-btn" aria-label="Back" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect width="20" height="20" rx="4" fill="#F3F4F6"/>
            <path d="M12 6L8 10L12 14" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="preferences-sidebar-title">Preferences</span>
      </div>

      <div className="preferences-sidebar-sections">
        {PREFERENCE_SECTIONS.map(section => (
          <div key={section.label} className="pref-section">
            <div className="pref-section-label">{section.label}</div>
            <ul className="pref-section-items">
              {section.items.map(item => (
                <li
                  key={item}
                  className={`pref-item ${'activeItem' in section && section.activeItem === item ? 'active' : ''}`}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PreferencesSidebar
