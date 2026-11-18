import { X, type LucideIcon } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { dashboard as t } from '../../content/dashboard.fr';
import { toneStyles, type DialogTone } from './dialogTones';
import { useDialog } from './useDialog';

/**
 * Fenêtre modale <dialog> (focus piégé, Échap, arrière-plan inerte). Le contenu n'est monté
 * qu'à l'ouverture : chaque formulaire repart ainsi d'un état vierge.
 */
export function ModalDialog({
  open,
  onClose,
  labelledBy,
  size = 'md',
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  size?: 'md' | 'lg' | 'xl';
  children: ReactNode;
}) {
  const ref = useDialog(open, onClose);
  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      className={`ui-dialog !m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-clip rounded-2xl bg-white p-0 text-neutral-950 shadow-float ${
        size === 'xl' ? 'max-w-4xl' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg'
      }`}
    >
      {open && children}
    </dialog>
  );
}

/** Mise en page d'un formulaire en fenêtre : en-tête coloré, corps défilant, pied fixe. */
export function DialogPanel({
  titleId,
  tone,
  icon: Icon,
  title,
  subtitle,
  onClose,
  onSubmit,
  footer,
  children,
}: {
  titleId: string;
  tone: DialogTone;
  icon: LucideIcon;
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  onSubmit?: (event: FormEvent) => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const style = toneStyles[tone];
  const content = (
    <>
      <div className="flex items-start gap-4 border-b border-neutral-200 px-6 py-5">
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${style.chip}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.drawer.close}
          className="-mr-2 -mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
      {/* `relative` : les radios masqués (sr-only) restent dans la zone défilante ; sinon leur
          focus fait défiler la fenêtre entière et décale l'en-tête. */}
      <div className="relative min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</div>
      {footer && (
        <div className="flex flex-col-reverse gap-3 border-t border-neutral-200 bg-neutral-50/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          {footer}
        </div>
      )}
    </>
  );
  const layout = 'flex max-h-[calc(100dvh-2rem)] flex-col';
  return onSubmit ? (
    <form noValidate onSubmit={onSubmit} className={layout}>
      {content}
    </form>
  ) : (
    <div className={layout}>{content}</div>
  );
}

/** Pastilles de choix rapide (montants, dates, motifs). */
export function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
        selected
          ? 'bg-neutral-950 text-white ring-neutral-950'
          : 'bg-white text-neutral-700 ring-neutral-300 hover:bg-neutral-50'
      }`}
    >
      {children}
    </button>
  );
}
