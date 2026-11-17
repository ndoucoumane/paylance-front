import { dashboard as t } from '../../content/dashboard.fr';
import type { PeriodDays } from '../../services/payments/types';

const PERIODS: PeriodDays[] = [7, 30, 90];

/** Choix de la période analysée (7, 30 ou 90 jours). */
export function PeriodSelector({
  value,
  onChange,
}: {
  value: PeriodDays;
  onChange: (period: PeriodDays) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={t.periodLabel}
      className="inline-flex rounded-full bg-white p-1 ring-1 ring-neutral-200"
    >
      {PERIODS.map((period) => (
        <button
          key={period}
          type="button"
          role="radio"
          aria-checked={value === period}
          onClick={() => onChange(period)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            value === period
              ? 'bg-neutral-950 text-white'
              : 'text-neutral-600 hover:text-neutral-950'
          }`}
        >
          <span className="sm:hidden">{t.periodsShort[period]}</span>
          <span className="hidden sm:inline">{t.periods[period]}</span>
        </button>
      ))}
    </div>
  );
}
