import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { dashboard as t } from '../../content/dashboard.fr';
import { useToast } from './toastContext';

/** Bouton de copie discret, avec retour visuel. */
export function CopyButton({
  value,
  label,
  className = '',
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => setDone(false), 1_500);
    return () => window.clearTimeout(timer);
  }, [done]);
  return (
    <button
      type="button"
      onClick={(event) => {
        // Dans une ligne cliquable : copier sans ouvrir le détail.
        event.stopPropagation();
        void navigator.clipboard?.writeText(value).then(() => {
          setDone(true);
          toast(t.actions.copied);
        });
      }}
      aria-label={label}
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 ${className}`}
    >
      {done ? (
        <Check aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy aria-hidden="true" className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
