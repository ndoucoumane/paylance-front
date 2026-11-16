/** Lecture typée des variables d'environnement Vite (voir .env.example). */

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, '') : undefined;
}

export type KeycloakConfig = { url: string; realm: string; clientId: string };

const apiUrl = clean(import.meta.env.VITE_API_URL);

const kcUrl = clean(import.meta.env.VITE_KEYCLOAK_URL);
const kcRealm = clean(import.meta.env.VITE_KEYCLOAK_REALM);
const kcClientId = clean(import.meta.env.VITE_KEYCLOAK_CLIENT_ID);

/**
 * Mode démonstration du parcours d'inscription : données fictives stockées dans le navigateur.
 * Actif par défaut tant que l'API n'est pas configurée ; `VITE_DEMO_MODE=false` le désactive.
 */
const demoFlag = import.meta.env.VITE_DEMO_MODE?.trim().toLowerCase();
const demoMode = demoFlag ? demoFlag !== 'false' : !apiUrl;

export const env = {
  apiUrl,
  demoMode,
  /** `null` si l'une des trois variables Keycloak manque. */
  keycloak:
    kcUrl && kcRealm && kcClientId
      ? ({ url: kcUrl, realm: kcRealm, clientId: kcClientId } satisfies KeycloakConfig)
      : null,
} as const;

/** Lien direct vers le flux « Mot de passe oublié » de Keycloak. */
export function getResetPasswordUrl(): string | null {
  const kc = env.keycloak;
  if (!kc) return null;
  const params = new URLSearchParams({ client_id: kc.clientId });
  return `${kc.url}/realms/${encodeURIComponent(kc.realm)}/login-actions/reset-credentials?${params.toString()}`;
}
