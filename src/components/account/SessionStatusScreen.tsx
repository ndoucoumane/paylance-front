import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { account as t } from '../../content/account.fr';
import { useSession } from '../../lib/session/sessionContext';
import { ApiError, errorMessage } from '../../services/api/errors';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { Spinner } from '../ui/Spinner';

/** Écran plein : vérification de la session, ou erreur avec reprise possible. */
export function SessionStatusScreen() {
  const { state, refresh, logout } = useSession();
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-neutral-50 px-4 py-12">
      <Logo tone="light" size="lg" />
      <div className="w-full max-w-md rounded-2xl bg-white p-6 ring-1 ring-neutral-200 sm:p-8">
        {state.status === 'error' ? (
          <div className="space-y-5">
            {state.error instanceof ApiError && state.error.kind === 'not-available' ? (
              <Alert tone="error" title={t.common.unavailableTitle}>
                <p>{state.error.message}</p>
                <p className="mt-2">{t.common.unavailableText}</p>
              </Alert>
            ) : (
              <Alert tone="error" title={t.common.errorTitle}>
                {errorMessage(state.error)}
              </Alert>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => run(refresh)} disabled={busy}>
                {busy ? <Spinner /> : <RotateCcw aria-hidden="true" className="h-4 w-4" />}
                {t.common.retry}
              </Button>
              <Button variant="ghostLight" onClick={() => run(logout)} disabled={busy}>
                {t.common.logout}
              </Button>
              <Link
                to="/"
                className="text-sm font-semibold text-neutral-700 underline-offset-4 hover:underline"
              >
                {t.common.backHome}
              </Link>
            </div>
          </div>
        ) : (
          <p role="status" className="flex items-center justify-center gap-3 text-neutral-600">
            <Spinner className="h-5 w-5 text-primary-strong" />
            {t.common.checkingSession}
          </p>
        )}
      </div>
    </div>
  );
}
