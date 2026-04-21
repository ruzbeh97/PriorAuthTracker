import { CheckCircle } from 'lucide-react';

interface VisitsBarProps {
  authorized: number;
  completed: number;
  scheduled: number;
}

export default function VisitsBar({ authorized, completed, scheduled }: VisitsBarProps) {
  const open = authorized - completed - scheduled;
  const completedPct = authorized > 0 ? (completed / authorized) * 100 : 0;
  const scheduledPct = authorized > 0 ? (scheduled / authorized) * 100 : 0;
  const exceeded = completed + scheduled > authorized;

  return (
    <div className="flex flex-col gap-1 w-full min-w-[100px]">
      <div className="flex items-center gap-1 text-[11px] leading-none">
        <span className="text-text-primary font-medium">{completed} done</span>
        <span className="text-status-expiring font-medium">{scheduled} sched</span>
        <span className="text-text-secondary">/ {authorized}</span>
      </div>
      <div className="flex h-[6px] rounded-full overflow-hidden bg-[#e5e7eb] w-full">
        <div
          className="bg-primary rounded-l-full shrink-0"
          style={{ width: `${Math.min(completedPct, 100)}%` }}
        />
        <div
          className={`shrink-0 ${exceeded ? 'bg-status-expired' : 'bg-status-expiring'}`}
          style={{ width: `${Math.min(scheduledPct, 100 - completedPct)}%` }}
        />
      </div>
      <div className="flex items-center gap-1 text-[11px] leading-none">
        <CheckCircle className="w-3.5 h-3.5 text-status-active" strokeWidth={2} />
        <span className="text-text-secondary">{Math.max(open, 0)} open</span>
        {exceeded && <span className="text-status-expired ml-1">{completed + scheduled - authorized} Exceeded</span>}
      </div>
    </div>
  );
}
