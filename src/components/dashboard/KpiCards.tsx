import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { dashboard as t } from '../../content/dashboard.fr';
import {
  currencyLabel,
  formatAmount,
  formatMoney,
  formatNumber,
  formatPercent,
} from '../../lib/format';
import { kpisFrom } from '../../services/payments/rules';
import type { PaymentOverview } from '../../services/payments/types';
import { Sparkline } from './Sparkline';

type Delta = {
  ratio: number | null;
  /** Une baisse est-elle une bonne nouvelle ? */ inverse?: boolean;
  points?: boolean;
};

function DeltaChip({ ratio, inverse, points }: Delta) {
  if (ratio === null || !Number.isFinite(ratio)) {
    return <span className="text-xs text-neutral-400">{t.noComparison}</span>;
  }
  const flat = Math.abs(ratio) < 0.0005;
  const good = flat ? null : ratio > 0 !== Boolean(inverse);
  const Icon = flat ? Minus : ratio > 0 ? ArrowUpRight : ArrowDownRight;
  const value = points
    ? `${ratio > 0 ? '+' : ratio < 0 ? '−' : ''}${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(Math.abs(ratio) * 100)} pt`
    : Math.abs(ratio) >= 10
      ? // Période précédente quasi vide : un multiplicateur reste lisible (« ×99 »).
        `×${new Intl.NumberFormat('fr-FR').format(Math.round(1 + ratio))}`
      : formatPercent(ratio, true);
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs">
      <span
        className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold tabular-nums ${
          good === null
            ? 'bg-neutral-100 text-neutral-600'
            : good
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-700'
        }`}
      >
        <Icon aria-hidden="true" className="h-3 w-3" strokeWidth={2.5} />
        {value}
      </span>
      <span className="text-neutral-500">{t.vsPrevious}</span>
    </span>
  );
}

const change = (current: number, previous: number) =>
  previous ? (current - previous) / previous : null;

const compact = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 2 });

/** Lisible jusqu'au million (« 976 500 »), abrégé au-delà (« 1,76 M »). */
function amountValue(cents: number): string {
  return cents / 100 >= 1_000_000 ? compact.format(cents / 100) : formatAmount(cents);
}

type CardProps = {
  label: string;
  value: string;
  /** Valeur exacte (info-bulle et lecteurs d'écran) quand `value` est abrégée. */
  exact?: string;
  unit?: string;
  delta: Delta;
  sub?: string;
  spark?: number[] | null;
  progress?: number | null;
};

function KpiCard({ label, value, exact, unit, delta, sub, spark, progress }: CardProps) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-neutral-500">{label}</p>
        {spark && <Sparkline values={spark} className="-mt-1 h-8 w-20 shrink-0" />}
      </div>
      <p
        title={exact}
        className="mt-2 whitespace-nowrap text-[1.625rem] font-semibold tabular-nums leading-none tracking-[-0.03em] text-neutral-950"
      >
        {exact ? (
          <>
            <span aria-hidden="true">{value}</span>
            <span className="sr-only">{exact}</span>
          </>
        ) : (
          value
        )}
        {unit && (
          <span
            aria-hidden={exact ? true : undefined}
            className="ml-1 text-sm font-medium tracking-normal text-neutral-500"
          >
            {unit}
          </span>
        )}
      </p>
      {progress !== undefined && progress !== null && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100" aria-hidden="true">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
      <div className="mt-auto pt-4">
        {sub ? <p className="text-xs text-neutral-500">{sub}</p> : <DeltaChip {...delta} />}
      </div>
    </div>
  );
}

/** Quatre indicateurs clés de la période, comparés à la période précédente. */
export function KpiCards({ overview, currency }: { overview: PaymentOverview; currency: string }) {
  const current = kpisFrom(overview.current);
  const previous = kpisFrom(overview.previous);
  const unit = currencyLabel(currency);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label={t.kpis.volume}
        value={amountValue(current.volume)}
        exact={formatMoney(current.volume, currency)}
        unit={unit}
        delta={{ ratio: change(current.volume, previous.volume) }}
        spark={overview.dailyVolume}
      />
      <KpiCard
        label={t.kpis.count}
        value={formatNumber(current.count)}
        delta={{ ratio: change(current.count, previous.count) }}
        spark={overview.dailyCount}
      />
      <KpiCard
        label={t.kpis.successRate}
        value={current.successRate === null ? '—' : formatPercent(current.successRate)}
        delta={{
          ratio:
            current.successRate !== null && previous.successRate !== null
              ? current.successRate - previous.successRate
              : null,
          points: true,
        }}
        progress={current.successRate}
      />
      <KpiCard
        label={t.kpis.refunded}
        value={amountValue(current.refunded)}
        exact={formatMoney(current.refunded, currency)}
        unit={unit}
        delta={{ ratio: change(current.refunded, previous.refunded), inverse: true }}
        sub={current.refundedCount ? undefined : t.kpis.refundedCount(0)}
      />
    </div>
  );
}
