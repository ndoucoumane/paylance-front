import { Check, CircleCheck, Copy, Smartphone } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { dashboard as t } from '../../content/dashboard.fr';
import { currencyLabel, formatMoney, formatNumber, formatPhone } from '../../lib/format';
import { useSession } from '../../lib/session/sessionContext';
import type { ProviderAccount } from '../../services/account/types';
import { errorMessage } from '../../services/api/errors';
import type { Payment } from '../../services/payments/types';
import { FormAlert } from '../account/FormAlert';
import { SubmitButton } from '../account/SubmitButton';
import { Button } from '../ui/Button';
import { Field, inputClass } from '../ui/form/Field';
import { toneStyles } from './dialogTones';
import { Chip, DialogPanel, ModalDialog } from './FormDialog';
import { ProviderMark } from './ProviderMark';
import { providerNames } from './providers';
import { StatusBadge } from './StatusBadge';
import { useToast } from './toastContext';

type Props = {
  open: boolean;
  /** Comptes prestataires actifs. */
  accounts: ProviderAccount[];
  currency: string;
  /** Indicatif du pays de l'entreprise, ex. +221. */
  dialCode: string;
  onClose: () => void;
  onCreated: (payment: Payment) => void;
  onView: (payment: Payment) => void;
};

const p = t.payment;
/** Montants en unités entières de la devise (F CFA). */
const MIN = 100;
const MAX = 2_000_000;
const QUICK = [5_000, 10_000, 25_000, 50_000];
const EXPIRIES = [15, 60, 1440] as const;
const DESCRIPTION_MAX = 140;

/** « 771234567 » → « 77 123 45 67 » pendant la saisie. */
function groupPhone(digits: string): string {
  return [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 7),
    digits.slice(7, 9),
    digits.slice(9),
  ]
    .filter(Boolean)
    .join(' ');
}

export function PaymentFormDialog(props: Props) {
  const titleId = useId();
  return (
    <ModalDialog open={props.open} onClose={props.onClose} labelledBy={titleId}>
      <PaymentForm titleId={titleId} {...props} />
    </ModalDialog>
  );
}

type Errors = { amount?: string; account?: string; phone?: string };

function PaymentForm({
  titleId,
  accounts,
  currency,
  dialCode,
  onClose,
  onCreated,
  onView,
}: Props & { titleId: string }) {
  const { api } = useSession();
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts.length === 1 ? accounts[0]!.id : '');
  const [phone, setPhone] = useState('');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [expiry, setExpiry] = useState<(typeof EXPIRIES)[number]>(60);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Payment | null>(null);
  const tone = toneStyles.emerald;

  const value = Number(amount) || 0;
  const amountOk = value >= MIN && value <= MAX;
  const phoneOk = /^\d{8,10}$/.test(phone);
  const account = accounts.find((entry) => entry.id === accountId) ?? null;
  const unit = currencyLabel(currency);
  const money = (units: number) => formatMoney(units * 100, currency);

  const clear = (key: keyof Errors) => setErrors((current) => ({ ...current, [key]: undefined }));

  const reset = () => {
    setCreated(null);
    setAmount('');
    setPhone('');
    setReference('');
    setDescription('');
    setErrors({});
    setError(null);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Errors = {
      amount: amountOk ? undefined : p.amountInvalid(money(MIN), money(MAX)),
      account: account ? undefined : p.accountRequired,
      phone: phoneOk ? undefined : p.phoneInvalid,
    };
    setErrors(next);
    if (next.amount || next.account || next.phone) {
      const first = next.amount
        ? 'payment-amount'
        : next.account
          ? 'payment-account'
          : 'payment-phone';
      document.getElementById(first)?.focus();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payment = await api.payments.create({
        providerAccountId: account!.id,
        amount: value * 100,
        payerPhone: `${dialCode}${phone}`,
        externalReference: reference.trim() || undefined,
        description: description.trim() || undefined,
        expiresInMinutes: expiry,
      });
      setCreated(payment);
      onCreated(payment);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <DialogPanel
        titleId={titleId}
        tone="emerald"
        icon={Smartphone}
        title={p.title}
        onClose={onClose}
        footer={
          <>
            <Button variant="secondaryLight" onClick={reset}>
              {p.another}
            </Button>
            <Button variant="secondaryLight" onClick={() => onView(created)}>
              {p.viewDetail}
            </Button>
            <Button size="lg" onClick={onClose}>
              {p.done}
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center py-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-8 ring-emerald-50/50">
            <CircleCheck aria-hidden="true" className="h-7 w-7" />
          </span>
          <p role="status" className="mt-5 text-lg font-semibold">
            {p.successTitle}
          </p>
          <p className="mt-1 max-w-sm text-sm text-neutral-500">{p.successText}</p>
          <p className="mt-6 text-4xl font-semibold tabular-nums tracking-tight">
            {formatMoney(created.amount, created.currency)}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <StatusBadge status={created.status} />
            <span className="text-sm text-neutral-500">
              {providerNames[created.provider]} · {formatPhone(created.payerPhone)}
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              void navigator.clipboard
                ?.writeText(created.paymentNumber)
                .then(() => toast(t.actions.copied))
            }
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 font-mono text-[0.8125rem] font-medium text-neutral-900 ring-1 ring-neutral-200 hover:bg-neutral-100"
          >
            {created.paymentNumber}
            <Copy aria-hidden="true" className="h-3.5 w-3.5 text-neutral-500" />
            <span className="sr-only">{t.actions.copyNumber}</span>
          </button>
        </div>
      </DialogPanel>
    );
  }

  return (
    <DialogPanel
      titleId={titleId}
      tone="emerald"
      icon={Smartphone}
      title={p.title}
      subtitle={p.subtitle}
      onClose={onClose}
      onSubmit={onSubmit}
      footer={
        <>
          <Button variant="secondaryLight" onClick={onClose} disabled={submitting}>
            {p.cancel}
          </Button>
          <SubmitButton loading={submitting}>{p.submit(amountOk ? money(value) : '')}</SubmitButton>
        </>
      }
    >
      <FormAlert title={p.errorTitle} message={error} />

      <div className="space-y-7">
        {/* Montant : grand champ central, comme sur un terminal de paiement. */}
        <div>
          <label htmlFor="payment-amount" className="block text-sm font-medium text-neutral-900">
            {p.amount}
          </label>
          <div
            className={`mt-2 flex items-baseline justify-center gap-2 rounded-2xl px-4 py-5 ring-1 transition-shadow focus-within:ring-2 ${
              errors.amount ? 'ring-red-600' : 'ring-neutral-200 focus-within:ring-emerald-600'
            }`}
          >
            <input
              id="payment-amount"
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              value={amount ? formatNumber(Number(amount)) : ''}
              onChange={(event) => {
                setAmount(event.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9));
                clear('amount');
              }}
              aria-invalid={Boolean(errors.amount)}
              aria-describedby={errors.amount ? 'payment-amount-erreur' : undefined}
              style={{ width: `${Math.max(1, formatNumber(value || 0).length) + 0.5}ch` }}
              className="min-w-[2ch] max-w-full bg-transparent text-right text-4xl font-semibold tabular-nums tracking-tight text-neutral-950 placeholder:text-neutral-300 focus:outline-none"
            />
            <span className="text-lg font-medium text-neutral-500">{unit}</span>
          </div>
          {errors.amount && (
            <p id="payment-amount-erreur" className="mt-1.5 text-sm text-red-700">
              {errors.amount}
            </p>
          )}
          <div
            role="group"
            aria-label={p.quickAmounts}
            className="mt-3 flex flex-wrap justify-center gap-2"
          >
            {QUICK.map((quick) => (
              <Chip
                key={quick}
                selected={value === quick}
                onClick={() => {
                  setAmount(String(quick));
                  clear('amount');
                }}
              >
                {formatNumber(quick)}
              </Chip>
            ))}
          </div>
        </div>

        {/* Compte prestataire */}
        <fieldset>
          <legend className="text-sm font-medium text-neutral-900">{p.account}</legend>
          <div
            id="payment-account"
            tabIndex={-1}
            className={`mt-2 grid gap-3 rounded-xl sm:grid-cols-2 ${
              errors.account ? 'outline outline-2 outline-offset-4 outline-red-600' : ''
            }`}
          >
            {accounts.map((entry) => {
              const selected = entry.id === accountId;
              return (
                <label
                  key={entry.id}
                  className={`relative flex cursor-pointer items-center gap-3 rounded-xl p-3.5 transition-shadow has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
                    selected ? tone.selected : 'ring-1 ring-neutral-200 hover:ring-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-account"
                    value={entry.id}
                    checked={selected}
                    onChange={() => {
                      setAccountId(entry.id);
                      clear('account');
                    }}
                    className="sr-only"
                  />
                  <ProviderMark provider={entry.provider} />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block truncate font-medium text-neutral-900">
                      {entry.label}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
                      {providerNames[entry.provider]}
                      {entry.environment === 'TEST' && (
                        <span className="rounded bg-neutral-100 px-1.5 py-px text-[0.625rem] font-semibold uppercase tracking-wide text-neutral-500">
                          {p.test}
                        </span>
                      )}
                    </span>
                  </span>
                  {selected && (
                    <span
                      aria-hidden="true"
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${tone.button}`}
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                </label>
              );
            })}
          </div>
          {errors.account && <p className="mt-1.5 text-sm text-red-700">{errors.account}</p>}
        </fieldset>

        {/* Client */}
        <Field id="payment-phone" label={p.phone} required hint={p.phoneHint} error={errors.phone}>
          {(control) => (
            <div className="flex">
              <span className="inline-flex h-11 items-center rounded-l-lg border border-r-0 border-neutral-300 bg-neutral-50 px-3.5 text-[15px] tabular-nums text-neutral-600">
                {dialCode}
              </span>
              <input
                {...control}
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder="77 123 45 67"
                value={groupPhone(phone)}
                onChange={(event) => {
                  setPhone(event.target.value.replace(/\D/g, '').slice(0, 10));
                  clear('phone');
                }}
                className={`${inputClass} rounded-l-none tabular-nums`}
              />
            </div>
          )}
        </Field>

        <div className="grid gap-5">
          <Field id="payment-reference" label={p.reference} optional>
            {(control) => (
              <input
                {...control}
                value={reference}
                maxLength={64}
                onChange={(event) => setReference(event.target.value)}
                placeholder={p.referencePlaceholder}
                className={`${inputClass} font-mono text-sm`}
              />
            )}
          </Field>
          <Field
            id="payment-description"
            label={p.description}
            optional
            hint={`${p.descriptionHint} ${description.length}/${DESCRIPTION_MAX}`}
          >
            {(control) => (
              <input
                {...control}
                value={description}
                maxLength={DESCRIPTION_MAX}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={p.descriptionPlaceholder}
                className={inputClass}
              />
            )}
          </Field>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-neutral-900">{p.expiry}</legend>
          <div className="mt-2 inline-flex rounded-full bg-neutral-100 p-1">
            {EXPIRIES.map((minutes) => (
              <label
                key={minutes}
                className={`relative cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${
                  expiry === minutes
                    ? 'bg-white text-neutral-950 shadow-card'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <input
                  type="radio"
                  name="payment-expiry"
                  checked={expiry === minutes}
                  onChange={() => setExpiry(minutes)}
                  className="sr-only"
                />
                {p.expiries[minutes]}
              </label>
            ))}
          </div>
        </fieldset>

        {amountOk && phoneOk && account && (
          <p
            className={`flex gap-2.5 rounded-xl p-3.5 text-sm leading-snug ring-1 ring-inset ${tone.soft} ${tone.text}`}
          >
            <Smartphone aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            {p.recap(
              money(value),
              providerNames[account.provider],
              formatPhone(`${dialCode}${phone}`),
            )}
          </p>
        )}
      </div>
    </DialogPanel>
  );
}
