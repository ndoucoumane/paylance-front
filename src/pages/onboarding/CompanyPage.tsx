import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompanyForm } from '../../components/account/CompanyForm';
import { LoadGate } from '../../components/account/LoadGate';
import { OnboardingLayout } from '../../components/account/OnboardingLayout';
import { useLoad } from '../../components/account/useLoad';
import { account as t } from '../../content/account.fr';
import { usePageTitle } from '../../lib/hooks/usePageTitle';
import { resumePath } from '../../lib/session/routing';
import { useReadySession } from '../../lib/session/sessionContext';

export default function CompanyPage() {
  usePageTitle(t.meta.company);
  const { api, snapshot } = useReadySession();
  const navigate = useNavigate();
  const hasOrganization = Boolean(snapshot.organization);
  const loader = useCallback(
    () => (hasOrganization ? api.getCompany() : Promise.resolve(null)),
    [api, hasOrganization],
  );
  const [state, retry] = useLoad(loader);

  return (
    <OnboardingLayout step="COMPANY" title={t.company.title} subtitle={t.company.subtitle}>
      <LoadGate state={state} retry={retry}>
        {(company) => (
          <CompanyForm initial={company} onSaved={(next) => navigate(resumePath(next))} />
        )}
      </LoadGate>
    </OnboardingLayout>
  );
}
