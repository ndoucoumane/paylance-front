import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PageLoader } from '../../components/layout/PageLoader';
import { loadAccountApi, type AccountApi } from '../../services/account';
import { SessionProvider } from './SessionProvider';

/**
 * Point d'entrée chargé à la demande pour toutes les pages du compte :
 * choisit l'implémentation (démo ou réelle) puis fournit la session.
 */
export default function AccountShell() {
  const [api, setApi] = useState<AccountApi | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadAccountApi().then(setApi, () => setFailed(true));
  }, []);

  if (failed) throw new Error('Chargement du module de compte impossible');
  if (!api) return <PageLoader />;

  return (
    <SessionProvider api={api}>
      <Outlet />
    </SessionProvider>
  );
}
