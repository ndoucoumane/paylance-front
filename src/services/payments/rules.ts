import type { Payment, PaymentStats, PaymentStatus } from './types';

/** Statuts qu'un remboursement peut viser (règle du RefundService côté serveur). */
export function isRefundable(payment: Payment): boolean {
  return payment.status === 'SUCCESS' || payment.status === 'PARTIALLY_REFUNDED';
}

/** Wave ne rembourse qu'en totalité une checkout session (WaveClient.refund). */
export function supportsPartialRefund(payment: Payment): boolean {
  return payment.provider !== 'WAVE';
}

const FINAL_FAILURES: PaymentStatus[] = ['FAILED', 'EXPIRED', 'CANCELLED'];
const PAID: PaymentStatus[] = ['SUCCESS', 'REFUNDED', 'PARTIALLY_REFUNDED'];

function sum(
  stats: PaymentStats,
  statuses: PaymentStatus[],
  field: 'count' | 'totalAmount',
): number {
  return stats.byStatus
    .filter((entry) => statuses.includes(entry.key as PaymentStatus))
    .reduce((total, entry) => total + entry[field], 0);
}

/** Indicateurs dérivés d'un agrégat par statut. */
export function kpisFrom(stats: PaymentStats) {
  const paidCount = sum(stats, PAID, 'count');
  const failedCount = sum(stats, FINAL_FAILURES, 'count');
  const settled = paidCount + failedCount;
  return {
    volume: sum(stats, ['SUCCESS', 'PARTIALLY_REFUNDED'], 'totalAmount'),
    count: stats.totalCount,
    successRate: settled ? paidCount / settled : null,
    refunded: sum(stats, ['REFUNDED'], 'totalAmount'),
    refundedCount: sum(stats, ['REFUNDED', 'PARTIALLY_REFUNDED'], 'count'),
  };
}

const DAY = 86_400_000;

/**
 * Début d'une période de N jours calendaires incluant aujourd'hui (minuit local).
 * Partagé par les indicateurs, la courbe et la liste pour que leurs totaux concordent.
 */
export function periodStart(days: number, now = Date.now()): number {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return today.getTime() - (days - 1) * DAY;
}
