import { AppLayout } from '../components/account/AppLayout';
import { ProvidersManager } from '../components/account/ProvidersManager';
import { account as t } from '../content/account.fr';
import { usePageTitle } from '../lib/hooks/usePageTitle';

export default function DashboardProvidersPage() {
  usePageTitle(t.meta.dashboardProviders);
  return (
    <AppLayout>
      <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-neutral-950">
        {t.providers.dashboardTitle}
      </h1>
      <p className="mt-1 text-[15px] text-neutral-600">{t.providers.dashboardSubtitle}</p>
      <div className="mt-8 max-w-3xl">
        <ProvidersManager />
      </div>
    </AppLayout>
  );
}
