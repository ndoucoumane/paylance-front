import { LogOut } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { account as t } from '../../content/account.fr';
import { ROUTES } from '../../lib/session/routing';
import { useSession } from '../../lib/session/sessionContext';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { Spinner } from '../ui/Spinner';
import { DemoBanner } from './DemoBanner';
import { OnboardingStepper, type StepperStep } from './OnboardingStepper';

type Props = {
  step: StepperStep;
  title: string;
  subtitle?: ReactNode;
  /** Sans carte blanche autour du contenu (ex. grille de prestataires). */
  bare?: boolean;
  children: ReactNode;
};

/** Mise en page des étapes d'onboarding : en-tête, indicateur d'étapes, contenu. */
export function OnboardingLayout({ step, title, subtitle, bare, children }: Props) {
  const { state, logout } = useSession();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);
  const email = state.status === 'ready' ? state.user.email : null;

  const onQuit = async () => {
    setLeaving(true);
    try {
      await logout();
      navigate(ROUTES.login, { replace: true });
    } catch {
      setLeaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <DemoBanner />
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo tone="light" />
          <div className="flex items-center gap-3">
            {email && <span className="hidden text-sm text-neutral-500 sm:inline">{email}</span>}
            <Button variant="ghostLight" onClick={onQuit} disabled={leaving}>
              {leaving ? <Spinner /> : <LogOut aria-hidden="true" className="h-4 w-4" />}
              <span className="hidden min-[400px]:inline">{t.common.quit}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14 lg:px-8 lg:py-14">
        <div className="lg:sticky lg:top-10 lg:self-start">
          <OnboardingStepper active={step} />
        </div>

        <main id="contenu" className="mt-8 min-w-0 lg:mt-0">
          <div className="max-w-3xl">
            <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-neutral-950 sm:text-[2rem]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">{subtitle}</p>
            )}
          </div>
          <div
            className={`mt-8 max-w-3xl ${bare ? '' : 'rounded-2xl bg-white p-5 ring-1 ring-neutral-200 sm:p-8'}`}
          >
            {children}
          </div>
          <p className="mt-6 max-w-3xl text-[0.8125rem] text-neutral-500">{t.stepper.saved}</p>
        </main>
      </div>
    </div>
  );
}
