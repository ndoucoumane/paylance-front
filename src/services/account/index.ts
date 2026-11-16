import { env } from '../../config/env';
import type { AccountApi } from './accountApi';

/**
 * Implémentation choisie selon la configuration (voir VITE_DEMO_MODE).
 * Chargée à la demande : la démo n'embarque pas keycloak-js, et inversement.
 */
export async function loadAccountApi(): Promise<AccountApi> {
  if (env.demoMode) {
    const { demoAccountApi } = await import('./demoAccountApi');
    return demoAccountApi;
  }
  const { liveAccountApi } = await import('./liveAccountApi');
  return liveAccountApi;
}

export type { AccountApi } from './accountApi';
