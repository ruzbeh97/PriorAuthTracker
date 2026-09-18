import './PreferencesSidebar.css'

const PREFERENCE_SECTIONS = [
  {
    label: 'General',
    items: ['Alert Rules', 'Appointment Types', 'Calendar', 'General', 'Marketing', 'Tags'],
  },
  {
    label: 'Clinical',
    items: ['Chart Note', 'Facesheets', 'ICD10', 'Measurements', 'Order Sets', 'Rooms', 'Text Snippets'],
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

// Only these pages exist in the prototype; the rest stay inert placeholders.
export const NAVIGABLE_PREFERENCE_ITEMS = [
  'Text Snippets',
  'Prior Authorization Tracker',
  'User Groups',
] as const

export type PreferenceItem = (typeof NAVIGABLE_PREFERENCE_ITEMS)[number]

interface PreferencesSidebarProps {
  onClose: () => void
  activeItem: PreferenceItem
  onSelect: (item: PreferenceItem) => void
}

function PreferencesSidebar({ onClose, activeItem, onSelect }: PreferencesSidebarProps) {
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
              {section.items.map(item => {
                const isNavigable = (NAVIGABLE_PREFERENCE_ITEMS as readonly string[]).includes(item)
                return (
                  <li
                    key={item}
                    className={`pref-item ${activeItem === item ? 'active' : ''}`}
                    onClick={isNavigable ? () => onSelect(item as PreferenceItem) : undefined}
                  >
                    {item}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PreferencesSidebar
