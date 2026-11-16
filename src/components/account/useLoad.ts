import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '../../services/api/errors';

export type LoadState<T> =
  { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: T };

/** Chargement initial d'un écran, avec relance. */
export function useLoad<T>(loader: () => Promise<T>): [LoadState<T>, () => void] {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' });

  const run = useCallback(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    loader().then(
      (data) => !cancelled && setState({ status: 'ready', data }),
      (error: unknown) => !cancelled && setState({ status: 'error', message: errorMessage(error) }),
    );
    return () => {
      cancelled = true;
    };
  }, [loader]);

  useEffect(() => run(), [run]);

  return [state, run];
}
