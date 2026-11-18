import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AccountApi } from '../../services/account';
import { SessionContext, type SessionContextValue, type SessionState } from './sessionContext';

/** Fournit la session à toutes les pages du compte (inscription, onboarding, tableau de bord). */
export function SessionProvider({ api, children }: { api: AccountApi; children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading' });

  const refresh = useCallback(async (): Promise<SessionState> => {
    let next: SessionState;
    try {
      const snapshot = await api.getSnapshot();
      next = snapshot ? { status: 'ready', ...snapshot } : { status: 'anonymous' };
    } catch (error) {
      next = { status: 'error', error: error instanceof Error ? error : new Error(String(error)) };
    }
    setState(next);
    return next;
  }, [api]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await api.logout();
    setState({ status: 'anonymous' });
  }, [api]);

  const value = useMemo<SessionContextValue>(
    () => ({ state, api, refresh, logout }),
    [state, api, refresh, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
