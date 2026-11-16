import { fr } from '../../content/fr';
import { icons } from '../ui/icons';
import { Reveal } from '../ui/Reveal';
import { Section, SectionHeading } from '../ui/Section';

export function Solutions() {
  const { solutions } = fr;
  return (
    <Section id="solutions" tone="surface">
      <SectionHeading id="solutions" eyebrow={solutions.eyebrow} title={solutions.title} />
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {solutions.items.map((solution, index) => {
          const Icon = icons[solution.icon];
          return (
            <Reveal
              as="li"
              id={solution.id}
              key={solution.id}
              delay={(index % 4) * 80}
              className="flex scroll-mt-24 flex-col rounded-xl bg-surface-card p-6 shadow-card ring-1 ring-surface-line"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary-strong">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-content">
                {solution.title}
              </h3>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-content-muted">
                {solutions.useCaseLabel}
              </p>
              <p className="mt-1 leading-relaxed text-content-body">{solution.text}</p>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
