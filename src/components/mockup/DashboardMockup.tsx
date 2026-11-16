import {
  ArrowLeftRight,
  ArrowUpRight,
  CalendarDays,
  CircleCheck,
  Clock3,
  Code2,
  Download,
  LayoutDashboard,
  ListChecks,
  RotateCcw,
  Search,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { fr } from '../../content/fr';
import { formatNumber } from '../../lib/format';

type Mockup = typeof fr.mockup;
type Provider = keyof Mockup['providers'];
type Status = Mockup['transactions'][number]['status'];
type NavIcon = Mockup['nav'][number]['icon'];

const navIcons: Record<NavIcon, LucideIcon> = {
  overview: LayoutDashboard,
  transactions: ArrowLeftRight,
  refunds: RotateCcw,
  reconciliation: ListChecks,
  customers: Users,
  developers: Code2,
};

/** Couleur de chaque opérateur, partagée par le graphique, la répartition et le tableau. */
const providerColors: Record<Provider, string> = {
  wave: 'bg-primary',
  orange: 'bg-neutral-800',
};

const statusStyles: Record<Status, { pill: string; dot: string }> = {
  success: { pill: 'bg-primary-soft text-primary-strong', dot: 'bg-primary' },
  pending: { pill: 'bg-accent-soft text-accent-strong', dot: 'bg-accent' },
  refunded: { pill: 'bg-neutral-100 text-neutral-700', dot: 'bg-neutral-400' },
};

const CHART_MAX = Math.max(...fr.mockup.chartTicks.map((tick) => tick.value));

type Props = {
  /** Version réduite pour la page de connexion (sans barre latérale ni répartition). */
  compact?: boolean;
  className?: string;
};

/**
 * Maquette du tableau de bord marchand Paylance, entièrement en HTML/CSS.
 * Exposée aux technologies d'assistance comme une seule image décrite.
 */
export function DashboardMockup({ compact = false, className = '' }: Props) {
  const { mockup } = fr;
  const kpis = compact ? mockup.kpis.slice(0, 2) : mockup.kpis;
  const transactions = compact ? mockup.transactions.slice(0, 3) : mockup.transactions;

  return (
    <figure role="img" aria-label={mockup.label} className={`relative ${className}`}>
      <div
        aria-hidden="true"
        className="flex overflow-hidden rounded-xl bg-white text-left text-neutral-950 shadow-float"
      >
        {!compact && <Sidebar />}

        <div className="min-w-0 flex-1">
          {/* Barre supérieure */}
          <div className="flex h-14 items-center justify-between gap-3 border-b border-neutral-200 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <p className="truncate text-sm font-semibold">{mockup.title}</p>
              <span className="hidden items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-[0.6875rem] font-medium text-neutral-600 min-[400px]:inline-flex">
                <CalendarDays className="h-3.5 w-3.5" />
                {mockup.period}
              </span>
            </div>
            {!compact && (
              <div className="flex items-center gap-2">
                <span className="hidden h-8 w-56 items-center gap-2 rounded-full bg-neutral-100 px-3 text-xs text-neutral-500 lg:flex">
                  <Search className="h-3.5 w-3.5" />
                  {mockup.search}
                </span>
                <span className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold shadow-[inset_0_0_0_1px_rgba(10,10,10,0.15)]">
                  <Download className="h-3.5 w-3.5" />
                  {mockup.export}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3 bg-neutral-50 p-3 sm:space-y-4 sm:p-5">
            {/* Indicateurs */}
            <div className={`grid grid-cols-2 gap-3 ${compact ? '' : 'lg:grid-cols-4'} sm:gap-4`}>
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-lg bg-white p-3 ring-1 ring-neutral-200 sm:p-4"
                >
                  <p className="text-xs font-medium text-neutral-500">{kpi.label}</p>
                  <p className="mt-1.5 whitespace-nowrap text-lg font-semibold tabular-nums tracking-tight sm:text-xl">
                    {kpi.value}
                    {'unit' in kpi && kpi.unit && (
                      <span className="ml-1 text-xs font-medium text-neutral-500">{kpi.unit}</span>
                    )}
                  </p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[0.6875rem]">
                    <span className="inline-flex items-center gap-0.5 font-semibold text-primary-strong">
                      <ArrowUpRight className="h-3 w-3" />
                      {kpi.delta}
                    </span>
                    <span className="text-neutral-500">{kpi.note}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className={`grid gap-3 sm:gap-4 ${compact ? '' : 'lg:grid-cols-3'}`}>
              <DailyChart compact={compact} />
              {!compact && <ProviderSplit />}
            </div>

            <TransactionsTable compact={compact} transactions={transactions} />
          </div>
        </div>
      </div>
      {compact && (
        <figcaption aria-hidden="true" className="mt-3 text-center text-xs text-ink-muted">
          {fr.common.illustrativeData}
        </figcaption>
      )}
    </figure>
  );
}

function Sidebar() {
  const { mockup } = fr;
  return (
    <div className="hidden w-52 shrink-0 flex-col border-r border-neutral-200 bg-white p-3 md:flex">
      <div className="flex items-center gap-2.5 rounded-lg p-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-950 text-[0.6875rem] font-semibold text-white">
          BT
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold">{mockup.merchant}</span>
          <span className="block truncate text-[0.6875rem] text-neutral-500">
            {mockup.merchantMode}
          </span>
        </span>
      </div>
      <ul className="mt-4 space-y-0.5">
        {mockup.nav.map((item) => {
          const Icon = navIcons[item.icon];
          const active = 'active' in item && item.active;
          return (
            <li
              key={item.label}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs ${
                active
                  ? 'bg-neutral-100 font-semibold text-neutral-950'
                  : 'font-medium text-neutral-500'
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? 'text-primary-strong' : ''}`} />
              {item.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Legend() {
  const { providers } = fr.mockup;
  return (
    <div className="flex items-center gap-3 text-[0.6875rem] text-neutral-600">
      {(Object.keys(providers) as Provider[]).map((provider) => (
        <span key={provider} className="inline-flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-sm ${providerColors[provider]}`} />
          {providers[provider]}
        </span>
      ))}
    </div>
  );
}

function DailyChart({ compact }: { compact: boolean }) {
  const { mockup } = fr;
  const days = compact ? mockup.chartDays.slice(-7) : mockup.chartDays;
  return (
    <div className="rounded-lg bg-white p-3 ring-1 ring-neutral-200 sm:p-4 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{mockup.chartTitle}</p>
          <p className="text-[0.6875rem] text-neutral-500">{mockup.chartSubtitle}</p>
        </div>
        <Legend />
      </div>

      <div className="mt-4 flex gap-2">
        {/* Axe vertical */}
        <div
          className={`flex shrink-0 flex-col justify-between text-right text-[0.625rem] tabular-nums text-neutral-400 ${
            compact ? 'h-28' : 'h-40 sm:h-44'
          }`}
        >
          {mockup.chartTicks.map((tick) => (
            <span key={tick.value} className="-my-1.5 leading-3">
              {tick.label}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className={`relative ${compact ? 'h-28' : 'h-40 sm:h-44'}`}>
            {/* Lignes de graduation */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {mockup.chartTicks.map((tick) => (
                <span
                  key={tick.value}
                  className={`border-t ${tick.value === 0 ? 'border-neutral-300' : 'border-dashed border-neutral-200'}`}
                />
              ))}
            </div>
            {/* Barres empilées : Wave en bas, Orange Money au-dessus */}
            <div className="absolute inset-0 flex items-end gap-1 sm:gap-1.5">
              {days.map((day, index) => {
                const isToday = index === days.length - 1;
                return (
                  <div
                    key={day.day}
                    className={`flex flex-1 flex-col overflow-hidden rounded-t-[3px] ${isToday ? '' : 'opacity-85'}`}
                    style={{ height: `${((day.wave + day.orange) / CHART_MAX) * 100}%` }}
                  >
                    <span className={providerColors.orange} style={{ flexGrow: day.orange }} />
                    <span className={providerColors.wave} style={{ flexGrow: day.wave }} />
                  </div>
                );
              })}
            </div>
          </div>
          {/* Axe horizontal */}
          <div className="mt-2 flex gap-1 text-center text-[0.625rem] tabular-nums text-neutral-400 sm:gap-1.5">
            {days.map((day, index) => (
              <span
                key={day.day}
                className={`flex-1 ${index % 2 === 1 && index !== days.length - 1 ? 'invisible sm:visible' : ''} ${
                  index === days.length - 1 ? 'font-semibold text-neutral-700' : ''
                }`}
              >
                {day.day}
              </span>
            ))}
          </div>
          <p className="mt-1 text-right text-[0.625rem] text-neutral-400">{mockup.chartMonth}</p>
        </div>
      </div>
    </div>
  );
}

function ProviderSplit() {
  const { mockup } = fr;
  return (
    <div className="flex flex-col rounded-lg bg-white p-3 ring-1 ring-neutral-200 sm:p-4">
      <p className="text-sm font-semibold">{mockup.splitTitle}</p>
      <p className="mt-3 text-[0.6875rem] text-neutral-500">{mockup.splitTotal}</p>
      <p className="mt-0.5 whitespace-nowrap text-xl font-semibold tabular-nums tracking-tight">
        {mockup.splitTotalValue}
        <span className="ml-1 text-xs font-medium text-neutral-500">{fr.common.currency}</span>
      </p>

      <div className="mt-4 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        {mockup.split.map((part) => (
          <span
            key={part.provider}
            className={providerColors[part.provider]}
            style={{ width: `${part.share}%` }}
          />
        ))}
      </div>

      <ul className="mt-5 space-y-4">
        {mockup.split.map((part) => (
          <li key={part.provider} className="flex items-start justify-between gap-3">
            <span className="flex items-center gap-2 whitespace-nowrap text-xs font-medium">
              <span className={`h-2 w-2 rounded-sm ${providerColors[part.provider]}`} />
              {mockup.providers[part.provider]}
              <span className="text-neutral-400">{part.share} %</span>
            </span>
            <span className="text-right">
              <span className="block whitespace-nowrap text-xs font-semibold tabular-nums">
                {part.amount}
              </span>
              <span className="block text-[0.6875rem] text-neutral-500">{part.count}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TransactionsTable({
  compact,
  transactions,
}: {
  compact: boolean;
  transactions: Mockup['transactions'];
}) {
  const { mockup } = fr;
  const { columns } = mockup;
  // Colonnes secondaires masquées sur petit écran et en version réduite
  // (classes écrites en entier pour que Tailwind les détecte).
  const visibleFrom = {
    sm: 'hidden sm:table-cell',
    md: 'hidden md:table-cell',
    lg: 'hidden lg:table-cell',
  };
  const full = (breakpoint: keyof typeof visibleFrom) =>
    compact ? 'hidden' : visibleFrom[breakpoint];

  return (
    <div className="overflow-hidden rounded-lg bg-white ring-1 ring-neutral-200">
      <div className="flex items-center justify-between px-3 py-3 sm:px-4">
        <p className="text-sm font-semibold">{mockup.transactionsTitle}</p>
        <span className="text-xs font-semibold text-primary-strong">{mockup.transactionsLink}</span>
      </div>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-y border-neutral-200 bg-neutral-50 text-left text-[0.6875rem] font-medium text-neutral-500">
            <th className="px-3 py-2 font-medium sm:px-4">{columns.ref}</th>
            <th className={`px-3 py-2 font-medium ${full('sm')}`}>{columns.customer}</th>
            <th className={`px-3 py-2 font-medium ${full('md')}`}>{columns.provider}</th>
            <th className={`px-3 py-2 font-medium ${full('lg')}`}>{columns.date}</th>
            <th className="px-3 py-2 text-right font-medium">{columns.amount}</th>
            <th className="px-3 py-2 font-medium">{columns.status}</th>
            <th className={`px-3 py-2 font-medium sm:pr-4 ${full('md')}`}>{columns.reconciled}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {transactions.map((tx) => {
            const status = statusStyles[tx.status];
            return (
              <tr key={tx.ref}>
                <td className="px-3 py-2.5 sm:px-4">
                  <span className="block whitespace-nowrap font-semibold tabular-nums">
                    {tx.ref}
                  </span>
                  <span
                    className={`text-[0.6875rem] text-neutral-500 ${compact ? '' : 'md:hidden'}`}
                  >
                    {mockup.providers[tx.provider]}
                  </span>
                </td>
                <td className={`px-3 py-2.5 text-neutral-700 ${full('sm')}`}>{tx.customer}</td>
                <td className={`px-3 py-2.5 ${full('md')}`}>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-neutral-700">
                    <span className={`h-2 w-2 rounded-sm ${providerColors[tx.provider]}`} />
                    {mockup.providers[tx.provider]}
                  </span>
                </td>
                <td className={`whitespace-nowrap px-3 py-2.5 text-neutral-500 ${full('lg')}`}>
                  {tx.date}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums">
                  {formatNumber(tx.amount)}
                  <span className="ml-1 text-[0.625rem] font-medium text-neutral-500">
                    {fr.common.currency}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${status.pill}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                    {mockup.statuses[tx.status]}
                  </span>
                </td>
                <td className={`px-3 py-2.5 sm:pr-4 ${full('md')}`}>
                  {tx.reconciled ? (
                    <span className="inline-flex items-center gap-1 text-primary-strong">
                      <CircleCheck className="h-3.5 w-3.5" />
                      {mockup.reconciledYes}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-neutral-500">
                      <Clock3 className="h-3.5 w-3.5" />
                      {mockup.reconciledNo}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
