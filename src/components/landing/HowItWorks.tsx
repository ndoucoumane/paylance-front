import { fr } from '../../content/fr';
import { Reveal } from '../ui/Reveal';
import { Section, SectionHeading } from '../ui/Section';

export function HowItWorks() {
  const { howItWorks } = fr;
  return (
    <Section id="fonctionnement" tone="white">
      <SectionHeading id="fonctionnement" eyebrow={howItWorks.eyebrow} title={howItWorks.title} />
      <ol className="relative mt-12 grid gap-8 lg:grid-cols-3 lg:gap-10">
        {/* Ligne de liaison entre les étapes (bureau) */}
        <span
          aria-hidden="true"
          className="absolute left-5 right-5 top-5 hidden h-px bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40 lg:block"
        />
        {howItWorks.steps.map((step, index) => (
          <Reveal
            as="li"
            key={step.title}
            delay={index * 100}
            className="relative flex gap-5 lg:block"
          >
            <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm font-bold text-white ring-4 ring-surface-card">
              <span className="sr-only">{howItWorks.stepLabel} </span>
              {index + 1}
            </span>
            <div className="lg:mt-6">
              <h3 className="font-display text-lg font-semibold text-content">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-content-body">{step.text}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
