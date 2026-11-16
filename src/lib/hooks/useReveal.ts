import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../motion';

function canAnimate(): boolean {
  return typeof IntersectionObserver !== 'undefined' && !prefersReducedMotion();
}

/**
 * Apparition discrète au scroll.
 * Sans IntersectionObserver ou avec prefers-reduced-motion, l'élément est visible immédiatement.
 */
export function useReveal<T extends Element>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(() => !canAnimate());

  useEffect(() => {
    const node = ref.current;
    if (visible || !node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return { ref, visible };
}
