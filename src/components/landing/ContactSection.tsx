import { fr } from '../../content/fr';
import { Section, SectionHeading } from '../ui/Section';
import { ContactForm } from './ContactForm';

export function ContactSection() {
  const { contact } = fr;
  return (
    <Section id="contact" tone="surface">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
        <div>
          <SectionHeading
            id="contact"
            eyebrow={contact.eyebrow}
            title={contact.title}
            intro={contact.intro}
          />
          <div className="mt-10 rounded-xl bg-ink p-6 text-white">
            <h3 className="font-display font-semibold">{contact.asideTitle}</h3>
            <ol className="mt-4 space-y-4">
              {contact.asideSteps.map((step, index) => (
                <li key={step} className="flex items-start gap-3 text-sm text-ink-muted">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary-bright">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="rounded-2xl bg-surface-card p-5 shadow-card ring-1 ring-surface-line sm:p-8">
          <ContactForm />
        </div>
      </div>
    </Section>
  );
}
