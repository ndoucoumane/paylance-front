import { Copy, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { dashboard as t } from '../../content/dashboard.fr';
import {
  formatLongDateTime,
  formatMoney,
  formatPhone,
  formatShortDateTime,
} from '../../lib/format';
import { useSession } from '../../lib/session/sessionContext';
import { isRefundable } from '../../services/payments/rules';
import type { Payment, PaymentStatusChange, Refund } from '../../services/payments/types';
import { errorMessage } from '../../services/api/errors';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { ProviderMark } from './ProviderMark';
import { providerNames } from './providers';
import { StatusBadge } from './StatusBadge';
import { statusBarColor } from './statusColors';
import { useToast } from './toastContext';
import { useDialog } from './useDialog';

type Props = {
  payment: Payment | null;
  /** Incrémenté après un remboursement pour recharger la chronologie. */
  version: number;
  onClose: () => void;
  onRefund: (payment: Payment) => void;
};

type Extra = { history: PaymentStatusChange[]; refunds: Refund[] };

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4 py-3">
      <dt className="text-sm text-neutral-500">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

/** Tiroir de détail d'une transaction : montant, informations, chronologie, remboursements. */
export function PaymentDrawer({ payment, version, onClose, onRefund }: Props) {
  const { api } = useSession();
  const toast = useToast();
  const ref = useDialog(Boolean(payment), onClose);
  const [extra, setExtra] = useState<Extra | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (target: Payment) => {
      setError(null);
      try {
        const [history, refunds] = await Promise.all([
          api.payments.history(target.paymentId),
          api.payments.refunds(target.paymentId),
        ]);
        setExtra({ history, refunds });
      } catch (cause) {
        setError(errorMessage(cause));
      }
    },
    [api],
  );

  useEffect(() => {
    setExtra(null);
    if (payment) void load(payment);
  }, [payment, version, load]);

  const copy = (value: string) => {
    void navigator.clipboard?.writeText(value).then(() => toast(t.actions.copied));
  };

  if (!payment) return <dialog ref={ref} className="ui-drawer" />;

  const d = t.drawer;
  const refunded =
    extra?.refunds
      .filter((item) => item.status === 'SUCCESS')
      .reduce((sum, item) => sum + item.amount, 0) ?? 0;

  return (
    <dialog
      ref={ref}
      aria-labelledby="detail-titre"
      className="ui-drawer fixed inset-y-0 left-auto right-0 m-0 h-full max-h-none w-full max-w-[480px] bg-white p-0 text-neutral-950 shadow-float sm:rounded-l-2xl"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-neutral-200 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <ProviderMark provider={payment.provider} />
            <div className="min-w-0">
              <h2 id="detail-titre" className="truncate font-mono text-sm font-semibold">
                {payment.paymentNumber}
              </h2>
              <p className="text-xs text-neutral-500">{formatShortDateTime(payment.createdAt)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={d.close}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 pb-6 pt-7">
            <p className="text-sm text-neutral-500">{d.amount}</p>
            <p className="mt-1 text-[2.25rem] font-semibold tabular-nums leading-none tracking-[-0.04em]">
              {formatMoney(payment.amount, payment.currency)}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={payment.status} />
              {payment.environment === 'TEST' && (
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                  {d.environments.TEST}
                </span>
              )}
              {refunded > 0 && payment.status === 'PARTIALLY_REFUNDED' && (
                <span className="text-xs text-neutral-500">
                  {d.refundable(formatMoney(payment.amount - refunded, payment.currency))}
                </span>
              )}
            </div>
            {isRefundable(payment) && (
              <Button
                variant="secondaryLight"
                onClick={() => onRefund(payment)}
                className="mt-6 w-full"
              >
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
                {d.refund}
              </Button>
            )}
          </div>

          <section aria-labelledby="detail-infos" className="border-t border-neutral-100 px-6 py-5">
            <h3
              id="detail-infos"
              className="text-xs font-semibold uppercase tracking-wider text-neutral-400"
            >
              {d.details}
            </h3>
            <dl className="mt-2 divide-y divide-neutral-100">
              <Row label={d.fields.number}>
                <button
                  type="button"
                  onClick={() => copy(payment.paymentNumber)}
                  className="inline-flex items-center gap-1.5 font-mono text-[0.8125rem] hover:text-primary-strong"
                >
                  {payment.paymentNumber}
                  <Copy aria-hidden="true" className="h-3.5 w-3.5 text-neutral-400" />
                  <span className="sr-only">{t.actions.copyNumber}</span>
                </button>
              </Row>
              {payment.externalReference && (
                <Row label={d.fields.reference}>{payment.externalReference}</Row>
              )}
              <Row label={d.fields.provider}>{providerNames[payment.provider]}</Row>
              <Row label={d.fields.environment}>{d.environments[payment.environment]}</Row>
              <Row label={d.fields.phone}>
                <span className="tabular-nums">
                  {formatPhone(payment.actualPayerPhone ?? payment.payerPhone)}
                </span>
              </Row>
              <Row label={d.fields.createdAt}>{formatLongDateTime(payment.createdAt)}</Row>
              {payment.paidAt && (
                <Row label={d.fields.paidAt}>{formatLongDateTime(payment.paidAt)}</Row>
              )}
              {payment.failureReason && (
                <Row label={d.fields.failure}>
                  <span className="text-red-700">{payment.failureReason}</span>
                </Row>
              )}
              <Row label={d.fields.id}>
                <span className="font-mono text-xs text-neutral-500">{payment.paymentId}</span>
              </Row>
            </dl>
          </section>

          {error && (
            <div className="px-6 pb-4">
              <Alert tone="error" title={t.refund.errorTitle}>
                {error}
              </Alert>
            </div>
          )}

          <section
            aria-labelledby="detail-chronologie"
            className="border-t border-neutral-100 px-6 py-5"
          >
            <h3
              id="detail-chronologie"
              className="text-xs font-semibold uppercase tracking-wider text-neutral-400"
            >
              {d.timeline}
            </h3>
            {!extra ? (
              <div className="mt-4 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="ui-skeleton h-10 rounded-lg" />
                ))}
              </div>
            ) : (
              <ol className="mt-4">
                {[...extra.history].reverse().map((change, index, list) => (
                  <li key={change.id} className="relative flex gap-3 pb-5 last:pb-0">
                    {index < list.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute left-[5px] top-4 h-full w-px bg-neutral-200"
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className={`relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ring-4 ring-white ${
                        statusBarColor[change.toStatus] ?? 'bg-neutral-300'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                        <span className="font-medium text-neutral-900">
                          {t.statuses[change.toStatus]}
                        </span>
                        <span className="text-xs tabular-nums text-neutral-500">
                          {formatShortDateTime(change.createdAt)}
                        </span>
                      </p>
                      {change.reason && (
                        <p className="mt-0.5 text-sm text-neutral-600">{change.reason}</p>
                      )}
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {d.triggeredBy[change.triggeredBy] ?? change.triggeredBy}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section
            aria-labelledby="detail-remboursements"
            className="border-t border-neutral-100 px-6 py-5"
          >
            <h3
              id="detail-remboursements"
              className="text-xs font-semibold uppercase tracking-wider text-neutral-400"
            >
              {d.refunds}
            </h3>
            {extra && extra.refunds.length === 0 && (
              <p className="mt-3 text-sm text-neutral-500">{d.noRefunds}</p>
            )}
            {extra && extra.refunds.length > 0 && (
              <ul className="mt-3 space-y-2">
                {extra.refunds.map((item) => (
                  <li
                    key={item.refundId}
                    className="rounded-xl bg-neutral-50 px-4 py-3 ring-1 ring-neutral-200"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold tabular-nums">
                        −{formatMoney(item.amount, payment.currency)}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {t.refundStatuses[item.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-600">{item.reason}</p>
                    <p className="mt-1 text-xs text-neutral-400">
                      {formatShortDateTime(item.createdAt)}
                      {item.requestedBy && ` · ${d.refundBy(item.requestedBy)}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </dialog>
  );
}
