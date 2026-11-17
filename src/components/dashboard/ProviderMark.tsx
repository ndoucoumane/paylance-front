import logoOm from '../../assets/images/logo-om.png';
import logoWave from '../../assets/images/logo-wave.png';
import type { PaymentProvider } from '../../services/account/types';

const logos: Record<PaymentProvider, string> = {
  WAVE: logoWave,
  ORANGE_MONEY: logoOm,
};

/** Logo d'opérateur à taille fixe (décoratif : le nom est toujours affiché à côté). */
export function ProviderMark({
  provider,
  size = 'md',
}: {
  provider: PaymentProvider;
  size?: 'sm' | 'md' | 'lg';
}) {
  const px = { sm: 28, md: 36, lg: 44 }[size];
  return (
    <img
      src={logos[provider]}
      alt=""
      aria-hidden="true"
      width={px}
      height={px}
      loading="lazy"
      decoding="async"
      className={`shrink-0 bg-[#fff] object-contain ring-1 ring-neutral-200 ${
        { sm: 'h-7 w-7 rounded-lg', md: 'h-9 w-9 rounded-lg', lg: 'h-11 w-11 rounded-xl' }[size]
      }`}
    />
  );
}
