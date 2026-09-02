import { AlertTriangle } from 'lucide-react';

interface UtilizationBarProps {
  authorized: number;
  completed: number;
  scheduled: number;
  claimed?: number;
  /** 'grid' packs the four labels 2x2 for narrow table cells; 'row' spreads them
   *  across a single line, which is how the detail panel renders them. */
  layout?: 'grid' | 'row';
}

export default function UtilizationBar({
  authorized,
  completed,
  scheduled,
  claimed = 0,
  layout = 'grid',
}: UtilizationBarProps) {
  const used = completed + scheduled + claimed;
  const exceeded = used > authorized;
  const excess = exceeded ? used - authorized : 0;
  const available = Math.max(authorized - used, 0);

  // The track spans whichever is larger, the authorized allowance or actual
  // usage, so an over-utilized authorization pushes its fills past the capacity
  // outline instead of being clamped to it.
  const span = Math.max(authorized, used) || 1;
  const pct = (n: number) => `${(n / span) * 100}%`;

  // A zero allowance has no capacity to mark, so the outline would collapse to
  // its own left border and read as a stray tick beside the fills. An untouched
  // authorization still draws the full track so the cell reads as an empty bar.
  const outlineWidth = authorized > 0 ? pct(authorized) : '100%';
  const showOutline = authorized > 0 || used === 0;

  const claimedColor = '#16a34a';
  const completedColor = exceeded ? '#e91916' : '#3b82f6';
  const scheduledColor = exceeded ? '#f6a3a2' : '#93c5fd';

  const trackHeight = layout === 'row' ? 'h-[13px]' : 'h-[10px]';
  const dot = layout === 'row' ? 'w-[5px] h-[5px]' : 'w-1.5 h-1.5';

  const claimedLabel = (
    <span key="claimed" className="flex items-center gap-1 font-medium" style={{ color: claimedColor }}>
      <span className={`${dot} rounded-full shrink-0`} style={{ backgroundColor: claimedColor }} />
      {claimed} Claimed
    </span>
  );
  const completedLabel = (
    <span key="completed" className="flex items-center gap-1 font-medium" style={{ color: completedColor }}>
      <span className={`${dot} rounded-full shrink-0`} style={{ backgroundColor: completedColor }} />
      {completed} Completed
    </span>
  );
  const scheduledLabel = (
    <span
      key="scheduled"
      className="flex items-center gap-1 font-medium"
      style={{ color: exceeded ? scheduledColor : '#3b82f6' }}
    >
      <span className={`${dot} rounded-full shrink-0`} style={{ backgroundColor: scheduledColor }} />
      {scheduled} Scheduled
    </span>
  );
  const remainderLabel = exceeded ? (
    <span key="remainder" className="flex items-center gap-1 font-medium text-[#808080]">
      <AlertTriangle className="w-[7px] h-[7px] shrink-0" strokeWidth={2.5} />
      {excess} Exceeded
    </span>
  ) : (
    <span key="remainder" className="flex items-center gap-1 font-medium text-text-secondary">
      <span className={`${dot} rounded-full bg-text-secondary shrink-0`} />
      {available} Available
    </span>
  );

  return (
    <div className="flex flex-col gap-1.5 min-w-[190px] w-full">
      <div className={`relative w-full ${trackHeight}`}>
        {/* Capacity outline marks the authorized allowance. It drops its right
            edge once usage overflows so the fills read as running past the limit. */}
        {showOutline && (
          <div
            className={`absolute inset-y-0 left-0 border-y border-l border-[#8c8c8c] rounded-l-full ${
              exceeded ? '' : 'border-r rounded-r-full'
            }`}
            style={{ width: outlineWidth }}
          />
        )}
        {/* Fills are layered rather than laid end-to-end: each starts at the left
            edge and runs to its cumulative total, so the rounded cap of a shorter
            segment sits on top of the one behind it with no gap. */}
        <div
          className="absolute inset-y-px left-0 rounded-full"
          style={{ width: pct(used), backgroundColor: scheduledColor }}
        />
        <div
          className="absolute inset-y-px left-0 rounded-full"
          style={{ width: pct(claimed + completed), backgroundColor: completedColor }}
        />
        <div
          className="absolute inset-y-px left-0 rounded-full"
          style={{ width: pct(claimed), backgroundColor: claimedColor }}
        />
      </div>

      {layout === 'row' ? (
        <div className="flex items-center justify-between gap-x-3 text-[10px] leading-[13px] whitespace-nowrap">
          {claimedLabel}
          {completedLabel}
          {scheduledLabel}
          {remainderLabel}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-[3px] text-[10.5px] leading-[13px] whitespace-nowrap">
          {completedLabel}
          {claimedLabel}
          {scheduledLabel}
          {remainderLabel}
        </div>
      )}
    </div>
  );
}
