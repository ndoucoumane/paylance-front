import { AlertTriangle, X } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { dashboard as t } from '../../content/dashboard.fr';
import { currencyLabel, formatMoney } from '../../lib/format';
import { useSession } from '../../lib/session/sessionContext';
import { supportsPartialRefund } from '../../services/payments/rules';
import type { Payment, Refund } from '../../services/payments/types';
import { errorMessage } from '../../services/api/errors';
import { FormAlert } from '../account/FormAlert';
import { SubmitButton } from '../account/SubmitButton';
import { Button } from '../ui/Button';
import { inputClass } from '../ui/form/Field';
import { Spinner } from '../ui/Spinner';
import { useDialog } from './useDialog';

type Props = {
  payment: Payment | null;
  onClose: () => void;
  onRefunded: (refund: Refund) => void;
};

const r = t.refund;

/** Fenêtre de remboursement : total ou partiel (selon l'opérateur), motif obligatoire. */
export function RefundDialog({ payment, onClose, onRefunded }: Props) {
  const { api } = useSession();
  const ref = useDialog(Boolean(payment), onClose);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [mode, setMode] = useState<'full' | 'partial'>('full');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ amount?: string; reason?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(
    async (target: Payment) => {
      setRemaining(null);
      try {
        const refunds = await api.payments.refunds(target.paymentId);
        const done = refunds
          .filter((item) => item.status === 'SUCCESS')
          .reduce((sum, item) => sum + item.amount, 0);
        setRemaining(target.amount - done);
      } catch (cause) {
        setError(errorMessage(cause));
        setRemaining(target.amount);
      }
    },
    [api],
  );

  useEffect(() => {
    if (!payment) return;
    setMode('full');
    setAmount('');
    setReason('');
    setErrors({});
    setError(null);
    setSubmitting(false);
    void load(payment);
  }, [payment, load]);

  if (!payment) return <dialog ref={ref} className="ui-dialog" />;

  // L'erreur d'un champ disparaît dès qu'il est corrigé.
  const updateReason = (value: string) => {
    setReason(value);
    if (value.trim()) setErrors((current) => ({ ...current, reason: undefined }));
  };

  const partialAllowed = supportsPartialRefund(payment);
  const unit = currencyLabel(payment.currency);
  const requested =
    mode === 'full'
      ? remaining
      : Math.round(Number(amount.replace(/\s/g, '').replace(',', '.')) * 100);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (remaining === null) return;
    const nextErrors: typeof errors = {};
    if (
      mode === 'partial' &&
      (!requested || requested <= 0 || requested > remaining || Number.isNaN(requested))
    ) {
      nextErrors.amount = r.amountInvalid(formatMoney(remaining, payment.currency));
    }
    if (!reason.trim()) nextErrors.reason = r.reasonRequired;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    setError(null);
    try {
      const refund = await api.payments.refund(payment.paymentId, {
        amount: mode === 'partial' ? (requested ?? undefined) : undefined,
        reason: reason.trim(),
      });
      onRefunded(refund);
    } catch (cause) {
      setError(errorMessage(cause));
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="remboursement-titre"
      className="ui-dialog m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-white p-0 text-neutral-950 shadow-float"
    >
      <form noValidate onSubmit={onSubmit}>
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5">
          <div>
            <h2 id="remboursement-titre" className="text-lg font-semibold tracking-tight">
              {r.title}
            </h2>
            <p className="mt-0.5 font-mono text-[0.8125rem] text-neutral-500">
              {r.summary(payment.paymentNumber)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.drawer.close}
            className="-mr-2 -mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <FormAlert title={r.errorTitle} message={error} />

          <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3.5 ring-1 ring-neutral-200">
            <span className="text-sm text-neutral-600">{r.remaining}</span>
            <span className="text-lg font-semibold tabular-nums">
              {remaining === null ? <Spinner /> : formatMoney(remaining, payment.currency)}
            </span>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-neutral-900">{r.mode}</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {(['full', 'partial'] as const).map((value) => {
                const disabled = value === 'partial' && !partialAllowed;
                return (
                  <label
                    key={value}
                    className={`flex gap-3 rounded-xl p-3.5 ring-1 transition-shadow ${
                      disabled
                        ? 'cursor-not-allowed bg-neutral-50 ring-neutral-200'
                        : mode === value
                          ? 'cursor-pointer ring-2 ring-neutral-950'
                          : 'cursor-pointer ring-neutral-200 hover:ring-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="refund-mode"
                      value={value}
                      checked={mode === value}
                      disabled={disabled}
                      onChange={() => setMode(value)}
                      className="mt-0.5 accent-neutral-950"
                    />
                    <span className="text-sm">
                      <span
                        className={`block font-medium ${disabled ? 'text-neutral-400' : 'text-neutral-900'}`}
                      >
                        {value === 'full' ? r.full : r.partial}
                      </span>
                      {disabled && (
                        <span className="mt-0.5 block text-xs text-neutral-400">
                          {r.partialUnavailable}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {mode === 'partial' && (
            <div>
              <label htmlFor="refund-amount" className="block text-sm font-medium text-neutral-900">
                {r.amount}
              </label>
              <div className="relative mt-1.5">
                <input
                  id="refund-amount"
                  inputMode="numeric"
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setErrors((current) => ({ ...current, amount: undefined }));
                  }}
                  aria-invalid={Boolean(errors.amount)}
                  aria-describedby={errors.amount ? 'refund-amount-erreur' : undefined}
                  className={`${inputClass} pr-16 tabular-nums`}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-neutral-500">
                  {unit}
                </span>
              </div>
              {errors.amount && (
                <p id="refund-amount-erreur" className="mt-1.5 text-sm text-red-700">
                  {errors.amount}
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="refund-reason" className="block text-sm font-medium text-neutral-900">
              {r.reason}
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {r.reasons.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => updateReason(preset)}
                  aria-pressed={reason === preset}
                  className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
                    reason === preset
                      ? 'bg-neutral-950 text-white ring-neutral-950'
                      : 'text-neutral-700 ring-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <textarea
              id="refund-reason"
              rows={3}
              value={reason}
              onChange={(event) => updateReason(event.target.value)}
              maxLength={500}
              aria-invalid={Boolean(errors.reason)}
              aria-describedby={errors.reason ? 'refund-reason-erreur' : 'refund-reason-aide'}
              className={`${inputClass} mt-3 h-auto resize-none py-2.5`}
            />
            {errors.reason ? (
              <p id="refund-reason-erreur" className="mt-1.5 text-sm text-red-700">
                {errors.reason}
              </p>
            ) : (
              <p id="refund-reason-aide" className="mt-1.5 text-[0.8125rem] text-neutral-500">
                {r.reasonHint}
              </p>
            )}
          </div>

          <p className="flex gap-2 text-[0.8125rem] leading-snug text-neutral-600">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            {r.warning}
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-neutral-200 bg-neutral-50/60 px-6 py-4 sm:flex-row sm:justify-end">
          <Button variant="secondaryLight" onClick={onClose} disabled={submitting}>
            {r.cancel}
          </Button>
          <SubmitButton loading={submitting} disabled={remaining === null}>
            {r.submit(
              requested && requested > 0 && !Number.isNaN(requested)
                ? formatMoney(requested, payment.currency)
                : '',
            )}
          </SubmitButton>
        </div>
      </form>
    </dialog>
  );
}
