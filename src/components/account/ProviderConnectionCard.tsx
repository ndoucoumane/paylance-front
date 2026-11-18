import { Check, Copy, Info, Plus } from 'lucide-react';
import { useState } from 'react';
import { account as t } from '../../content/account.fr';
import type { ProviderDefinition } from '../../services/account/referenceData';
import type { ProviderAccount, ProviderAccountStatus } from '../../services/account/types';
import { ProviderMark } from '../dashboard/ProviderMark';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { ProviderAccountForm } from './ProviderAccountForm';

const p = t.providers;

const statusStyles: Record<ProviderAccountStatus, string> = {
  ACTIVE: 'bg-primary-soft text-primary-strong',
  PENDING_VERIFICATION: 'bg-accent-soft text-accent-strong',
  DISABLED: 'bg-neutral-100 text-neutral-600',
};

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2_000);
        });
      }}
      className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50"
    >
      {copied ? (
        <Check aria-hidden="true" className="h-3.5 w-3.5" />
      ) : (
        <Copy aria-hidden="true" className="h-3.5 w-3.5" />
      )}
      {copied ? p.copied : p.copy}
    </button>
  );
}

type AccountRowProps = {
  account: ProviderAccount;
  testing: boolean;
  canManage: boolean;
  onTest: () => void;
  onDisable: () => void;
};

function AccountRow({ account, testing, canManage, onTest, onDisable }: AccountRowProps) {
  const active = account.status === 'ACTIVE';
  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-neutral-950">{account.label}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-semibold ${statusStyles[account.status]}`}
            >
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-primary' : 'bg-current'}`}
              />
              {p.status[account.status]}
            </span>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
              {p.environmentBadge[account.environment]}
            </span>
            {Object.entries(account.credentials)
              .slice(0, 1)
              .map(([key, value]) => (
                <span key={key} className="font-mono text-neutral-500">
                  {value}
                </span>
              ))}
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button variant="secondaryLight" onClick={onTest} disabled={testing}>
              {testing && <Spinner />}
              {testing ? p.testing : active ? p.retest : p.test}
            </Button>
            <Button variant="ghostLight" onClick={onDisable} disabled={testing}>
              {p.disable}
            </Button>
          </div>
        )}
      </div>

      {account.lastVerificationMessage && (
        <p
          role={active ? 'status' : 'alert'}
          className={`mt-3 text-sm ${active ? 'text-neutral-600' : 'text-accent-strong'}`}
        >
          {account.lastVerificationMessage}
          {account.lastVerifiedAt && (
            <span className="text-neutral-500">
              {' '}
              · {p.lastCheck} : {dateFormat.format(new Date(account.lastVerifiedAt))}
            </span>
          )}
        </p>
      )}

      <div className="mt-3 rounded-lg bg-neutral-50 p-3 ring-1 ring-neutral-200">
        <p className="text-xs text-neutral-500">{p.webhookTitle}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate text-[0.8125rem] text-neutral-800">
            {account.webhookUrl}
          </code>
          <CopyButton value={account.webhookUrl} />
        </div>
      </div>
    </li>
  );
}

type Props = {
  provider: ProviderDefinition;
  accounts: ProviderAccount[];
  testingIds: Set<string>;
  /** OWNER ou ADMIN : ajouter, tester, désactiver. */
  canManage: boolean;
  onCreated: (account: ProviderAccount) => void;
  onTest: (account: ProviderAccount) => void;
  onDisable: (account: ProviderAccount) => void;
};

/** Un prestataire : modes de connexion, comptes connectés (plusieurs possibles) et ajout d'un compte. */
export function ProviderConnectionCard({
  provider,
  accounts,
  testingIds,
  canManage,
  onCreated,
  onTest,
  onDisable,
}: Props) {
  const [adding, setAdding] = useState(false);

  return (
    <section
      aria-labelledby={`prestataire-${provider.id}`}
      className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 sm:p-6"
    >
      <header className="flex items-start gap-4">
        <ProviderMark provider={provider.id} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h2
              id={`prestataire-${provider.id}`}
              className="text-lg font-semibold text-neutral-950"
            >
              {provider.name}
            </h2>
            <span className="text-sm text-neutral-500">
              {accounts.length ? p.accountsCount(accounts.length) : p.noAccounts}
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-600">{provider.description}</p>
        </div>
      </header>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg p-3.5 ring-1 ring-neutral-200">
          <p className="text-sm font-semibold text-neutral-400">{p.directMode}</p>
          <p className="mt-1 flex gap-1.5 text-[0.8125rem] leading-snug text-neutral-500">
            <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {provider.directAuthorization.available ? null : provider.directAuthorization.reason}
          </p>
        </div>
        <div className="rounded-lg p-3.5 ring-2 ring-primary-strong">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-950">
            <Check aria-hidden="true" className="h-4 w-4 text-primary-strong" />
            {p.apiMode}
          </p>
          <p className="mt-1 text-[0.8125rem] leading-snug text-neutral-600">{p.apiModeText}</p>
        </div>
      </div>

      {accounts.length > 0 && (
        <ul className="mt-6 divide-y divide-neutral-200 border-t border-neutral-200 pt-5">
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              testing={testingIds.has(account.id)}
              canManage={canManage}
              onTest={() => onTest(account)}
              onDisable={() => onDisable(account)}
            />
          ))}
        </ul>
      )}

      {canManage && (
        <div className="mt-6">
          {adding ? (
            <ProviderAccountForm
              provider={provider}
              onCancel={() => setAdding(false)}
              onCreated={(account) => {
                setAdding(false);
                onCreated(account);
              }}
            />
          ) : (
            <Button variant="secondaryLight" onClick={() => setAdding(true)}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              {accounts.length ? p.addAnotherAccount : p.addAccount}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
