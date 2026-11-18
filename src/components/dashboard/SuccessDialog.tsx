import { X } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { dashboard as t } from '../../content/dashboard.fr';
import { formatLongDateTime, formatMoney, formatPhone } from '../../lib/format';
import type { Payment, Refund, ScheduledRefund } from '../../services/payments/types';
import { Button } from '../ui/Button';
import { CopyButton } from './CopyButton';
import { ModalDialog } from './FormDialog';
import { ProviderMark } from './ProviderMark';
import { providerNames } from './providers';
import { ScheduleStatus } from './ScheduleStatus';
import { StatusBadge } from './StatusBadge';

/** Ce qui vient de réussir, avec les données renvoyées par le serveur. */
export type SuccessInfo =
  | { kind: 'payment'; payment: Payment }
  | { kind: 'refund'; refund: Refund; payment: Payment }
  | { kind: 'schedule'; schedule: ScheduledRefund };

type Props = {
  info: SuccessInfo | null;
  onClose: () => void;
  /** Ouvre la fiche de la transaction concernée. */
  onView: (payment: Payment) => void;
  /** Relance la même action (nouveau paiement, nouvelle programmation). */
  onAgain: (kind: SuccessInfo['kind']) => void;
};

const c = t.success;

/** Confirmation centrée, coche verte animée, récapitulatif et actions de suite. */
export function SuccessDialog({ info, onClose, onView, onAgain }: Props) {
  const titleId = useId();
  return (
    <ModalDialog open={Boolean(info)} onClose={onClose} labelledBy={titleId}>
      {info && (
        <Content
          info={info}
          titleId={titleId}
          onClose={onClose}
          onView={onView}
          onAgain={onAgain}
        />
      )}
    </ModalDialog>
  );
}

type Row = { label: string; value: ReactNode };

function Content({
  info,
  titleId,
  onClose,
  onView,
  onAgain,
}: Props & { info: SuccessInfo; titleId: string }) {
  let title: string;
  let text: string;
  let amount: string;
  let number: string;
  let provider: Payment['provider'];
  let rows: Row[];
  let secondary: ReactNode = null;
  let failed = false;

  if (info.kind === 'payment') {
    const { payment } = info;
    title = c.payment.title;
    text = c.payment.text;
    amount = formatMoney(payment.amount, payment.currency);
    number = payment.paymentNumber;
    provider = payment.provider;
    rows = [
      { label: c.fields.customer, value: formatPhone(payment.payerPhone) },
      ...(payment.externalReference
        ? [{ label: c.fields.reference, value: payment.externalReference }]
        : []),
      ...(payment.expiresAt
        ? [{ label: c.fields.expiresAt, value: formatLongDateTime(payment.expiresAt) }]
        : []),
      { label: c.fields.status, value: <StatusBadge status={payment.status} /> },
    ];
    secondary = (
      <>
        <Button variant="secondaryLight" onClick={() => onAgain('payment')}>
          {c.payment.another}
        </Button>
        <Button variant="secondaryLight" onClick={() => onView(payment)}>
          {c.payment.view}
        </Button>
      </>
    );
  } else if (info.kind === 'refund') {
    const { refund, payment } = info;
    // Le statut renvoyé par le serveur fait foi : un 201 peut être en cours ou refusé.
    if (refund.status === 'FAILED') {
      failed = true;
      title = c.refund.failedTitle;
      text = refund.failureReason ?? c.refund.failedText;
    } else if (refund.status === 'PENDING') {
      title = c.refund.pendingTitle;
      text = c.refund.pendingText;
    } else {
      title = c.refund.title;
      text = c.refund.text;
    }
    amount = formatMoney(refund.amount, payment.currency);
    number = refund.paymentNumber;
    provider = payment.provider;
    rows = [
      { label: c.fields.customer, value: formatPhone(refund.payerPhone) },
      { label: c.fields.reason, value: refund.reason },
      { label: c.fields.createdAt, value: formatLongDateTime(refund.createdAt) },
      ...(refund.requestedBy ? [{ label: c.fields.author, value: refund.requestedBy }] : []),
    ];
    secondary = (
      <Button variant="secondaryLight" onClick={() => onView(payment)}>
        {c.refund.view}
      </Button>
    );
  } else {
    const { schedule } = info;
    title = c.schedule.title;
    text = c.schedule.text;
    amount =
      (schedule.amount ?? schedule.effectiveAmount) != null
        ? formatMoney((schedule.amount ?? schedule.effectiveAmount)!, schedule.currency)
        : c.schedule.fullAmount;
    number = schedule.paymentNumber;
    provider = schedule.provider;
    rows = [
      { label: c.fields.scheduledAt, value: formatLongDateTime(schedule.scheduledAt) },
      {
        label: c.fields.mode,
        value: schedule.amount === null ? c.schedule.fullMode : c.schedule.partialMode,
      },
      { label: c.fields.customer, value: formatPhone(schedule.payerPhone) },
      { label: c.fields.reason, value: schedule.reason },
      { label: c.fields.status, value: <ScheduleStatus status={schedule.status} /> },
    ];
    secondary = (
      <Button variant="secondaryLight" onClick={() => onAgain('schedule')}>
        {c.schedule.another}
      </Button>
    );
  }

  return (
    <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
      <div className="relative min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-10 sm:px-8">
        <button
          type="button"
          onClick={onClose}
          aria-label={c.close}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          {failed ? <FailureMark /> : <SuccessCheck />}
          <h2 id={titleId} role="status" className="mt-6 text-xl font-semibold tracking-tight">
            {title}
          </h2>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-neutral-500">{text}</p>
          <p className="mt-6 text-[2.25rem] font-semibold tabular-nums leading-none tracking-[-0.04em]">
            {amount}
          </p>
        </div>

        {/* Récapitulatif */}
        <div className="mt-7 overflow-hidden rounded-xl ring-1 ring-neutral-200">
          <div className="flex items-center gap-3 border-b border-neutral-100 bg-neutral-50/70 px-4 py-3">
            <ProviderMark provider={provider} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-neutral-500">
                {c.fields.transaction} · {providerNames[provider]}
              </p>
              <p className="truncate font-mono text-[0.8125rem] font-medium text-neutral-950">
                {number}
              </p>
            </div>
            <CopyButton value={number} label={c.copyNumber} />
          </div>
          <dl className="divide-y divide-neutral-100">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-2.5">
                <dt className="shrink-0 text-xs text-neutral-500">{row.label}</dt>
                <dd className="min-w-0 truncate text-right text-sm font-medium text-neutral-900">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-neutral-200 bg-neutral-50/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
        {secondary}
        <Button size="lg" onClick={onClose}>
          {c.done}
        </Button>
      </div>
    </div>
  );
}

/** Coche verte dessinée à l'ouverture (animation désactivée si l'utilisateur la refuse). */
function SuccessCheck() {
  return (
    <svg aria-hidden="true" viewBox="0 0 52 52" className="ui-success-check h-16 w-16" fill="none">
      <circle
        cx="26"
        cy="26"
        r="24"
        stroke="currentColor"
        strokeWidth="2.5"
        className="ui-success-ring text-emerald-600"
      />
      <path
        d="M16 27l7 7 13-15"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ui-success-path text-emerald-600"
      />
    </svg>
  );
}

/** Échec renvoyé par le serveur (ex. remboursement refusé par l'opérateur) : croix rouge. */
function FailureMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 52 52" className="ui-success-check h-16 w-16" fill="none">
      <circle
        cx="26"
        cy="26"
        r="24"
        stroke="currentColor"
        strokeWidth="2.5"
        className="ui-success-ring text-red-600"
      />
      <path
        d="M19 19l14 14M33 19L19 33"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="ui-success-path text-red-600"
      />
    </svg>
  );
}
