import type { AuthStatus } from '../types';

const statusConfig: Record<AuthStatus, { color: string; bg: string; dot: string }> = {
  Active: { color: 'text-green-800', bg: 'bg-green-50', dot: 'bg-status-active' },
  'Expiring Soon': { color: 'text-amber-800', bg: 'bg-amber-50', dot: 'bg-status-expiring' },
  Expired: { color: 'text-red-800', bg: 'bg-red-50', dot: 'bg-status-expired' },
  'Needs Auth': { color: 'text-orange-800', bg: 'bg-orange-50', dot: 'bg-status-needs-auth' },
};

export default function StatusBadge({ status }: { status: AuthStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.color} ${config.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
}
