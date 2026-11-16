import { Check, PlugZap } from 'lucide-react';
import { account as t } from '../../content/account.fr';
import { ROUTES } from '../../lib/session/routing';
import { ButtonLink } from '../ui/Button';

/** Tableau de bord sans prestataire connecté : invitation à connecter le premier compte. */
export function EmptyDashboardState() {
  return (
    <section
      aria-labelledby="etat-vide-titre"
      className="rounded-2xl bg-white px-6 py-12 text-center ring-1 ring-neutral-200 sm:px-12 sm:py-16"
    >
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary-strong">
        <PlugZap aria-hidden="true" className="h-6 w-6" />
      </span>
      <h2
        id="etat-vide-titre"
        className="mx-auto mt-6 max-w-md text-xl font-semibold tracking-tight text-neutral-950"
      >
        {t.app.empty.title}
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-neutral-600">
        {t.app.empty.text}
      </p>
      <ButtonLink to={ROUTES.dashboardProviders} size="lg" className="mt-8">
        {t.app.empty.cta}
      </ButtonLink>
      <ul className="mx-auto mt-10 flex max-w-2xl flex-col justify-center gap-3 text-sm text-neutral-600 sm:flex-row sm:gap-6">
        {t.app.empty.points.map((point) => (
          <li key={point} className="inline-flex items-center justify-center gap-2">
            <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-primary-strong" />
            {point}
          </li>
        ))}
      </ul>
    </section>
  );
}
