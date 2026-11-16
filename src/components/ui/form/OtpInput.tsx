import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  /** Appelé quand tous les chiffres sont saisis. */
  onComplete?: (value: string) => void;
};

/**
 * Saisie d'un code à N chiffres : une case par chiffre, collage du code entier,
 * avancée automatique et retour arrière vers la case précédente.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled,
  invalid,
  describedBy,
  onComplete,
}: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, index) => value[index] ?? '');

  const focus = (index: number) => refs.current[Math.max(0, Math.min(length - 1, index))]?.focus();

  const update = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  };

  const onInput = (index: number, raw: string) => {
    const typed = raw.replace(/\D/g, '');
    if (!typed) return;
    if (typed.length > 1) {
      // Saisie automatique du code reçu (iOS / Android) ou collage dans une case.
      update(typed);
      focus(typed.length);
      return;
    }
    const chars = [...digits];
    chars[index] = typed;
    update(chars.join(''));
    focus(index + 1);
  };

  const onKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const chars = [...digits];
      if (chars[index]) {
        chars[index] = '';
      } else if (index > 0) {
        chars[index - 1] = '';
        focus(index - 1);
      }
      onChange(chars.join('').slice(0, length));
    } else if (event.key === 'ArrowLeft') {
      focus(index - 1);
    } else if (event.key === 'ArrowRight') {
      focus(index + 1);
    }
  };

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '');
    if (pasted) {
      update(pasted);
      focus(pasted.length);
    }
  };

  return (
    <div
      role="group"
      aria-label="Code de vérification à 6 chiffres"
      className="flex gap-2 sm:gap-3"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          value={digit}
          disabled={disabled}
          aria-label={`Chiffre ${index + 1} sur ${length}`}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(event) => onInput(index, event.target.value)}
          onKeyDown={(event) => onKeyDown(index, event)}
          onPaste={onPaste}
          onFocus={(event) => event.target.select()}
          className="h-14 w-full min-w-0 rounded-lg border border-neutral-300 bg-white text-center text-xl font-semibold tabular-nums text-neutral-950 transition-colors focus:border-primary-strong focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:bg-neutral-50 aria-[invalid=true]:border-red-600 sm:h-16 sm:text-2xl"
        />
      ))}
    </div>
  );
}
