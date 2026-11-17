import { ArrowRight, ListOrdered } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboard as t } from '../../content/dashboard.fr';
import { ROUTES } from '../../lib/session/routing';
import { useSession } from '../../lib/session/sessionContext';
import { errorMessage } from '../../services/api/errors';
import type { PaymentOverview, PeriodDays } from '../../services/payments/types';
import { Alert } from '../ui/Alert';
import { Breakdown } from './Breakdown';
import { KpiCards } from './KpiCards';
import { PeriodSelector } from './PeriodSelector';
import { VolumeChart } from './VolumeChart';

function OverviewSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="ui-skeleton h-[132px] rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="ui-skeleton h-[340px] rounded-2xl lg:col-span-2" />
        <div className="ui-skeleton h-[340px] rounded-2xl" />
      </div>
    </div>
  );
}

/** Vue d'ensemble : indicateurs, courbe et répartition. La liste vit sur la page Transactions. */
export function TransactionsOverview({ currency }: { currency: string }) {
  const { api } = useSession();
  const [period, setPeriod] = useState<PeriodDays>(30);
  const [overview, setOverview] = useState<PaymentOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    api.payments.overview(period).then(
      (data) => !cancelled && setOverview(data),
      (cause: unknown) => !cancelled && setError(errorMessage(cause)),
    );
    return () => {
      cancelled = true;
    };
  }, [api, period]);

  return (
    <div className="space-y-6">
      <PeriodSelector value={period} onChange={setPeriod} />

      {error && (
        <Alert tone="error" title={t.table.emptyTitle}>
          {error}
        </Alert>
      )}

      {!overview ? (
        !error && <OverviewSkeleton />
      ) : (
        <>
          <KpiCards overview={overview} currency={currency} />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              {overview.dailyVolume && overview.dailyCount ? (
                <VolumeChart
                  volume={overview.dailyVolume}
                  counts={overview.dailyCount}
                  currency={currency}
                  periodLabel={t.periods[period]}
                />
              ) : (
                <section className="flex h-full items-center rounded-2xl bg-white p-6 text-sm text-neutral-500 ring-1 ring-neutral-200">
                  {t.chart.unavailable}
                </section>
              )}
            </div>
            <Breakdown stats={overview.current} />
          </div>
        </>
      )}

      <Link
        to={ROUTES.dashboardTransactions}
        className="group flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-neutral-200 transition-shadow hover:ring-neutral-300 sm:p-6"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-white">
          <ListOrdered aria-hidden="true" className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-neutral-950">{t.overviewLink.title}</span>
          <span className="mt-0.5 block text-sm text-neutral-500">{t.overviewLink.text}</span>
        </span>
        <span className="hidden items-center gap-1.5 text-sm font-semibold text-primary-strong sm:inline-flex">
          {t.overviewLink.cta}
          <ArrowRight
            aria-hidden="true"
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </Link>
    </div>
  );
}
