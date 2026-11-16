import Keycloak from 'keycloak-js';
import { env } from '../../config/env';

/** Origine d'un échec d'initialisation Keycloak. */
export type AuthErrorKind = 'config' | 'unreachable' | 'init';

const REACHABILITY_TIMEOUT_MS = 8_000;
const INIT_TIMEOUT_MS = 15_000;

export class AuthInitError extends Error {
  readonly kind: AuthErrorKind;

  constructor(kind: AuthErrorKind, cause?: unknown) {
    super(`Initialisation Keycloak impossible (${kind})`, { cause });
    this.name = 'AuthInitError';
    this.kind = kind;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, kind: AuthErrorKind): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new AuthInitError(kind)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Vérifie que le serveur Keycloak répond avant toute redirection,
 * pour afficher un message clair au lieu d'une page d'erreur du navigateur.
 * `no-cors` : on teste seulement la joignabilité réseau, sans dépendre des en-têtes CORS.
 */
async function assertReachable(url: string, realm: string): Promise<void> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REACHABILITY_TIMEOUT_MS);
  try {
    await fetch(`${url}/realms/${encodeURIComponent(realm)}/.well-known/openid-configuration`, {
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (error) {
    throw new AuthInitError('unreachable', error);
  } finally {
    window.clearTimeout(timer);
  }
}

async function createAndInit(): Promise<Keycloak> {
  const config = env.keycloak;
  if (!config) throw new AuthInitError('config');

  await assertReachable(config.url, config.realm);

  const keycloak = new Keycloak({
    url: config.url,
    realm: config.realm,
    clientId: config.clientId,
  });

  try {
    await withTimeout(
      keycloak.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        responseMode: 'fragment',
        checkLoginIframe: false,
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      }),
      INIT_TIMEOUT_MS,
      'unreachable',
    );
  } catch (error) {
    throw error instanceof AuthInitError ? error : new AuthInitError('init', error);
  }

  return keycloak;
}

let initPromise: Promise<Keycloak> | null = null;

/**
 * Instance unique (une instance Keycloak ne peut être initialisée qu'une fois,
 * y compris sous React StrictMode). En cas d'échec, un nouvel essai recrée l'instance.
 */
export function initKeycloak(): Promise<Keycloak> {
  if (!initPromise) {
    initPromise = createAndInit().catch((error: unknown) => {
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}
