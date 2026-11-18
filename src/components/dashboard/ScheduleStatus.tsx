import { dashboard as t } from '../../content/dashboard.fr';
import type { ScheduledRefundStatus } from '../../services/payments/types';

const scheduleStatusStyles: Record<ScheduledRefundStatus, { badge: string; dot: string }> = {
  SCHEDULED: { badge: 'bg-sky-50 text-sky-800 ring-sky-600/20', dot: 'bg-sky-500' },
  EXECUTED: { badge: 'bg-violet-50 text-violet-700 ring-violet-600/15', dot: 'bg-violet-500' },
  CANCELLED: {
    badge: 'bg-neutral-100 text-neutral-600 ring-neutral-500/15',
    dot: 'bg-neutral-400',
  },
  FAILED: { badge: 'bg-red-50 text-red-700 ring-red-600/15', dot: 'bg-red-500' },
};

/** Pastille de statut d'un remboursement programmé. */
export function ScheduleStatus({ status }: { status: ScheduledRefundStatus }) {
  const style = scheduleStatusStyles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style.badge}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {t.scheduled.statuses[status]}
    </span>
  );
}
