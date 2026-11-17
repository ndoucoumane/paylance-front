import { useEffect, useState } from 'react';
import { dashboard as t } from '../../content/dashboard.fr';
import { formatMoney } from '../../lib/format';
import { useSession } from '../../lib/session/sessionContext';
import { errorMessage } from '../../services/api/errors';
import type { Payment } from '../../services/payments/types';

const r = t.refund;

export type RefundValues = { mode: 'full' | 'partial'; amount: string; reason: string };
export type RefundErrors = { amount?: string; reason?: string };

export const emptyRefund: RefundValues = { mode: 'full', amount: '', reason: '' };

/** Montant demandé en centimes (`null` si la saisie n'est pas un nombre positif). */
export function requestedAmount(values: RefundValues, remaining: number | null): number | null {
  if (values.mode === 'full') return remaining;
  const parsed = Math.round(Number(values.amount.replace(/\s/g, '').replace(',', '.')) * 100);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function validateRefund(
  values: RefundValues,
  remaining: number,
  payment: Payment,
): RefundErrors {
  const errors: RefundErrors = {};
  const requested = requestedAmount(values, remaining);
  if (values.mode === 'partial' && (!requested || requested > remaining)) {
    errors.amount = r.amountInvalid(formatMoney(remaining, payment.currency));
  }
  if (!values.reason.trim()) errors.reason = r.reasonRequired;
  return errors;
}

/** Solde remboursable d'un paiement : montant moins les remboursements aboutis. */
export function useRemaining(payment: Payment | null) {
  const { api } = useSession();
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setRemaining(null);
    setError(null);
    if (!payment) return;
    let cancelled = false;
    api.payments.refunds(payment.paymentId).then(
      (refunds) => {
        if (cancelled) return;
        const done = refunds
          .filter((item) => item.status === 'SUCCESS')
          .reduce((sum, item) => sum + item.amount, 0);
        setRemaining(payment.amount - done);
      },
      (cause: unknown) => {
        if (cancelled) return;
        setError(errorMessage(cause));
        setRemaining(payment.amount);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [api, payment]);
  return { remaining, error };
}
