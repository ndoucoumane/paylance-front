import { FlaskConical } from 'lucide-react';
import { account as t } from '../../content/account.fr';
import { useSession } from '../../lib/session/sessionContext';

/** Bandeau permanent en mode démonstration, avec remise à zéro des données fictives. */
export function DemoBanner() {
  const { api } = useSession();
  if (!api.demo) return null;
  const demo = api.demo;

  const onReset = () => {
    if (!window.confirm(t.demo.resetConfirm)) return;
    demo.reset();
    window.location.assign('/connexion');
  };

  return (
    <div className="border-b border-neutral-200 bg-neutral-100 text-[0.8125rem] text-neutral-700">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-1.5 font-semibold text-neutral-900">
          <FlaskConical aria-hidden="true" className="h-4 w-4 text-primary-strong" />
          {t.demo.label}
        </span>
        <span className="order-last w-full text-neutral-600 sm:order-none sm:w-auto sm:min-w-0 sm:flex-1">
          {t.demo.text}
        </span>
        <button
          type="button"
          onClick={onReset}
          className="ml-auto rounded font-semibold text-neutral-900 underline underline-offset-4 hover:text-primary-strong"
        >
          {t.demo.reset}
        </button>
      </div>
    </div>
  );
}
