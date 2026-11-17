import { CalendarClock, Info } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { dashboard as t } from '../../content/dashboard.fr';
import { useSession } from '../../lib/session/sessionContext';
import { errorMessage } from '../../services/api/errors';
import type { Payment, ScheduledRefund } from '../../services/payments/types';
import { FormAlert } from '../account/FormAlert';
import { SubmitButton } from '../account/SubmitButton';
import { Button } from '../ui/Button';
import { inputClass } from '../ui/form/Field';
import { toneStyles } from './dialogTones';
import { Chip, DialogPanel, ModalDialog } from './FormDialog';
import { PaymentPicker, SelectedPayment } from './PaymentPicker';
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
  open: boolean;
  /** Transaction déjà choisie (depuis le menu d'une ligne), sinon choix dans le formulaire. */
  payment: Payment | null;
  onClose: () => void;
  onScheduled: (schedule: ScheduledRefund) => void;
};

const s = t.schedule;
const DAY = 86_400_000;
const MAX_DAYS = 90;

const pad = (value: number) => String(value).padStart(2, '0');
const toDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const toTime = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const longDate = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

type Preset = keyof typeof s.presets;

/** Échéances proposées, calculées à l'ouverture du formulaire. */
function presetDate(preset: Preset, now = new Date()): Date {
  const at = (days: number, hour: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    date.setHours(hour, 0, 0, 0);
    return date;
  };
  if (preset === 'tomorrow') return at(1, 9);
  if (preset === 'in3') return at(3, 9);
  if (preset === 'in7') return at(7, 9);
  // Dernier jour du mois à 18 h (ou du mois suivant si l'échéance est déjà passée).
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 18);
  return end.getTime() > now.getTime() + 3_600_000
    ? end
    : new Date(now.getFullYear(), now.getMonth() + 2, 0, 18);
}

export function ScheduleRefundDialog({ open, payment, onClose, onScheduled }: Props) {
  const titleId = useId();
  return (
    <ModalDialog open={open} onClose={onClose} labelledBy={titleId} size="lg">
      <ScheduleForm
        titleId={titleId}
        initial={payment}
        onClose={onClose}
        onScheduled={onScheduled}
      />
    </ModalDialog>
  );
}

function ScheduleForm({
  titleId,
  initial,
  onClose,
  onScheduled,
}: {
  titleId: string;
  initial: Payment | null;
  onClose: () => void;
  onScheduled: (schedule: ScheduledRefund) => void;
}) {
  const { api } = useSession();
  const [payment, setPayment] = useState<Payment | null>(initial);
  const [picking, setPicking] = useState(!initial);
  const { remaining, error: loadError } = useRemaining(picking ? null : payment);
  const [values, setValues] = useState<RefundValues>(emptyRefund);
  const [errors, setErrors] = useState<RefundErrors & { payment?: string; when?: string }>({});
  const [preset, setPreset] = useState<Preset | null>('tomorrow');
  const [date, setDate] = useState(() => toDate(presetDate('tomorrow')));
  const [time, setTime] = useState(() => toTime(presetDate('tomorrow')));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const tone = toneStyles.sky;

  const when = date && time ? new Date(`${date}T${time}`) : null;
  const whenValid =
    when !== null &&
    !Number.isNaN(when.getTime()) &&
    when.getTime() > Date.now() + 5 * 60_000 &&
    when.getTime() < Date.now() + MAX_DAYS * DAY;
  const today = new Date();

  const choosePreset = (value: Preset) => {
    const next = presetDate(value);
    setPreset(value);
    setDate(toDate(next));
    setTime(toTime(next));
    setErrors((current) => ({ ...current, when: undefined }));
  };

  const onRefundChange = (patch: Partial<RefundValues>) => {
    setValues((current) => ({ ...current, ...patch }));
    setErrors((current) => ({
      ...current,
      amount: 'amount' in patch || 'mode' in patch ? undefined : current.amount,
      reason: 'reason' in patch ? undefined : current.reason,
    }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!payment || picking) {
      setErrors({ payment: s.paymentRequired });
      return;
    }
    if (remaining === null) return;
    const nextErrors = {
      ...validateRefund(values, remaining, payment),
      when: whenValid ? undefined : s.whenInvalid,
    };
    setErrors(nextErrors);
    if (nextErrors.amount || nextErrors.reason || nextErrors.when) return;

    setSubmitting(true);
    setError(null);
    try {
      const schedule = await api.payments.scheduleRefund(payment.paymentId, {
        amount:
          values.mode === 'partial' ? (requestedAmount(values, remaining) ?? undefined) : undefined,
        reason: values.reason.trim(),
        scheduledAt: when!.toISOString(),
      });
      onScheduled(schedule);
    } catch (cause) {
      setError(errorMessage(cause));
      setSubmitting(false);
    }
  };

  return (
    <DialogPanel
      titleId={titleId}
      tone="sky"
      icon={CalendarClock}
      title={s.title}
      subtitle={s.subtitle}
      onClose={onClose}
      onSubmit={onSubmit}
      footer={
        <>
          <Button variant="secondaryLight" onClick={onClose} disabled={submitting}>
            {s.cancel}
          </Button>
          <SubmitButton loading={submitting} disabled={!picking && remaining === null}>
            {s.submit}
          </SubmitButton>
        </>
      }
    >
      <FormAlert title={s.errorTitle} message={error ?? loadError} />

      <div className="space-y-8">
        {/* 1. Transaction */}
        <section aria-labelledby={`${titleId}-tx`}>
          <h3 id={`${titleId}-tx`} className="mb-2 text-sm font-medium text-neutral-900">
            <span className="mr-2 text-neutral-400">1</span>
            {s.payment}
          </h3>
          {picking || !payment ? (
            <PaymentPicker
              tone="sky"
              value={payment}
              error={errors.payment}
              onChange={(next) => {
                setPayment(next);
                setPicking(false);
                setValues(emptyRefund);
                setErrors({});
              }}
            />
          ) : (
            <SelectedPayment payment={payment} onChange={() => setPicking(true)} />
          )}
        </section>

        {/* 2. Montant et motif */}
        {payment && !picking && (
          <section aria-labelledby={`${titleId}-montant`}>
            <h3 id={`${titleId}-montant`} className="mb-3 text-sm font-medium text-neutral-900">
              <span className="mr-2 text-neutral-400">2</span>
              {s.amountStep}
            </h3>
            <RefundFields
              idPrefix="schedule"
              tone="sky"
              payment={payment}
              remaining={remaining}
              values={values}
              errors={errors}
              onChange={onRefundChange}
            />
          </section>
        )}

        {/* 3. Échéance */}
        <fieldset>
          <legend className="mb-3 text-sm font-medium text-neutral-900">
            <span className="mr-2 text-neutral-400">{payment && !picking ? 3 : 2}</span>
            {s.when}
          </legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(s.presets) as Preset[]).map((key) => (
              <Chip key={key} selected={preset === key} onClick={() => choosePreset(key)}>
                {s.presets[key]}
              </Chip>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_9rem]">
            <div>
              <label htmlFor="schedule-date" className="sr-only">
                {s.date}
              </label>
              <input
                id="schedule-date"
                type="date"
                value={date}
                min={toDate(today)}
                max={toDate(new Date(today.getTime() + MAX_DAYS * DAY))}
                onChange={(event) => {
                  setDate(event.target.value);
                  setPreset(null);
                  setErrors((current) => ({ ...current, when: undefined }));
                }}
                aria-invalid={Boolean(errors.when)}
                aria-describedby="schedule-when-aide"
                className={`${inputClass} tabular-nums`}
              />
            </div>
            <div>
              <label htmlFor="schedule-time" className="sr-only">
                {s.time}
              </label>
              <input
                id="schedule-time"
                type="time"
                step={900}
                value={time}
                onChange={(event) => {
                  setTime(event.target.value);
                  setPreset(null);
                  setErrors((current) => ({ ...current, when: undefined }));
                }}
                aria-invalid={Boolean(errors.when)}
                aria-describedby="schedule-when-aide"
                className={`${inputClass} tabular-nums`}
              />
            </div>
          </div>
          <p
            id="schedule-when-aide"
            className={`mt-2 text-sm ${errors.when ? 'text-red-700' : 'text-neutral-600'}`}
          >
            {errors.when ??
              (whenValid && when ? s.whenSummary(longDate.format(when)) : s.whenInvalid)}
          </p>
        </fieldset>

        <p
          className={`flex gap-2.5 rounded-xl p-3.5 text-[0.8125rem] leading-snug ring-1 ring-inset ${tone.soft} ${tone.text}`}
        >
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {s.info}
        </p>
      </div>
    </DialogPanel>
  );
}
