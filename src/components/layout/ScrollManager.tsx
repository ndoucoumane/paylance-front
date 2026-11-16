import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { prefersReducedMotion } from '../../lib/motion';

/**
 * Gère le défilement à chaque navigation :
 * - lien avec ancre (`/#faq`) : défile jusqu'à la section et y place le focus (clavier, lecteurs d'écran) ;
 * - changement de page sans ancre : retour en haut.
 */
export function ScrollManager() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (!target) return;
      target.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      });
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname, hash, key]);

  return null;
}
