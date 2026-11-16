import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';

export type MenuAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  disabled?: boolean;
  /** Explication affichée sous un élément désactivé. */
  hint?: string;
  tone?: 'default' | 'danger';
  /** Trait de séparation avant l'élément. */
  separated?: boolean;
};

type Props = { label: string; actions: MenuAction[] };

const MENU_WIDTH = 232;

/**
 * Menu d'actions accessible (motif « menu button » WAI-ARIA) : flèches, Début/Fin, Échap,
 * clic extérieur. Rendu dans un portail en position fixe pour ne jamais être rogné par un tableau.
 */
export function ActionMenu({ label, actions }: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();
  const enabled = actions
    .map((action, index) => (action.disabled ? -1 : index))
    .filter((index) => index >= 0);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  }, []);

  /** Place le menu sous son bouton (ou au-dessus s'il manque de place). */
  const place = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    // Bouton sorti de l'écran : le menu n'a plus de point d'ancrage visible.
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setOpen(false);
      return;
    }
    const height = menuRef.current?.offsetHeight ?? 200;
    const below = rect.bottom + 6 + height < window.innerHeight;
    setPosition({
      top: below ? rect.bottom + 6 : rect.top - 6 - height,
      left: Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)),
    });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    itemRefs.current[enabled[0] ?? 0]?.focus({ preventScroll: true });
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) close(false);
    };
    // Le menu suit son bouton pendant le défilement et le redimensionnement.
    let frame = 0;
    const follow = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };
    document.addEventListener('pointerdown', onPointer);
    window.addEventListener('scroll', follow, true);
    window.addEventListener('resize', follow);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('scroll', follow, true);
      window.removeEventListener('resize', follow);
    };
    // `enabled` dérive de `actions` : focus initial uniquement à l'ouverture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, close, place]);

  const focusAt = (position: number) => {
    const target = enabled[(position + enabled.length) % enabled.length];
    if (target !== undefined) itemRefs.current[target]?.focus({ preventScroll: true });
  };

  const onMenuKeyDown = (event: KeyboardEvent) => {
    const current = enabled.indexOf(
      itemRefs.current.findIndex((item) => item === document.activeElement),
    );
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusAt(current + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusAt(current - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusAt(0);
        break;
      case 'End':
        event.preventDefault();
        focusAt(enabled.length - 1);
        break;
      case 'Escape':
        event.preventDefault();
        close(true);
        break;
      case 'Tab':
        close(false);
        break;
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 ${
          open ? 'bg-neutral-100 text-neutral-900' : ''
        }`}
      >
        <MoreHorizontal aria-hidden="true" className="h-[18px] w-[18px]" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            tabIndex={-1}
            aria-label={label}
            onKeyDown={onMenuKeyDown}
            style={{
              top: position?.top ?? -9999,
              left: position?.left ?? -9999,
              width: MENU_WIDTH,
            }}
            className="ui-menu fixed z-[70] rounded-xl bg-white p-1.5 shadow-float"
          >
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <div key={action.id}>
                  {action.separated && (
                    <div role="separator" className="my-1.5 h-px bg-neutral-100" />
                  )}
                  <button
                    ref={(element) => {
                      itemRefs.current[index] = element;
                    }}
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    aria-disabled={action.disabled || undefined}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (action.disabled) return;
                      close(true);
                      action.onSelect();
                    }}
                    className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors ${
                      action.disabled
                        ? 'cursor-not-allowed text-neutral-400'
                        : action.tone === 'danger'
                          ? 'text-neutral-900 hover:bg-neutral-50 focus:bg-neutral-100'
                          : 'text-neutral-800 hover:bg-neutral-50 focus:bg-neutral-100'
                    }`}
                  >
                    <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                    <span className="min-w-0">
                      <span className="block font-medium">{action.label}</span>
                      {action.disabled && action.hint && (
                        <span className="mt-0.5 block text-xs leading-snug text-neutral-400">
                          {action.hint}
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
