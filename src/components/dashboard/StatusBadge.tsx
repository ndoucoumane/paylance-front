import { dashboard as t } from '../../content/dashboard.fr';
import type { PaymentStatus } from '../../services/payments/types';

const styles: Record<PaymentStatus, { badge: string; dot: string }> = {
  SUCCESS: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', dot: 'bg-emerald-500' },
  PENDING: { badge: 'bg-amber-50 text-amber-800 ring-amber-600/20', dot: 'bg-amber-500' },
  PROCESSING: { badge: 'bg-sky-50 text-sky-700 ring-sky-600/15', dot: 'bg-sky-500 animate-pulse' },
  FAILED: { badge: 'bg-red-50 text-red-700 ring-red-600/15', dot: 'bg-red-500' },
  EXPIRED: { badge: 'bg-neutral-100 text-neutral-600 ring-neutral-500/15', dot: 'bg-neutral-400' },
  CANCELLED: {
    badge: 'bg-neutral-100 text-neutral-600 ring-neutral-500/15',
    dot: 'bg-neutral-400',
  },
  REFUNDED: { badge: 'bg-violet-50 text-violet-700 ring-violet-600/15', dot: 'bg-violet-500' },
  PARTIALLY_REFUNDED: {
    badge: 'bg-violet-50 text-violet-700 ring-violet-600/15',
    dot: 'bg-violet-400',
  },
};

/** Statut de paiement : pastille colorée + libellé (la couleur n'est jamais seule porteuse du sens). */
export function StatusBadge({
  status,
  className = '',
}: {
  status: PaymentStatus;
  className?: string;
}) {
  const style = styles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style.badge} ${className}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {t.statuses[status]}
    </span>
  );
}
