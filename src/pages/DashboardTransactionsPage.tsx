import { useCallback } from 'react';
import { AppLayout } from '../components/account/AppLayout';
import { EmptyDashboardState } from '../components/account/EmptyDashboardState';
import { LoadGate } from '../components/account/LoadGate';
import { useLoad } from '../components/account/useLoad';
import { ToastProvider } from '../components/dashboard/Toast';
import { TransactionsWorkspace } from '../components/dashboard/TransactionsWorkspace';
import { account } from '../content/account.fr';
import { dashboard as t } from '../content/dashboard.fr';
import { usePageTitle } from '../lib/hooks/usePageTitle';
import { useReadySession } from '../lib/session/sessionContext';
import { findCountry } from '../services/account/referenceData';

export default function DashboardTransactionsPage() {
  usePageTitle(account.meta.dashboardTransactions);
  const { api, snapshot } = useReadySession();
  const loader = useCallback(() => api.listProviderAccounts(), [api]);
  const [state, retry] = useLoad(loader);
  const { organization } = snapshot;

  return (
    <AppLayout>
      <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-neutral-950">
        {t.page.title}
      </h1>
      <p className="mt-1 text-[15px] text-neutral-600">{t.page.subtitle}</p>

      <div className="mt-8">
        <LoadGate state={state} retry={retry}>
          {(accounts) => {
            const active = accounts.filter((entry) => entry.status === 'ACTIVE');
            if (active.length === 0) return <EmptyDashboardState />;
            return (
              <ToastProvider>
                <TransactionsWorkspace
                  accounts={active}
                  currency={organization?.defaultCurrency ?? 'XOF'}
                  dialCode={findCountry(organization?.country ?? 'SN')?.dialCode ?? '+221'}
                />
              </ToastProvider>
            );
          }}
        </LoadGate>
      </div>
    </AppLayout>
  );
}
