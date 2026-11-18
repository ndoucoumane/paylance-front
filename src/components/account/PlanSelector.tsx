import { Check } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { account as t } from '../../content/account.fr';
import { useSession, type SessionState } from '../../lib/session/sessionContext';
import type { Plan, PlanId } from '../../services/account/types';
import { errorMessage } from '../../services/api/errors';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { FormAlert } from './FormAlert';

type Props = { plans: Plan[]; selected: PlanId | null; onSaved: (next: SessionState) => void };

/**
 * Formules Starter / Growth / Business. Seules les formules « self-serve » se choisissent ici,
 * sans paiement ; les autres passent par l'équipe commerciale.
 */
export function PlanSelector({ plans, selected, onSaved }: Props) {
  const { api, refresh } = useSession();
  const [saving, setSaving] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = async (plan: Plan) => {
    setSaving(plan.id);
    setError(null);
    try {
      await api.selectPlan(plan.id);
      onSaved(await refresh());
    } catch (cause) {
      setError(errorMessage(cause));
      setSaving(null);
    }
  };

  return (
    <div>
      <FormAlert title={t.plan.errorTitle} message={error} />
      <ul className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = selected === plan.id;
          return (
            <li
              key={plan.id}
              className={`flex flex-col rounded-2xl bg-white p-6 ${
                plan.recommended ? 'ring-2 ring-primary-strong' : 'ring-1 ring-neutral-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-neutral-950">{plan.name}</h2>
                {(isCurrent || plan.recommended) && (
                  <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-strong">
                    {isCurrent ? t.plan.current : t.plan.recommended}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{plan.description}</p>
              <p className="mt-5 text-[15px] font-semibold text-neutral-950">{plan.priceLabel}</p>
              <ul className="mt-5 space-y-2.5 border-t border-neutral-200 pt-5 text-sm text-neutral-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary-strong"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                {plan.selfServe ? (
                  <Button
                    onClick={() => void choose(plan)}
                    disabled={saving !== null}
                    aria-busy={saving === plan.id}
                    className="w-full"
                  >
                    {saving === plan.id && <Spinner />}
                    {t.plan.chooseNamed(plan.name)}
                  </Button>
                ) : (
                  <Link
                    to="/?sujet=acces_anticipe#contact"
                    className="inline-flex min-h-10 w-full items-center justify-center rounded-full px-4 text-sm font-semibold text-neutral-950 shadow-[inset_0_0_0_1px_rgba(10,10,10,0.15)] transition-colors hover:bg-neutral-50"
                  >
                    {t.plan.contact}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-sm text-neutral-600">{t.plan.noPayment}</p>
    </div>
  );
}
