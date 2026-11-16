import { fr } from '../../content/fr';
import { icons } from '../ui/icons';
import { Reveal } from '../ui/Reveal';
import { Section, SectionHeading } from '../ui/Section';

export function Security() {
  const { security } = fr;
  return (
    <Section id="securite" tone="surface">
      <SectionHeading
        id="securite"
        eyebrow={security.eyebrow}
        title={security.title}
        intro={security.intro}
      />
      <ul className="mt-12 grid gap-4 sm:grid-cols-2">
        {security.items.map((item, index) => {
          const Icon = icons[item.icon];
          return (
            <Reveal
              as="li"
              key={item.title}
              delay={(index % 2) * 80}
              className="flex gap-4 rounded-xl bg-white p-6 ring-1 ring-neutral-200"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-strong">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold text-neutral-950">
                  {item.title}
                </h3>
                <p className="mt-2 leading-relaxed text-neutral-600">{item.text}</p>
              </div>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
