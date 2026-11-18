import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormAlert } from '../../components/account/FormAlert';
import { OnboardingLayout } from '../../components/account/OnboardingLayout';
import { ProvidersManager } from '../../components/account/ProvidersManager';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { account as t } from '../../content/account.fr';
import { usePageTitle } from '../../lib/hooks/usePageTitle';
import { resumePath, ROUTES } from '../../lib/session/routing';
import { useReadySession } from '../../lib/session/sessionContext';
import { errorMessage } from '../../services/api/errors';

export default function ConnectProvidersPage() {
  usePageTitle(t.meta.providers);
  const { api, refresh, snapshot } = useReadySession();
  const navigate = useNavigate();
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async () => {
    setFinishing(true);
    setError(null);
    try {
      if (snapshot.progress.currentStep !== 'DONE') {
        await api.completeProvidersStep();
        navigate(resumePath(await refresh()));
      } else {
        navigate(ROUTES.dashboard);
      }
    } catch (cause) {
      setError(errorMessage(cause));
      setFinishing(false);
    }
  };

  return (
    <OnboardingLayout
      step="PROVIDERS"
      title={t.providers.title}
      subtitle={t.providers.subtitle}
      bare
    >
      <ProvidersManager
        footer={(activeCount) => (
          <div className="border-t border-neutral-200 pt-6">
            <FormAlert title={t.common.errorTitle} message={error} />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                size="lg"
                variant={activeCount ? 'primary' : 'secondaryLight'}
                onClick={() => void finish()}
                disabled={finishing}
                aria-busy={finishing}
              >
                {finishing && <Spinner />}
                {activeCount ? t.providers.finish : t.providers.skip}
              </Button>
            </div>
          </div>
        )}
      />
    </OnboardingLayout>
  );
}
