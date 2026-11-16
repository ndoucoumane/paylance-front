import { dashboard as t } from '../../content/dashboard.fr';
import { formatNumber } from '../../lib/format';
import type { PaymentProvider } from '../../services/account/types';
import type { PaymentStats, PaymentStatus } from '../../services/payments/types';
import { ProviderMark } from './ProviderMark';
import { providerNames } from './providers';
import { statusBarColor } from './statusColors';

/** Répartition de la période par opérateur (montants) et par statut (nombre). */
export function Breakdown({ stats }: { stats: PaymentStats }) {
  const providers = [...stats.byProvider].sort((a, b) => b.count - a.count);
  const providerTotal = providers.reduce((sum, entry) => sum + entry.count, 0);
  const statuses = [...stats.byStatus].sort((a, b) => b.count - a.count);

  return (
    <section
      aria-labelledby="repartition"
      className="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-neutral-200 sm:p-6"
    >
      <h2 id="repartition" className="text-base font-semibold text-neutral-950">
        {t.breakdown.title}
      </h2>
      {stats.totalCount === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">{t.breakdown.empty}</p>
      ) : (
        <>
          <p className="mt-5 text-xs font-medium text-neutral-500">{t.breakdown.byProvider}</p>
          <ul className="mt-3 space-y-3">
            {providers.map((entry) => {
              const share = providerTotal ? entry.count / providerTotal : 0;
              return (
                <li key={entry.key}>
                  <div className="flex items-center gap-3">
                    <ProviderMark provider={entry.key as PaymentProvider} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-800">
                      {providerNames[entry.key as PaymentProvider] ?? entry.key}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-neutral-950">
                      {Math.round(share * 100)} %
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 pl-10">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-neutral-900"
                        style={{ width: `${share * 100}%` }}
                      />
                    </div>
                    <span className="w-28 text-right text-xs tabular-nums text-neutral-500">
                      {t.chart.tooltipCount(entry.count)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="mt-7 text-xs font-medium text-neutral-500">{t.breakdown.byStatus}</p>
          <div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
            {statuses.map((entry) => (
              <span
                key={entry.key}
                className={statusBarColor[entry.key as PaymentStatus] ?? 'bg-neutral-300'}
                style={{ width: `${(entry.count / stats.totalCount) * 100}%` }}
              />
            ))}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            {statuses.map((entry) => (
              <li key={entry.key} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-sm ${statusBarColor[entry.key as PaymentStatus] ?? 'bg-neutral-300'}`}
                />
                <span className="min-w-0 flex-1 truncate text-neutral-600">
                  {t.statuses[entry.key as PaymentStatus] ?? entry.key}
                </span>
                <span className="font-medium tabular-nums text-neutral-900">
                  {formatNumber(entry.count)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
