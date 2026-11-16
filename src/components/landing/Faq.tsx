import { fr } from '../../content/fr';
import { Accordion } from '../ui/Accordion';
import { Section, SectionHeading } from '../ui/Section';

export function Faq() {
  const { faq } = fr;
  return (
    <Section id="faq" tone="white">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <SectionHeading id="faq" eyebrow={faq.eyebrow} title={faq.title} />
        <Accordion items={faq.items.map((item) => ({ title: item.q, content: <p>{item.a}</p> }))} />
      </div>
    </Section>
  );
}
