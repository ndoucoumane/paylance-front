import type { ReactNode } from 'react';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

type Props = { loading: boolean; children: ReactNode; className?: string; disabled?: boolean };

/** Bouton principal de formulaire avec état de chargement. */
export function SubmitButton({ loading, children, className = '', disabled }: Props) {
  return (
    <Button
      type="submit"
      size="lg"
      disabled={loading || disabled}
      aria-busy={loading}
      className={className}
    >
      {loading && <Spinner />}
      {children}
    </Button>
  );
}
