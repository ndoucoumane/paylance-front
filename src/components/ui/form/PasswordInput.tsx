import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { inputClass } from './Field';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

/** Champ mot de passe avec bouton afficher / masquer. */
export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(
  { className = '', ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={`${inputClass} pr-12 ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-neutral-500 hover:text-neutral-900"
      >
        {visible ? (
          <EyeOff aria-hidden="true" className="h-[18px] w-[18px]" />
        ) : (
          <Eye aria-hidden="true" className="h-[18px] w-[18px]" />
        )}
      </button>
    </div>
  );
});
