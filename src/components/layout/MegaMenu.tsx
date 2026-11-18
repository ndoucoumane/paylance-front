import { ArrowRight, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState, type FocusEvent, type PointerEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { NavMenu } from '../../content/fr';
import { availableLinks } from '../../lib/nav';
import { NavLinkItem } from './NavLinkItem';

type Props = { menus: NavMenu[] };

type OpenState = { id: string; via: 'hover' | 'click' } | null;

const CLOSE_DELAY_MS = 200;

/**
 * Méga-menu bureau : ouverture au survol (souris) et au clic (clavier, tactile).
 * Échap ferme et rend le focus au bouton ; un clic à l'extérieur ferme aussi.
 */
export function MegaMenu({ menus }: Props) {
  const [open, setOpen] = useState<OpenState>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const location = useLocation();

  const cancelClose = () => window.clearTimeout(closeTimer.current);

  // Fermeture à chaque navigation.
  useEffect(() => {
    setOpen(null);
  }, [location.key]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (!listRef.current?.contains(event.target as Node)) setOpen(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(null);
        document.getElementById(`menu-bouton-${open.id}`)?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    const timer = closeTimer;
    return () => window.clearTimeout(timer.current);
  }, []);

  const onEnter = (event: PointerEvent, id: string) => {
    if (event.pointerType !== 'mouse') return;
    cancelClose();
    setOpen((current) => (current?.id === id ? current : { id, via: 'hover' }));
  };

  const onLeave = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      setOpen((current) => (current?.via === 'hover' ? null : current));
    }, CLOSE_DELAY_MS);
  };

  const onToggle = (id: string) => {
    cancelClose();
    setOpen((current) =>
      current?.id === id && current.via === 'click' ? null : { id, via: 'click' },
    );
  };

  const onBlur = (event: FocusEvent<HTMLLIElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && !event.currentTarget.contains(next)) setOpen(null);
  };

  return (
    <ul ref={listRef} className="flex items-center gap-0.5 xl:gap-1">
      {menus.map((menu) => {
        if (menu.href) {
          return (
            <li key={menu.id}>
              <Link
                to={menu.href}
                className="inline-flex items-center whitespace-nowrap rounded-md px-2.5 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-950 xl:px-3"
              >
                {menu.label}
              </Link>
            </li>
          );
        }
        const isOpen = open?.id === menu.id;
        const panelId = `menu-panneau-${menu.id}`;
        const single = menu.columns.length === 1;
        return (
          <li
            key={menu.id}
            onPointerEnter={(event) => onEnter(event, menu.id)}
            onPointerLeave={onLeave}
            onBlur={onBlur}
          >
            <button
              type="button"
              id={`menu-bouton-${menu.id}`}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => onToggle(menu.id)}
              className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-2 text-sm font-medium transition-colors xl:px-3 ${
                isOpen
                  ? 'bg-neutral-100 text-neutral-950'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              {menu.label}
              <ChevronDown
                aria-hidden="true"
                className={`h-4 w-4 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Panneau pleine largeur : du logo à « Créer un compte » (zone utile du Container). */}
            <div id={panelId} hidden={!isOpen} className="absolute inset-x-8 top-full pt-3">
              <div className="ui-mega grid grid-cols-[minmax(0,1fr)_19rem] overflow-hidden rounded-2xl bg-surface-card text-content shadow-float ring-1 ring-black/5">
                <div
                  className="grid gap-x-6 gap-y-2 p-5 xl:p-6"
                  style={{
                    gridTemplateColumns: `repeat(${menu.columns.length}, minmax(0, 1fr))`,
                  }}
                >
                  {menu.columns.map((column, columnIndex) => (
                    <div key={column.title ?? columnIndex} className="min-w-0">
                      {/* Sans titre propre, seule la première colonne porte le nom du menu. */}
                      <p
                        aria-hidden={!column.title && columnIndex > 0}
                        className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-content-muted"
                      >
                        {column.title ?? (columnIndex === 0 ? menu.label : '\u00a0')}
                      </p>
                      <ul className={single ? 'grid grid-cols-2 gap-x-6' : ''}>
                        {availableLinks(column.items).map((item) => (
                          <li key={item.label}>
                            <NavLinkItem item={item} variant="panel" />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {menu.intro && (
                  <aside className="flex flex-col border-l border-neutral-200 bg-surface p-6">
                    <p className="text-base font-semibold tracking-[-0.01em] text-content">
                      {menu.intro.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-content-muted">
                      {menu.intro.text}
                    </p>
                    <Link
                      to={menu.intro.cta.href}
                      className="group mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-primary-strong"
                    >
                      {menu.intro.cta.label}
                      <ArrowRight
                        aria-hidden="true"
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      />
                    </Link>
                  </aside>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
