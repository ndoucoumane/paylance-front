import { Check, Search } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { dashboard as t } from '../../content/dashboard.fr';
import { formatMoney, formatPhone, formatShortDateTime } from '../../lib/format';
import { useSession } from '../../lib/session/sessionContext';
import { errorMessage } from '../../services/api/errors';
import type { Payment } from '../../services/payments/types';
import { Alert } from '../ui/Alert';
import { toneStyles, type DialogTone } from './dialogTones';
import { ProviderMark } from './ProviderMark';
import { providerNames } from './providers';
import { StatusBadge } from './StatusBadge';

type Props = {
  value: Payment | null;
  onChange: (payment: Payment) => void;
  tone?: DialogTone;
  /** Message d'erreur du formulaire parent (aucune transaction choisie). */
  error?: string;
};

/** Recherche et choix d'une transaction remboursable (paiements réussis des 90 derniers jours). */
export function PaymentPicker({ value, onChange, tone = 'violet', error }: Props) {
  const { api } = useSession();
  const id = useId();
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Payment[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const style = toneStyles[tone];

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const q = search.trim() || undefined;
      const query = { periodDays: 90 as const, q, page: 0, size: 25 };
      Promise.all([
        api.payments.list({ ...query, status: 'SUCCESS' }),
        api.payments.list({ ...query, status: 'PARTIALLY_REFUNDED' }),
      ]).then(
        ([paid, partial]) => {
          if (cancelled) return;
          setLoadError(null);
          setItems(
            [...paid.items, ...partial.items].sort((a, b) =>
              b.createdAt.localeCompare(a.createdAt),
            ),
          );
        },
        (cause: unknown) => !cancelled && setLoadError(errorMessage(cause)),
      );
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [api, search]);

  return (
    <div>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t.picker.search}
          aria-label={t.picker.searchLabel}
          aria-controls={`${id}-liste`}
          className="h-11 w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-4 text-[15px] text-neutral-950 transition-colors placeholder:text-neutral-400 hover:border-neutral-400 focus:border-primary-strong focus:outline-none focus:ring-4 focus:ring-primary/15"
        />
      </div>

      {loadError && (
        <Alert tone="error" title={t.picker.title} className="mt-3">
          {loadError}
        </Alert>
      )}

      <fieldset
        id={`${id}-liste`}
        aria-describedby={error ? `${id}-erreur` : `${id}-aide`}
        className={`mt-3 max-h-72 overflow-y-auto rounded-xl ring-1 ${
          error ? 'ring-red-600' : 'ring-neutral-200'
        }`}
      >
        <legend className="sr-only">{t.picker.listLabel}</legend>
        {items === null ? (
          <div aria-hidden="true" className="space-y-px">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="ui-skeleton h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="ui-skeleton h-3 w-36 rounded" />
                  <div className="ui-skeleton h-3 w-24 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-neutral-500">{t.picker.empty}</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {items.map((payment) => {
              const selected = value?.paymentId === payment.paymentId;
              return (
                <li key={payment.paymentId}>
                  <label
                    className={`relative flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-primary ${
                      selected ? style.row : 'hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`${id}-paiement`}
                      checked={selected}
                      onChange={() => onChange(payment)}
                      className="sr-only"
                    />
                    <ProviderMark provider={payment.provider} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-[0.8125rem] font-medium text-neutral-950">
                        {payment.paymentNumber}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-neutral-500">
                        {formatPhone(payment.payerPhone)} · {providerNames[payment.provider]} ·{' '}
                        {formatShortDateTime(payment.createdAt)}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-semibold tabular-nums text-neutral-950">
                        {formatMoney(payment.amount, payment.currency)}
                      </span>
                      {payment.status === 'PARTIALLY_REFUNDED' && (
                        <StatusBadge status={payment.status} />
                      )}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${
                        selected ? style.button : 'ring-neutral-300'
                      }`}
                    >
                      {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </fieldset>
      {error ? (
        <p id={`${id}-erreur`} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : (
        <p id={`${id}-aide`} className="mt-1.5 text-[0.8125rem] text-neutral-500">
          {t.picker.hint}
        </p>
      )}
    </div>
  );
}

/** Rappel compact de la transaction choisie, avec bouton « Changer ». */
export function SelectedPayment({
  payment,
  onChange,
}: {
  payment: Payment;
  onChange?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-neutral-50 px-4 py-3 ring-1 ring-neutral-200">
      <ProviderMark provider={payment.provider} />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[0.8125rem] font-medium text-neutral-950">
          {payment.paymentNumber}
        </p>
        <p className="mt-0.5 truncate text-xs text-neutral-500">
          {formatPhone(payment.payerPhone)} · {formatMoney(payment.amount, payment.currency)}
        </p>
      </div>
      {onChange && (
        <button
          type="button"
          onClick={onChange}
          className="rounded-full px-3 py-1 text-sm font-semibold text-neutral-700 ring-1 ring-inset ring-neutral-300 hover:bg-white"
        >
          {t.picker.change}
        </button>
      )}
    </div>
  );
}
