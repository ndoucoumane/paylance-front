import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';

/** En-tête + contenu principal + pied de page. */
export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main id="contenu" tabIndex={-1} className="focus:outline-none">
        {children}
      </main>
      <Footer />
    </>
  );
}
