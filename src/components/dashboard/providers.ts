import type { PaymentProvider } from '../../services/account/types';

export const providerNames: Record<PaymentProvider, string> = {
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
};
