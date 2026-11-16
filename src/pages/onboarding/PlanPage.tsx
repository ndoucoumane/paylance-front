import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadGate } from '../../components/account/LoadGate';
import { OnboardingLayout } from '../../components/account/OnboardingLayout';
import { PlanSelector } from '../../components/account/PlanSelector';
import { useLoad } from '../../components/account/useLoad';
import { account as t } from '../../content/account.fr';
import { usePageTitle } from '../../lib/hooks/usePageTitle';
import { ROUTES } from '../../lib/session/routing';
import { useReadySession } from '../../lib/session/sessionContext';

export default function PlanPage() {
  usePageTitle(t.meta.plan);
  const { api } = useReadySession();
  const navigate = useNavigate();
  const loader = useCallback(
    () => Promise.all([api.listPlans(), api.getSelectedPlan()] as const),
    [api],
  );
  const [state, retry] = useLoad(loader);

  return (
    <OnboardingLayout step="PLAN" title={t.plan.title} subtitle={t.plan.subtitle} bare>
      <LoadGate state={state} retry={retry}>
        {([plans, selected]) => (
          <PlanSelector
            plans={plans}
            selected={selected}
            onSaved={() => navigate(ROUTES.providers)}
          />
        )}
      </LoadGate>
    </OnboardingLayout>
  );
}
