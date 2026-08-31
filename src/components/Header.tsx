import {
  AudioLines,
  Bell,
  ChevronDown,
  ChevronUp,
  Mic,
  PanelLeft,
  Search,
  Sparkles,
  UserRound,
} from 'lucide-react';

interface DetailHeaderInfo {
  patientName: string;
  authNumber: string;
  index: number;
  total: number;
}

interface HeaderProps {
  onToggleSidebar: () => void;
  detailHeaderInfo?: DetailHeaderInfo | null;
  onNavigateRecord?: (dir: 'prev' | 'next') => void;
  onBackToTable?: () => void;
}

export default function Header({
  onToggleSidebar,
  detailHeaderInfo,
  onNavigateRecord,
  onBackToTable,
}: HeaderProps) {
  return (
    <header className="flex items-center gap-2 h-9 px-2 bg-shell shrink-0">
      <button
        onClick={onToggleSidebar}
        title="Toggle sidebar"
        className="flex items-center justify-center w-7 h-7 shrink-0 rounded-lg text-shell-fg-subtle hover:bg-black/5 transition-colors"
      >
        <PanelLeft className="w-4 h-4" strokeWidth={1.75} />
      </button>

      <nav className="flex items-center gap-1.5 shrink-0 text-[13px]">
        <button
          onClick={onBackToTable}
          className="text-shell-fg-subtle hover:text-shell-fg transition-colors"
        >
          Daily Operations
        </button>
        <span className="text-shell-fg-subtle/60">/</span>
        {detailHeaderInfo ? (
          <>
            <button
              onClick={onBackToTable}
              className="text-shell-fg-subtle hover:text-shell-fg transition-colors"
            >
              Prior Authorizations
            </button>
            <span className="text-shell-fg-subtle/60">/</span>
            <span className="font-medium text-shell-fg">{detailHeaderInfo.patientName}</span>
            <span className="text-shell-fg-subtle">{detailHeaderInfo.authNumber}</span>
          </>
        ) : (
          <span className="font-medium text-shell-fg">Prior Authorizations</span>
        )}
      </nav>

      {detailHeaderInfo ? (
        <div className="flex-1" />
      ) : (
        <div className="flex flex-1 items-center justify-center gap-1 min-w-0">
          <button
            title="Notifications"
            className="flex items-center justify-center w-7 h-7 shrink-0 rounded-lg text-shell-fg-subtle hover:bg-black/5 transition-colors"
          >
            <Bell className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <button className="relative flex items-center justify-center gap-1.5 h-7 w-[320px] max-w-full px-2.5 rounded-lg bg-black/5 hover:bg-black/10 transition-colors">
            <Search className="w-3.5 h-3.5 text-shell-fg-subtle" strokeWidth={1.75} />
            <span className="text-[13px] text-shell-fg-subtle">Global Search</span>
            <span className="absolute right-2.5 text-[12px] text-shell-fg-subtle/70">ctrl+K</span>
          </button>
        </div>
      )}

      <div className="flex items-center gap-1 ml-auto shrink-0">
        {detailHeaderInfo && (
          <>
            <span className="text-[13px] text-shell-fg-subtle">
              {detailHeaderInfo.index}
              <span className="text-shell-fg-subtle/60">/{detailHeaderInfo.total}</span>
            </span>
            <button
              onClick={() => onNavigateRecord?.('next')}
              disabled={detailHeaderInfo.index >= detailHeaderInfo.total}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-shell-fg-subtle hover:bg-black/5 transition-colors disabled:opacity-30"
            >
              <ChevronDown className="w-4 h-4" strokeWidth={1.75} />
            </button>
            <button
              onClick={() => onNavigateRecord?.('prev')}
              disabled={detailHeaderInfo.index <= 1}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-shell-fg-subtle hover:bg-black/5 transition-colors disabled:opacity-30"
            >
              <ChevronUp className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </>
        )}
        <button
          title="Dictation"
          className="flex items-center gap-1 h-7 px-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
        >
          <AudioLines className="w-4 h-4" strokeWidth={1.75} />
          <UserRound className="w-4 h-4" strokeWidth={1.75} />
        </button>
        <button className="flex items-center gap-1.5 h-7 px-2 rounded-lg text-primary hover:bg-black/5 transition-colors">
          <Mic className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span className="text-[13px] font-medium">Scribe</span>
        </button>
        <button className="flex items-center gap-1.5 h-7 px-2 rounded-lg text-primary hover:bg-black/5 transition-colors">
          <span className="flex items-center justify-center w-4 h-4 rounded bg-linear-to-br from-[#405bf2] to-primary">
            <Sparkles className="w-2.5 h-2.5 text-white" strokeWidth={2} />
          </span>
          <span className="text-[13px] font-medium">Athelas AI</span>
        </button>
      </div>
    </header>
  );
}
