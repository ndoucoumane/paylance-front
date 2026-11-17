import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Copy,
  Eye,
  Phone,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { dashboard as t } from '../../content/dashboard.fr';
import {
  currencyLabel,
  formatAmount,
  formatMoney,
  formatPhone,
  formatShortDateTime,
} from '../../lib/format';
import { useSession } from '../../lib/session/sessionContext';
import type { PaymentProvider } from '../../services/account/types';
import { errorMessage } from '../../services/api/errors';
import { isRefundable } from '../../services/payments/rules';
import type {
  Payment,
  PaymentPage,
  PaymentSort,
  PaymentSortField,
  PaymentStats,
  PaymentStatus,
  PeriodDays,
} from '../../services/payments/types';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { selectClass } from '../ui/form/Field';
import { ActionMenu, type MenuAction } from './ActionMenu';
import { EmptyState } from './EmptyState';
import { PeriodSelector } from './PeriodSelector';
import { ProviderMark } from './ProviderMark';
import { providerNames } from './providers';
import { StatusBadge } from './StatusBadge';
import { useToast } from './toastContext';

const PAGE_SIZE = 12;
const TABS = ['ALL', 'SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'] as const;
type Tab = (typeof TABS)[number];

type Props = {
  periodDays: PeriodDays;
  stats: PaymentStats | null;
  currency: string;
  /** Incrémenté après un remboursement pour recharger la liste. */
  version: number;
  onOpen: (payment: Payment) => void;
  onRefund: (payment: Payment) => void;
  onSchedule?: (payment: Payment) => void;
  /** Affiche le choix de la période à côté du bouton Exporter. */
  onPeriodChange?: (period: PeriodDays) => void;
  /** Bouton « Créer un paiement » de l'état vide (nouveau marchand). */
  onCreate?: () => void;
};

const DEFAULT_SORT: PaymentSort = { field: 'createdAt', direction: 'desc' };
const SORT_KEYS = ['createdAt-desc', 'createdAt-asc', 'amount-desc', 'amount-asc'] as const;
type SortKey = (typeof SORT_KEYS)[number];
const sortKey = (sort: PaymentSort) => `${sort.field}-${sort.direction}` as SortKey;
const fromKey = (key: SortKey): PaymentSort => {
  const [field, direction] = key.split('-') as [PaymentSortField, PaymentSort['direction']];
  return { field, direction };
};

/** En-tête de colonne triable : un clic trie, un second inverse le sens. */
function SortHeader({
  field,
  sort,
  onSort,
  align = 'left',
  className,
  children,
}: {
  field: PaymentSortField;
  sort: PaymentSort;
  onSort: (sort: PaymentSort) => void;
  align?: 'left' | 'right';
  className: string;
  children: ReactNode;
}) {
  const active = sort.field === field;
  const Icon = !active ? ChevronsUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={className}
    >
      <button
        type="button"
        onClick={() =>
          onSort({
            field,
            // Premier clic : du plus grand / plus récent au plus petit / plus ancien.
            direction: active && sort.direction === 'desc' ? 'asc' : 'desc',
          })
        }
        className={`-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium transition-colors hover:bg-neutral-100 hover:text-neutral-900 ${
          active ? 'text-neutral-900' : ''
        } ${align === 'right' ? 'flex-row-reverse' : ''}`}
      >
        {children}
        <Icon
          aria-hidden="true"
          className={`h-3.5 w-3.5 ${active ? 'text-neutral-900' : 'text-neutral-400'}`}
        />
      </button>
    </th>
  );
}

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function SkeletonRows() {
  return (
    <ul aria-hidden="true" className="divide-y divide-neutral-100">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="flex items-center gap-4 px-5 py-4 sm:px-6">
          <div className="ui-skeleton h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="ui-skeleton h-3 w-40 rounded" />
            <div className="ui-skeleton h-3 w-24 rounded" />
          </div>
          <div className="ui-skeleton h-4 w-20 rounded" />
          <div className="ui-skeleton hidden h-5 w-20 rounded-full sm:block" />
        </li>
      ))}
    </ul>
  );
}

/** Liste des transactions : filtres, recherche, export, tableau (bureau) ou cartes (mobile). */
export function TransactionsTable({
  periodDays,
  stats,
  currency,
  version,
  onOpen,
  onRefund,
  onSchedule,
  onPeriodChange,
  onCreate,
}: Props) {
  const { api } = useSession();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('ALL');
  const [provider, setProvider] = useState<PaymentProvider | ''>('');
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PaymentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sort, setSort] = useState<PaymentSort>(DEFAULT_SORT);

  useEffect(() => setPage(0), [tab, provider, q, periodDays, sort]);

  const query = useMemo(
    () => ({
      periodDays,
      status: tab === 'ALL' ? undefined : (tab as PaymentStatus),
      provider: provider || undefined,
      q: q || undefined,
      sort,
      page,
      size: PAGE_SIZE,
    }),
    [periodDays, tab, provider, q, sort, page],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.payments.list(query).then(
      (result) => {
        if (cancelled) return;
        setData(result);
        setLoading(false);
      },
      (cause: unknown) => {
        if (cancelled) return;
        setError(errorMessage(cause));
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [api, query, version]);

  const counts = useMemo(() => {
    const byStatus = new Map(stats?.byStatus.map((entry) => [entry.key, entry.count]));
    return {
      ALL: stats?.totalCount,
      SUCCESS: byStatus.get('SUCCESS') ?? 0,
      PENDING: byStatus.get('PENDING') ?? 0,
      FAILED: byStatus.get('FAILED') ?? 0,
      REFUNDED: byStatus.get('REFUNDED') ?? 0,
    } as Record<Tab, number | undefined>;
  }, [stats]);

  const copy = (value: string) =>
    void navigator.clipboard?.writeText(value).then(() => toast(t.actions.copied));

  const actionsFor = (payment: Payment): MenuAction[] => [
    { id: 'view', label: t.actions.view, icon: Eye, onSelect: () => onOpen(payment) },
    {
      id: 'number',
      label: t.actions.copyNumber,
      icon: Copy,
      onSelect: () => copy(payment.paymentNumber),
    },
    {
      id: 'phone',
      label: t.actions.copyPhone,
      icon: Phone,
      onSelect: () => copy(payment.payerPhone ?? ''),
      disabled: !payment.payerPhone,
    },
    {
      id: 'refund',
      label: t.actions.refund,
      icon: RotateCcw,
      onSelect: () => onRefund(payment),
      disabled: !isRefundable(payment),
      hint: t.actions.refundUnavailable,
      separated: true,
    },
    ...(onSchedule
      ? [
          {
            id: 'schedule',
            label: t.actions.schedule,
            icon: CalendarClock,
            onSelect: () => onSchedule(payment),
            disabled: !isRefundable(payment),
            hint: t.actions.refundUnavailable,
          },
        ]
      : []),
  ];

  const exportCsv = async () => {
    setExporting(true);
    try {
      const all = await api.payments.list({ ...query, page: 0, size: 1000 });
      const header = [
        'Numéro',
        'Date',
        'Opérateur',
        'Téléphone',
        'Référence',
        'Montant',
        'Devise',
        'Statut',
      ];
      const rows = all.items.map((p) => [
        p.paymentNumber,
        p.createdAt,
        providerNames[p.provider],
        p.payerPhone ?? '',
        p.externalReference ?? '',
        String(p.amount / 100),
        p.currency,
        t.statuses[p.status],
      ]);
      const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(';'))
        .join('\n');
      const url = URL.createObjectURL(
        new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }),
      );
      const link = Object.assign(document.createElement('a'), {
        href: url,
        download: `transactions-${periodDays}j.csv`,
      });
      link.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setExporting(false);
    }
  };

  const filtered = tab !== 'ALL' || provider !== '' || q !== '';
  const total = data?.total ?? 0;
  const from = total ? page * PAGE_SIZE + 1 : 0;
  const to = Math.min(total, (page + 1) * PAGE_SIZE);
  const unit = currencyLabel(currency);

  return (
    <section
      aria-labelledby="transactions-titre"
      className="rounded-2xl bg-white ring-1 ring-neutral-200"
    >
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
        <div>
          <h2 id="transactions-titre" className="text-base font-semibold text-neutral-950">
            {t.table.title}
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            {t.table.subtitle(stats?.totalCount ?? 0)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onPeriodChange && <PeriodSelector value={periodDays} onChange={onPeriodChange} />}
          <button
            type="button"
            onClick={() => void exportCsv()}
            disabled={exporting || total === 0}
            className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold text-neutral-900 ring-1 ring-inset ring-neutral-950/15 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? t.exporting : t.export}
          </button>
        </div>
      </div>

      {/* Onglets de statut */}
      <div className="mt-5 overflow-x-auto px-5 sm:px-6">
        <div
          role="tablist"
          aria-label={t.table.tabsLabel}
          className="flex gap-1 border-b border-neutral-200"
        >
          {TABS.map((item) => {
            const selected = tab === item;
            return (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(item)}
                className={`-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  selected
                    ? 'border-neutral-950 text-neutral-950'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {t.table.tabs[item]}
                {counts[item] !== undefined && (
                  <span
                    className={`rounded-full px-1.5 py-px text-[0.6875rem] font-semibold tabular-nums ${
                      selected ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {counts[item]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recherche et filtre */}
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:px-6">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.table.search}
            aria-label={t.table.searchLabel}
            className="h-10 w-full rounded-full border border-neutral-200 bg-neutral-50 pl-10 pr-4 text-sm text-neutral-950 transition-colors placeholder:text-neutral-400 hover:border-neutral-300 focus:border-primary-strong focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/15"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:flex">
          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value as PaymentProvider | '')}
            aria-label={t.table.providerLabel}
            className={`${selectClass} h-10 rounded-full border-neutral-200 bg-neutral-50 text-sm md:w-56`}
          >
            <option value="">{t.table.providerAll}</option>
            {(Object.keys(providerNames) as PaymentProvider[]).map((key) => (
              <option key={key} value={key}>
                {providerNames[key]}
              </option>
            ))}
          </select>
          {/* Sur mobile, pas d'en-têtes de colonnes : le tri passe par une liste. */}
          <select
            value={sortKey(sort)}
            onChange={(event) => setSort(fromKey(event.target.value as SortKey))}
            aria-label={t.table.sortLabel}
            className={`${selectClass} h-10 rounded-full border-neutral-200 bg-neutral-50 text-sm md:hidden`}
          >
            {SORT_KEYS.map((key) => (
              <option key={key} value={key}>
                {t.table.sorts[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="px-5 pb-4 sm:px-6">
          <Alert tone="error" title={t.table.emptyTitle}>
            {error}
          </Alert>
        </div>
      )}

      {/* Liste */}
      <div className="border-t border-neutral-100" aria-busy={loading}>
        {loading && !data ? (
          <SkeletonRows />
        ) : data && data.items.length === 0 ? (
          filtered ? (
            <EmptyState
              variant="search"
              title={t.table.emptySearchTitle}
              text={t.table.emptyFiltered}
              action={
                <Button
                  variant="secondaryLight"
                  onClick={() => {
                    setTab('ALL');
                    setProvider('');
                    setSearch('');
                  }}
                >
                  {t.table.resetFilters}
                </Button>
              }
            />
          ) : periodDays === 90 ? (
            // Rien sur la plus longue période : très probablement un nouveau marchand.
            <EmptyState
              variant="transactions"
              title={t.table.emptyNewTitle}
              text={t.table.emptyNewText}
              action={
                onCreate && (
                  <Button onClick={onCreate}>
                    <Plus aria-hidden="true" className="h-4 w-4" />
                    {t.table.emptyNewCta}
                  </Button>
                )
              }
            />
          ) : (
            <EmptyState
              variant="transactions"
              title={t.table.emptyTitle}
              text={t.table.emptyPeriod}
              action={
                onPeriodChange && (
                  <Button variant="secondaryLight" onClick={() => onPeriodChange(90)}>
                    {t.periods[90]}
                  </Button>
                )
              }
            />
          )
        ) : data ? (
          <div className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
            {/* Bureau */}
            <table className="hidden w-full border-collapse text-left md:table">
              <thead>
                <tr className="text-xs font-medium text-neutral-500">
                  <SortHeader
                    field="createdAt"
                    sort={sort}
                    onSort={setSort}
                    className="py-3 pl-6 pr-3"
                  >
                    {t.table.columns.transaction}
                    <span className="sr-only"> ({t.table.date})</span>
                  </SortHeader>
                  <th scope="col" className="px-3 py-3 font-medium">
                    {t.table.columns.customer}
                  </th>
                  <th scope="col" className="hidden px-3 py-3 font-medium lg:table-cell">
                    {t.table.columns.provider}
                  </th>
                  <SortHeader
                    field="amount"
                    sort={sort}
                    onSort={setSort}
                    align="right"
                    className="px-3 py-3 text-right"
                  >
                    {t.table.columns.amount}
                  </SortHeader>
                  <th scope="col" className="px-3 py-3 font-medium">
                    {t.table.columns.status}
                  </th>
                  <th scope="col" className="py-3 pl-3 pr-6 text-right font-medium">
                    <span className="sr-only">{t.table.columns.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 border-t border-neutral-100">
                {data.items.map((payment) => (
                  <tr
                    key={payment.paymentId}
                    onClick={() => onOpen(payment)}
                    className="group cursor-pointer transition-colors hover:bg-neutral-50/80"
                  >
                    <td className="py-3.5 pl-6 pr-3">
                      <div className="flex items-center gap-3">
                        <span className="lg:hidden">
                          <ProviderMark provider={payment.provider} />
                        </span>
                        <div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onOpen(payment);
                            }}
                            aria-label={t.table.openDetail(payment.paymentNumber)}
                            className="rounded font-mono text-[0.8125rem] font-medium text-neutral-950 underline-offset-4 group-hover:underline"
                          >
                            {payment.paymentNumber}
                          </button>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {formatShortDateTime(payment.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="whitespace-nowrap text-sm tabular-nums text-neutral-800">
                        {formatPhone(payment.payerPhone)}
                      </p>
                      {payment.externalReference && (
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {payment.externalReference}
                        </p>
                      )}
                    </td>
                    <td className="hidden px-3 py-3.5 lg:table-cell">
                      <div className="flex items-center gap-2.5">
                        <ProviderMark provider={payment.provider} size="sm" />
                        <span className="text-sm text-neutral-800">
                          {providerNames[payment.provider]}
                        </span>
                        {payment.environment === 'TEST' && (
                          <span className="rounded bg-neutral-100 px-1.5 py-px text-[0.625rem] font-semibold uppercase tracking-wide text-neutral-500">
                            {t.table.test}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-right">
                      <span className="text-[15px] font-semibold tabular-nums text-neutral-950">
                        {formatAmount(payment.amount)}
                      </span>
                      <span className="ml-1 text-xs text-neutral-500">{unit}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td
                      className="py-3.5 pl-3 pr-6 text-right"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <ActionMenu
                        label={t.actions.label(payment.paymentNumber)}
                        actions={actionsFor(payment)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile */}
            <ul className="divide-y divide-neutral-100 md:hidden">
              {data.items.map((payment) => (
                <li key={payment.paymentId} className="flex items-center gap-2 py-3.5 pl-5 pr-3">
                  <button
                    type="button"
                    onClick={() => onOpen(payment)}
                    aria-label={t.table.openDetail(payment.paymentNumber)}
                    className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                  >
                    <span className="min-w-0">
                      <span className="block whitespace-nowrap font-mono text-xs font-medium text-neutral-950">
                        {payment.paymentNumber}
                      </span>
                      <span className="mt-1 block truncate text-xs text-neutral-500">
                        {providerNames[payment.provider]} · {formatShortDateTime(payment.createdAt)}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-neutral-950">
                        {formatMoney(payment.amount, payment.currency)}
                      </span>
                      <StatusBadge status={payment.status} />
                    </span>
                  </button>
                  <ActionMenu
                    label={t.actions.label(payment.paymentNumber)}
                    actions={actionsFor(payment)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {/* Pagination */}
      {data && total > 0 && (
        <div className="flex items-center justify-between gap-4 border-t border-neutral-100 px-5 py-3.5 sm:px-6">
          <p className="text-sm tabular-nums text-neutral-500">{t.table.range(from, to, total)}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              disabled={page === 0 || loading}
              aria-label={t.table.previous}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 ring-1 ring-inset ring-neutral-950/15 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((value) => value + 1)}
              disabled={to >= total || loading}
              aria-label={t.table.next}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 ring-1 ring-inset ring-neutral-950/15 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
