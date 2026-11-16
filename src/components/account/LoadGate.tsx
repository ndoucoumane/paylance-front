import type { ReactNode } from 'react';
import { account as t } from '../../content/account.fr';
import { Alert } from '../ui/Alert';
import { Spinner } from '../ui/Spinner';
import type { LoadState } from './useLoad';

/** Affiche le chargement ou l'erreur, puis le contenu une fois les données prêtes. */
export function LoadGate<T>({
  state,
  retry,
  children,
}: {
  state: LoadState<T>;
  retry: () => void;
  children: (data: T) => ReactNode;
}) {
  if (state.status === 'loading') {
    return (
      <p role="status" className="flex items-center gap-2 py-6 text-neutral-500">
        <Spinner /> {t.common.loading}
      </p>
    );
  }
  if (state.status === 'error') {
    return (
      <Alert tone="error" title={t.common.errorTitle}>
        <p>{state.message}</p>
        <button
          type="button"
          onClick={retry}
          className="mt-2 font-semibold underline underline-offset-4"
        >
          {t.common.retry}
        </button>
      </Alert>
    );
  }
  return <>{children(state.data)}</>;
}
