import type { CSSProperties } from 'react';
import { ShieldCheck } from 'lucide-react';
import { fr } from '../../content/fr';
import { ButtonLink } from '../ui/Button';
import { Container } from '../ui/Container';
import { DashboardMockup } from '../mockup/DashboardMockup';

/** Décalage d'apparition de chaque bloc (voir .hero-rise dans index.css). */
const delay = (ms: number) => ({ '--hero-delay': `${ms}ms` }) as CSSProperties;

export function Hero() {
  const { hero } = fr;
  return (
    <section id="accueil" aria-labelledby="accueil-titre" className="bg-white pt-16 sm:pt-24">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="hero-rise text-sm font-medium text-neutral-500" style={delay(0)}>
              {hero.eyebrow}
            </p>
            <h1
              id="accueil-titre"
              className="hero-rise mt-4 text-balance text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.04em] text-neutral-950 sm:text-6xl lg:text-[3.5rem] xl:text-[3.75rem]"
              style={delay(60)}
            >
              {hero.title}
              <span className="block text-[#858585]">{hero.titleMuted}</span>
            </h1>
            <p
              className="hero-rise mt-6 max-w-xl text-[17px] leading-relaxed text-neutral-600"
              style={delay(120)}
            >
              {hero.subtitle}
            </p>

            <div className="hero-rise mt-9 flex flex-col gap-3 sm:flex-row" style={delay(180)}>
              <ButtonLink to="/?sujet=acces_anticipe#contact" size="lg">
                {hero.primaryCta}
              </ButtonLink>
              <ButtonLink to="/#fonctionnement" variant="secondaryLight" size="lg">
                {hero.secondaryCta}
              </ButtonLink>
            </div>

            <p
              className="hero-rise mt-6 inline-flex items-center gap-2 text-sm text-neutral-500"
              style={delay(220)}
            >
              <ShieldCheck aria-hidden="true" className="h-4 w-4 text-primary-strong" />
              {hero.fundsNote}
            </p>
          </div>

          <div className="hero-rise lg:col-span-4 lg:col-start-9 lg:self-end" style={delay(240)}>
            <p className="text-xs text-neutral-500">{hero.scopeTitle}</p>
            <ol className="mt-3 border-t border-neutral-200">
              {hero.scope.map((item, i) => (
                <li
                  key={item}
                  className="flex items-baseline gap-4 border-b border-neutral-200 py-3 text-[15px] text-neutral-700"
                >
                  <span className="text-xs tabular-nums text-neutral-400">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="hero-stage mt-16 overflow-hidden rounded-2xl bg-[#F6F6F4] sm:mt-24">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pt-4 text-xs text-neutral-500 sm:px-7 sm:pt-5">
            <span>{hero.previewCaption}</span>
            <span>{hero.previewNote}</span>
          </div>
          <div className="p-3 sm:p-7">
            <DashboardMockup className="w-full" />
          </div>
        </div>
      </Container>
    </section>
  );
}
