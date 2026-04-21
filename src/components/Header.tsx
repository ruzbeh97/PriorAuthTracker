import { Menu, Search, BarChart2, BookOpen, ChevronDown } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-outline bg-white">
      <div className="flex items-center gap-3">
        <button className="p-1 rounded-full hover:bg-surface-variant transition-colors">
          <Menu className="w-5 h-5 text-text-primary" strokeWidth={1.5} />
        </button>
        <h1 className="text-lg font-medium text-text-primary">Prior Authorizations</h1>
      </div>
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-1">
          <IconButton icon={Search} />
          <IconButton icon={BarChart2} />
          <IconButton icon={BookOpen} />
          <div className="ml-2 flex items-center gap-1 px-2 py-1 rounded bg-surface-variant">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-400 to-blue-500" />
            <span className="text-xs font-medium text-primary">Athelas AI</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-[#ffad33] flex items-center justify-center text-base font-bold text-text-primary">
            A
          </div>
          <div className="flex items-center gap-2.5 px-4 py-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-text-primary">Adam Smith</span>
              <span className="text-xs text-text-primary">Administrator</span>
            </div>
            <button className="p-1 rounded-full">
              <ChevronDown className="w-5 h-5 text-text-primary" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function IconButton({ icon: Icon }: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }) {
  return (
    <button className="relative p-1.5 rounded-full hover:bg-surface-variant transition-colors">
      <Icon className="w-6 h-6 text-text-primary" strokeWidth={1.5} />
    </button>
  );
}
