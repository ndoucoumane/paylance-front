import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { SessionStatusScreen } from '../../components/account/SessionStatusScreen';
import type { OnboardingStep } from '../../services/account/types';
import { canAccessStep, resumePath, ROUTES, STEP_ROUTES } from './routing';
import { useSession } from './sessionContext';

export type GateRequirement =
  /** Connexion, inscription : réservées aux visiteurs non connectés. */
  | 'guest'
  /** Vérification de l'adresse e-mail. */
  | 'unverified'
  /** Étape d'onboarding (retour sur une étape terminée autorisé). */
  | { step: OnboardingStep }
  /** Espace professionnel : onboarding terminé. */
  | 'app';

/**
 * Garde de route : redirige selon l'état renvoyé par le serveur
 * (non connecté, e-mail non vérifié, entreprise absente, onboarding en cours, terminé).
 */
export function SessionGate({
  require,
  children,
}: {
  require: GateRequirement;
  children: ReactNode;
}) {
  const { state } = useSession();
  const location = useLocation();

  if (state.status === 'loading' || state.status === 'error') return <SessionStatusScreen />;

  if (require === 'guest') {
    return state.status === 'ready' ? <Navigate to={resumePath(state)} replace /> : <>{children}</>;
  }

  if (state.status === 'anonymous') {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }

  const resume = resumePath(state);

  if (require === 'unverified') {
    return state.user.emailVerified ? <Navigate to={resume} replace /> : <>{children}</>;
  }

  if (require === 'app') {
    return resume === STEP_ROUTES.DONE ? <>{children}</> : <Navigate to={resume} replace />;
  }

  return canAccessStep(state, require.step) ? <>{children}</> : <Navigate to={resume} replace />;
}
