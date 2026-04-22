import { CheckCircle } from 'lucide-react';

interface VisitsBarProps {
  authorized: number;
  completed: number;
  scheduled: number;
}

export default function VisitsBar({ authorized, completed, scheduled }: VisitsBarProps) {
  const open = authorized - completed - scheduled;
  const exceeded = completed + scheduled > authorized;
  const exceededCount = exceeded ? completed + scheduled - authorized : 0;
  const total = Math.max(authorized, completed + scheduled);

  const completedPct = total > 0 ? (completed / total) * 100 : 0;
  const scheduledPct = total > 0 ? (scheduled / total) * 100 : 0;
  const authorizedPct = total > 0 ? (authorized / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-1 w-full min-w-[100px]">
      <div className="flex items-center gap-1 text-[11px] leading-none">
        <span className={`font-medium ${exceeded ? 'text-status-expired' : 'text-text-primary'}`}>{completed} done</span>
        <span className={`font-medium ${exceeded ? 'text-[#f6a3a2]' : 'text-status-expiring'}`}>{scheduled} sched</span>
        <span className="text-text-secondary">/ {authorized}</span>
      </div>

      {exceeded ? (
        <div className="relative h-[8px] w-full">
          {/* Full bar background (completed + scheduled) */}
          <div className="absolute inset-y-0 left-0 rounded-tl-[4px] rounded-br-[4px] bg-[#f6a3a2] border border-[#e91916]" style={{ width: '100%' }} />
          {/* Completed portion */}
          <div className="absolute inset-y-0 left-0 rounded-tl-[4px] rounded-br-[4px] bg-status-expired border border-[#e91916]" style={{ width: `${completedPct}%` }} />
          {/* Authorized baseline (gray overlay stops here) */}
          <div className="absolute inset-y-0 left-0 rounded-tl-[4px] rounded-br-[4px] bg-[#d9d9d9] border border-[#8c8c8c]" style={{ width: `${Math.min(authorizedPct, completedPct)}%` }} />
        </div>
      ) : (
        <div className="flex h-[6px] rounded-full overflow-hidden bg-[#e5e7eb] w-full">
          <div
            className="bg-primary rounded-l-full shrink-0"
            style={{ width: `${Math.min(completedPct, 100)}%` }}
          />
          <div
            className="bg-status-expiring shrink-0"
            style={{ width: `${scheduledPct}%` }}
          />
        </div>
      )}

      <div className="flex items-center gap-1 text-[11px] leading-none">
        {exceeded ? (
          <span className="text-text-secondary">{exceededCount} Exceeded</span>
        ) : (
          <>
            <CheckCircle className="w-3.5 h-3.5 text-status-active" strokeWidth={2} />
            <span className="text-text-secondary">{Math.max(open, 0)} open</span>
          </>
        )}
      </div>
    </div>
  );
}
