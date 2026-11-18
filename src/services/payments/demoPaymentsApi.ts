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
  RefundRequest,
  ScheduledRefund,
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
  /** Paiements créés depuis l'interface. */
  created?: Payment[];
  /** Remboursements programmés (exécutés à la lecture suivante leur échéance passée). */
  scheduled?: ScheduledRefund[];
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

/** Un paiement créé dans l'interface est confirmé par le « client » une minute plus tard. */
const SETTLE_MS = 60_000;

function settle(payment: Payment, now: number): Payment {
  const created = Date.parse(payment.createdAt);
  if (payment.status !== 'PENDING' || now - created < SETTLE_MS) return payment;
  const paidAt = new Date(created + SETTLE_MS).toISOString();
  return { ...payment, status: 'SUCCESS', paidAt, updatedAt: paidAt };
}

function remainingOf(item: Generated, state: DemoPaymentsState): number {
  const refunded = refundsOf(item, state)
    .filter((refund) => refund.status === 'SUCCESS')
    .reduce((total, refund) => total + refund.amount, 0);
  return item.payment.amount - refunded;
}

/** Règles du RefundService : statut remboursable, Wave en totalité, solde suffisant. */
function applyRefund(
  item: Generated,
  state: DemoPaymentsState,
  request: RefundRequest,
  requestedBy: string,
  at = new Date(),
): Refund {
  const payment = withRefunds(item, state);
  if (!isRefundable(payment)) {
    throw new ApiError(
      'http',
      `Impossible de rembourser un paiement au statut ${payment.status}.`,
      { status: 409 },
    );
  }
  const remaining = remainingOf(item, state);
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
    refundId: `ref_${at.getTime().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`,
    paymentId: payment.paymentId,
    paymentNumber: payment.paymentNumber,
    payerPhone: payment.payerPhone,
    amount,
    status: 'SUCCESS',
    reason: request.reason.trim(),
    failureReason: null,
    providerRefundId: `demo_${at.getTime().toString(36)}`,
    requestedBy,
    createdAt: at.toISOString(),
  };
  state.refunds[payment.paymentId] = [refund, ...(state.refunds[payment.paymentId] ?? [])];
  return refund;
}

/** Exécute les remboursements programmés arrivés à échéance. */
function runSchedules(items: Generated[], state: DemoPaymentsState, now: number) {
  for (const schedule of state.scheduled ?? []) {
    if (schedule.status !== 'SCHEDULED' || Date.parse(schedule.scheduledAt) > now) continue;
    const item = items.find((entry) => entry.payment.paymentId === schedule.paymentId);
    try {
      if (!item) throw new Error('Paiement introuvable.');
      const refund = applyRefund(
        item,
        state,
        { amount: schedule.amount ?? undefined, reason: schedule.reason },
        schedule.createdBy ?? 'Programmation',
        new Date(schedule.scheduledAt),
      );
      schedule.status = 'EXECUTED';
      schedule.refundId = refund.refundId;
    } catch (cause) {
      schedule.status = 'FAILED';
      schedule.failureReason = cause instanceof Error ? cause.message : 'Échec du remboursement.';
    }
  }
}

async function dataset<T>(
  read: (items: Generated[], state: DemoPaymentsState, user: StoredUser) => T,
): Promise<T> {
  return withCurrentUser((user) => {
    const now = Date.now();
    if (!user.payments || now - user.payments.anchor > REANCHOR_MS) {
      user.payments = { ...user.payments, anchor: now, refunds: user.payments?.refunds ?? {} };
    }
    const state = user.payments;
    const created = (state.created ?? []).map((payment) => ({
      payment: settle(payment, now),
      seededRefund: null,
    }));
    const items = [...generate(user, state.anchor), ...created];
    runSchedules(items, state, now);
    return read(items, state, user);
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

      const series = (list: Payment[], start: number) => {
        const volume = Array.from({ length: periodDays }, () => 0);
        const count = Array.from({ length: periodDays }, () => 0);
        for (const payment of list) {
          const index = Math.floor((Date.parse(payment.createdAt) - start) / DAY);
          if (index < 0 || index >= periodDays) continue;
          count[index]! += 1;
          if (payment.status === 'SUCCESS' || payment.status === 'PARTIALLY_REFUNDED') {
            volume[index]! += payment.amount;
          }
        }
        return { volume, count };
      };
      const { volume: dailyVolume, count: dailyCount } = series(current, firstDay);
      const { volume: previousDailyVolume } = series(previous, firstDay - span);
      return {
        current: stats(current),
        previous: stats(previous),
        dailyVolume,
        dailyCount,
        previousDailyVolume,
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
        .sort((a, b) => {
          const sort = query.sort ?? { field: 'createdAt', direction: 'desc' };
          const diff =
            sort.field === 'amount' ? a.amount - b.amount : a.createdAt.localeCompare(b.createdAt);
          // À montant égal, la plus récente d'abord.
          const ordered = sort.direction === 'asc' ? diff : -diff;
          return ordered || b.createdAt.localeCompare(a.createdAt);
        });
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
    return dataset((items, state, user) =>
      applyRefund(find(items, paymentId), state, request, `${user.firstName} ${user.lastName}`),
    );
  },

  async create(request) {
    await wait(900);
    return dataset((items, state, user) => {
      const account = user.providerAccounts.find((entry) => entry.id === request.providerAccountId);
      if (!account || account.status !== 'ACTIVE') {
        throw new ApiError('http', 'Ce compte prestataire n’est pas actif.', { status: 422 });
      }
      if (!Number.isInteger(request.amount) || request.amount < 100 * 100) {
        throw new ApiError('http', 'Le montant minimum est de 100.', { status: 422 });
      }
      if (!/^\+\d{9,14}$/.test(request.payerPhone)) {
        throw new ApiError('http', 'Numéro de téléphone invalide.', { status: 422 });
      }
      const now = new Date();
      const sequence = items.length + 1;
      const number = paymentNumber(now, sequence);
      const payment: Payment = {
        paymentId: `pay_ui_${now.getTime().toString(36)}`,
        paymentNumber: number,
        correlationId: null,
        applicationId: null,
        providerAccountId: account.id,
        customerId: null,
        environment: account.environment,
        provider: account.provider,
        status: 'PENDING',
        amount: request.amount,
        currency: user.preferences?.currency ?? user.organization?.defaultCurrency ?? 'XOF',
        payerPhone: request.payerPhone,
        actualPayerPhone: null,
        externalReference: request.externalReference?.trim() || null,
        failureReason: null,
        paidAt: null,
        expiresAt: new Date(now.getTime() + request.expiresInMinutes * 60_000).toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      state.created = [payment, ...(state.created ?? [])];
      return payment;
    });
  },

  async scheduledRefunds() {
    await wait(200);
    return dataset((items, state) =>
      (state.scheduled ?? [])
        .map((schedule): ScheduledRefund => {
          const item = items.find((entry) => entry.payment.paymentId === schedule.paymentId);
          if (!item) return { ...schedule };
          const executed = schedule.refundId
            ? refundsOf(item, state).find((refund) => refund.refundId === schedule.refundId)
            : undefined;
          const effectiveAmount = executed
            ? executed.amount
            : (schedule.amount ??
              (schedule.status === 'SCHEDULED' ? remainingOf(item, state) : null));
          return { ...schedule, effectiveAmount, paymentAmount: item.payment.amount };
        })
        .sort((a, b) => {
          // Prochaines échéances d'abord, puis l'historique du plus récent au plus ancien.
          const pendingA = a.status === 'SCHEDULED' ? 0 : 1;
          const pendingB = b.status === 'SCHEDULED' ? 0 : 1;
          if (pendingA !== pendingB) return pendingA - pendingB;
          return pendingA === 0
            ? a.scheduledAt.localeCompare(b.scheduledAt)
            : b.scheduledAt.localeCompare(a.scheduledAt);
        }),
    );
  },

  async scheduleRefund(paymentId, request) {
    await wait(700);
    return dataset((items, state, user) => {
      const item = find(items, paymentId);
      const payment = withRefunds(item, state);
      if (!isRefundable(payment)) {
        throw new ApiError('http', 'Seul un paiement réussi peut être remboursé.', {
          status: 409,
        });
      }
      const when = Date.parse(request.scheduledAt);
      if (Number.isNaN(when) || when < Date.now() + 60_000) {
        throw new ApiError('http', 'La date d’exécution doit être dans le futur.', {
          status: 422,
        });
      }
      if (
        (state.scheduled ?? []).some(
          (entry) => entry.paymentId === paymentId && entry.status === 'SCHEDULED',
        )
      ) {
        throw new ApiError('http', 'Un remboursement est déjà programmé pour ce paiement.', {
          status: 409,
        });
      }
      const remaining = remainingOf(item, state);
      if (request.amount !== undefined) {
        if (!supportsPartialRefund(payment) && request.amount < remaining) {
          throw new ApiError('http', 'Wave ne permet que le remboursement total d’un paiement.', {
            status: 422,
          });
        }
        if (request.amount <= 0 || request.amount > remaining) {
          throw new ApiError('http', 'Le montant dépasse le solde remboursable.', {
            status: 422,
          });
        }
      }
      const schedule: ScheduledRefund = {
        id: `sch_${Date.now().toString(36)}`,
        paymentId,
        paymentNumber: payment.paymentNumber,
        provider: payment.provider,
        payerPhone: payment.payerPhone,
        amount: request.amount ?? null,
        currency: payment.currency,
        reason: request.reason.trim(),
        scheduledAt: new Date(when).toISOString(),
        status: 'SCHEDULED',
        refundId: null,
        failureReason: null,
        createdBy: `${user.firstName} ${user.lastName}`,
        createdAt: new Date().toISOString(),
      };
      state.scheduled = [schedule, ...(state.scheduled ?? [])];
      return schedule;
    });
  },

  async cancelScheduledRefund(id) {
    await wait(400);
    return dataset((_items, state) => {
      const schedule = state.scheduled?.find((entry) => entry.id === id);
      if (!schedule) throw new ApiError('http', 'Programmation introuvable.', { status: 404 });
      if (schedule.status !== 'SCHEDULED') {
        throw new ApiError('http', 'Ce remboursement n’est plus modifiable.', { status: 409 });
      }
      schedule.status = 'CANCELLED';
      return { ...schedule };
    });
  },
};
