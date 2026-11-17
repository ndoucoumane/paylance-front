import { CalendarPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { dashboard as t } from '../../content/dashboard.fr';
import { formatMoney, formatPhone } from '../../lib/format';
import { useSession } from '../../lib/session/sessionContext';
import { errorMessage } from '../../services/api/errors';
import type { ScheduledRefund, ScheduledRefundStatus } from '../../services/payments/types';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { EmptyState } from './EmptyState';
import { ProviderMark } from './ProviderMark';
import { useToast } from './toastContext';

const s = t.scheduled;

const statusStyles: Record<ScheduledRefundStatus, { badge: string; dot: string }> = {
  SCHEDULED: { badge: 'bg-sky-50 text-sky-800 ring-sky-600/20', dot: 'bg-sky-500' },
  EXECUTED: { badge: 'bg-violet-50 text-violet-700 ring-violet-600/15', dot: 'bg-violet-500' },
  CANCELLED: {
    badge: 'bg-neutral-100 text-neutral-600 ring-neutral-500/15',
    dot: 'bg-neutral-400',
  },
  FAILED: { badge: 'bg-red-50 text-red-700 ring-red-600/15', dot: 'bg-red-500' },
};

const day = new Intl.DateTimeFormat('fr-FR', { day: 'numeric' });
const month = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
const hour = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const weekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' });

type Props = {
  /** Incrémenté après une programmation pour recharger la liste. */
  version: number;
  onCreate: () => void;
  onCount: (upcoming: number) => void;
};

/** Échéancier des remboursements programmés, avec annulation. */
export function ScheduledRefundsList({ version, onCreate, onCount }: Props) {
  const { api } = useSession();
  const toast = useToast();
  const [items, setItems] = useState<ScheduledRefund[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.payments.scheduledRefunds().then(
      (data) => {
        if (cancelled) return;
        setItems(data);
        setError(null);
        onCount(data.filter((item) => item.status === 'SCHEDULED').length);
      },
      (cause: unknown) => {
        if (cancelled) return;
        setItems([]);
        setError(errorMessage(cause));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [api, version, reload, onCount]);

  const cancel = async (item: ScheduledRefund) => {
    if (!window.confirm(s.cancelConfirm(item.paymentNumber))) return;
    setCancelling(item.id);
    try {
      await api.payments.cancelScheduledRefund(item.id);
      toast(s.cancelled);
      setReload((value) => value + 1);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setCancelling(null);
    }
  };

  const upcoming = items?.filter((item) => item.status === 'SCHEDULED').length ?? 0;

  return (
    <section
      aria-labelledby="programmes-titre"
      className="rounded-2xl bg-white ring-1 ring-neutral-200"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
        <div>
          <h2 id="programmes-titre" className="text-base font-semibold text-neutral-950">
            {s.title}
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500">{s.subtitle}</p>
        </div>
        {upcoming > 0 && (
          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800 ring-1 ring-inset ring-sky-600/20">
            {s.upcoming(upcoming)}
          </span>
        )}
      </div>

      {error && (
        <div className="px-5 pt-4 sm:px-6">
          <Alert tone="error" title={t.schedule.errorTitle}>
            {error}
          </Alert>
        </div>
      )}

      <div className="mt-5 border-t border-neutral-100">
        {items === null ? (
          <div className="flex justify-center py-16 text-neutral-400">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            variant="scheduled"
            title={s.emptyTitle}
            text={s.emptyText}
            action={
              <Button variant="secondaryLight" onClick={onCreate}>
                <CalendarPlus aria-hidden="true" className="h-4 w-4" />
                {t.page.scheduleLong}
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {items.map((item) => {
              const at = new Date(item.scheduledAt);
              const style = statusStyles[item.status];
              const active = item.status === 'SCHEDULED';
              return (
                <li
                  key={item.id}
                  className={`flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 sm:flex-nowrap sm:px-6 ${
                    active ? '' : 'opacity-80'
                  }`}
                >
                  {/* Échéance façon calendrier */}
                  <div
                    className={`flex w-14 shrink-0 flex-col items-center overflow-hidden rounded-xl ring-1 ring-inset ${
                      active ? 'ring-sky-600/25' : 'ring-neutral-200'
                    }`}
                  >
                    <span
                      className={`w-full py-0.5 text-center text-[0.625rem] font-semibold uppercase tracking-wide ${
                        active ? 'bg-sky-700 text-white' : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {month.format(at).replace('.', '')}
                    </span>
                    <span className="py-1 text-xl font-semibold tabular-nums leading-none text-neutral-950">
                      {day.format(at)}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ProviderMark provider={item.provider} size="sm" />
                      <span className="font-mono text-[0.8125rem] font-medium text-neutral-950">
                        {item.paymentNumber}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style.badge}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                        />
                        {s.statuses[item.status]}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-neutral-500">
                      <span className="capitalize">{weekday.format(at)}</span> à {hour.format(at)} ·{' '}
                      {formatPhone(item.payerPhone)} · {item.reason}
                      {item.createdBy && ` · ${s.by(item.createdBy)}`}
                    </p>
                    {item.failureReason && (
                      <p className="mt-1 text-xs text-red-700">{item.failureReason}</p>
                    )}
                  </div>

                  <div className="ml-auto flex items-center gap-3">
                    <span className="whitespace-nowrap text-right text-[15px] font-semibold tabular-nums text-neutral-950">
                      {item.amount === null ? s.full : formatMoney(item.amount, item.currency)}
                    </span>
                    {active && (
                      <button
                        type="button"
                        onClick={() => void cancel(item)}
                        disabled={cancelling === item.id}
                        aria-label={s.cancelLabel(item.paymentNumber)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-neutral-700 ring-1 ring-inset ring-neutral-300 transition-colors hover:bg-red-50 hover:text-red-700 hover:ring-red-600/30 disabled:opacity-50"
                      >
                        {cancelling === item.id && <Spinner />}
                        {s.cancel}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
