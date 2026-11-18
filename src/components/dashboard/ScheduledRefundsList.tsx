import { CalendarPlus, CalendarX2, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { dashboard as t } from '../../content/dashboard.fr';
import {
  currencyLabel,
  formatAmount,
  formatMoney,
  formatPhone,
  formatShortDateTime,
} from '../../lib/format';
import { useSession } from '../../lib/session/sessionContext';
import { errorMessage } from '../../services/api/errors';
import type { ScheduledRefund } from '../../services/payments/types';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { ActionMenu, type MenuAction } from './ActionMenu';
import { CopyButton } from './CopyButton';
import { EmptyState } from './EmptyState';
import { ProviderMark } from './ProviderMark';
import { providerNames } from './providers';
import { ScheduledRefundDetailDialog } from './ScheduledRefundDetailDialog';
import { ScheduleStatus } from './ScheduleStatus';
import { useToast } from './toastContext';

const s = t.scheduled;

const day = new Intl.DateTimeFormat('fr-FR', { day: 'numeric' });
const month = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
const hour = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const weekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' });
const year = new Intl.DateTimeFormat('fr-FR', { year: 'numeric' });

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
  /** Id plutôt qu'objet : la fiche suit la liste rechargée (ex. statut après annulation). */
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = items?.find((item) => item.id === detailId) ?? null;

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

  const actionsFor = (item: ScheduledRefund): MenuAction[] => [
    { id: 'view', label: s.view, icon: Eye, onSelect: () => setDetailId(item.id) },
    {
      id: 'cancel',
      label: s.cancel,
      icon: CalendarX2,
      tone: 'danger',
      onSelect: () => void cancel(item),
      disabled: item.status !== 'SCHEDULED' || cancelling === item.id,
      hint: s.cancelUnavailable,
      separated: true,
    },
  ];

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
          <>
            {/* Bureau */}
            <table className="hidden w-full border-collapse text-left md:table">
              <thead>
                <tr className="text-xs font-medium text-neutral-500">
                  <th scope="col" className="py-3 pl-6 pr-3 font-medium">
                    {s.columns.when}
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    {s.columns.transaction}
                  </th>
                  <th scope="col" className="hidden px-3 py-3 font-medium lg:table-cell">
                    {s.columns.provider}
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">
                    {s.columns.amount}
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    {s.columns.status}
                  </th>
                  <th scope="col" className="hidden px-3 py-3 font-medium xl:table-cell">
                    {s.columns.author}
                  </th>
                  <th scope="col" className="py-3 pl-3 pr-6 text-right font-medium">
                    {s.columns.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 border-t border-neutral-100">
                {items.map((item) => {
                  const at = new Date(item.scheduledAt);
                  const active = item.status === 'SCHEDULED';
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setDetailId(item.id)}
                      className="group cursor-pointer align-middle transition-colors hover:bg-neutral-50/80"
                    >
                      <td className="py-3.5 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <CalendarChip at={at} active={active} />
                          <div className="whitespace-nowrap">
                            <p className="text-sm font-medium capitalize text-neutral-950">
                              {weekday.format(at)}
                            </p>
                            <p className="mt-0.5 text-xs tabular-nums text-neutral-500">
                              {year.format(at)} · {s.at(hour.format(at))}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[16rem] px-3 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="lg:hidden">
                            <ProviderMark provider={item.provider} size="sm" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setDetailId(item.id);
                                }}
                                aria-label={s.openDetail(item.paymentNumber)}
                                className="whitespace-nowrap rounded font-mono text-[0.8125rem] font-medium text-neutral-950 underline-offset-4 group-hover:underline"
                              >
                                {item.paymentNumber}
                              </button>
                              <CopyButton
                                value={item.paymentNumber}
                                label={s.copyNumber(item.paymentNumber)}
                                className="h-6 w-6"
                              />
                            </div>
                            <p
                              className="mt-0.5 truncate text-xs text-neutral-500"
                              title={item.reason}
                            >
                              {formatPhone(item.payerPhone)} · {item.reason}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-neutral-500 xl:hidden">
                              {s.by(item.createdBy ?? s.unknownAuthor)}
                            </p>
                            {item.failureReason && (
                              <p className="mt-1 text-xs text-red-700">{item.failureReason}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-3 py-3.5 lg:table-cell">
                        <div className="flex items-center gap-2.5">
                          <ProviderMark provider={item.provider} size="sm" />
                          <span className="whitespace-nowrap text-sm text-neutral-800">
                            {providerNames[item.provider]}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-right">
                        <Amount item={item} />
                      </td>
                      <td className="px-3 py-3.5">
                        <ScheduleStatus status={item.status} />
                      </td>
                      <td className="hidden px-3 py-3.5 xl:table-cell">
                        <Author item={item} />
                      </td>
                      <td
                        className="py-3.5 pl-3 pr-6 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {cancelling === item.id ? (
                          <span className="inline-flex h-8 w-8 items-center justify-center text-neutral-400">
                            <Spinner />
                          </span>
                        ) : (
                          <ActionMenu
                            label={s.menuLabel(item.paymentNumber)}
                            actions={actionsFor(item)}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile */}
            <ul className="divide-y divide-neutral-100 md:hidden">
              {items.map((item) => {
                const at = new Date(item.scheduledAt);
                const active = item.status === 'SCHEDULED';
                return (
                  <li
                    key={item.id}
                    className="relative py-4 pl-5 pr-3 transition-colors active:bg-neutral-50"
                  >
                    <div className="flex items-start gap-3">
                      <CalendarChip at={at} active={active} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => setDetailId(item.id)}
                                aria-label={s.openDetail(item.paymentNumber)}
                                className="truncate rounded font-mono text-xs font-medium text-neutral-950 underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:underline"
                              >
                                {item.paymentNumber}
                              </button>
                              <CopyButton
                                value={item.paymentNumber}
                                label={s.copyNumber(item.paymentNumber)}
                                className="relative z-10 h-6 w-6"
                              />
                            </div>
                            <p className="mt-1 truncate text-xs text-neutral-500">
                              <span className="capitalize">{weekday.format(at)}</span>{' '}
                              {s.at(hour.format(at))} · {providerNames[item.provider]}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <Amount item={item} compact />
                          </div>
                        </div>
                        <p className="mt-1 truncate text-xs text-neutral-500">
                          {item.reason} · {s.by(item.createdBy ?? s.unknownAuthor)}
                        </p>
                        {item.failureReason && (
                          <p className="mt-1 text-xs text-red-700">{item.failureReason}</p>
                        )}
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <ScheduleStatus status={item.status} />
                          <span className="relative z-10">
                            {cancelling === item.id ? (
                              <span className="inline-flex h-8 w-8 items-center justify-center text-neutral-400">
                                <Spinner />
                              </span>
                            ) : (
                              <ActionMenu
                                label={s.menuLabel(item.paymentNumber)}
                                actions={actionsFor(item)}
                              />
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <ScheduledRefundDetailDialog
        item={detail}
        cancelling={cancelling === detail?.id}
        onClose={() => setDetailId(null)}
        onCancel={(item) => void cancel(item)}
      />
    </section>
  );
}

function CalendarChip({ at, active }: { at: Date; active: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`flex w-11 shrink-0 flex-col items-center overflow-hidden rounded-lg ring-1 ring-inset ${
        active ? 'ring-sky-600/25' : 'ring-neutral-200'
      }`}
    >
      <span
        className={`w-full py-px text-center text-[0.5625rem] font-semibold uppercase tracking-wide ${
          active ? 'bg-sky-700 text-white' : 'bg-neutral-100 text-neutral-500'
        }`}
      >
        {month.format(at).replace('.', '')}
      </span>
      <span className="py-1 text-base font-semibold tabular-nums leading-none text-neutral-950">
        {day.format(at)}
      </span>
    </div>
  );
}

/** Montant programmé ; pour un « solde total », montant remboursé ou solde actuel estimé. */
function Amount({ item, compact = false }: { item: ScheduledRefund; compact?: boolean }) {
  const value = item.amount ?? item.effectiveAmount ?? null;
  const executed = item.status === 'EXECUTED';
  let note: string | null = null;
  if (item.amount === null) note = executed || value === null ? s.full : s.fullEstimated;
  else if (item.paymentAmount && item.amount < item.paymentAmount) {
    note = s.partialOf(formatMoney(item.paymentAmount, item.currency));
  }
  return (
    <>
      {value !== null ? (
        <p
          className={`whitespace-nowrap font-semibold tabular-nums text-neutral-950 ${
            compact ? 'text-sm' : 'text-[15px]'
          }`}
        >
          {formatAmount(value)}
          <span className="ml-1 text-xs font-normal text-neutral-500">
            {currencyLabel(item.currency)}
          </span>
        </p>
      ) : (
        <p className="text-sm font-semibold text-neutral-950">{s.full}</p>
      )}
      {note && value !== null && (
        <p className="mt-0.5 whitespace-nowrap text-[0.6875rem] text-neutral-500">{note}</p>
      )}
    </>
  );
}

function Author({ item }: { item: ScheduledRefund }) {
  const name = item.createdBy;
  return (
    <div className="min-w-0">
      <p className="max-w-[10rem] truncate text-sm text-neutral-800">{name ?? s.unknownAuthor}</p>
      <p className="mt-0.5 whitespace-nowrap text-xs text-neutral-500">
        {s.createdOn(formatShortDateTime(item.createdAt))}
      </p>
    </div>
  );
}
