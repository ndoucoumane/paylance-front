import { Check, Circle } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/account/AppLayout';
import { EmptyDashboardState } from '../components/account/EmptyDashboardState';
import { ToastProvider } from '../components/dashboard/Toast';
import { TransactionsOverview } from '../components/dashboard/TransactionsOverview';
import { PeriodSelector } from '../components/dashboard/PeriodSelector';
import { LoadGate } from '../components/account/LoadGate';
import { useLoad } from '../components/account/useLoad';
import { account as t } from '../content/account.fr';
import { usePageTitle } from '../lib/hooks/usePageTitle';
import { ROUTES } from '../lib/session/routing';
import { useReadySession } from '../lib/session/sessionContext';
import type { PeriodDays } from '../services/payments/types';
import type { AccountSnapshot } from '../services/account/types';

function SetupChecklist({
  snapshot,
  hasActive,
}: {
  snapshot: AccountSnapshot;
  hasActive: boolean;
}) {
  const done = new Set(snapshot.progress.completedSteps);
  const items = [
    { label: t.app.setup.account, ok: true },
    { label: t.app.setup.email, ok: snapshot.user.emailVerified },
    { label: t.app.setup.company, ok: done.has('COMPANY') },
    { label: t.app.setup.preferences, ok: done.has('PREFERENCES') },
    { label: t.app.setup.plan, ok: done.has('PLAN') },
    { label: t.app.setup.provider, ok: hasActive, href: ROUTES.dashboardProviders },
  ];
  const count = items.filter((item) => item.ok).length;
  return (
    <section
      aria-labelledby="mise-en-route"
      className="rounded-2xl bg-white p-6 ring-1 ring-neutral-200"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="mise-en-route" className="text-base font-semibold text-neutral-950">
          {t.app.setupTitle}
        </h2>
        <span className="text-xs text-neutral-500">{t.app.setupDone(count, items.length)}</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100" aria-hidden="true">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${(count / items.length) * 100}%` }}
        />
      </div>
      <ul className="mt-5 space-y-3 text-sm">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2.5">
            {item.ok ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                <Check aria-hidden="true" className="h-3 w-3" strokeWidth={3} />
              </span>
            ) : (
              <Circle aria-hidden="true" className="h-5 w-5 text-neutral-300" />
            )}
            {!item.ok && item.href ? (
              <Link
                to={item.href}
                className="font-medium text-primary-strong underline-offset-4 hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span className={item.ok ? 'text-neutral-700' : 'text-neutral-500'}>
                {item.label}
              </span>
            )}
            <span className="sr-only">{item.ok ? ' : terminé' : ' : à faire'}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function DashboardPage() {
  usePageTitle(t.meta.dashboard);
  const { api, snapshot } = useReadySession();
  const loader = useCallback(() => api.listProviderAccounts(), [api]);
  const [state, retry] = useLoad(loader);
  const { user, organization } = snapshot;
  const [period, setPeriod] = useState<PeriodDays>(30);
  const hasActive =
    state.status === 'ready' && state.data.some((account) => account.status === 'ACTIVE');

  return (
    <AppLayout>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-neutral-950">
            {t.app.hello(user.firstName)}
          </h1>
          {organization && (
            <p className="mt-1 text-[15px] text-neutral-600">
              {organization.name} · {t.app.org(t.app.roles[organization.role])}
            </p>
          )}
        </div>
        {hasActive && <PeriodSelector value={period} onChange={setPeriod} />}
      </div>

      <div className="mt-8">
        <LoadGate state={state} retry={retry}>
          {(accounts) => {
            if (!accounts.some((account) => account.status === 'ACTIVE')) {
              return (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <EmptyDashboardState />
                  <div>
                    <SetupChecklist snapshot={snapshot} hasActive={false} />
                  </div>
                </div>
              );
            }
            return (
              <ToastProvider>
                <TransactionsOverview
                  currency={organization?.defaultCurrency ?? 'XOF'}
                  period={period}
                />
              </ToastProvider>
            );
          }}
        </LoadGate>
      </div>
    </AppLayout>
  );
}
