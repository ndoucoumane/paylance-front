import { useEffect, useRef } from 'react';

/**
 * Pilote un <dialog> natif en mode modal : piège du focus, Échap et arrière-plan inerte
 * sont gérés par le navigateur. `onClose` est appelé quelle que soit la façon de fermer.
 */
export function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handle = () => onClose();
    dialog.addEventListener('close', handle);
    return () => dialog.removeEventListener('close', handle);
  }, [onClose]);
  return ref;
}
