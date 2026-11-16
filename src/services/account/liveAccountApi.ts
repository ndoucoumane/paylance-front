import type Keycloak from 'keycloak-js';
import { initKeycloak } from '../../lib/auth/keycloak';
import { ApiError } from '../api/errors';
import { apiRequest } from '../api/http';
import { livePaymentsApi } from '../payments/livePaymentsApi';
import type { AccountApi } from './accountApi';
import { findCountry } from './referenceData';
import type { Organization, ProviderAccount, UserAccount } from './types';

/**
 * Implémentation réelle : Keycloak pour l'identité, API Paylance pour le reste.
 *
 * Seuls les contrats présents dans le backend sont appelés :
 * - POST/GET /api/v1/organizations (OrganizationCreateRequest / OrganizationResponse) ;
 * - GET/POST /api/v1/dashboard/provider-accounts (ProviderAccountCreateRequest / Response).
 * Ces routes sont autorisées par SecurityConfig, mais leurs contrôleurs restent à écrire.
 * Les autres fonctions lèvent une erreur « non disponible » au lieu d'appeler une route inventée.
 */

async function keycloak(): Promise<Keycloak> {
  return initKeycloak();
}

export async function token(): Promise<string> {
  const kc = await keycloak();
  if (!kc.authenticated) throw new ApiError('http', 'Session expirée', { status: 401 });
  await kc.updateToken(30).catch(() => {
    throw new ApiError('http', 'Session expirée', { status: 401 });
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

const notAvailable = (feature: string) => () => Promise.reject(ApiError.notAvailable(feature));

export const liveAccountApi: AccountApi = {
  mode: 'live',
  redirectLogin: true,
  payments: livePaymentsApi,

  async getSnapshot() {
    const kc = await keycloak();
    if (!kc.authenticated) return null;
    // Pas encore d'endpoint pour lire la progression de l'onboarding.
    throw ApiError.notAvailable('Suivi de la progression de l’inscription');
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
    // Le backend n'accepte aujourd'hui que nom, pays et devise (OrganizationCreateRequest).
    const organization = await apiRequest<Organization>('/api/v1/organizations', {
      method: 'POST',
      token: await token(),
      body: {
        name: profile.tradeName,
        country: profile.country,
        defaultCurrency: findCountry(profile.country)?.currency,
      },
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

  // ProviderAccountService.testConnection / disable existent, mais sans route publiée.
  testProviderAccount: notAvailable('Test de connexion du compte prestataire'),
  disableProviderAccount: notAvailable('Désactivation du compte prestataire'),
  completeProvidersStep: notAvailable('Suivi de la progression de l’inscription'),
};
