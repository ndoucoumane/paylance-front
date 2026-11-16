import { fr } from '../../content/fr';
import { ButtonLink } from '../ui/Button';
import { Container } from '../ui/Container';
import { Logo } from '../ui/Logo';
import { MegaMenu } from './MegaMenu';
import { MobileNav } from './MobileNav';

export function Header() {
  const menus = fr.header.menus;
  return (
    <>
      <a
        href="#contenu"
        className="sr-only z-[60] rounded-md bg-white px-4 py-2 font-semibold text-content focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {fr.common.skipToContent}
      </a>
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <Container className="relative flex h-16 items-center justify-between gap-4">
          <Logo tone="light" />
          <nav aria-label={fr.header.navLabel} className="hidden lg:block">
            <MegaMenu menus={menus} />
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            <ButtonLink to="/connexion" variant="ghostLight">
              {fr.header.login}
            </ButtonLink>
            <ButtonLink to="/register" variant="primary">
              {fr.header.register}
            </ButtonLink>
          </div>
          <MobileNav menus={menus} />
        </Container>
      </header>
    </>
  );
}
