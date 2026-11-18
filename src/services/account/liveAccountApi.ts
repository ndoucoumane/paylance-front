import type Keycloak from 'keycloak-js';
import { initKeycloak } from '../../lib/auth/keycloak';
import { ApiError } from '../api/errors';
import { apiRequest } from '../api/http';
import { livePaymentsApi } from '../payments/livePaymentsApi';
import type { AccountApi } from './accountApi';
import type { AccountSnapshot, Organization, ProviderAccount, UserAccount } from './types';

/**
 * Implémentation réelle : Keycloak pour l'identité, API Paylance pour le reste.
 *
 * Routes branchées (voir paylance-backend/docs/message-front-2026-11-18.md) :
 * - GET /api/v1/me : session, organisation et progression, calculées par le serveur ;
 * - POST/GET /api/v1/organizations ;
 * - GET/POST /api/v1/dashboard/provider-accounts, POST …/{id}/test et …/{id}/disable.
 * Les autres fonctions lèvent une erreur « non disponible » au lieu d'appeler une route inventée.
 * La connexion passe par la page Keycloak (PKCE) en attendant les routes /public/auth/*.
 */

async function keycloak(): Promise<Keycloak> {
  return initKeycloak();
}

export async function token(): Promise<string> {
  const kc = await keycloak();
  if (!kc.authenticated)
    throw new ApiError('http', 'Votre session a expiré. Reconnectez-vous.', { status: 401 });
  await kc.updateToken(30).catch(() => {
    throw new ApiError('http', 'Votre session a expiré. Reconnectez-vous.', { status: 401 });
  });
  return kc.token!;
}

/** Identité issue du jeton Keycloak (servira quand la progression sera exposée). */
export function readUser(kc: Keycloak): UserAccount {
  const claims = (kc.tokenParsed ?? {}) as Record<string, unknown>;
  const text = (key: string) => (typeof claims[key] === 'string' ? (claims[key] as string) : '');
  return {
    id: text('sub'),
    firstName: text('given_name'),
    lastName: text('family_name'),
    email: text('email'),
    emailVerified: claims.email_verified === true,
  };
}

let organizationId: string | null = null;

export async function currentOrganizationId(): Promise<string> {
  if (organizationId) return organizationId;
  const organizations = await apiRequest<Organization[]>('/api/v1/organizations', {
    token: await token(),
  });
  const first = organizations[0];
  if (!first) throw new ApiError('http', 'Créez d’abord votre entreprise.', { status: 409 });
  organizationId = first.id;
  return first.id;
}

const providerAccountPath = (id: string) =>
  `/api/v1/dashboard/provider-accounts/${encodeURIComponent(id)}`;

const notAvailable = (feature: string) => () => Promise.reject(ApiError.notAvailable(feature));

export const liveAccountApi: AccountApi = {
  mode: 'live',
  redirectLogin: true,
  payments: livePaymentsApi,

  async getSnapshot() {
    const kc = await keycloak();
    if (!kc.authenticated) return null;
    // Le serveur fait foi : e-mail vérifié, organisation et progression ne sont jamais déduits ici.
    const snapshot = await apiRequest<AccountSnapshot>('/api/v1/me', { token: await token() });
    organizationId = snapshot.organization?.id ?? null;
    return snapshot;
  },

  async login(email) {
    const kc = await keycloak();
    await kc.login({ loginHint: email, redirectUri: `${window.location.origin}/connexion` });
  },

  async logout() {
    organizationId = null;
    const kc = await keycloak();
    await kc.logout({ redirectUri: `${window.location.origin}/` });
  },

  register: notAvailable('Création de compte'),
  getEmailVerification: notAvailable('Vérification de l’adresse e-mail'),
  sendVerificationCode: notAvailable('Envoi du code de vérification'),
  verifyEmail: notAvailable('Vérification de l’adresse e-mail'),
  getCompany: notAvailable('Profil de l’entreprise'),

  async saveCompany(profile) {
    // Le backend n'accepte aujourd'hui que le nom et le pays : il déduit lui-même la devise.
    // Le reste du profil attend PUT /organizations/current/profile.
    const organization = await apiRequest<Organization>('/api/v1/organizations', {
      method: 'POST',
      token: await token(),
      body: { name: profile.tradeName, country: profile.country },
    });
    organizationId = organization.id;
    return organization;
  },

  getPreferences: notAvailable('Préférences'),
  savePreferences: notAvailable('Préférences'),
  listPlans: notAvailable('Formules d’abonnement'),
  getSelectedPlan: notAvailable('Formules d’abonnement'),
  selectPlan: notAvailable('Formules d’abonnement'),

  async listProviderAccounts() {
    return apiRequest<ProviderAccount[]>('/api/v1/dashboard/provider-accounts', {
      token: await token(),
      organizationId: await currentOrganizationId(),
    });
  },

  async createProviderAccount(request) {
    return apiRequest<ProviderAccount>('/api/v1/dashboard/provider-accounts', {
      method: 'POST',
      body: request,
      token: await token(),
      organizationId: await currentOrganizationId(),
    });
  },

  async testProviderAccount(id) {
    return apiRequest<ProviderAccount>(`${providerAccountPath(id)}/test`, {
      method: 'POST',
      token: await token(),
      organizationId: await currentOrganizationId(),
    });
  },

  async disableProviderAccount(id) {
    return apiRequest<ProviderAccount>(`${providerAccountPath(id)}/disable`, {
      method: 'POST',
      token: await token(),
      organizationId: await currentOrganizationId(),
    });
  },

  completeProvidersStep: notAvailable('Suivi de la progression de l’inscription'),
};
