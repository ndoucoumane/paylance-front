import { ArrowRight, Handshake, Plug } from 'lucide-react';
import { fr } from '../../content/fr';
import { ButtonLink } from '../ui/Button';
import { Reveal } from '../ui/Reveal';
import { Section, SectionHeading } from '../ui/Section';

export function Partners() {
  const { partners } = fr;
  return (
    <Section id="partenaires" tone="white">
      <SectionHeading
        id="partenaires"
        eyebrow={partners.eyebrow}
        title={partners.title}
        intro={partners.intro}
      />
      <div className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ul className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {partners.integrations.map((integration) => (
            <li
              key={integration.name}
              className={`flex flex-col rounded-xl p-6 ${
                integration.upcoming
                  ? 'border border-dashed border-surface-line-strong bg-surface'
                  : 'bg-surface-card shadow-card ring-1 ring-surface-line'
              }`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary-strong">
                <Plug aria-hidden="true" className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-content">
                {integration.name}
              </h3>
              <p className="mt-1 text-sm text-content-muted">{integration.text}</p>
              {integration.upcoming && (
                <p className="mt-4 inline-flex w-fit rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-strong">
                  {partners.upcomingLabel}
                </p>
              )}
            </li>
          ))}
        </ul>

        <Reveal className="relative overflow-hidden rounded-xl bg-ink p-8 text-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/15 blur-2xl"
          />
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Handshake aria-hidden="true" className="h-5 w-5" />
          </span>
          <h3 className="mt-5 font-display text-xl font-semibold">{partners.become.title}</h3>
          <p className="mt-2 leading-relaxed text-ink-muted">{partners.become.text}</p>
          <ButtonLink to={partners.become.href} className="mt-6">
            {partners.become.cta}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </ButtonLink>
        </Reveal>
      </div>
    </Section>
  );
}
