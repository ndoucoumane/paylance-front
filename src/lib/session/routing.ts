import type { OnboardingStep } from '../../services/account/types';
import type { SessionState } from './sessionContext';

export const ROUTES = {
  login: '/connexion',
  register: '/register',
  verifyEmail: '/verify-email',
  company: '/onboarding/company',
  preferences: '/onboarding/preferences',
  plan: '/onboarding/plan',
  providers: '/onboarding/connect-providers',
  dashboard: '/app',
  dashboardProviders: '/app/prestataires',
} as const;

export const STEP_ROUTES: Record<OnboardingStep, string> = {
  COMPANY: ROUTES.company,
  PREFERENCES: ROUTES.preferences,
  PLAN: ROUTES.plan,
  PROVIDERS: ROUTES.providers,
  DONE: ROUTES.dashboard,
};

export const STEP_ORDER: OnboardingStep[] = ['COMPANY', 'PREFERENCES', 'PLAN', 'PROVIDERS', 'DONE'];

/** Page où reprendre le parcours, d'après l'état renvoyé par le serveur. */
export function resumePath(state: SessionState): string {
  if (state.status !== 'ready') return ROUTES.login;
  if (!state.user.emailVerified) return ROUTES.verifyEmail;
  if (!state.organization) return ROUTES.company;
  return STEP_ROUTES[state.progress.currentStep];
}

/** Une étape est accessible si elle est terminée ou en cours (retour en arrière autorisé). */
export function canAccessStep(state: SessionState, step: OnboardingStep): boolean {
  if (state.status !== 'ready' || !state.user.emailVerified) return false;
  if (step !== 'COMPANY' && !state.organization) return false;
  const current = STEP_ORDER.indexOf(state.progress.currentStep);
  return STEP_ORDER.indexOf(step) <= current;
}
