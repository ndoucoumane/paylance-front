import { createContext, useContext } from 'react';
import type { AccountApi } from '../../services/account';
import type { AccountSnapshot } from '../../services/account/types';
import type { ApiError } from '../../services/api/errors';

export type SessionState =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError | Error }
  | { status: 'anonymous' }
  | ({ status: 'ready' } & AccountSnapshot);

export type SessionContextValue = {
  state: SessionState;
  api: AccountApi;
  /**
   * Relit la session depuis le serveur (après chaque étape) et renvoie le nouvel état :
   * la page suivante se déduit de cette réponse, jamais d'un enchaînement codé en dur.
   */
  refresh: () => Promise<SessionState>;
  logout: () => Promise<void>;
};

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession doit être utilisé dans <SessionProvider>.');
  return value;
}

/** Session prête : à n'utiliser que derrière un garde de route. */
export function useReadySession() {
  const session = useSession();
  if (session.state.status !== 'ready') throw new Error('Session non prête');
  return { ...session, snapshot: session.state };
}
