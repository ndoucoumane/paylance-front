import type { EnvironmentType, PaymentProvider } from '../account/types';

/**
 * Miroir des DTO du backend (DashboardPaymentController).
 * Les montants sont en centimes (unité mineure × 100), y compris pour le XOF.
 */

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'CANCELLED';

export type RefundStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
export type TriggeredBy = 'API' | 'WEBHOOK' | 'RECONCILIATION' | 'MANUAL';

/** PaymentStatusResponse */
export type Payment = {
  paymentId: string;
  /** Numéro lisible, ex. PL-261110-000001-7. */
  paymentNumber: string;
  correlationId: string | null;
  applicationId: string | null;
  providerAccountId: string | null;
  customerId: string | null;
  environment: EnvironmentType;
  provider: PaymentProvider;
  status: PaymentStatus;
  /** En centimes. */
  amount: number;
  currency: string;
  payerPhone: string | null;
  actualPayerPhone: string | null;
  externalReference: string | null;
  failureReason: string | null;
  paidAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** PaymentStatusHistoryResponse */
export type PaymentStatusChange = {
  id: string;
  fromStatus: PaymentStatus | null;
  toStatus: PaymentStatus;
  reason: string | null;
  triggeredBy: TriggeredBy | string;
  createdAt: string;
};

/** RefundResponse */
export type Refund = {
  refundId: string;
  paymentId: string;
  paymentNumber: string;
  payerPhone: string | null;
  amount: number;
  status: RefundStatus;
  reason: string;
  failureReason: string | null;
  providerRefundId: string | null;
  requestedBy: string | null;
  createdAt: string;
};

/** RefundRequest : `amount` absent = remboursement total. */
export type RefundRequest = { amount?: number; reason: string };

/** PaymentStatsResponse.AggregateEntry */
export type AggregateEntry = { key: string; count: number; totalAmount: number };

export type PaymentStats = {
  totalCount: number;
  totalAmount: number;
  byStatus: AggregateEntry[];
  byProvider: AggregateEntry[];
};

/**
 * Création d'un paiement depuis le tableau de bord (contrat attendu, pas encore exposé
 * par DashboardPaymentController). Le client reçoit la demande sur son téléphone.
 */
export type PaymentCreateRequest = {
  providerAccountId: string;
  /** En centimes. */
  amount: number;
  /** Format international, ex. +221771234567. */
  payerPhone: string;
  externalReference?: string;
  description?: string;
  /** Durée de validité de la demande. */
  expiresInMinutes: number;
};

export type ScheduledRefundStatus = 'SCHEDULED' | 'EXECUTED' | 'CANCELLED' | 'FAILED';

/** Remboursement exécuté automatiquement à une date choisie (contrat attendu). */
export type ScheduledRefund = {
  id: string;
  paymentId: string;
  paymentNumber: string;
  provider: Payment['provider'];
  payerPhone: string | null;
  /** En centimes ; `null` = solde remboursable au moment de l'exécution. */
  amount: number | null;
  /**
   * Montant effectif en centimes : remboursé si exécuté, sinon solde remboursable actuel
   * (estimation affichée pour un « solde total »). Absent si le serveur ne le calcule pas.
   */
  effectiveAmount?: number | null;
  /** Montant initial du paiement, en centimes. */
  paymentAmount?: number;
  currency: string;
  reason: string;
  scheduledAt: string;
  status: ScheduledRefundStatus;
  refundId: string | null;
  failureReason: string | null;
  createdBy: string | null;
  createdAt: string;
};

/** `amount` absent = remboursement total. */
export type ScheduledRefundRequest = RefundRequest & { scheduledAt: string };

/* ---------- Côté écran ---------- */

export type PeriodDays = 7 | 30 | 90;

/** Tri de la liste : champ et sens. */
export type PaymentSortField = 'createdAt' | 'amount';
export type PaymentSort = { field: PaymentSortField; direction: 'asc' | 'desc' };

export type PaymentQuery = {
  periodDays: PeriodDays;
  status?: PaymentStatus;
  provider?: PaymentProvider;
  /** Numéro de transaction, téléphone ou référence. */
  q?: string;
  /** Par défaut : date décroissante. */
  sort?: PaymentSort;
  /** Page commençant à 0. */
  page: number;
  size: number;
};

export type PaymentPage = {
  items: Payment[];
  total: number;
  page: number;
  size: number;
};

/** Indicateurs d'une période, comparés à la période précédente de même durée. */
export type PaymentOverview = {
  current: PaymentStats;
  previous: PaymentStats;
  /** Volume encaissé par jour (centimes), si disponible. */
  dailyVolume: number[] | null;
  dailyCount: number[] | null;
  /** Volume quotidien de la période précédente (même durée), pour la comparaison. */
  previousDailyVolume: number[] | null;
};

export interface PaymentsApi {
  overview(periodDays: PeriodDays): Promise<PaymentOverview>;
  list(query: PaymentQuery): Promise<PaymentPage>;
  get(paymentId: string): Promise<Payment>;
  history(paymentId: string): Promise<PaymentStatusChange[]>;
  refunds(paymentId: string): Promise<Refund[]>;
  refund(paymentId: string, request: RefundRequest): Promise<Refund>;
  create(request: PaymentCreateRequest): Promise<Payment>;
  scheduledRefunds(): Promise<ScheduledRefund[]>;
  scheduleRefund(paymentId: string, request: ScheduledRefundRequest): Promise<ScheduledRefund>;
  cancelScheduledRefund(id: string): Promise<ScheduledRefund>;
}
