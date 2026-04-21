import {
  FileText,
  BarChart3,
  CalendarDays,
  Wrench,
  ClipboardList,
  Cpu,
  Settings,
  ChevronDown,
  Gift,
} from 'lucide-react';

const navItems = [
  { label: 'EHR', icon: FileText },
  { label: 'Insights', icon: BarChart3 },
  { label: 'Daily Operations', icon: CalendarDays },
  { label: 'Utilities', icon: Wrench },
  { label: 'Action Items', icon: ClipboardList },
  { label: 'Automation', icon: Cpu },
  { label: 'Setting', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="flex flex-col justify-between w-[232px] h-full bg-white border-r border-[#e5e7eb] shrink-0">
      <div className="flex flex-col gap-4">
        <div className="flex items-center h-14 px-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full border-2 border-white" />
            </div>
            <span className="text-lg font-medium text-text-primary tracking-tight">Athelas</span>
          </div>
        </div>
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              className="flex items-center justify-between w-full px-4 py-[7px] rounded text-left hover:bg-surface-variant transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <item.icon className="w-5 h-5 text-text-tertiary shrink-0" strokeWidth={1.5} />
                <span className="text-base text-text-tertiary truncate font-normal">{item.label}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-text-tertiary shrink-0" strokeWidth={1.5} />
            </button>
          ))}
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
