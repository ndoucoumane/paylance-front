import { CalendarClock, Check, Copy, RotateCcw, X } from 'lucide-react';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { dashboard as t } from '../../content/dashboard.fr';
import {
  formatLongDateTime,
  formatMoney,
  formatPhone,
  formatShortDateTime,
} from '../../lib/format';
import { useSession } from '../../lib/session/sessionContext';
import { errorMessage } from '../../services/api/errors';
import { isRefundable } from '../../services/payments/rules';
import type { Payment, PaymentStatusChange, Refund } from '../../services/payments/types';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { ModalDialog } from './FormDialog';
import { ProviderMark } from './ProviderMark';
import { providerNames } from './providers';
import { StatusBadge } from './StatusBadge';
import { statusBarColor } from './statusColors';
import { useToast } from './toastContext';

type Props = {
  payment: Payment | null;
  /** Incrémenté après un remboursement pour recharger la chronologie. */
  version: number;
  onClose: () => void;
  onRefund: (payment: Payment) => void;
  onSchedule?: (payment: Payment) => void;
};

const d = t.drawer;
const PAID = ['SUCCESS', 'PARTIALLY_REFUNDED', 'REFUNDED'];

/** Fiche détaillée d'une transaction, en fenêtre centrée. */
export function PaymentDetailDialog(props: Props) {
  const titleId = useId();
  return (
    <ModalDialog
      open={Boolean(props.payment)}
      onClose={props.onClose}
      labelledBy={titleId}
      size="xl"
    >
      {props.payment && <Detail {...props} payment={props.payment} titleId={titleId} />}
    </ModalDialog>
  );
}

function SectionTitle({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3
      id={id}
      className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-neutral-400"
    >
      {children}
    </h3>
  );
}

function Item({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-neutral-900">{children}</dd>
    </div>
  );
}

/** Bouton de copie discret, avec retour visuel. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => setDone(false), 1_500);
    return () => window.clearTimeout(timer);
  }, [done]);
  return (
    <button
      type="button"
      onClick={() =>
        void navigator.clipboard?.writeText(value).then(() => {
          setDone(true);
          toast(t.actions.copied);
        })
      }
      aria-label={label}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
    >
      {done ? (
        <Check aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy aria-hidden="true" className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function Detail({
  payment,
  version,
  onClose,
  onRefund,
  onSchedule,
  titleId,
}: Props & { payment: Payment; titleId: string }) {
  const { api } = useSession();
  const [history, setHistory] = useState<PaymentStatusChange[] | null>(null);
  const [refunds, setRefunds] = useState<Refund[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([
      api.payments.history(payment.paymentId),
      api.payments.refunds(payment.paymentId),
    ]).then(
      ([changes, items]) => {
        if (cancelled) return;
        setHistory([...changes].reverse());
        setRefunds(items);
      },
      (cause: unknown) => !cancelled && setError(errorMessage(cause)),
    );
    return () => {
      cancelled = true;
    };
  }, [api, payment, version]);

  const refunded = (refunds ?? [])
    .filter((item) => item.status === 'SUCCESS')
    .reduce((sum, item) => sum + item.amount, 0);
  const paid = PAID.includes(payment.status);
  const refundable = isRefundable(payment);
  const phone = formatPhone(payment.payerPhone);
  const money = (cents: number) => formatMoney(cents, payment.currency);

  return (
    <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
      {/* En-tête */}
      <header className="flex items-center gap-3 border-b border-neutral-200 px-6 py-4">
        <ProviderMark provider={payment.provider} />
        <div className="min-w-0 flex-1">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-neutral-400">
            {d.eyebrow}
          </p>
          <div className="flex items-center gap-1">
            <h2 id={titleId} className="truncate font-mono text-[0.9375rem] font-medium">
              {payment.paymentNumber}
            </h2>
            <CopyButton value={payment.paymentNumber} label={t.actions.copyNumber} />
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={d.close}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto">
        {/* Montant et actions */}
        <section className="flex flex-col gap-6 border-b border-neutral-200 px-6 py-7 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={payment.status} />
              {payment.environment === 'TEST' && (
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                  {d.environments.TEST}
                </span>
              )}
            </div>
            <p className="mt-3 text-[2.5rem] font-semibold tabular-nums leading-none tracking-[-0.04em]">
              {money(payment.amount)}
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              {d.via(providerNames[payment.provider], phone)} ·{' '}
              {formatShortDateTime(payment.paidAt ?? payment.createdAt)}
            </p>
          </div>
          {(refundable || onSchedule) && (
            <div className="flex flex-wrap gap-2">
              {onSchedule && refundable && (
                <Button variant="secondaryLight" onClick={() => onSchedule(payment)}>
                  <CalendarClock aria-hidden="true" className="h-4 w-4 text-sky-700" />
                  {d.schedule}
                </Button>
              )}
              {refundable && (
                <Button onClick={() => onRefund(payment)}>
                  <RotateCcw aria-hidden="true" className="h-4 w-4" />
                  {d.refund}
                </Button>
              )}
            </div>
          )}
        </section>

        {/* Synthèse encaissé / remboursé / net */}
        {paid && (
          <dl className="grid grid-cols-3 divide-x divide-neutral-200 border-b border-neutral-200 bg-neutral-50/60">
            {[
              { label: d.totals.collected, value: money(payment.amount), tone: 'text-neutral-950' },
              {
                label: d.totals.refunded,
                value: refunds ? (refunded ? `−${money(refunded)}` : money(0)) : '…',
                tone: refunded ? 'text-violet-700' : 'text-neutral-500',
              },
              {
                label: d.totals.net,
                value: refunds ? money(payment.amount - refunded) : '…',
                tone: 'text-neutral-950',
              },
            ].map((item) => (
              <div key={item.label} className="min-w-0 px-4 py-4 sm:px-6">
                <dt className="text-xs text-neutral-500">{item.label}</dt>
                <dd
                  className={`mt-1 truncate text-sm font-semibold tabular-nums sm:text-[15px] ${item.tone}`}
                >
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {error && (
          <div className="px-6 pt-5">
            <Alert tone="error" title={t.refund.errorTitle}>
              {error}
            </Alert>
          </div>
        )}

        <div className="grid md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          {/* Informations */}
          <div className="space-y-8 px-6 py-6">
            <section aria-labelledby={`${titleId}-paiement`}>
              <SectionTitle id={`${titleId}-paiement`}>{d.sections.payment}</SectionTitle>
              <dl className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <Item label={d.fields.reference}>
                  {payment.externalReference ? (
                    <span className="font-mono text-[0.8125rem]">{payment.externalReference}</span>
                  ) : (
                    <span className="text-neutral-400">{d.fields2.none}</span>
                  )}
                </Item>
                <Item label={d.fields.provider}>
                  {providerNames[payment.provider]}
                  <span className="font-normal text-neutral-500">
                    {' '}
                    · {d.environments[payment.environment]}
                  </span>
                </Item>
                <Item label={d.fields.createdAt}>{formatLongDateTime(payment.createdAt)}</Item>
                {payment.paidAt ? (
                  <Item label={d.fields.paidAt}>{formatLongDateTime(payment.paidAt)}</Item>
                ) : (
                  payment.expiresAt && (
                    <Item label={d.fields2.expiresAt}>{formatLongDateTime(payment.expiresAt)}</Item>
                  )
                )}
                {payment.failureReason && (
                  <Item label={d.fields.failure} wide>
                    <span className="text-red-700">{payment.failureReason}</span>
                  </Item>
                )}
              </dl>
            </section>

            <section aria-labelledby={`${titleId}-client`}>
              <SectionTitle id={`${titleId}-client`}>{d.sections.customer}</SectionTitle>
              <dl className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <Item label={d.fields.phone}>
                  <span className="tabular-nums">{phone}</span>
                </Item>
                {payment.actualPayerPhone && payment.actualPayerPhone !== payment.payerPhone && (
                  <Item label={d.fields2.actualPayer}>
                    <span className="tabular-nums">{formatPhone(payment.actualPayerPhone)}</span>
                  </Item>
                )}
              </dl>
            </section>

            <section aria-labelledby={`${titleId}-remb`}>
              <SectionTitle id={`${titleId}-remb`}>{d.refunds}</SectionTitle>
              {!refunds ? (
                <div className="ui-skeleton mt-4 h-14 rounded-xl" aria-hidden="true" />
              ) : refunds.length === 0 ? (
                <p className="mt-3 text-sm text-neutral-500">{d.noRefunds}</p>
              ) : (
                <ul className="mt-4 divide-y divide-neutral-100 rounded-xl ring-1 ring-neutral-200">
                  {refunds.map((item) => (
                    <li
                      key={item.refundId}
                      className="flex items-start justify-between gap-4 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-900">
                          {item.reason}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {formatShortDateTime(item.createdAt)}
                          {item.requestedBy && ` · ${d.refundBy(item.requestedBy)}`}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums text-violet-700">
                          −{money(item.amount)}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {t.refundStatuses[item.status]}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby={`${titleId}-tech`}>
              <SectionTitle id={`${titleId}-tech`}>{d.sections.technical}</SectionTitle>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-neutral-50 py-1.5 pl-3 pr-1.5 ring-1 ring-neutral-200">
                <code className="truncate font-mono text-xs text-neutral-600">
                  {payment.paymentId}
                </code>
                <CopyButton value={payment.paymentId} label={d.copyId} />
              </div>
            </section>
          </div>

          {/* Chronologie */}
          <aside
            aria-labelledby={`${titleId}-chrono`}
            className="border-t border-neutral-200 bg-neutral-50/60 px-6 py-6 md:border-l md:border-t-0"
          >
            <SectionTitle id={`${titleId}-chrono`}>{d.timeline}</SectionTitle>
            {!history ? (
              <div className="mt-4 space-y-3" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="ui-skeleton h-12 rounded-lg" />
                ))}
              </div>
            ) : (
              <ol className="mt-5">
                {history.map((change, index) => (
                  <li key={change.id} className="relative flex gap-3.5 pb-6 last:pb-0">
                    {index < history.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute left-[5px] top-4 h-full w-px bg-neutral-200"
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className={`relative mt-1 h-[11px] w-[11px] shrink-0 rounded-full ${
                        statusBarColor[change.toStatus] ?? 'bg-neutral-300'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900">
                        {t.statuses[change.toStatus]}
                      </p>
                      {change.reason && (
                        <p className="mt-0.5 text-sm text-neutral-600">{change.reason}</p>
                      )}
                      <p className="mt-1 text-xs tabular-nums text-neutral-400">
                        {formatShortDateTime(change.createdAt)} ·{' '}
                        {d.triggeredBy[change.triggeredBy] ?? change.triggeredBy}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
