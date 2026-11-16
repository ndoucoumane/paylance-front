import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode;
  description?: ReactNode;
  error?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox(
  { id, label, description, error, ...props },
  ref,
) {
  const errorId = error ? `${id}-erreur` : undefined;
  return (
    <div>
      <div className="flex gap-3">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer rounded border-neutral-300 accent-primary-strong"
          {...props}
        />
        <label htmlFor={id} className="cursor-pointer text-sm leading-snug text-neutral-700">
          <span className="font-medium text-neutral-900">{label}</span>
          {description && <span className="mt-0.5 block text-neutral-500">{description}</span>}
        </label>
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
});
