import type { ElementType, ReactNode } from 'react';

type Props = { children: ReactNode; className?: string; as?: ElementType };

export function Container({ children, className = '', as: Tag = 'div' }: Props) {
  return (
    <Tag className={`mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </Tag>
  );
}
