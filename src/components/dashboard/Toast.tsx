import { CircleCheck } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ToastContext } from './toastContext';

type PopoverElement = HTMLDivElement & { showPopover?: () => void; hidePopover?: () => void };

/**
 * Confirmation brève en bas d'écran, annoncée aux lecteurs d'écran.
 * Affichée dans la couche supérieure (API popover) pour rester visible au-dessus
 * d'un tiroir ou d'une fenêtre modale ouverts.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const ref = useRef<PopoverElement | null>(null);

  const show = useCallback((text: string) => {
    window.clearTimeout(timer.current);
    setMessage(text);
    setCount((value) => value + 1);
    timer.current = window.setTimeout(() => setMessage(null), 2_600);
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element?.showPopover) return;
    try {
      // Fermer puis rouvrir place le message au-dessus de la dernière couche ouverte.
      if (element.matches(':popover-open')) element.hidePopover?.();
      if (message) element.showPopover();
    } catch {
      // Navigateur sans popover : le message reste affiché en position fixe.
    }
  }, [message, count]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        ref={(element) => {
          ref.current = element;
          element?.setAttribute('popover', 'manual');
        }}
        role="status"
        aria-live="polite"
        style={{ inset: 'auto 0 1.5rem 0', margin: '0 auto' }}
        className="pointer-events-none fixed z-[80] w-max overflow-visible border-0 bg-transparent p-0"
      >
        {message && (
          <p className="ui-menu inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white shadow-float">
            <CircleCheck aria-hidden="true" className="h-4 w-4 text-primary-bright" />
            {message}
          </p>
        )}
      </div>
    </ToastContext.Provider>
  );
}
