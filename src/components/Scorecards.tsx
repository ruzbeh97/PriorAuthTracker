interface ScorecardProps {
  title: string;
  value: number;
  subtitle: string;
}

function Scorecard({ title, value, subtitle }: ScorecardProps) {
  return (
    <div className="flex flex-col gap-1 items-start p-5 bg-white border border-outline rounded-[10px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.06)] w-[217px]">
      <span className="text-sm font-medium text-text-primary">{title}</span>
      <span className="text-[32px] leading-[38px] text-text-primary">{value}</span>
      <span className="text-sm font-medium text-text-secondary">{subtitle}</span>
    </div>
  );
}

export default function Scorecards() {
  return (
    <div className="flex gap-3 items-start pt-8 pb-4 px-4">
      <Scorecard title="Needs Authorization" value={3} subtitle="Missing Authorizations" />
      <Scorecard title="Expiring Soon" value={8} subtitle="<7 days or <2 visits" />
      <Scorecard title="Expired" value={12} subtitle="Needs Authorization" />
    </div>
  );
}
