import type { MemberRole } from '../../services/account/types';
import { useSession } from './sessionContext';

/**
 * Droits d'organisation, tels que les applique le serveur (matrice de
 * paylance-backend/docs/contrat-api-securite.md, §2). Ils ne servent qu'à masquer des boutons :
 * le serveur reste le garde-fou et répond `403` à toute action non autorisée.
 *
 * OWNER et ADMIN : rembourser, programmer ou annuler un remboursement, créer un paiement,
 * créer, tester ou désactiver un compte prestataire. DEVELOPER et VIEWER : lecture seule.
 */
const MANAGERS: MemberRole[] = ['OWNER', 'ADMIN'];

export function canManage(role: MemberRole | null | undefined): boolean {
  return role ? MANAGERS.includes(role) : false;
}

/** Droit de gestion du membre connecté dans l'organisation courante. */
export function useCanManage(): boolean {
  const { state } = useSession();
  return state.status === 'ready' && canManage(state.organization?.role);
}
