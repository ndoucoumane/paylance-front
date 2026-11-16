import type { ReactNode } from 'react';
import { Container } from './Container';

type Tone = 'surface' | 'white' | 'ink';

const tones: Record<Tone, string> = {
  surface: 'bg-surface text-content',
  white: 'bg-surface-card text-content',
  ink: 'bg-ink text-white',
};

type SectionProps = {
  id: string;
  tone?: Tone;
  children: ReactNode;
  className?: string;
};

/** Section de landing avec ancre et titre associé (`${id}-titre`). */
export function Section({ id, tone = 'surface', children, className = '' }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titre`}
      className={`scroll-mt-16 py-16 sm:py-24 ${tones[tone]} ${className}`}
    >
      <Container>{children}</Container>
    </section>
  );
}

type HeadingProps = {
  id: string;
  eyebrow: string;
  title: string;
  intro?: string;
  tone?: 'light' | 'dark';
  align?: 'left' | 'center';
  className?: string;
};

export function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
  tone = 'light',
  align = 'left',
  className = '',
}: HeadingProps) {
  const dark = tone === 'dark';
  return (
    <div className={`max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''} ${className}`}>
      <p className={`text-sm font-medium ${dark ? 'text-primary-bright' : 'text-primary-strong'}`}>
        {eyebrow}
      </p>
      <h2
        id={`${id}-titre`}
        className={`mt-3 text-balance font-display text-3xl font-semibold tracking-[-0.03em] sm:text-4xl ${
          dark ? 'text-white' : 'text-neutral-950'
        }`}
      >
        {title}
      </h2>
      {intro && (
        <p
          className={`mt-4 text-lg leading-relaxed ${dark ? 'text-ink-muted' : 'text-content-body'}`}
        >
          {intro}
        </p>
      )}
    </div>
  );
}
