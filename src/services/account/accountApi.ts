import type { PaymentsApi } from '../payments/types';
import type {
  AccountSnapshot,
  CompanyProfile,
  EmailVerificationStatus,
  Organization,
  Plan,
  PlanId,
  Preferences,
  ProviderAccount,
  ProviderAccountCreateRequest,
  RegisterRequest,
} from './types';

/**
 * Point d'accès unique du parcours d'inscription. Deux implémentations :
 * - `demoAccountApi` : données fictives dans le navigateur (en attendant le backend) ;
 * - `liveAccountApi` : API Paylance + Keycloak.
 *
 * Les règles métier (progression, expiration du code, test de connexion…) appartiennent
 * à l'implémentation, jamais aux écrans : chaque mutation renvoie l'état à jour.
 */
export interface AccountApi {
  readonly mode: 'demo' | 'live';
  /** L'authentification se fait par redirection (Keycloak) plutôt que par formulaire. */
  readonly redirectLogin: boolean;
  /** Transactions de l'organisation courante. */
  readonly payments: PaymentsApi;
  /** Outils propres au mode démonstration (absents en mode réel). */
  readonly demo?: DemoTools;

  /** Session courante, ou `null` si personne n'est connecté. */
  getSnapshot(): Promise<AccountSnapshot | null>;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  register(request: RegisterRequest): Promise<void>;

  getEmailVerification(): Promise<EmailVerificationStatus>;
  sendVerificationCode(): Promise<EmailVerificationStatus>;
  verifyEmail(code: string): Promise<void>;

  getCompany(): Promise<CompanyProfile | null>;
  /** Crée l'organisation (l'utilisateur en devient OWNER) ou met à jour son profil. */
  saveCompany(profile: CompanyProfile): Promise<Organization>;

  getPreferences(): Promise<Preferences | null>;
  savePreferences(preferences: Preferences): Promise<void>;

  listPlans(): Promise<Plan[]>;
  getSelectedPlan(): Promise<PlanId | null>;
  selectPlan(plan: PlanId): Promise<void>;

  listProviderAccounts(): Promise<ProviderAccount[]>;
  createProviderAccount(request: ProviderAccountCreateRequest): Promise<ProviderAccount>;
  testProviderAccount(id: string): Promise<ProviderAccount>;
  disableProviderAccount(id: string): Promise<ProviderAccount>;
  /** Termine l'étape « prestataires » (avec ou sans compte connecté). */
  completeProvidersStep(): Promise<void>;
}

/** Libellés de démonstration affichés à l'écran (identifiants du compte d'essai). */
export type DemoAccountHints = {
  email: string;
  password: string;
  /** Dernier code de vérification « envoyé » (aucun e-mail n'est réellement envoyé). */
  lastCode: string | null;
};

export type DemoTools = {
  hints(): DemoAccountHints;
  /** Efface toutes les données fictives de ce navigateur. */
  reset(): void;
};
