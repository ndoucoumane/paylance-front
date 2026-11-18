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

/**
 * Contrôles de confort de saisie uniquement : le serveur refait tous les contrôles et son
 * message fait foi. Le plafond est le `refundableAmount` renvoyé par le serveur.
 */
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

/**
 * Solde remboursable d'un paiement, relu sur le serveur à l'ouverture du formulaire :
 * `refundableAmount`, calculé par le serveur (remboursements aboutis et en cours déduits).
 * Aucun calcul local : si la lecture échoue, le solde reste inconnu et l'envoi est bloqué.
 */
export function useRemaining(payment: Payment | null) {
  const { api } = useSession();
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setRemaining(null);
    setError(null);
    if (!payment) return;
    let cancelled = false;
    api.payments.get(payment.paymentId).then(
      (fresh) => {
        if (!cancelled) setRemaining(fresh.refundableAmount);
      },
      (cause: unknown) => {
        if (!cancelled) setError(errorMessage(cause));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [api, payment]);
  return { remaining, error };
}
