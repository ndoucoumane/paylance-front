import { ArrowRight, RotateCcw } from 'lucide-react';
import { useId, useState } from 'react';
import { dashboard as t } from '../../content/dashboard.fr';
import type { Payment } from '../../services/payments/types';
import { Button } from '../ui/Button';
import { DialogPanel, ModalDialog } from './FormDialog';
import { PaymentPicker } from './PaymentPicker';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Transaction choisie : le formulaire de remboursement prend le relais. */
  onPick: (payment: Payment) => void;
};

/** Première étape d'un remboursement lancé depuis la page : choisir la transaction. */
export function RefundPickerDialog({ open, onClose, onPick }: Props) {
  const titleId = useId();
  return (
    <ModalDialog open={open} onClose={onClose} labelledBy={titleId}>
      <PickerStep titleId={titleId} onClose={onClose} onPick={onPick} />
    </ModalDialog>
  );
}

function PickerStep({ titleId, onClose, onPick }: Omit<Props, 'open'> & { titleId: string }) {
  const [selected, setSelected] = useState<Payment | null>(null);
  return (
    <DialogPanel
      titleId={titleId}
      tone="violet"
      icon={RotateCcw}
      title={t.picker.title}
      subtitle={t.picker.subtitle}
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        if (selected) onPick(selected);
      }}
      footer={
        <>
          <Button variant="secondaryLight" onClick={onClose}>
            {t.refund.cancel}
          </Button>
          <Button type="submit" size="lg" disabled={!selected}>
            {t.picker.continue}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        </>
      }
    >
      <PaymentPicker value={selected} onChange={setSelected} />
    </DialogPanel>
  );
}
