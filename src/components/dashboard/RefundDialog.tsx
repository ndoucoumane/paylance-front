import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { dashboard as t } from '../../content/dashboard.fr';
import { formatMoney } from '../../lib/format';
import { useSession } from '../../lib/session/sessionContext';
import { errorMessage } from '../../services/api/errors';
import type { Payment, Refund } from '../../services/payments/types';
import { FormAlert } from '../account/FormAlert';
import { SubmitButton } from '../account/SubmitButton';
import { Button } from '../ui/Button';
import { DialogPanel, ModalDialog } from './FormDialog';
import { RefundFields } from './RefundFields';
import {
  emptyRefund,
  requestedAmount,
  useRemaining,
  validateRefund,
  type RefundErrors,
  type RefundValues,
} from './refundForm';

type Props = {
  payment: Payment | null;
  onClose: () => void;
  onRefunded: (refund: Refund) => void;
};

const r = t.refund;

/** Fenêtre de remboursement : total ou partiel (selon l'opérateur), motif obligatoire. */
export function RefundDialog({ payment, onClose, onRefunded }: Props) {
  const titleId = useId();
  return (
    <ModalDialog open={Boolean(payment)} onClose={onClose} labelledBy={titleId}>
      {payment && (
        <RefundForm titleId={titleId} payment={payment} onClose={onClose} onRefunded={onRefunded} />
      )}
    </ModalDialog>
  );
}

function RefundForm({
  titleId,
  payment,
  onClose,
  onRefunded,
}: {
  titleId: string;
  payment: Payment;
  onClose: () => void;
  onRefunded: (refund: Refund) => void;
}) {
  const { api } = useSession();
  const { remaining, error: loadError } = useRemaining(payment);
  const [values, setValues] = useState<RefundValues>(emptyRefund);
  const [errors, setErrors] = useState<RefundErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // L'erreur d'un champ disparaît dès qu'il est modifié.
  const onChange = (patch: Partial<RefundValues>) => {
    setValues((current) => ({ ...current, ...patch }));
    setErrors((current) => ({
      amount: 'amount' in patch || 'mode' in patch ? undefined : current.amount,
      reason: 'reason' in patch ? undefined : current.reason,
    }));
  };

  const requested = requestedAmount(values, remaining);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (remaining === null) return;
    const nextErrors = validateRefund(values, remaining, payment);
    setErrors(nextErrors);
    if (nextErrors.amount || nextErrors.reason) return;

    setSubmitting(true);
    setError(null);
    try {
      const refund = await api.payments.refund(payment.paymentId, {
        amount: values.mode === 'partial' ? (requested ?? undefined) : undefined,
        reason: values.reason.trim(),
      });
      onRefunded(refund);
    } catch (cause) {
      setError(errorMessage(cause));
      setSubmitting(false);
    }
  };

  return (
    <DialogPanel
      titleId={titleId}
      tone="violet"
      icon={RotateCcw}
      title={r.title}
      subtitle={
        <span className="font-mono text-[0.8125rem]">{r.summary(payment.paymentNumber)}</span>
      }
      onClose={onClose}
      onSubmit={onSubmit}
      footer={
        <>
          <Button variant="secondaryLight" onClick={onClose} disabled={submitting}>
            {r.cancel}
          </Button>
          <SubmitButton loading={submitting} disabled={remaining === null}>
            {r.submit(requested ? formatMoney(requested, payment.currency) : '')}
          </SubmitButton>
        </>
      }
    >
      <FormAlert title={r.errorTitle} message={error ?? loadError} />
      <RefundFields
        idPrefix="refund"
        payment={payment}
        remaining={remaining}
        values={values}
        errors={errors}
        onChange={onChange}
      />
      <p className="mt-6 flex gap-2 text-[0.8125rem] leading-snug text-neutral-600">
        <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        {r.warning}
      </p>
    </DialogPanel>
  );
}
