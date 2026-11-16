import type { PaymentProvider } from '../../services/account/types';

const marks: Record<PaymentProvider, { label: string; className: string }> = {
  WAVE: { label: 'W', className: 'bg-neutral-950 text-white' },
  ORANGE_MONEY: {
    label: 'OM',
    className: 'bg-white text-neutral-950 ring-1 ring-inset ring-neutral-300',
  },
};

/** Monogramme d'opérateur (pas de logo de marque). */
export function ProviderMark({
  provider,
  size = 'md',
}: {
  provider: PaymentProvider;
  size?: 'sm' | 'md';
}) {
  const mark = marks[provider];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-lg font-semibold tracking-tight ${mark.className} ${
        size === 'sm' ? 'h-7 w-7 text-[0.625rem]' : 'h-9 w-9 text-xs'
      }`}
    >
      {mark.label}
    </span>
  );
}
