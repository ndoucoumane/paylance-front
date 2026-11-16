import { fr } from '../../content/fr';
import { icons } from '../ui/icons';
import { Reveal } from '../ui/Reveal';
import { Section, SectionHeading } from '../ui/Section';

export function Problem() {
  const { problem } = fr;
  return (
    <Section id="probleme" tone="surface">
      <SectionHeading
        id="probleme"
        eyebrow={problem.eyebrow}
        title={problem.title}
        intro={problem.intro}
      />
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {problem.items.map((item, index) => {
          const Icon = icons[item.icon];
          return (
            <Reveal
              as="li"
              key={item.title}
              delay={index * 80}
              className="rounded-xl bg-surface-card p-6 shadow-card ring-1 ring-surface-line"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-content">{item.title}</h3>
              <p className="mt-2 leading-relaxed text-content-body">{item.text}</p>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
