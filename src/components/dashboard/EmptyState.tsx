import { CalendarClock, LineChart, Search, Smartphone, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type Variant = 'transactions' | 'search' | 'scheduled' | 'chart';

const badges: Record<Variant, { icon: LucideIcon; className: string }> = {
  transactions: { icon: Smartphone, className: 'bg-emerald-600 text-white' },
  search: { icon: Search, className: 'bg-neutral-900 text-white' },
  scheduled: { icon: CalendarClock, className: 'bg-sky-600 text-white' },
  chart: { icon: LineChart, className: 'bg-emerald-600 text-white' },
};

/**
 * Illustration sobre : deux reçus empilés et une pastille d'action. Dessinée avec les
 * couleurs du thème (classes Tailwind), elle suit donc le mode clair comme le sombre.
 */
function Illustration({ variant }: { variant: Variant }) {
  const badge = badges[variant];
  const Icon = badge.icon;
  return (
    <div aria-hidden="true" className="relative h-[104px] w-[148px]">
      <svg viewBox="0 0 148 104" className="h-full w-full">
        <g transform="rotate(-7 74 52)">
          <rect x="30" y="14" width="88" height="70" rx="12" className="fill-neutral-100" />
        </g>
        <rect
          x="22"
          y="20"
          width="100"
          height="72"
          rx="12"
          className="fill-white stroke-neutral-200"
          strokeWidth="1.5"
        />
        {variant === 'chart' ? (
          <path
            d="M36 74 C48 74 52 58 62 60 S78 72 88 54 S104 44 110 40"
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="4 5"
            className="stroke-neutral-300"
          />
        ) : (
          <>
            <rect x="36" y="34" width="34" height="7" rx="3.5" className="fill-neutral-200" />
            <rect x="84" y="34" width="24" height="7" rx="3.5" className="fill-emerald-100" />
            <rect x="36" y="50" width="56" height="5" rx="2.5" className="fill-neutral-100" />
            <rect x="36" y="62" width="44" height="5" rx="2.5" className="fill-neutral-100" />
            <rect x="36" y="74" width="30" height="5" rx="2.5" className="fill-neutral-100" />
          </>
        )}
      </svg>
      <span
        className={`absolute bottom-0 right-1 flex h-9 w-9 items-center justify-center rounded-full ring-4 ring-white ${badge.className}`}
      >
        <Icon className="h-4 w-4" />
      </span>
    </div>
  );
}

type Props = {
  variant: Variant;
  title: string;
  text?: string;
  /** Bouton ou lien d'action. */
  action?: ReactNode;
  compact?: boolean;
};

/** État vide illustré : liste sans résultat, nouveau marchand, aucune programmation. */
export function EmptyState({ variant, title, text, action, compact }: Props) {
  return (
    <div className={`flex flex-col items-center px-6 text-center ${compact ? 'py-8' : 'py-14'}`}>
      <Illustration variant={variant} />
      <p className="mt-5 font-semibold text-neutral-950">{title}</p>
      {text && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-neutral-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
