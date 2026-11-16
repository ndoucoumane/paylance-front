import { fr } from '../../content/fr';
import { icons } from '../ui/icons';
import { Reveal } from '../ui/Reveal';
import { Section, SectionHeading } from '../ui/Section';

export function Features() {
  const { features } = fr;
  return (
    <Section id="fonctionnalites" tone="surface">
      <SectionHeading id="fonctionnalites" eyebrow={features.eyebrow} title={features.title} />
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.items.map((feature, index) => {
          const Icon = icons[feature.icon];
          return (
            <Reveal
              as="li"
              id={feature.id}
              key={feature.id}
              delay={(index % 3) * 80}
              className="scroll-mt-24 rounded-xl bg-surface-card p-6 shadow-card ring-1 ring-surface-line"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary-strong">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-content">
                {feature.title}
              </h3>
              <p className="mt-2 leading-relaxed text-content-body">{feature.text}</p>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
