import type { ElementType, ReactNode } from 'react';
import { useReveal } from '../../lib/hooks/useReveal';

type Props = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Décalage en ms, pour échelonner les éléments d'une grille. */
  delay?: number;
  id?: string;
};

export function Reveal({ children, as: Tag = 'div', className = '', delay = 0, id }: Props) {
  const { ref, visible } = useReveal<HTMLElement>();
  return (
    <Tag
      ref={ref}
      id={id}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
