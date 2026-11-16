import { ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { account as t } from '../../content/account.fr';
import { Logo } from '../ui/Logo';
import { DemoBanner } from './DemoBanner';

type Props = {
  title: string;
  subtitle?: ReactNode;
  /** Lien d'en-tête, ex. « Déjà un compte ? Se connecter ». */
  topLink?: ReactNode;
  children: ReactNode;
};

/**
 * Mise en page des écrans d'authentification : formulaire à gauche,
 * panneau de présentation gris clair à droite (grand écran uniquement).
 */
export function AuthLayout({ title, subtitle, topLink, children }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <DemoBanner />
      <div className="flex flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="flex flex-1 flex-col px-4 sm:px-8 lg:px-12">
          <header className="flex h-20 items-center justify-between gap-4">
            <Logo tone="light" />
            {topLink && <div className="text-right text-sm text-neutral-600">{topLink}</div>}
          </header>
          <main
            id="contenu"
            className="flex flex-1 items-start justify-center py-8 sm:items-center sm:py-12"
          >
            <div className="w-full max-w-[440px]">
              <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-neutral-950 sm:text-[2rem]">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">{subtitle}</p>
              )}
              <div className="mt-8">{children}</div>
            </div>
          </main>
          <footer className="py-6 text-xs text-neutral-500">
            © {new Date().getFullYear()} Paylance
          </footer>
        </div>

        <aside className="hidden border-l border-neutral-200 bg-surface lg:flex lg:flex-col lg:justify-center lg:px-14 xl:px-20">
          <div className="max-w-md">
            <p className="text-sm font-medium text-neutral-500">{t.aside.eyebrow}</p>
            <p className="mt-4 text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.04em] text-neutral-950">
              {t.aside.title}
              <span className="block text-[#858585]">{t.aside.titleMuted}</span>
            </p>
            <p className="mt-12 text-xs text-neutral-500">{t.aside.stepsTitle}</p>
            <ol className="mt-3 border-t border-neutral-200">
              {t.aside.steps.map((step, index) => (
                <li
                  key={step}
                  className="flex items-baseline gap-4 border-b border-neutral-200 py-3 text-[15px] text-neutral-700"
                >
                  <span className="text-xs tabular-nums text-neutral-400">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-8 flex items-start gap-2 text-sm text-neutral-600">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-primary-strong"
              />
              {t.aside.note}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
