import { useCallback, useEffect, useState } from 'react';
import { dashboard as t } from '../../content/dashboard.fr';
import { useSession } from '../../lib/session/sessionContext';
import { errorMessage } from '../../services/api/errors';
import type { Payment, PaymentOverview, PeriodDays } from '../../services/payments/types';
import { Alert } from '../ui/Alert';
import { Breakdown } from './Breakdown';
import { KpiCards } from './KpiCards';
import { PaymentDrawer } from './PaymentDrawer';
import { RefundDialog } from './RefundDialog';
import { useToast } from './toastContext';
import { TransactionsTable } from './TransactionsTable';
import { VolumeChart } from './VolumeChart';

const PERIODS: PeriodDays[] = [7, 30, 90];

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

/** Tableau de bord des transactions : indicateurs, courbe, répartition et liste. */
export function TransactionsOverview({ currency }: { currency: string }) {
  const { api } = useSession();
  const toast = useToast();
  const [period, setPeriod] = useState<PeriodDays>(30);
  const [overview, setOverview] = useState<PaymentOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [detail, setDetail] = useState<Payment | null>(null);
  const [refunding, setRefunding] = useState<Payment | null>(null);

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
  }, [api, period, version]);

  const closeDetail = useCallback(() => setDetail(null), []);
  const closeRefund = useCallback(() => setRefunding(null), []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="radiogroup"
          aria-label={t.periodLabel}
          className="inline-flex rounded-full bg-white p-1 ring-1 ring-neutral-200"
        >
          {PERIODS.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={period === value}
              onClick={() => setPeriod(value)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                period === value
                  ? 'bg-neutral-950 text-white'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              <span className="sm:hidden">{t.periodsShort[value]}</span>
              <span className="hidden sm:inline">{t.periods[value]}</span>
            </button>
          ))}
        </div>
      </div>

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

      <TransactionsTable
        periodDays={period}
        stats={overview?.current ?? null}
        currency={currency}
        version={version}
        onOpen={setDetail}
        onRefund={setRefunding}
      />

      <PaymentDrawer
        payment={detail}
        version={version}
        onClose={closeDetail}
        onRefund={setRefunding}
      />
      <RefundDialog
        payment={refunding}
        onClose={closeRefund}
        onRefunded={(refund) => {
          setRefunding(null);
          setVersion((value) => value + 1);
          toast(t.refund.success);
          // Le tiroir ouvert affiche l'état réel du paiement après remboursement.
          if (detail?.paymentId === refund.paymentId) {
            api.payments.get(refund.paymentId).then(setDetail, () => undefined);
          }
        }}
      />
    </div>
  );
}
