import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadGate } from '../../components/account/LoadGate';
import { OnboardingLayout } from '../../components/account/OnboardingLayout';
import { PreferencesForm } from '../../components/account/PreferencesForm';
import { useLoad } from '../../components/account/useLoad';
import { account as t } from '../../content/account.fr';
import { usePageTitle } from '../../lib/hooks/usePageTitle';
import { ROUTES } from '../../lib/session/routing';
import { useReadySession } from '../../lib/session/sessionContext';
import { defaultPreferences } from '../../services/account/referenceData';

export default function PreferencesPage() {
  usePageTitle(t.meta.preferences);
  const { api, snapshot } = useReadySession();
  const navigate = useNavigate();
  const country = snapshot.organization?.country ?? 'SN';
  const loader = useCallback(
    async () => (await api.getPreferences()) ?? defaultPreferences(country),
    [api, country],
  );
  const [state, retry] = useLoad(loader);

  return (
    <OnboardingLayout
      step="PREFERENCES"
      title={t.preferences.title}
      subtitle={t.preferences.subtitle}
    >
      <LoadGate state={state} retry={retry}>
        {(preferences) => (
          <PreferencesForm initial={preferences} onSaved={() => navigate(ROUTES.plan)} />
        )}
      </LoadGate>
    </OnboardingLayout>
  );
}
