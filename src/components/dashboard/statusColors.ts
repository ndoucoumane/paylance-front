import type { PaymentStatus } from '../../services/payments/types';

/** Couleur d'un statut pour les barres de répartition. */
export const statusBarColor: Record<PaymentStatus, string> = {
  SUCCESS: 'bg-emerald-500',
  PENDING: 'bg-amber-400',
  PROCESSING: 'bg-sky-400',
  FAILED: 'bg-red-400',
  EXPIRED: 'bg-neutral-300',
  CANCELLED: 'bg-neutral-300',
  REFUNDED: 'bg-violet-400',
  PARTIALLY_REFUNDED: 'bg-violet-300',
};
