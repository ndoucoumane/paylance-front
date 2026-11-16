import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { account as t } from '../../content/account.fr';
import { canAccessStep, STEP_ROUTES } from '../../lib/session/routing';
import { useSession } from '../../lib/session/sessionContext';
import type { OnboardingStep } from '../../services/account/types';

export type StepperStep = 'ACCOUNT' | 'EMAIL' | Exclude<OnboardingStep, 'DONE'>;

const STEPS: StepperStep[] = ['ACCOUNT', 'EMAIL', 'COMPANY', 'PREFERENCES', 'PLAN', 'PROVIDERS'];

type StepState = {
  id: StepperStep;
  label: string;
  status: 'complete' | 'current' | 'upcoming';
  href?: string;
};

function useSteps(active: StepperStep): StepState[] {
  const { state } = useSession();
  return STEPS.map((id) => {
    const label = t.stepper.steps[id];
    if (id === active) return { id, label, status: 'current' };
    if (state.status !== 'ready') return { id, label, status: 'upcoming' };
    if (id === 'ACCOUNT') return { id, label, status: 'complete' };
    if (id === 'EMAIL')
      return { id, label, status: state.user.emailVerified ? 'complete' : 'upcoming' };
    const complete = state.progress.completedSteps.includes(id);
    const href = canAccessStep(state, id) ? STEP_ROUTES[id] : undefined;
    return { id, label, status: complete ? 'complete' : 'upcoming', href };
  });
}

/** Indicateur de progression : liste verticale sur grand écran, barre compacte sur mobile. */
export function OnboardingStepper({ active }: { active: StepperStep }) {
  const steps = useSteps(active);
  const index = STEPS.indexOf(active);

  return (
    <nav aria-label={t.stepper.label}>
      {/* Mobile et tablette */}
      <div className="lg:hidden">
        <p className="text-sm font-medium text-neutral-500">
          {t.stepper.progress(index + 1, STEPS.length)}
          <span className="text-neutral-900"> · {t.stepper.steps[active]}</span>
        </p>
        <div className="mt-3 grid grid-cols-6 gap-1.5" aria-hidden="true">
          {steps.map((step) => (
            <span
              key={step.id}
              className={`h-1.5 rounded-full ${
                step.status === 'complete'
                  ? 'bg-primary'
                  : step.status === 'current'
                    ? 'bg-neutral-900'
                    : 'bg-neutral-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Grand écran */}
      <ol className="hidden lg:block">
        {steps.map((step, position) => {
          const last = position === steps.length - 1;
          const content = (
            <>
              <span
                className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  step.status === 'complete'
                    ? 'bg-primary text-white'
                    : step.status === 'current'
                      ? 'bg-neutral-950 text-white'
                      : 'bg-white text-neutral-400 ring-1 ring-inset ring-neutral-300'
                }`}
              >
                {step.status === 'complete' ? (
                  <Check aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
                ) : (
                  position + 1
                )}
              </span>
              <span className="pt-1">
                <span
                  className={`block text-sm ${
                    step.status === 'current'
                      ? 'font-semibold text-neutral-950'
                      : step.status === 'complete'
                        ? 'font-medium text-neutral-700'
                        : 'text-neutral-500'
                  }`}
                >
                  {step.label}
                </span>
                {step.id === 'PROVIDERS' && (
                  <span className="block text-xs text-neutral-500">{t.stepper.optional}</span>
                )}
                <span className="sr-only">
                  {step.status === 'complete'
                    ? ' (terminée)'
                    : step.status === 'current'
                      ? ' (en cours)'
                      : ''}
                </span>
              </span>
            </>
          );
          return (
            <li key={step.id} className="relative pb-7 last:pb-0">
              {!last && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[13px] top-8 h-[calc(100%-2.25rem)] w-px ${
                    step.status === 'complete' ? 'bg-primary' : 'bg-neutral-200'
                  }`}
                />
              )}
              {step.href && step.status === 'complete' ? (
                <Link
                  to={step.href}
                  className="-m-1 flex items-start gap-3 rounded-lg p-1 hover:bg-neutral-100"
                >
                  {content}
                </Link>
              ) : (
                <div
                  className="flex items-start gap-3"
                  aria-current={step.status === 'current' ? 'step' : undefined}
                >
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
