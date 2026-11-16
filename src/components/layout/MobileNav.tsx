import { ChevronDown, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fr, type NavMenu } from '../../content/fr';
import { availableLinks } from '../../lib/nav';
import { ButtonLink } from '../ui/Button';
import { NavLinkItem } from './NavLinkItem';

type Props = { menus: NavMenu[] };

/** Navigation mobile : panneau plein écran avec un accordéon par menu. */
export function MobileNav({ menus }: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    setExpanded(null);
  }, [location.key]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls="menu-mobile"
        aria-label={open ? fr.header.closeMenu : fr.header.openMenu}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-neutral-900 hover:bg-neutral-100"
      >
        {open ? (
          <X aria-hidden="true" className="h-6 w-6" />
        ) : (
          <Menu aria-hidden="true" className="h-6 w-6" />
        )}
      </button>

      <div
        id="menu-mobile"
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-neutral-200 bg-white"
      >
        <nav aria-label={fr.header.navLabel} className="px-4 pb-10 pt-2">
          <ul className="divide-y divide-neutral-200">
            {menus.map((menu) => {
              if (menu.href) {
                return (
                  <li key={menu.id}>
                    <Link
                      to={menu.href}
                      className="block py-4 text-base font-semibold text-neutral-950"
                    >
                      {menu.label}
                    </Link>
                  </li>
                );
              }
              const isOpen = expanded === menu.id;
              const panelId = `menu-mobile-${menu.id}`;
              return (
                <li key={menu.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setExpanded(isOpen ? null : menu.id)}
                    className="flex w-full items-center justify-between py-4 text-left text-base font-semibold text-neutral-950"
                  >
                    {menu.label}
                    <ChevronDown
                      aria-hidden="true"
                      className={`h-5 w-5 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div id={panelId} hidden={!isOpen} className="pb-3">
                    {menu.columns.map((column, columnIndex) => (
                      <div key={column.title ?? columnIndex}>
                        {column.title && (
                          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                            {column.title}
                          </p>
                        )}
                        <ul>
                          {availableLinks(column.items).map((item) => (
                            <li key={item.label}>
                              <NavLinkItem item={item} variant="panel" />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-6 grid gap-3">
            <ButtonLink to="/register" variant="primary" size="lg">
              {fr.header.register}
            </ButtonLink>
            <ButtonLink to="/connexion" variant="secondaryLight" size="lg">
              {fr.header.login}
            </ButtonLink>
          </div>
        </nav>
      </div>
    </div>
  );
}
