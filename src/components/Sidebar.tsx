import { useState } from 'react';
import {
  BarChart3,
  Calendar,
  ChartSpline,
  ChevronDown,
  ChevronUp,
  Circle,
  CircleCheck,
  CircleHelp,
  CreditCard,
  FileText,
  FileX2,
  House,
  Inbox,
  PackagePlus,
  Settings,
  ShieldCheck,
  Sprout,
  Users,
  Waves,
} from 'lucide-react';

type IconType = React.ComponentType<{ className?: string; strokeWidth?: number }>;

interface NavItem {
  label: string;
  icon?: IconType;
  page?: string;
}

interface NavGroup {
  label: string;
  textOnly?: boolean;
  items: NavItem[];
}

const topLevelItems: NavItem[] = [
  { label: 'Home', icon: House },
  { label: 'Visits', icon: Calendar },
  { label: 'Tasks', icon: CircleCheck },
  { label: 'Preferences', icon: Settings },
];

const navGroups: NavGroup[] = [
  {
    label: 'Medical Records',
    items: [
      { label: 'Patients', icon: Users },
      { label: 'Inbox', icon: Inbox },
      { label: 'Order Manager', icon: FileText },
      { label: 'Interventions', icon: Sprout },
      { label: 'Pharmacy Requests', icon: PackagePlus },
    ],
  },
  {
    label: 'Daily Operations',
    textOnly: true,
    items: [
      { label: 'Onboarding' },
      { label: 'Appointments' },
      { label: 'Prior Authorizations', icon: ShieldCheck, page: 'Prior Auth Tracker 2' },
      { label: 'Call Center' },
      { label: 'Claim Details' },
      { label: 'Encounter Details' },
      { label: 'Patient Responsibility' },
    ],
  },
  {
    label: 'Revenue Cycle',
    items: [
      { label: 'Encounters', icon: Users },
      { label: 'Claims', icon: FileText },
      { label: 'Denials', icon: FileX2 },
      { label: 'Remittances', icon: CreditCard },
    ],
  },
  {
    label: 'Reporting',
    items: [
      { label: 'Practice Pulse', icon: Waves },
      { label: 'EMR Reports', icon: BarChart3 },
      { label: 'AI Report Builder', icon: ChartSpline },
    ],
  },
];

function AirLogo() {
  return (
    <div className="flex items-center gap-1.5 h-8 px-2">
      <svg viewBox="0 0 20 20" className="w-[18px] h-[18px] text-shell-fg" aria-hidden="true">
        <path
          d="M2.6 12.1 8 9.7l-.6-4.3a1 1 0 0 1 1.6-.9l2 1.6 2.5-2.5a1.4 1.4 0 1 1 2 2l-2.5 2.5 1.6 2a1 1 0 0 1-.9 1.6l-4.3-.6-2.4 5.4a.8.8 0 0 1-1.5-.2l-.6-3.5-3.5-.6a.8.8 0 0 1-.2-1.5Z"
          fill="currentColor"
        />
      </svg>
      <span className="text-[17px] font-bold tracking-tight text-shell-fg">Air</span>
    </div>
  );
}

function NavButton({
  item,
  isActive,
  onSelect,
  showIcon = true,
}: {
  item: NavItem;
  isActive: boolean;
  onSelect: () => void;
  showIcon?: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex items-center gap-2 h-7 px-2 rounded-lg text-left transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-shell-fg-muted hover:bg-black/5 hover:text-shell-fg'
      }`}
    >
      {showIcon && item.icon && (
        <item.icon
          className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-shell-fg-subtle'}`}
          strokeWidth={1.75}
        />
      )}
      <span className={`text-[13px] truncate ${isActive ? 'font-medium' : ''}`}>{item.label}</span>
    </button>
  );
}

interface SidebarProps {
  collapsed: boolean;
  activePage: string;
  onPageChange: (page: string) => void;
  onExpand?: () => void;
}

export default function Sidebar({ collapsed, activePage, onPageChange, onExpand }: SidebarProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const isItemActive = (item: NavItem) =>
    item.page ? activePage === item.page : activePage === item.label;

  const selectItem = (item: NavItem) => onPageChange(item.page ?? item.label);

  if (collapsed) {
    const railItems = [...topLevelItems, ...navGroups.flatMap((g) => g.items)].filter(
      (item): item is NavItem & { icon: IconType } => !!item.icon,
    );
    return (
      <aside className="flex flex-col w-14 h-full bg-shell shrink-0">
        <button
          onClick={() => onExpand?.()}
          title="Expand sidebar"
          className="flex items-center justify-center h-8 mx-2 mt-2 rounded-lg hover:bg-black/5 transition-colors"
        >
          <svg viewBox="0 0 20 20" className="w-[18px] h-[18px] text-shell-fg" aria-hidden="true">
            <path
              d="M2.6 12.1 8 9.7l-.6-4.3a1 1 0 0 1 1.6-.9l2 1.6 2.5-2.5a1.4 1.4 0 1 1 2 2l-2.5 2.5 1.6 2a1 1 0 0 1-.9 1.6l-4.3-.6-2.4 5.4a.8.8 0 0 1-1.5-.2l-.6-3.5-3.5-.6a.8.8 0 0 1-.2-1.5Z"
              fill="currentColor"
            />
          </svg>
        </button>
        <nav className="flex flex-col gap-0.5 px-2 mt-4 overflow-y-auto">
          {railItems.map((item) => {
            const active = isItemActive(item);
            return (
              <button
                key={item.label}
                title={item.label}
                onClick={() => selectItem(item)}
                className={`flex items-center justify-center h-7 rounded-lg transition-colors ${
                  active ? 'bg-primary/10 text-primary' : 'text-shell-fg-subtle hover:bg-black/5'
                }`}
              >
                <item.icon className="w-4 h-4" strokeWidth={1.75} />
              </button>
            );
          })}
        </nav>
        <div className="mt-auto px-2 pb-2">
          <div className="border-t border-black/10 pt-2 flex flex-col items-center gap-1">
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-semibold">
              RI
            </div>
            <button className="flex items-center justify-center w-7 h-7 rounded-lg text-shell-fg-subtle hover:bg-black/5 transition-colors">
              <Settings className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col w-[200px] h-full bg-shell shrink-0">
      <div className="px-2 pt-2">
        <AirLogo />
      </div>

      <nav className="flex flex-col px-2 mt-4 min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-0.5 pb-3">
          {topLevelItems.map((item) => (
            <NavButton
              key={item.label}
              item={item}
              isActive={isItemActive(item)}
              onSelect={() => selectItem(item)}
            />
          ))}
        </div>

        {navGroups.map((group) => {
          const isOpen = !collapsedGroups.has(group.label);
          const Chevron = isOpen ? ChevronUp : ChevronDown;
          return (
            <div key={group.label} className="flex flex-col pb-3">
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex items-center gap-2 h-7 px-2 rounded-lg hover:bg-black/5 transition-colors"
              >
                <Circle className="w-4 h-4 shrink-0 text-shell-fg-subtle" strokeWidth={1.75} />
                <span className="text-[13px] font-medium text-shell-fg truncate">{group.label}</span>
                <Chevron
                  className="w-3.5 h-3.5 shrink-0 ml-auto text-shell-fg-subtle"
                  strokeWidth={1.75}
                />
              </button>

              {isOpen && (
                <div className="flex">
                  <div className="w-[9px] shrink-0 flex">
                    <div className="w-px ml-1 bg-black/10" />
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    {group.items.map((item) => (
                      <NavButton
                        key={item.label}
                        item={item}
                        isActive={isItemActive(item)}
                        onSelect={() => selectItem(item)}
                        showIcon={!group.textOnly}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto px-2 pb-2">
        <div className="border-t border-black/10 pt-2 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-semibold shrink-0">
            RI
          </div>
          <button
            title="Settings"
            className="flex items-center justify-center w-7 h-7 rounded-lg text-shell-fg-subtle hover:bg-black/5 transition-colors"
          >
            <Settings className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <button
            title="Help"
            className="flex items-center justify-center w-7 h-7 rounded-lg text-shell-fg-subtle hover:bg-black/5 transition-colors ml-auto"
          >
            <CircleHelp className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  );
}
