import { ArrowRight, Check } from 'lucide-react';
import { fr } from '../../content/fr';
import { ButtonLink } from '../ui/Button';
import { Reveal } from '../ui/Reveal';
import { Section } from '../ui/Section';

export function Pricing() {
  const { pricing } = fr;
  return (
    <Section id="tarifs" tone="surface">
      <Reveal className="mx-auto max-w-3xl rounded-2xl bg-surface-card p-8 text-center shadow-card ring-1 ring-surface-line sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary-strong">
          {pricing.eyebrow}
        </p>
        <h2
          id="tarifs-titre"
          className="mt-3 text-balance font-display text-2xl font-bold tracking-tight text-content sm:text-3xl"
        >
          {pricing.title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-content-body">{pricing.text}</p>
        <ul className="mx-auto mt-8 flex max-w-xl flex-col items-start gap-3 text-left sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6">
          {pricing.points.map((point) => (
            <li
              key={point}
              className="inline-flex items-center gap-2 text-sm font-medium text-content"
            >
              <Check aria-hidden="true" className="h-4 w-4 text-primary-strong" />
              {point}
            </li>
          ))}
        </ul>
        <ButtonLink to="/?sujet=acces_anticipe#contact" size="lg" className="mt-8">
          {pricing.cta}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </ButtonLink>
      </Reveal>
    </Section>
  );
}
