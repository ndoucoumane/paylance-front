import { Plus } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { account as t } from '../../content/account.fr';
import { useCanManage } from '../../lib/session/permissions';
import { useSession } from '../../lib/session/sessionContext';
import { PROVIDERS } from '../../services/account/referenceData';
import type { ProviderAccount } from '../../services/account/types';
import { errorMessage } from '../../services/api/errors';
import { FormAlert } from './FormAlert';
import { LoadGate } from './LoadGate';
import { ProviderConnectionCard } from './ProviderConnectionCard';
import { useLoad } from './useLoad';

type Props = {
  /** Actions de bas de page (ex. « Passer cette étape »), selon le nombre de comptes actifs. */
  footer?: (activeCount: number) => ReactNode;
};

/** Liste des prestataires et de leurs comptes, partagée par l'onboarding et le tableau de bord. */
export function ProvidersManager({ footer }: Props) {
  const { api } = useSession();
  /** OWNER ou ADMIN : le serveur refuse (403) l'ajout, le test et la désactivation aux autres. */
  const manage = useCanManage();
  const loader = useCallback(() => api.listProviderAccounts(), [api]);
  const [state, retry] = useLoad(loader);
  const [accounts, setAccounts] = useState<ProviderAccount[] | null>(null);
  const [testing, setTesting] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const list = accounts ?? (state.status === 'ready' ? state.data : []);

  const upsert = (account: ProviderAccount) =>
    setAccounts((current) => {
      const base = current ?? (state.status === 'ready' ? state.data : []);
      const others = base.filter((item) => item.id !== account.id);
      return account.status === 'DISABLED'
        ? others
        : [...others, account].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    });

  const setBusy = (id: string, busy: boolean) =>
    setTesting((current) => {
      const next = new Set(current);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });

  const test = async (account: ProviderAccount) => {
    setError(null);
    setBusy(account.id, true);
    try {
      upsert(await api.testProviderAccount(account.id));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(account.id, false);
    }
  };

  const disable = async (account: ProviderAccount) => {
    if (!window.confirm(t.providers.disableConfirm(account.label))) return;
    setError(null);
    try {
      upsert(await api.disableProviderAccount(account.id));
    } catch (cause) {
      setError(errorMessage(cause));
    }
  };

  return (
    <LoadGate state={state} retry={retry}>
      {() => (
        <div className="space-y-5">
          {api.demo && (
            <p className="rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-700">
              {t.demo.providersText}
            </p>
          )}
          {!manage && (
            <p className="rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-700">
              {t.providers.readOnly}
            </p>
          )}
          <FormAlert title={t.providers.errorTitle} message={error} />

          {PROVIDERS.map((provider) => (
            <ProviderConnectionCard
              key={provider.id}
              provider={provider}
              accounts={list.filter((account) => account.provider === provider.id)}
              testingIds={testing}
              canManage={manage}
              onCreated={(account) => {
                upsert(account);
                void test(account);
              }}
              onTest={(account) => void test(account)}
              onDisable={(account) => void disable(account)}
            />
          ))}

          <section className="rounded-2xl border border-dashed border-neutral-300 p-5 sm:p-6">
            <h2 className="text-base font-semibold text-neutral-950">{t.providers.otherTitle}</h2>
            <p className="mt-1 text-sm text-neutral-600">{t.providers.otherText}</p>
            <Link
              to="/?sujet=partenariat#contact"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-strong underline-offset-4 hover:underline"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              {t.providers.otherCta}
            </Link>
          </section>

          {footer?.(list.filter((account) => account.status === 'ACTIVE').length)}
        </div>
      )}
    </LoadGate>
  );
}
