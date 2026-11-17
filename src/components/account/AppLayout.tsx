import { LogOut, Moon, Sun } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { account as t } from '../../content/account.fr';
import { useTheme } from '../../lib/hooks/useTheme';
import { ROUTES } from '../../lib/session/routing';
import { useReadySession } from '../../lib/session/sessionContext';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { Spinner } from '../ui/Spinner';
import { DemoBanner } from './DemoBanner';

const NAV: { to: string; label: string; short?: string; end: boolean }[] = [
  { to: ROUTES.dashboard, label: t.app.nav.overview, end: true },
  { to: ROUTES.dashboardTransactions, label: t.app.nav.transactions, end: false },
  {
    to: ROUTES.dashboardProviders,
    label: t.app.nav.providers,
    short: t.app.nav.providersShort,
    end: false,
  },
];

/** Mise en page de l'espace professionnel. */
export function AppLayout({ children }: { children: ReactNode }) {
  const { snapshot, logout } = useReadySession();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);
  const { theme, toggle } = useTheme();
  const { user, organization } = snapshot;
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() || '?';

  const onLogout = async () => {
    setLeaving(true);
    try {
      await logout();
      navigate(ROUTES.login, { replace: true });
    } catch {
      setLeaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <DemoBanner />
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <Logo tone="light" />
            {organization && (
              <>
                <span aria-hidden="true" className="hidden h-6 w-px bg-neutral-200 sm:block" />
                <span className="hidden truncate text-sm font-medium text-neutral-700 sm:block">
                  {organization.name}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right text-sm leading-tight md:block">
              <span className="block font-medium text-neutral-900">
                {user.firstName} {user.lastName}
              </span>
              <span className="block text-xs text-neutral-500">{user.email}</span>
            </span>
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-950 text-xs font-semibold text-white"
            >
              {initials}
            </span>
            <Button
              variant="ghostLight"
              onClick={toggle}
              aria-label={theme === 'dark' ? t.app.theme.light : t.app.theme.dark}
              title={theme === 'dark' ? t.app.theme.light : t.app.theme.dark}
            >
              {theme === 'dark' ? (
                <Sun aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Moon aria-hidden="true" className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghostLight"
              onClick={onLogout}
              disabled={leaving}
              aria-label={t.common.logout}
            >
              {leaving ? <Spinner /> : <LogOut aria-hidden="true" className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <nav aria-label="Espace professionnel" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <ul className="-mb-px flex gap-6 overflow-x-auto">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `inline-flex whitespace-nowrap border-b-2 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-neutral-950 text-neutral-950'
                        : 'border-transparent text-neutral-500 hover:text-neutral-900'
                    }`
                  }
                >
                  {item.short ? (
                    <>
                      <span className="sm:hidden">{item.short}</span>
                      <span className="hidden sm:inline">{item.label}</span>
                    </>
                  ) : (
                    item.label
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="contenu" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}
