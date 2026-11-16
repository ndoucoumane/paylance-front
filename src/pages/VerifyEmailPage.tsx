import { OnboardingLayout } from '../components/account/OnboardingLayout';
import { VerifyEmailForm } from '../components/account/VerifyEmailForm';
import { account as t } from '../content/account.fr';
import { usePageTitle } from '../lib/hooks/usePageTitle';
import { useReadySession } from '../lib/session/sessionContext';

export default function VerifyEmailPage() {
  usePageTitle(t.meta.verifyEmail);
  const { snapshot } = useReadySession();
  return (
    <OnboardingLayout
      step="EMAIL"
      title={t.verify.title}
      subtitle={t.verify.subtitle(snapshot.user.email)}
    >
      <VerifyEmailForm />
    </OnboardingLayout>
  );
}
