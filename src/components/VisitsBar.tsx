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
        <span className={`font-medium ${exceeded ? 'text-[#f6a3a2]' : 'text-[#a8c4e6]'}`}>{scheduled} sched</span>
        <span className="text-text-secondary">/ {authorized}</span>
      </div>

      {exceeded ? (
        <div className="relative h-[10px] w-full rounded-full border border-[#e91916] bg-[#f6a3a2] overflow-hidden">
          {/* Completed portion */}
          <div className="absolute inset-y-0 left-0 bg-status-expired" style={{ width: `${completedPct}%` }} />
          {/* Authorized baseline (gray overlay stops here) */}
          <div className="absolute inset-y-0 left-0 bg-[#d9d9d9]" style={{ width: `${Math.min(authorizedPct, completedPct)}%` }} />
        </div>
      ) : (
        <div className="relative h-[10px] w-full rounded-full border border-[#b0b0b0] bg-[#e0e0e0] overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-primary"
            style={{ width: `${Math.min(completedPct, 100)}%` }}
          />
          <div
            className="absolute inset-y-0 bg-[#a8c4e6]"
            style={{ left: `${completedPct}%`, width: `${scheduledPct}%` }}
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
