import { CalendarX2, Info, X } from 'lucide-react';
import { useId } from 'react';
import { dashboard as t } from '../../content/dashboard.fr';
import { formatLongDateTime, formatMoney, formatPhone } from '../../lib/format';
import type { ScheduledRefund, ScheduledRefundStatus } from '../../services/payments/types';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { CopyButton } from './CopyButton';
import { ModalDialog } from './FormDialog';
import { Item, SectionTitle } from './PaymentDetailDialog';
import { ProviderMark } from './ProviderMark';
import { providerNames } from './providers';
import { ScheduleStatus } from './ScheduleStatus';

type Props = {
  item: ScheduledRefund | null;
  cancelling: boolean;
  onClose: () => void;
  onCancel: (item: ScheduledRefund) => void;
};

const s = t.scheduled;
const d = s.detail;

const stepDot: Record<ScheduledRefundStatus, string> = {
  SCHEDULED: 'bg-sky-500 ring-4 ring-sky-500/15',
  EXECUTED: 'bg-violet-500',
  CANCELLED: 'bg-neutral-400',
  FAILED: 'bg-red-500',
};

/** Fiche détaillée d'un remboursement programmé, sur le modèle de celle d'une transaction. */
export function ScheduledRefundDetailDialog(props: Props) {
  const titleId = useId();
  return (
    <ModalDialog open={Boolean(props.item)} onClose={props.onClose} labelledBy={titleId} size="xl">
      {props.item && <Detail {...props} item={props.item} titleId={titleId} />}
    </ModalDialog>
  );
}

function Detail({
  item,
  cancelling,
  onClose,
  onCancel,
  titleId,
}: Props & { item: ScheduledRefund; titleId: string }) {
  const money = (cents: number) => formatMoney(cents, item.currency);
  const value = item.amount ?? item.effectiveAmount ?? null;
  const active = item.status === 'SCHEDULED';
  const estimated = item.amount === null && active && value !== null;
  const when = formatLongDateTime(item.scheduledAt);

  return (
    <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
      {/* En-tête */}
      <header className="flex items-center gap-3 border-b border-neutral-200 px-6 py-4">
        <ProviderMark provider={item.provider} />
        <div className="min-w-0 flex-1">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-neutral-400">
            {d.eyebrow}
          </p>
          <div className="flex items-center gap-1">
            <h2 id={titleId} className="truncate font-mono text-[0.9375rem] font-medium">
              {item.paymentNumber}
            </h2>
            <CopyButton value={item.paymentNumber} label={s.copyNumber(item.paymentNumber)} />
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.drawer.close}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto">
        {/* Montant et action */}
        <section className="flex flex-col gap-6 border-b border-neutral-200 px-6 py-7 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <ScheduleStatus status={item.status} />
            <p className="mt-3 text-[2.5rem] font-semibold tabular-nums leading-none tracking-[-0.04em]">
              {value !== null ? money(value) : s.full}
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              {t.drawer.via(providerNames[item.provider], formatPhone(item.payerPhone))} ·{' '}
              {item.status === 'EXECUTED' ? d.executedOn(when) : d.plannedFor(when)}
            </p>
          </div>
          {active && (
            <Button
              variant="secondaryLight"
              onClick={() => onCancel(item)}
              disabled={cancelling}
              className="hover:text-red-700"
            >
              {cancelling ? (
                <Spinner />
              ) : (
                <CalendarX2 aria-hidden="true" className="h-4 w-4 text-red-600" />
              )}
              {d.cancel}
            </Button>
          )}
        </section>

        {estimated && (
          <div className="flex items-start gap-2.5 border-b border-neutral-200 bg-sky-50/60 px-6 py-3 text-sm text-sky-900">
            <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
            {d.estimatedNote}
          </div>
        )}

        <div className="grid md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          {/* Informations */}
          <div className="space-y-8 px-6 py-6">
            <section aria-labelledby={`${titleId}-remb`}>
              <SectionTitle id={`${titleId}-remb`}>{d.sections.refund}</SectionTitle>
              <dl className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <Item label={d.fields.scheduledAt}>{when}</Item>
                <Item label={d.fields.mode}>
                  {item.amount === null ? d.fields.modeFull : d.fields.modePartial}
                </Item>
                <Item label={d.fields.reason} wide>
                  {item.reason}
                </Item>
                <Item label={d.fields.author}>{item.createdBy ?? s.unknownAuthor}</Item>
                <Item label={d.fields.createdAt}>{formatLongDateTime(item.createdAt)}</Item>
                {item.failureReason && (
                  <Item label={d.fields.failure} wide>
                    <span className="text-red-700">{item.failureReason}</span>
                  </Item>
                )}
              </dl>
            </section>

            <section aria-labelledby={`${titleId}-paiement`}>
              <SectionTitle id={`${titleId}-paiement`}>{d.sections.payment}</SectionTitle>
              <dl className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <Item label={d.fields.paymentNumber}>
                  <span className="font-mono text-[0.8125rem]">{item.paymentNumber}</span>
                </Item>
                {item.paymentAmount !== undefined && (
                  <Item label={d.fields.paymentAmount}>
                    <span className="tabular-nums">{money(item.paymentAmount)}</span>
                  </Item>
                )}
                <Item label={d.fields.provider}>{providerNames[item.provider]}</Item>
                <Item label={d.fields.phone}>
                  <span className="tabular-nums">{formatPhone(item.payerPhone)}</span>
                </Item>
              </dl>
            </section>

            <section aria-labelledby={`${titleId}-tech`}>
              <SectionTitle id={`${titleId}-tech`}>{d.sections.technical}</SectionTitle>
              <dl className="mt-3 space-y-2">
                {[
                  { label: d.fields.id, value: item.id },
                  { label: d.fields.paymentId, value: item.paymentId },
                  ...(item.refundId ? [{ label: d.fields.refundId, value: item.refundId }] : []),
                ].map((entry) => (
                  <div key={entry.label}>
                    <dt className="sr-only">{entry.label}</dt>
                    <dd className="flex items-center justify-between gap-3 rounded-lg bg-neutral-50 py-1.5 pl-3 pr-1.5 ring-1 ring-neutral-200">
                      <span className="min-w-0">
                        <span className="block text-[0.6875rem] text-neutral-500">
                          {entry.label}
                        </span>
                        <code className="block truncate font-mono text-xs text-neutral-600">
                          {entry.value}
                        </code>
                      </span>
                      <CopyButton value={entry.value} label={`${d.copyId} : ${entry.label}`} />
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          {/* Chronologie */}
          <aside
            aria-labelledby={`${titleId}-chrono`}
            className="border-t border-neutral-200 bg-neutral-50/60 px-6 py-6 md:border-l md:border-t-0"
          >
            <SectionTitle id={`${titleId}-chrono`}>{d.timeline}</SectionTitle>
            <ol className="mt-5">
              <li className="relative flex gap-3.5 pb-6">
                <span
                  aria-hidden="true"
                  className="absolute left-[5px] top-4 h-full w-px bg-neutral-200"
                />
                <span
                  aria-hidden="true"
                  className="relative mt-1 h-[11px] w-[11px] shrink-0 rounded-full bg-neutral-900"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900">{d.steps.created}</p>
                  <p className="mt-0.5 text-sm text-neutral-600">
                    {s.by(item.createdBy ?? s.unknownAuthor)}
                  </p>
                  <p className="mt-1 text-xs tabular-nums text-neutral-400">
                    {formatLongDateTime(item.createdAt)}
                  </p>
                </div>
              </li>
              <li className="relative flex gap-3.5">
                <span
                  aria-hidden="true"
                  className={`relative mt-1 h-[11px] w-[11px] shrink-0 rounded-full ${stepDot[item.status]}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900">
                    {item.status === 'SCHEDULED' ? d.steps.upcoming : d.steps[item.status]}
                  </p>
                  {item.failureReason && (
                    <p className="mt-0.5 text-sm text-red-700">{item.failureReason}</p>
                  )}
                  {item.status !== 'CANCELLED' && (
                    <p className="mt-1 text-xs tabular-nums text-neutral-400">{when}</p>
                  )}
                </div>
              </li>
            </ol>
          </aside>
        </div>
      </div>
    </div>
  );
}
