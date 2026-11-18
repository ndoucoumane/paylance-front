import { useCallback, useRef } from 'react';
import { ApiError } from '../../services/api/errors';

/**
 * Clé `Idempotency-Key` d'un formulaire de création (paiement, remboursement, programmation).
 *
 * - `keyFor(demande)` renvoie la même clé pour la même demande tant que le serveur n'a pas
 *   répondu : une relance après une coupure réseau ou un délai dépassé ne crée donc pas
 *   l'opération deux fois.
 * - Une demande différente (saisie modifiée) obtient une nouvelle clé.
 * - `settle(erreur)`, dans le `catch`, abandonne la clé dès que le serveur a répondu : un refus
 *   suivi d'une nouvelle tentative est une nouvelle demande.
 */
export function useIdempotencyKey() {
  const pending = useRef<{ key: string; request: string } | null>(null);

  const keyFor = useCallback((request: unknown) => {
    const serialized = JSON.stringify(request);
    if (pending.current?.request !== serialized) {
      pending.current = { key: crypto.randomUUID(), request: serialized };
    }
    return pending.current.key;
  }, []);

  const settle = useCallback((cause: unknown) => {
    const unanswered =
      cause instanceof ApiError && (cause.kind === 'network' || cause.kind === 'timeout');
    if (!unanswered) pending.current = null;
  }, []);

  return { keyFor, settle };
}
