import { CalendarPlus, Plus, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { dashboard as t } from '../../content/dashboard.fr';
import { useSession } from '../../lib/session/sessionContext';
import type { ProviderAccount } from '../../services/account/types';
import type { Payment, PaymentStats, PeriodDays } from '../../services/payments/types';
import { Button } from '../ui/Button';
import { PaymentDetailDialog } from './PaymentDetailDialog';
import { PaymentFormDialog } from './PaymentFormDialog';
import { RefundDialog } from './RefundDialog';
import { RefundPickerDialog } from './RefundPickerDialog';
import { ScheduledRefundsList } from './ScheduledRefundsList';
import { ScheduleRefundDialog } from './ScheduleRefundDialog';
import { useToast } from './toastContext';
import { TransactionsTable } from './TransactionsTable';

type Section = 'history' | 'scheduled';

type Props = {
  accounts: ProviderAccount[];
  currency: string;
  dialCode: string;
};

/** Page Transactions : historique, remboursements programmés et formulaires d'action. */
export function TransactionsWorkspace({ accounts, currency, dialCode }: Props) {
  const { api } = useSession();
  const toast = useToast();
  const [section, setSection] = useState<Section>('history');
  const [period, setPeriod] = useState<PeriodDays>(30);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  /** Incrémenté à chaque paiement, remboursement ou programmation pour tout recharger. */
  const [version, setVersion] = useState(0);
  const [upcoming, setUpcoming] = useState<number | null>(null);

  const [detail, setDetail] = useState<Payment | null>(null);
  const [refunding, setRefunding] = useState<Payment | null>(null);
  const [picking, setPicking] = useState(false);
  const [paying, setPaying] = useState(false);
  const [scheduling, setScheduling] = useState<{ payment: Payment | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.payments.overview(period).then(
      (data) => !cancelled && setStats(data.current),
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [api, period, version]);

  useEffect(() => {
    let cancelled = false;
    api.payments.scheduledRefunds().then(
      (items) =>
        !cancelled && setUpcoming(items.filter((item) => item.status === 'SCHEDULED').length),
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [api, version]);

  const refresh = () => setVersion((value) => value + 1);
  const closeDetail = useCallback(() => setDetail(null), []);
  const closeRefund = useCallback(() => setRefunding(null), []);
  const closePicker = useCallback(() => setPicking(false), []);
  const closePayment = useCallback(() => setPaying(false), []);
  const closeSchedule = useCallback(() => setScheduling(null), []);
  const openSchedule = useCallback(
    (payment: Payment | null = null) => setScheduling({ payment }),
    [],
  );

  const sections: { id: Section; label: string; short: string; count?: number | null }[] = [
    { id: 'history', label: t.page.sections.history, short: t.page.sectionsShort.history },
    {
      id: 'scheduled',
      label: t.page.sections.scheduled,
      short: t.page.sectionsShort.scheduled,
      count: upcoming,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Sections et actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label={t.page.sectionsLabel}
          className="inline-flex self-start rounded-full bg-white p-1 ring-1 ring-neutral-200"
        >
          {sections.map((item) => {
            const selected = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`onglet-${item.id}`}
                aria-selected={selected}
                aria-controls={`panneau-${item.id}`}
                onClick={() => setSection(item.id)}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  selected ? 'bg-neutral-950 text-white' : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <span className="sm:hidden">{item.short}</span>
                <span className="hidden sm:inline">{item.label}</span>
                {item.count ? (
                  <span
                    className={`rounded-full px-1.5 py-px text-[0.6875rem] font-semibold tabular-nums ${
                      selected ? 'bg-sky-400 text-neutral-950' : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {item.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <Button variant="secondaryLight" onClick={() => openSchedule()}>
            <CalendarPlus aria-hidden="true" className="h-4 w-4 text-sky-700" />
            <span className="sm:hidden">{t.page.schedule}</span>
            <span className="hidden sm:inline">{t.page.scheduleLong}</span>
          </Button>
          <Button variant="secondaryLight" onClick={() => setPicking(true)}>
            <RotateCcw aria-hidden="true" className="h-4 w-4 text-violet-700" />
            {t.page.refund}
          </Button>
          <Button className="col-span-2" onClick={() => setPaying(true)}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            {t.page.newPayment}
          </Button>
        </div>
      </div>

      <div
        role="tabpanel"
        id={`panneau-${section}`}
        aria-labelledby={`onglet-${section}`}
        className="space-y-4"
      >
        {section === 'history' ? (
          <>
            <TransactionsTable
              periodDays={period}
              stats={stats}
              currency={currency}
              version={version}
              onOpen={setDetail}
              onRefund={setRefunding}
              onSchedule={openSchedule}
              onPeriodChange={setPeriod}
              onCreate={() => setPaying(true)}
            />
          </>
        ) : (
          <ScheduledRefundsList
            version={version}
            onCreate={() => openSchedule()}
            onCount={setUpcoming}
          />
        )}
      </div>

      <PaymentDetailDialog
        payment={detail}
        version={version}
        onClose={closeDetail}
        onRefund={setRefunding}
        onSchedule={openSchedule}
      />
      <RefundPickerDialog
        open={picking}
        onClose={closePicker}
        onPick={(payment) => {
          setPicking(false);
          setRefunding(payment);
        }}
      />
      <RefundDialog
        payment={refunding}
        onClose={closeRefund}
        onRefunded={(refund) => {
          setRefunding(null);
          refresh();
          toast(t.refund.success);
          // Le tiroir ouvert affiche l'état réel du paiement après remboursement.
          if (detail?.paymentId === refund.paymentId) {
            api.payments.get(refund.paymentId).then(setDetail, () => undefined);
          }
        }}
      />
      <ScheduleRefundDialog
        open={scheduling !== null}
        payment={scheduling?.payment ?? null}
        onClose={closeSchedule}
        onScheduled={() => {
          setScheduling(null);
          refresh();
          setSection('scheduled');
          toast(t.schedule.success);
        }}
      />
      <PaymentFormDialog
        open={paying}
        accounts={accounts}
        currency={currency}
        dialCode={dialCode}
        onClose={closePayment}
        onCreated={() => {
          setSection('history');
          refresh();
        }}
        onView={(payment) => {
          setPaying(false);
          setDetail(payment);
        }}
      />
    </div>
  );
}
