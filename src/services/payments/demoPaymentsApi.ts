import { withCurrentUser, type StoredUser } from '../account/demoAccountApi';
import { findCountry } from '../account/referenceData';
import { ApiError } from '../api/errors';
import { isRefundable, periodStart, supportsPartialRefund } from './rules';
import type {
  AggregateEntry,
  Payment,
  PaymentOverview,
  PaymentPage,
  PaymentQuery,
  PaymentsApi,
  PaymentStats,
  PaymentStatus,
  PaymentStatusChange,
  Refund,
} from './types';

/**
 * Transactions fictives du mode démonstration. Elles sont générées de façon déterministe
 * pour chaque entreprise ayant au moins un compte prestataire connecté ; seuls les
 * remboursements effectués depuis l'interface sont enregistrés (localStorage).
 * Les règles de remboursement reprennent celles du RefundService du backend.
 */

export type DemoPaymentsState = {
  /** Instant de référence de la génération (rafraîchi toutes les 6 h). */
  anchor: number;
  /** Remboursements effectués dans l'interface, par paiement. */
  refunds: Record<string, Refund[]>;
};

const DAY = 86_400_000;
const COUNT = 180;
const HORIZON_DAYS = 180;
const REANCHOR_MS = 6 * 3_600_000;

const FAILURES = [
  'Solde insuffisant sur le compte du client',
  'Paiement refusé par le client',
  'Délai de confirmation dépassé',
];
const FIRST_NAMES = [
  'Aminata',
  'Moussa',
  'Fatou',
  'Cheikh',
  'Awa',
  'Ibrahima',
  'Mariama',
  'Ousmane',
  'Khady',
  'Abdou',
];

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Générateur pseudo-aléatoire reproductible (mulberry32). */
function random(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickStatus(r: number, ageMs: number, canPartial: boolean): PaymentStatus {
  if (ageMs < 20 * 60_000) return r < 0.5 ? 'PENDING' : r < 0.7 ? 'PROCESSING' : 'SUCCESS';
  if (r < 0.79) return 'SUCCESS';
  if (r < 0.86) return 'FAILED';
  if (r < 0.9) return 'EXPIRED';
  if (r < 0.92) return 'CANCELLED';
  if (r < 0.97) return 'REFUNDED';
  return canPartial ? 'PARTIALLY_REFUNDED' : 'SUCCESS';
}

function paymentNumber(date: Date, sequence: number): string {
  const ymd = `${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const seq = String(sequence).padStart(6, '0');
  const check = [...`${ymd}${seq}`].reduce((total, digit) => total + Number(digit), 0) % 10;
  return `PL-${ymd}-${seq}-${check}`;
}

type Generated = { payment: Payment; seededRefund: Refund | null };

function generate(user: StoredUser, anchor: number): Generated[] {
  const organization = user.organization;
  const accounts = user.providerAccounts.filter((account) => account.status === 'ACTIVE');
  if (!organization || accounts.length === 0) return [];

  const rand = random(hash(organization.id));
  const dial = findCountry(organization.country)?.dialCode ?? '+221';
  const currency = user.preferences?.currency ?? organization.defaultCurrency;

  const drafts = Array.from({ length: COUNT }, (_, index) => {
    const ageMs = Math.floor(Math.pow(rand(), 1.7) * HORIZON_DAYS * DAY);
    return { index, ageMs, r: [rand(), rand(), rand(), rand(), rand(), rand()] };
  }).sort((a, b) => b.ageMs - a.ageMs);

  return drafts.map((draft, chronological) => {
    const [rStatus, rAmount, rAccount, rPhone, rFailure, rName] = draft.r as [
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    const account = accounts[Math.floor(rAccount * accounts.length)]!;
    const createdAt = new Date(anchor - draft.ageMs);
    const status = pickStatus(rStatus, draft.ageMs, account.provider !== 'WAVE');
    const amountXof = Math.round((1_000 + Math.pow(rAmount, 2.4) * 149_000) / 500) * 500;
    const amount = amountXof * 100;
    const phoneDigits = String(Math.floor(rPhone * 10_000_000)).padStart(7, '0');
    const prefix = ['77', '78', '76', '70', '75'][Math.floor(rPhone * 5)]!;
    const paid = status === 'SUCCESS' || status === 'REFUNDED' || status === 'PARTIALLY_REFUNDED';
    const paidAt = paid
      ? new Date(createdAt.getTime() + 45_000 + Math.floor(rFailure * 90_000))
      : null;
    const id = `pay_${organization.id.slice(-6)}_${String(draft.index).padStart(4, '0')}`;
    const number = paymentNumber(createdAt, 1 + chronological);

    const payment: Payment = {
      paymentId: id,
      paymentNumber: number,
      correlationId: null,
      applicationId: null,
      providerAccountId: account.id,
      customerId: `cus_${FIRST_NAMES[Math.floor(rName * FIRST_NAMES.length)]!.toLowerCase()}`,
      environment: account.environment,
      provider: account.provider,
      status,
      amount,
      currency,
      payerPhone: `${dial}${prefix}${phoneDigits}`,
      actualPayerPhone: null,
      externalReference: `CMD-${String(10_000 + chronological)}`,
      failureReason: status === 'FAILED' ? FAILURES[Math.floor(rFailure * FAILURES.length)]! : null,
      paidAt: paidAt?.toISOString() ?? null,
      expiresAt: new Date(createdAt.getTime() + 15 * 60_000).toISOString(),
      createdAt: createdAt.toISOString(),
      updatedAt: (paidAt ?? createdAt).toISOString(),
    };

    let seededRefund: Refund | null = null;
    if (status === 'REFUNDED' || status === 'PARTIALLY_REFUNDED') {
      const refundAmount = status === 'REFUNDED' ? amount : Math.round(amount / 200) * 100;
      seededRefund = {
        refundId: `ref_${id}`,
        paymentId: id,
        paymentNumber: number,
        payerPhone: payment.payerPhone,
        amount: refundAmount,
        status: 'SUCCESS',
        reason:
          status === 'REFUNDED'
            ? 'Commande annulée par le client'
            : 'Article manquant à la livraison',
        failureReason: null,
        providerRefundId: `wv_rf_${draft.index}`,
        requestedBy: `${user.firstName} ${user.lastName}`,
        createdAt: new Date(paidAt!.getTime() + 2 * DAY).toISOString(),
      };
      payment.updatedAt = seededRefund.createdAt;
    }
    return { payment, seededRefund };
  });
}

function refundsOf(item: Generated, state: DemoPaymentsState): Refund[] {
  const added = state.refunds[item.payment.paymentId] ?? [];
  return [...added, ...(item.seededRefund ? [item.seededRefund] : [])].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

/** Applique les remboursements faits dans l'interface au statut du paiement. */
function withRefunds(item: Generated, state: DemoPaymentsState): Payment {
  const added = state.refunds[item.payment.paymentId];
  if (!added?.length) return item.payment;
  const refunded = refundsOf(item, state)
    .filter((refund) => refund.status === 'SUCCESS')
    .reduce((total, refund) => total + refund.amount, 0);
  return {
    ...item.payment,
    status: refunded >= item.payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
    updatedAt: added[0]!.createdAt,
  };
}

async function dataset<T>(
  read: (items: Generated[], state: DemoPaymentsState, user: StoredUser) => T,
): Promise<T> {
  return withCurrentUser((user) => {
    const now = Date.now();
    if (!user.payments || now - user.payments.anchor > REANCHOR_MS) {
      user.payments = { anchor: now, refunds: user.payments?.refunds ?? {} };
    }
    return read(generate(user, user.payments.anchor), user.payments, user);
  });
}

function aggregate(payments: Payment[], key: (payment: Payment) => string): AggregateEntry[] {
  const map = new Map<string, AggregateEntry>();
  for (const payment of payments) {
    const k = key(payment);
    const entry = map.get(k) ?? { key: k, count: 0, totalAmount: 0 };
    entry.count += 1;
    entry.totalAmount += payment.amount;
    map.set(k, entry);
  }
  return [...map.values()];
}

function stats(payments: Payment[]): PaymentStats {
  return {
    totalCount: payments.length,
    totalAmount: payments.reduce((total, payment) => total + payment.amount, 0),
    byStatus: aggregate(payments, (payment) => payment.status),
    byProvider: aggregate(payments, (payment) => payment.provider),
  };
}

function inRange(payment: Payment, from: number, to: number): boolean {
  const time = Date.parse(payment.createdAt);
  return time >= from && time < to;
}

function find(items: Generated[], paymentId: string): Generated {
  const item = items.find((entry) => entry.payment.paymentId === paymentId);
  if (!item) throw new ApiError('http', 'Paiement introuvable.', { status: 404 });
  return item;
}

export const demoPaymentsApi: PaymentsApi = {
  async overview(periodDays) {
    await wait(300);
    return dataset((items, state): PaymentOverview => {
      const now = Date.now();
      const span = periodDays * DAY;
      const firstDay = periodStart(periodDays, now);
      const payments = items.map((item) => withRefunds(item, state));
      const current = payments.filter((payment) => inRange(payment, firstDay, now + DAY));
      const previous = payments.filter((payment) => inRange(payment, firstDay - span, firstDay));

      const dailyVolume = Array.from({ length: periodDays }, () => 0);
      const dailyCount = Array.from({ length: periodDays }, () => 0);
      for (const payment of current) {
        const index = Math.floor((Date.parse(payment.createdAt) - firstDay) / DAY);
        if (index < 0 || index >= periodDays) continue;
        dailyCount[index]! += 1;
        if (payment.status === 'SUCCESS' || payment.status === 'PARTIALLY_REFUNDED') {
          dailyVolume[index]! += payment.amount;
        }
      }
      return {
        current: stats(current),
        previous: stats(previous),
        dailyVolume,
        dailyCount,
      };
    });
  },

  async list(query: PaymentQuery): Promise<PaymentPage> {
    await wait(250);
    return dataset((items, state) => {
      const now = Date.now();
      const from = periodStart(query.periodDays, now);
      const needle = query.q?.trim().toLowerCase().replace(/\s/g, '');
      const filtered = items
        .map((item) => withRefunds(item, state))
        .filter((payment) => inRange(payment, from, now + DAY))
        .filter((payment) => !query.status || payment.status === query.status)
        .filter((payment) => !query.provider || payment.provider === query.provider)
        .filter(
          (payment) =>
            !needle ||
            [payment.paymentNumber, payment.payerPhone, payment.externalReference]
              .filter(Boolean)
              .some((value) => value!.toLowerCase().includes(needle)),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const start = query.page * query.size;
      return {
        items: filtered.slice(start, start + query.size),
        total: filtered.length,
        page: query.page,
        size: query.size,
      };
    });
  },

  async get(paymentId) {
    await wait(150);
    return dataset((items, state) => withRefunds(find(items, paymentId), state));
  },

  async history(paymentId) {
    await wait(200);
    return dataset((items, state) => {
      const item = find(items, paymentId);
      const p = item.payment;
      const created = Date.parse(p.createdAt);
      const at = (offset: number) => new Date(created + offset).toISOString();
      const changes: PaymentStatusChange[] = [
        {
          id: `${p.paymentId}-h1`,
          fromStatus: null,
          toStatus: 'PENDING',
          reason: 'Paiement créé',
          triggeredBy: 'API',
          createdAt: at(0),
        },
      ];
      if (p.status !== 'PENDING') {
        changes.push({
          id: `${p.paymentId}-h2`,
          fromStatus: 'PENDING',
          toStatus: 'PROCESSING',
          reason: 'Client redirigé vers le prestataire',
          triggeredBy: 'WEBHOOK',
          createdAt: at(20_000),
        });
      }
      const final: PaymentStatus | null =
        p.status === 'PENDING' || p.status === 'PROCESSING'
          ? null
          : p.status === 'REFUNDED' || p.status === 'PARTIALLY_REFUNDED'
            ? 'SUCCESS'
            : p.status;
      if (final) {
        changes.push({
          id: `${p.paymentId}-h3`,
          fromStatus: 'PROCESSING',
          toStatus: final,
          reason:
            final === 'SUCCESS'
              ? 'Paiement confirmé par le prestataire'
              : final === 'EXPIRED'
                ? 'Lien de paiement expiré'
                : final === 'CANCELLED'
                  ? 'Paiement annulé'
                  : p.failureReason,
          triggeredBy: final === 'EXPIRED' ? 'RECONCILIATION' : 'WEBHOOK',
          createdAt: p.paidAt ?? at(15 * 60_000),
        });
      }
      let paidSoFar = 0;
      for (const refund of [...refundsOf(item, state)].reverse()) {
        if (refund.status !== 'SUCCESS') continue;
        const before: PaymentStatus = paidSoFar > 0 ? 'PARTIALLY_REFUNDED' : 'SUCCESS';
        paidSoFar += refund.amount;
        changes.push({
          id: `${refund.refundId}-h`,
          fromStatus: before,
          toStatus: paidSoFar >= p.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          reason: refund.reason,
          triggeredBy: 'MANUAL',
          createdAt: refund.createdAt,
        });
      }
      return changes;
    });
  },

  async refunds(paymentId) {
    await wait(150);
    return dataset((items, state) => refundsOf(find(items, paymentId), state));
  },

  async refund(paymentId, request) {
    await wait(900);
    return dataset((items, state, user) => {
      const item = find(items, paymentId);
      const payment = withRefunds(item, state);
      if (!isRefundable(payment)) {
        throw new ApiError(
          'http',
          `Impossible de rembourser un paiement au statut ${payment.status}.`,
          { status: 409 },
        );
      }
      const already = refundsOf(item, state)
        .filter((refund) => refund.status === 'SUCCESS')
        .reduce((total, refund) => total + refund.amount, 0);
      const remaining = payment.amount - already;
      const amount = request.amount ?? remaining;
      if (request.amount !== undefined && !supportsPartialRefund(payment) && amount < remaining) {
        throw new ApiError('http', 'Wave ne permet que le remboursement total d’un paiement.', {
          status: 422,
        });
      }
      if (amount <= 0 || amount > remaining) {
        throw new ApiError('http', 'Le montant dépasse le solde remboursable.', { status: 422 });
      }
      const refund: Refund = {
        refundId: `ref_${Date.now().toString(36)}`,
        paymentId,
        paymentNumber: payment.paymentNumber,
        payerPhone: payment.payerPhone,
        amount,
        status: 'SUCCESS',
        reason: request.reason.trim(),
        failureReason: null,
        providerRefundId: `demo_${Date.now().toString(36)}`,
        requestedBy: `${user.firstName} ${user.lastName}`,
        createdAt: new Date().toISOString(),
      };
      state.refunds[paymentId] = [refund, ...(state.refunds[paymentId] ?? [])];
      return refund;
    });
  },
};
