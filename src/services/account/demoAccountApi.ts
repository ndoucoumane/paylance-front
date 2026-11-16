import { ApiError } from '../api/errors';
import { demoPaymentsApi, type DemoPaymentsState } from '../payments/demoPaymentsApi';
import type { AccountApi } from './accountApi';
import { findCountry } from './referenceData';
import type {
  AccountSnapshot,
  CompanyProfile,
  EmailVerificationStatus,
  OnboardingProgress,
  OnboardingStep,
  Organization,
  Plan,
  PlanId,
  Preferences,
  ProviderAccount,
  RegisterRequest,
  UserAccount,
} from './types';

/**
 * Implémentation de démonstration : joue le rôle du backend, avec des données fictives
 * enregistrées dans le navigateur (localStorage). Rien n'est envoyé sur le réseau.
 *
 * Règle de démonstration pour les prestataires : un compte en environnement TEST passe
 * le test de connexion, un compte LIVE est refusé (aucune vérification réelle possible ici).
 */

const STORAGE_KEY = 'paylance.demo.v1';
const CODE_TTL_MS = 10 * 60_000;
const RESEND_COOLDOWN_MS = 30_000;
const MAX_ATTEMPTS = 5;
const STEP_ORDER: OnboardingStep[] = ['COMPANY', 'PREFERENCES', 'PLAN', 'PROVIDERS', 'DONE'];

export const DEMO_ACCOUNT = { email: 'awa.diop@exemple.sn', password: 'Paylance2026!' };

export type StoredUser = UserAccount & {
  passwordHash: string;
  verification: {
    code: string;
    expiresAt: number;
    resendAvailableAt: number;
    attemptsLeft: number;
  } | null;
  organization: Organization | null;
  company: CompanyProfile | null;
  preferences: Preferences | null;
  plan: PlanId | null;
  progress: OnboardingProgress;
  providerAccounts: ProviderAccount[];
  /** Transactions fictives (voir demoPaymentsApi) : date de génération et remboursements. */
  payments?: DemoPaymentsState;
};

type Store = { users: StoredUser[]; sessionUserId: string | null; lastCode: string | null };

const PLANS: Plan[] = [
  {
    id: 'STARTER',
    name: 'Starter',
    description: 'Pour démarrer et connecter vos premiers comptes marchands.',
    priceLabel: 'Gratuit pendant la phase pilote',
    features: [
      'Wave Business et Orange Money',
      'Plusieurs comptes par prestataire',
      'Tableau de bord et rapprochement',
      'Environnements test et live',
    ],
    selfServe: true,
    recommended: true,
  },
  {
    id: 'GROWTH',
    name: 'Growth',
    description: 'Pour les équipes qui encaissent un volume régulier.',
    priceLabel: 'Tarif selon votre volume mensuel',
    features: [
      'Tout Starter',
      'Remboursements programmés',
      'Membres et rôles d’équipe',
      'Support prioritaire',
    ],
    selfServe: false,
  },
  {
    id: 'BUSINESS',
    name: 'Business',
    description: 'Pour les volumes importants et les besoins sur mesure.',
    priceLabel: 'Sur devis',
    features: [
      'Tout Growth',
      'Accompagnement à l’intégration',
      'Engagements de service',
      'Interlocuteur dédié',
    ],
    selfServe: false,
  },
];

/* ---------- Utilitaires ---------- */

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const latency = () => wait(350 + Math.random() * 400);
const nowIso = () => new Date().toISOString();

function randomId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `${prefix}_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

function randomCode(): string {
  return String(crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000).padStart(6, '0');
}

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`paylance-demo:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function mask(value: string): string {
  return value.length <= 4 ? '••••' : `••••${value.slice(-4)}`;
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function httpError(status: number, message: string): ApiError {
  return new ApiError('http', message, { status });
}

/** Étape courante = première étape non terminée, dans l'ordre du parcours. */
function withCompleted(progress: OnboardingProgress, step: OnboardingStep): OnboardingProgress {
  const completed = new Set([...progress.completedSteps, step]);
  const currentStep = STEP_ORDER.find((item) => item !== 'DONE' && !completed.has(item)) ?? 'DONE';
  if (currentStep === 'DONE') completed.add('DONE');
  return {
    ...progress,
    completedSteps: STEP_ORDER.filter((item) => completed.has(item)),
    currentStep,
  };
}

/* ---------- Stockage ---------- */

let memoryStore: Store | null = null;

function emptyStore(): Store {
  return { users: [], sessionUserId: null, lastCode: null };
}

function readStore(): Store {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {
    // Stockage indisponible (navigation privée…) : repli en mémoire.
  }
  return memoryStore ?? emptyStore();
}

function writeStore(store: Store): void {
  memoryStore = store;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Repli en mémoire déjà assuré.
  }
}

async function seedStore(): Promise<Store> {
  const store = readStore();
  if (store.users.some((user) => user.email === DEMO_ACCOUNT.email)) return store;

  const createdAt = nowIso();
  const organizationId = randomId('org');
  const accountId = randomId('pa');
  store.users.push({
    id: randomId('usr'),
    firstName: 'Awa',
    lastName: 'Diop',
    email: DEMO_ACCOUNT.email,
    emailVerified: true,
    passwordHash: await hashPassword(DEMO_ACCOUNT.password),
    verification: null,
    organization: {
      id: organizationId,
      name: 'Boutique Teranga',
      slug: 'boutique-teranga',
      country: 'SN',
      defaultCurrency: 'XOF',
      status: 'ACTIVE',
      role: 'OWNER',
      createdAt,
    },
    company: {
      tradeName: 'Boutique Teranga',
      legalName: 'Teranga Distribution SARL',
      country: 'SN',
      sector: 'E-commerce',
      phone: '+221771234567',
      website: 'https://boutique-teranga.exemple.sn',
      size: '11-50',
    },
    preferences: {
      currency: 'XOF',
      timezone: 'Africa/Dakar',
      language: 'fr',
      notifications: {
        paymentSucceeded: true,
        paymentFailed: true,
        refunds: true,
        providerIssues: true,
        weeklySummary: true,
      },
    },
    plan: 'STARTER',
    progress: {
      currentStep: 'DONE',
      completedSteps: [...STEP_ORDER],
      providersSkipped: false,
    },
    providerAccounts: [
      {
        id: accountId,
        provider: 'WAVE',
        label: 'Wave · Boutique principale',
        environment: 'TEST',
        status: 'ACTIVE',
        credentials: { checkoutApiKey: '••••7f3a' },
        webhookSecretConfigured: true,
        webhookUrl: `https://api.paylance.test/api/v1/webhooks/wave/${accountId}`,
        lastVerifiedAt: createdAt,
        lastVerificationMessage: 'Connexion vérifiée (environnement de test, mode démonstration).',
        createdAt,
        updatedAt: createdAt,
      },
    ],
  });
  writeStore(store);
  return store;
}

/** Lecture-modification-écriture de l'utilisateur connecté. */
export async function withCurrentUser<T>(
  update: (user: StoredUser, store: Store) => T | Promise<T>,
): Promise<T> {
  const store = await seedStore();
  const user = store.users.find((item) => item.id === store.sessionUserId);
  if (!user) throw httpError(401, 'Session expirée');
  const result = await update(user, store);
  writeStore(store);
  return result;
}

function requireVerified(user: StoredUser): void {
  if (!user.emailVerified) throw httpError(403, 'Adresse e-mail non vérifiée');
}

function requireOrganization(user: StoredUser): Organization {
  requireVerified(user);
  if (!user.organization) throw httpError(409, 'Créez d’abord votre entreprise.');
  return user.organization;
}

function issueCode(user: StoredUser, store: Store): EmailVerificationStatus {
  const now = Date.now();
  const code = randomCode();
  user.verification = {
    code,
    expiresAt: now + CODE_TTL_MS,
    resendAvailableAt: now + RESEND_COOLDOWN_MS,
    attemptsLeft: MAX_ATTEMPTS,
  };
  store.lastCode = code;
  return toVerificationStatus(user);
}

function toVerificationStatus(user: StoredUser): EmailVerificationStatus {
  const verification = user.verification;
  if (!verification) throw httpError(409, 'Aucun code en cours. Demandez un nouveau code.');
  return {
    expiresAt: new Date(verification.expiresAt).toISOString(),
    resendAvailableAt: new Date(verification.resendAvailableAt).toISOString(),
    attemptsLeft: verification.attemptsLeft,
  };
}

/* ---------- API ---------- */

export const demoAccountApi: AccountApi = {
  mode: 'demo',
  redirectLogin: false,
  payments: demoPaymentsApi,

  demo: {
    hints() {
      return { ...DEMO_ACCOUNT, lastCode: readStore().lastCode };
    },
    reset() {
      memoryStore = null;
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignoré
      }
    },
  },

  async getSnapshot(): Promise<AccountSnapshot | null> {
    const store = await seedStore();
    const user = store.users.find((item) => item.id === store.sessionUserId);
    if (!user) return null;
    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        emailVerified: user.emailVerified,
      },
      organization: user.organization,
      progress: user.progress,
    };
  },

  async login(email, password) {
    await latency();
    const store = await seedStore();
    const hash = await hashPassword(password);
    const user = store.users.find((item) => item.email === email.trim().toLowerCase());
    if (!user || user.passwordHash !== hash) {
      throw httpError(401, 'E-mail ou mot de passe incorrect.');
    }
    store.sessionUserId = user.id;
    writeStore(store);
  },

  async logout() {
    await wait(150);
    const store = readStore();
    store.sessionUserId = null;
    writeStore(store);
  },

  async register(request: RegisterRequest) {
    await latency();
    const store = await seedStore();
    const email = request.email.trim().toLowerCase();
    if (store.users.some((user) => user.email === email)) {
      throw httpError(409, 'Un compte existe déjà avec cette adresse e-mail.');
    }
    const user: StoredUser = {
      id: randomId('usr'),
      firstName: request.firstName.trim(),
      lastName: request.lastName.trim(),
      email,
      emailVerified: false,
      passwordHash: await hashPassword(request.password),
      verification: null,
      organization: null,
      company: null,
      preferences: null,
      plan: null,
      progress: { currentStep: 'COMPANY', completedSteps: [], providersSkipped: false },
      providerAccounts: [],
    };
    issueCode(user, store);
    store.users.push(user);
    store.sessionUserId = user.id;
    writeStore(store);
  },

  async getEmailVerification() {
    return withCurrentUser((user, store) =>
      user.verification ? toVerificationStatus(user) : issueCode(user, store),
    );
  },

  async sendVerificationCode() {
    await latency();
    return withCurrentUser((user, store) => {
      if (user.emailVerified) throw httpError(409, 'Adresse e-mail déjà vérifiée.');
      if (user.verification && Date.now() < user.verification.resendAvailableAt) {
        throw httpError(429, 'Patientez quelques secondes avant de demander un nouveau code.');
      }
      return issueCode(user, store);
    });
  },

  async verifyEmail(code) {
    await latency();
    return withCurrentUser((user, store) => {
      if (user.emailVerified) return;
      const verification = user.verification;
      if (!verification) throw httpError(409, 'Aucun code en cours. Demandez un nouveau code.');
      if (Date.now() > verification.expiresAt) {
        throw httpError(410, 'Ce code a expiré. Demandez un nouveau code.');
      }
      if (verification.attemptsLeft <= 0) {
        throw httpError(429, 'Trop de tentatives. Demandez un nouveau code.');
      }
      if (code !== verification.code) {
        verification.attemptsLeft -= 1;
        throw new ApiError(
          'http',
          verification.attemptsLeft > 0
            ? `Code incorrect. Il vous reste ${verification.attemptsLeft} tentative${verification.attemptsLeft > 1 ? 's' : ''}.`
            : 'Code incorrect. Trop de tentatives : demandez un nouveau code.',
          { status: 422 },
        );
      }
      user.emailVerified = true;
      user.verification = null;
      store.lastCode = null;
    });
  },

  async getCompany() {
    return withCurrentUser((user) => user.company);
  },

  async saveCompany(profile) {
    await latency();
    return withCurrentUser((user) => {
      requireVerified(user);
      const country = findCountry(profile.country);
      if (!user.organization) {
        user.organization = {
          id: randomId('org'),
          name: profile.tradeName,
          slug: slugify(profile.tradeName),
          country: profile.country,
          defaultCurrency: country?.currency ?? 'XOF',
          status: 'ACTIVE',
          role: 'OWNER',
          createdAt: nowIso(),
        };
      } else {
        user.organization = { ...user.organization, name: profile.tradeName };
      }
      user.company = profile;
      user.progress = withCompleted(user.progress, 'COMPANY');
      return user.organization;
    });
  },

  async getPreferences() {
    return withCurrentUser((user) => user.preferences);
  },

  async savePreferences(preferences) {
    await latency();
    return withCurrentUser((user) => {
      const organization = requireOrganization(user);
      user.preferences = preferences;
      user.organization = { ...organization, defaultCurrency: preferences.currency };
      user.progress = withCompleted(user.progress, 'PREFERENCES');
    });
  },

  async listPlans() {
    await wait(200);
    return PLANS;
  },

  async getSelectedPlan() {
    return withCurrentUser((user) => user.plan);
  },

  async selectPlan(planId) {
    await latency();
    return withCurrentUser((user) => {
      requireOrganization(user);
      const plan = PLANS.find((item) => item.id === planId);
      if (!plan) throw httpError(404, 'Formule introuvable.');
      if (!plan.selfServe) {
        throw httpError(422, `La formule ${plan.name} s’active avec notre équipe commerciale.`);
      }
      user.plan = planId;
      user.progress = withCompleted(user.progress, 'PLAN');
    });
  },

  async listProviderAccounts() {
    await wait(200);
    return withCurrentUser((user) => {
      requireOrganization(user);
      return user.providerAccounts.filter((account) => account.status !== 'DISABLED');
    });
  },

  async createProviderAccount(request) {
    await latency();
    return withCurrentUser((user) => {
      requireOrganization(user);
      const id = randomId('pa');
      const now = nowIso();
      const path = request.provider === 'WAVE' ? 'wave' : 'orange-money';
      const account: ProviderAccount = {
        id,
        provider: request.provider,
        label: request.label.trim(),
        environment: request.environment,
        status: 'PENDING_VERIFICATION',
        credentials: Object.fromEntries(
          Object.entries(request.credentials).map(([key, value]) => [
            key,
            key === 'merchantCode' || key === 'merchantName' ? value : mask(value),
          ]),
        ),
        webhookSecretConfigured: Boolean(request.webhookSecret),
        webhookUrl: `https://api.paylance.test/api/v1/webhooks/${path}/${id}`,
        lastVerifiedAt: null,
        lastVerificationMessage: null,
        createdAt: now,
        updatedAt: now,
      };
      user.providerAccounts.push(account);
      return account;
    });
  },

  async testProviderAccount(id) {
    await wait(1_100);
    return withCurrentUser((user) => {
      requireOrganization(user);
      const account = user.providerAccounts.find((item) => item.id === id);
      if (!account) throw httpError(404, 'Compte prestataire introuvable.');
      const now = nowIso();
      const success = account.environment === 'TEST';
      Object.assign(account, {
        status: success ? 'ACTIVE' : 'PENDING_VERIFICATION',
        lastVerifiedAt: success ? now : account.lastVerifiedAt,
        lastVerificationMessage: success
          ? 'Connexion vérifiée (environnement de test, mode démonstration).'
          : 'Mode démonstration : un compte LIVE ne peut pas être vérifié. Utilisez l’environnement TEST.',
        updatedAt: now,
      } satisfies Partial<ProviderAccount>);
      return { ...account };
    });
  },

  async disableProviderAccount(id) {
    await latency();
    return withCurrentUser((user) => {
      const account = user.providerAccounts.find((item) => item.id === id);
      if (!account) throw httpError(404, 'Compte prestataire introuvable.');
      account.status = 'DISABLED';
      account.updatedAt = nowIso();
      return { ...account };
    });
  },

  async completeProvidersStep() {
    await latency();
    return withCurrentUser((user) => {
      requireOrganization(user);
      const hasActive = user.providerAccounts.some((account) => account.status === 'ACTIVE');
      user.progress = {
        ...withCompleted(user.progress, 'PROVIDERS'),
        providersSkipped: !hasActive,
      };
    });
  },
};
