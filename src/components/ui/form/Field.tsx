import type { ReactNode } from 'react';

export type ControlProps = {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby'?: string;
  'aria-required'?: boolean;
};

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  className?: string;
  /** Élément à droite du libellé (ex. lien « Mot de passe oublié »). */
  aside?: ReactNode;
  children: (control: ControlProps) => ReactNode;
};

/** Libellé + contrôle + aide + erreur, reliés par les attributs ARIA. */
export function Field({
  id,
  label,
  required,
  optional,
  hint,
  error,
  className = '',
  aside,
  children,
}: FieldProps) {
  const hintId = hint ? `${id}-aide` : undefined;
  const errorId = error ? `${id}-erreur` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-medium text-neutral-900">
          {label}
          {optional && <span className="ml-1 font-normal text-neutral-500">(facultatif)</span>}
        </label>
        {aside}
      </div>
      <div className="mt-1.5">
        {children({
          id,
          'aria-invalid': Boolean(error),
          'aria-describedby': describedBy,
          'aria-required': required || undefined,
        })}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-[0.8125rem] leading-snug text-neutral-500">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Style commun des champs texte et listes. */
export const inputClass =
  'block h-11 w-full rounded-lg border border-neutral-300 bg-white px-3.5 text-[15px] text-neutral-950 transition-colors placeholder:text-neutral-400 hover:border-neutral-400 focus:border-primary-strong focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500 aria-[invalid=true]:border-red-600 aria-[invalid=true]:focus:ring-red-600/15';

/** Liste déroulante : flèche dessinée par `.form-select` (index.css). */
export const selectClass = `${inputClass} form-select cursor-pointer pr-10`;
