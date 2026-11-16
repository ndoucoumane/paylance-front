/**
 * Types du parcours d'inscription et d'onboarding.
 *
 * Section 1 : miroir exact des DTO du backend (paylance-backend, package web.dto.onboarding
 * et domain.enums). Toute évolution côté Java doit être reportée ici.
 *
 * Section 2 : contrats dont le backend n'a pas encore d'équivalent (inscription, code e-mail,
 * progression, profil d'entreprise étendu, préférences, formules). Ils servent l'implémentation
 * de démonstration et décrivent ce que le frontend attend des futurs endpoints.
 */

/* ---------- 1. Contrats existants du backend ---------- */

export type MemberRole = 'OWNER' | 'ADMIN' | 'DEVELOPER' | 'VIEWER';
export type OrganizationStatus = 'ACTIVE' | 'SUSPENDED';
export type PaymentProvider = 'WAVE' | 'ORANGE_MONEY';
export type EnvironmentType = 'TEST' | 'LIVE';
export type ProviderAccountStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'DISABLED';

/** OrganizationCreateRequest */
export type OrganizationCreateRequest = {
  name: string;
  slug?: string;
  /** Code ISO à 2 lettres. */
  country: string;
  /** Code ISO à 3 lettres. */
  defaultCurrency?: string;
};

/** OrganizationResponse */
export type Organization = {
  id: string;
  name: string;
  slug: string;
  country: string;
  defaultCurrency: string;
  status: OrganizationStatus;
  role: MemberRole;
  createdAt: string;
};

/** ProviderAccountCreateRequest */
export type ProviderAccountCreateRequest = {
  provider: PaymentProvider;
  label: string;
  environment: EnvironmentType;
  credentials: Record<string, string>;
  webhookSecret?: string;
};

/** ProviderAccountResponse (identifiants toujours masqués). */
export type ProviderAccount = {
  id: string;
  provider: PaymentProvider;
  label: string;
  environment: EnvironmentType;
  status: ProviderAccountStatus;
  credentials: Record<string, string>;
  webhookSecretConfigured: boolean;
  /** URL à déclarer chez le prestataire pour recevoir les notifications. */
  webhookUrl: string;
  lastVerifiedAt: string | null;
  lastVerificationMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

/* ---------- 2. Contrats attendus (pas encore exposés par le backend) ---------- */

export type UserAccount = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
};

export type RegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  acceptTerms: true;
};

export type EmailVerificationStatus = {
  /** Fin de validité du code en cours (ISO 8601). */
  expiresAt: string;
  /** Date à partir de laquelle un nouveau code peut être demandé. */
  resendAvailableAt: string;
  attemptsLeft: number;
};

export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '500+';

export type CompanyProfile = {
  tradeName: string;
  legalName: string;
  country: string;
  sector: string;
  /** Format E.164. */
  phone: string;
  website: string | null;
  size: CompanySize;
};

export type NotificationPreferences = {
  paymentSucceeded: boolean;
  paymentFailed: boolean;
  refunds: boolean;
  providerIssues: boolean;
  weeklySummary: boolean;
};

export type Preferences = {
  currency: string;
  timezone: string;
  language: 'fr' | 'en';
  notifications: NotificationPreferences;
};

export type PlanId = 'STARTER' | 'GROWTH' | 'BUSINESS';

export type Plan = {
  id: PlanId;
  name: string;
  description: string;
  /** Libellé de prix tel que défini par l'offre commerciale (aucun montant inventé). */
  priceLabel: string;
  features: string[];
  /** La formule peut être choisie directement pendant l'inscription, sans paiement. */
  selfServe: boolean;
  recommended?: boolean;
};

export type OnboardingStep = 'COMPANY' | 'PREFERENCES' | 'PLAN' | 'PROVIDERS' | 'DONE';

/** Progression calculée et enregistrée par le serveur. */
export type OnboardingProgress = {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  /** Étape « prestataires » passée sans connecter de compte. */
  providersSkipped: boolean;
};

/** Tout ce qu'il faut pour décider où envoyer l'utilisateur. */
export type AccountSnapshot = {
  user: UserAccount;
  organization: Organization | null;
  progress: OnboardingProgress;
};
