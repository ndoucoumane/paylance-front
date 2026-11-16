import { Check, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fr } from '../../content/fr';
import { availableLinks, menuLinks, type AvailableLink } from '../../lib/nav';
import { Container } from '../ui/Container';
import { Logo } from '../ui/Logo';
import { NavLinkItem } from './NavLinkItem';

/**
 * Pied de page noir et gris : marque sur fond noir, liens dans un panneau gris anthracite,
 * bande de bas de page gris foncé.
 */
export function Footer() {
  const year = new Date().getFullYear();
  const menus = fr.header.menus;

  // Les menus « lien direct » (ex. Tarifs) rejoignent la première colonne.
  const directLinks: AvailableLink[] = menus
    .filter((menu): menu is typeof menu & { href: string } => Boolean(menu.href))
    .map((menu) => ({ label: menu.label, href: menu.href }));
  const columns = menus
    .filter((menu) => !menu.href)
    .map((menu, index) => ({
      id: menu.id,
      label: menu.label,
      links: index === 0 ? [...menuLinks(menu), ...directLinks] : menuLinks(menu),
    }))
    .filter((column) => column.links.length > 0);
  const legal = availableLinks(fr.footer.legal);

  return (
    <footer className="bg-neutral-950 text-white">
      <Container className="py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-14">
          <div className="max-w-sm">
            <Logo tone="dark" />
            <p className="mt-5 text-sm leading-relaxed text-neutral-400">{fr.footer.tagline}</p>
            <ul className="mt-6 space-y-3 text-sm text-neutral-300">
              <li className="inline-flex items-center gap-2">
                <Check aria-hidden="true" className="h-4 w-4 text-primary-bright" />
                {fr.footer.compatibility}
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="h-4 w-4 text-primary-bright" />
                {fr.hero.fundsNote}
              </li>
            </ul>
            <Link
              to="/?sujet=acces_anticipe#contact"
              className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-neutral-200"
            >
              {fr.hero.primaryCta}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 rounded-2xl bg-neutral-900 p-6 ring-1 ring-inset ring-white/5 min-[480px]:grid-cols-2 sm:p-8 md:grid-cols-4">
            {columns.map((column) => (
              <nav key={column.id} aria-labelledby={`pied-${column.id}`}>
                <h2 id={`pied-${column.id}`} className="text-sm font-semibold text-white">
                  {column.label}
                </h2>
                <ul className="mt-4 space-y-3">
                  {column.links.map((item) => (
                    <li key={item.label}>
                      <NavLinkItem item={item} variant="footer" />
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
      </Container>

      <div className="border-t border-white/10 bg-neutral-900">
        <Container className="flex flex-col gap-3 py-5 text-sm text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
          <p>{fr.footer.copyright(year)}</p>
          {legal.length > 0 && (
            <ul aria-label={fr.footer.legalTitle} className="flex flex-wrap gap-x-6 gap-y-2">
              {legal.map((item) => (
                <li key={item.label}>
                  <NavLinkItem item={item} variant="footer" />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </div>
    </footer>
  );
}
