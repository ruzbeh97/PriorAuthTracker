import { useState } from 'react';
import {
  FileText,
  BarChart3,
  CalendarDays,
  Wrench,
  ClipboardList,
  Cpu,
  Settings,
  ChevronDown,
  ChevronRight,
  Gift,
  ShieldCheck,
} from 'lucide-react';

interface NavChild {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children?: NavChild[];
}

const navItems: NavItem[] = [
  { label: 'EHR', icon: FileText },
  { label: 'Insights', icon: BarChart3 },
  {
    label: 'Daily Operations',
    icon: CalendarDays,
    children: [
      { label: 'Prior Auth Tracker 1', icon: ShieldCheck },
      { label: 'Prior Auth Tracker 2', icon: ShieldCheck },
    ],
  },
  { label: 'Utilities', icon: Wrench },
  { label: 'Action Items', icon: ClipboardList },
  { label: 'Automation', icon: Cpu },
  { label: 'Setting', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  activePage: string;
  onPageChange: (page: string) => void;
}

export default function Sidebar({ collapsed, activePage, onPageChange }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Daily Operations']));

  const toggleExpand = (label: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const isChildActive = (item: NavItem) =>
    item.children?.some((c) => activePage === c.label) ?? false;

  if (collapsed) {
    return (
      <aside className="flex flex-col justify-between w-[52px] h-full bg-white border-r border-[#e5e7eb] shrink-0 transition-all duration-200">
        <div className="flex flex-col gap-2 items-center pt-4">
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center mb-2">
            <div className="w-3 h-3 rounded-full border-2 border-white" />
          </div>
          {navItems.map((item) => {
            const active = isChildActive(item);
            return (
              <button
                key={item.label}
                title={item.label}
                className={`p-2 rounded-lg transition-colors ${
                  active ? 'bg-primary/10 text-primary' : 'text-text-tertiary hover:bg-surface-variant'
                }`}
              >
                <item.icon className="w-5 h-5" strokeWidth={1.5} />
              </button>
            );
          })}
        </div>
        <div className="flex flex-col items-center gap-2 pb-4 border-t border-[#d1d5db] pt-3">
          <button title="Settings" className="p-2 rounded-lg text-text-tertiary hover:bg-surface-variant transition-colors">
            <Settings className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <button title="Refer a practice" className="p-2 rounded-lg text-primary hover:opacity-80 transition-opacity">
            <Gift className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col justify-between w-[232px] h-full bg-white border-r border-[#e5e7eb] shrink-0 transition-all duration-200">
      <div className="flex flex-col gap-4">
        <div className="flex items-center h-14 px-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full border-2 border-white" />
            </div>
            <span className="text-lg font-medium text-text-primary tracking-tight">Athelas</span>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5 px-2">
          {navItems.map((item) => {
            const isExpanded = expandedSections.has(item.label);
            const hasChildren = item.children && item.children.length > 0;
            const Chevron = hasChildren && isExpanded ? ChevronDown : ChevronRight;

            return (
              <div key={item.label}>
                <button
                  onClick={() => hasChildren && toggleExpand(item.label)}
                  className={`flex items-center justify-between w-full px-4 py-[7px] rounded text-left transition-colors group ${
                    hasChildren && isExpanded ? 'bg-surface-variant' : 'hover:bg-surface-variant'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <item.icon className="w-5 h-5 text-text-tertiary shrink-0" strokeWidth={1.5} />
                    <span className="text-base text-text-tertiary truncate font-normal">{item.label}</span>
                  </div>
                  <Chevron className="w-4 h-4 text-text-tertiary shrink-0" strokeWidth={1.5} />
                </button>
                {hasChildren && isExpanded && (
                  <div className="flex flex-col gap-0.5 mt-0.5 ml-4">
                    {item.children!.map((child) => {
                      const isActive = activePage === child.label;
                      return (
                        <button
                          key={child.label}
                          onClick={() => onPageChange(child.label)}
                          className={`flex items-center gap-2 w-full pl-5 pr-4 py-[6px] rounded text-left transition-colors ${
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-surface-variant text-text-tertiary'
                          }`}
                        >
                          <child.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-text-tertiary'}`} strokeWidth={1.5} />
                          <span className={`text-sm truncate ${isActive ? 'font-medium text-primary' : 'font-normal'}`}>
                            {child.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-[#d1d5db] px-4 py-3.5">
        <button className="flex items-center gap-2 px-4 py-[5px] text-primary hover:opacity-80 transition-opacity">
          <Gift className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span className="text-sm">Refer a practice</span>
        </button>
      </div>
    </aside>
  );
}
