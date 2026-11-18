import { currentOrganizationId, token } from '../account/liveAccountApi';
import { ApiError } from '../api/errors';
import { apiRequest } from '../api/http';
import { periodStart } from './rules';
import type {
  Payment,
  PaymentOverview,
  PaymentPage,
  PaymentQuery,
  PaymentsApi,
  PaymentStats,
  PaymentStatusChange,
  Refund,
} from './types';

/** API réelle : DashboardPaymentController (GET /payments, /payments/stats, historique, remboursements). */

const DAY = 86_400_000;

/** Page Spring : sérialisation historique ou `VIA_DTO` (objet `page`). */
type SpringPage<T> = {
  content: T[];
  totalElements?: number;
  number?: number;
  size?: number;
  page?: { totalElements: number; number: number; size: number };
};

/** Instant UTC avec `Z` (ex. `2026-11-18T08:00:00.000Z`), accepté par `from` et `to`. */
function isoUtc(time: number): string {
  return new Date(time).toISOString();
}

async function auth() {
  return { token: await token(), organizationId: await currentOrganizationId() };
}

async function fetchStats(from: number, to: number): Promise<PaymentStats> {
  const params = new URLSearchParams({ from: isoUtc(from), to: isoUtc(to) });
  return apiRequest<PaymentStats>(`/api/v1/dashboard/payments/stats?${params}`, await auth());
}

const path = (paymentId: string) => `/api/v1/dashboard/payments/${encodeURIComponent(paymentId)}`;

export const livePaymentsApi: PaymentsApi = {
  async overview(periodDays): Promise<PaymentOverview> {
    const now = Date.now();
    const span = periodDays * DAY;
    const start = periodStart(periodDays, now);
    const [current, previous] = await Promise.all([
      fetchStats(start, now),
      fetchStats(start - span, start),
    ]);
    // Le backend ne fournit pas encore de série quotidienne : pas de courbe plutôt qu'une courbe inventée.
    return { current, previous, dailyVolume: null, dailyCount: null, previousDailyVolume: null };
  },

  async list(query: PaymentQuery): Promise<PaymentPage> {
    const params = new URLSearchParams({
      page: String(query.page),
      size: String(query.size),
      // Pageable Spring : « champ,sens ».
      sort: `${query.sort?.field ?? 'createdAt'},${query.sort?.direction ?? 'desc'}`,
      from: isoUtc(periodStart(query.periodDays)),
    });
    if (query.status) params.set('status', query.status);
    if (query.provider) params.set('provider', query.provider);
    if (query.q?.trim()) params.set('q', query.q.trim());
    const page = await apiRequest<SpringPage<Payment>>(
      `/api/v1/dashboard/payments?${params}`,
      await auth(),
    );
    return {
      items: page.content,
      total: page.page?.totalElements ?? page.totalElements ?? page.content.length,
      page: page.page?.number ?? page.number ?? query.page,
      size: page.page?.size ?? page.size ?? query.size,
    };
  },

  async get(paymentId) {
    return apiRequest<Payment>(path(paymentId), await auth());
  },

  async history(paymentId) {
    return apiRequest<PaymentStatusChange[]>(`${path(paymentId)}/history`, await auth());
  },

  async refunds(paymentId) {
    return apiRequest<Refund[]>(`${path(paymentId)}/refunds`, await auth());
  },

  async refund(paymentId, request, options) {
    return apiRequest<Refund>(`${path(paymentId)}/refunds`, {
      method: 'POST',
      body: request,
      idempotencyKey: options?.idempotencyKey,
      ...(await auth()),
    });
  },

  // Pas encore d'endpoint côté DashboardPaymentController : message explicite plutôt qu'un 404.
  async create() {
    throw ApiError.notAvailable('Création de paiement depuis le tableau de bord');
  },

  async scheduledRefunds() {
    throw ApiError.notAvailable('Remboursements programmés');
  },

  async scheduleRefund() {
    throw ApiError.notAvailable('Remboursements programmés');
  },

  async cancelScheduledRefund() {
    throw ApiError.notAvailable('Remboursements programmés');
  },
};
