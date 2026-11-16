import { fr } from '../../content/fr';
import { createPaymentCurl, createPaymentJs, signedWebhook } from '../../content/codeSamples';
import { CodeBlock } from '../ui/CodeBlock';
import { icons } from '../ui/icons';
import { Reveal } from '../ui/Reveal';
import { Section, SectionHeading } from '../ui/Section';
import { Tabs } from '../ui/Tabs';

export function Developers() {
  const { developers } = fr;
  return (
    <Section id="developpeurs" tone="white">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <SectionHeading
            id="developpeurs"
            eyebrow={developers.eyebrow}
            title={developers.title}
            intro={developers.intro}
          />
          <ul className="mt-10 space-y-6">
            {developers.points.map((point) => {
              const Icon = icons[point.icon];
              return (
                <li key={point.title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-strong">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display font-semibold text-content">{point.title}</h3>
                    <p className="mt-1 leading-relaxed text-content-body">{point.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <Reveal className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-xl bg-ink shadow-float ring-1 ring-ink-600">
            <p className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-sm font-semibold text-white">
              <span className="rounded bg-primary/20 px-1.5 py-0.5 font-mono text-[0.6875rem] text-primary-bright">
                POST
              </span>
              <span className="font-mono text-[0.8125rem] font-normal text-ink-muted">
                /api/v1/payments
              </span>
              <span className="sr-only">{developers.requestTitle}</span>
            </p>
            <Tabs
              label={developers.tabsLabel}
              tabs={[
                {
                  id: 'curl',
                  label: 'curl',
                  content: (
                    <CodeBlock
                      code={createPaymentCurl}
                      label={`${developers.requestTitle} (curl)`}
                    />
                  ),
                },
                {
                  id: 'javascript',
                  label: 'JavaScript',
                  content: (
                    <CodeBlock
                      code={createPaymentJs}
                      label={`${developers.requestTitle} (JavaScript)`}
                    />
                  ),
                },
              ]}
            />
          </div>

          <div className="overflow-hidden rounded-xl bg-ink shadow-float ring-1 ring-ink-600">
            <h3 className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-white">
              {developers.webhookTitle}
            </h3>
            <CodeBlock code={signedWebhook} label={developers.webhookTitle} />
          </div>

          <p className="text-sm text-content-muted">{developers.note}</p>
        </Reveal>
      </div>
    </Section>
  );
}
