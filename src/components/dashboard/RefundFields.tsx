import { dashboard as t } from '../../content/dashboard.fr';
import { currencyLabel, formatMoney } from '../../lib/format';
import { supportsPartialRefund } from '../../services/payments/rules';
import type { Payment } from '../../services/payments/types';
import { inputClass } from '../ui/form/Field';
import { Spinner } from '../ui/Spinner';
import { toneStyles, type DialogTone } from './dialogTones';
import { Chip } from './FormDialog';
import type { RefundErrors, RefundValues } from './refundForm';

const r = t.refund;

type Props = {
  idPrefix: string;
  payment: Payment;
  remaining: number | null;
  values: RefundValues;
  errors: RefundErrors;
  onChange: (patch: Partial<RefundValues>) => void;
  tone?: DialogTone;
};

/** Solde remboursable, mode total/partiel, montant et motif. */
export function RefundFields({
  idPrefix,
  payment,
  remaining,
  values,
  errors,
  onChange,
  tone = 'violet',
}: Props) {
  const partialAllowed = supportsPartialRefund(payment);
  const style = toneStyles[tone];
  const amountId = `${idPrefix}-amount`;
  const reasonId = `${idPrefix}-reason`;

  return (
    <div className="space-y-6">
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
                className={`flex items-start gap-3 rounded-xl p-3.5 transition-shadow ${
                  disabled
                    ? 'cursor-not-allowed bg-neutral-50 ring-1 ring-neutral-200'
                    : values.mode === value
                      ? `cursor-pointer ${style.selected}`
                      : 'cursor-pointer ring-1 ring-neutral-200 hover:ring-neutral-300'
                }`}
              >
                <input
                  type="radio"
                  name={`${idPrefix}-mode`}
                  value={value}
                  checked={values.mode === value}
                  disabled={disabled}
                  onChange={() => onChange({ mode: value })}
                  className={`mt-0.5 ${style.accent}`}
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

      {values.mode === 'partial' && (
        <div>
          <label htmlFor={amountId} className="block text-sm font-medium text-neutral-900">
            {r.amount}
          </label>
          <div className="relative mt-1.5">
            <input
              id={amountId}
              inputMode="decimal"
              autoComplete="off"
              value={values.amount}
              onChange={(event) => onChange({ amount: event.target.value })}
              aria-invalid={Boolean(errors.amount)}
              aria-describedby={errors.amount ? `${amountId}-erreur` : undefined}
              className={`${inputClass} pr-16 tabular-nums`}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-neutral-500">
              {currencyLabel(payment.currency)}
            </span>
          </div>
          {errors.amount && (
            <p id={`${amountId}-erreur`} className="mt-1.5 text-sm text-red-700">
              {errors.amount}
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor={reasonId} className="block text-sm font-medium text-neutral-900">
          {r.reason}
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {r.reasons.map((preset) => (
            <Chip
              key={preset}
              selected={values.reason === preset}
              onClick={() => onChange({ reason: preset })}
            >
              {preset}
            </Chip>
          ))}
        </div>
        <textarea
          id={reasonId}
          rows={3}
          value={values.reason}
          onChange={(event) => onChange({ reason: event.target.value })}
          maxLength={500}
          aria-invalid={Boolean(errors.reason)}
          aria-describedby={errors.reason ? `${reasonId}-erreur` : `${reasonId}-aide`}
          className={`${inputClass} mt-3 h-auto resize-none py-2.5`}
        />
        {errors.reason ? (
          <p id={`${reasonId}-erreur`} className="mt-1.5 text-sm text-red-700">
            {errors.reason}
          </p>
        ) : (
          <p id={`${reasonId}-aide`} className="mt-1.5 text-[0.8125rem] text-neutral-500">
            {r.reasonHint}
          </p>
        )}
      </div>
    </div>
  );
}
