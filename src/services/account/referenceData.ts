import type { CompanySize, PaymentProvider, Preferences } from './types';

/**
 * Listes de référence des formulaires d'onboarding. Les valeurs par défaut par pays
 * ne sont que des suggestions pré-remplies : l'utilisateur peut toutes les modifier.
 */

export type Country = {
  code: string;
  name: string;
  dialCode: string;
  currency: string;
  timezone: string;
};

export const COUNTRIES: Country[] = [
  { code: 'SN', name: 'Sénégal', dialCode: '+221', currency: 'XOF', timezone: 'Africa/Dakar' },
  {
    code: 'CI',
    name: 'Côte d’Ivoire',
    dialCode: '+225',
    currency: 'XOF',
    timezone: 'Africa/Abidjan',
  },
  { code: 'ML', name: 'Mali', dialCode: '+223', currency: 'XOF', timezone: 'Africa/Bamako' },
  {
    code: 'BF',
    name: 'Burkina Faso',
    dialCode: '+226',
    currency: 'XOF',
    timezone: 'Africa/Ouagadougou',
  },
  { code: 'BJ', name: 'Bénin', dialCode: '+229', currency: 'XOF', timezone: 'Africa/Porto-Novo' },
  { code: 'TG', name: 'Togo', dialCode: '+228', currency: 'XOF', timezone: 'Africa/Lome' },
  { code: 'NE', name: 'Niger', dialCode: '+227', currency: 'XOF', timezone: 'Africa/Niamey' },
  { code: 'GN', name: 'Guinée', dialCode: '+224', currency: 'GNF', timezone: 'Africa/Conakry' },
  { code: 'CM', name: 'Cameroun', dialCode: '+237', currency: 'XAF', timezone: 'Africa/Douala' },
  { code: 'FR', name: 'France', dialCode: '+33', currency: 'EUR', timezone: 'Europe/Paris' },
];

export function findCountry(code: string): Country | undefined {
  return COUNTRIES.find((country) => country.code === code);
}

export const SECTORS = [
  'E-commerce',
  'Logiciel et SaaS',
  'Commerce de détail',
  'Éducation',
  'Santé',
  'Transport et logistique',
  'Restauration et hôtellerie',
  'Services financiers',
  'Association ou ONG',
  'Autre',
];

export const COMPANY_SIZES: { value: CompanySize; label: string }[] = [
  { value: '1-10', label: '1 à 10 personnes' },
  { value: '11-50', label: '11 à 50 personnes' },
  { value: '51-200', label: '51 à 200 personnes' },
  { value: '201-500', label: '201 à 500 personnes' },
  { value: '500+', label: 'Plus de 500 personnes' },
];

export const CURRENCIES = [
  { code: 'XOF', label: 'Franc CFA BCEAO (XOF)' },
  { code: 'XAF', label: 'Franc CFA BEAC (XAF)' },
  { code: 'GNF', label: 'Franc guinéen (GNF)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'USD', label: 'Dollar américain (USD)' },
];

export const TIMEZONES = [...new Set(COUNTRIES.map((country) => country.timezone)), 'UTC'].map(
  (zone) => ({ value: zone, label: zone.replace('_', ' ') }),
);

export const LANGUAGES: { value: Preferences['language']; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
];

/** Préférences proposées pour un pays donné. */
export function defaultPreferences(countryCode: string): Preferences {
  const country = findCountry(countryCode) ?? COUNTRIES[0]!;
  return {
    currency: country.currency,
    timezone: country.timezone,
    language: 'fr',
    notifications: {
      paymentSucceeded: true,
      paymentFailed: true,
      refunds: true,
      providerIssues: true,
      weeklySummary: false,
    },
  };
}

/* ---------- Prestataires ---------- */

export type CredentialField = {
  key: string;
  label: string;
  hint?: string;
  required: boolean;
  /** Valeur secrète : saisie masquée. */
  secret: boolean;
};

export type ProviderDefinition = {
  id: PaymentProvider;
  name: string;
  description: string;
  /** Autorisation directe (type OAuth) proposée par le prestataire. */
  directAuthorization: { available: false; reason: string } | { available: true };
  credentialFields: CredentialField[];
  webhookSecret: { label: string; hint: string };
  setupSteps: string[];
};

/**
 * Champs alignés sur les identifiants attendus par le backend
 * (WaveCredentials / OrangeMoneyCredentials).
 */
export const PROVIDERS: ProviderDefinition[] = [
  {
    id: 'WAVE',
    name: 'Wave Business',
    description: 'Encaissements par lien et QR code, remboursements et versements.',
    directAuthorization: {
      available: false,
      reason:
        'Wave ne propose pas d’autorisation directe pour les comptes marchands. La connexion se fait avec les clés API de votre espace Wave Business.',
    },
    credentialFields: [
      {
        key: 'checkoutApiKey',
        label: 'Clé API Checkout',
        hint: 'Obligatoire. Elle permet de créer les paiements.',
        required: true,
        secret: true,
      },
      {
        key: 'payoutApiKey',
        label: 'Clé API Payout',
        hint: 'Facultative. Nécessaire pour les remboursements et versements.',
        required: false,
        secret: true,
      },
      {
        key: 'balanceApiKey',
        label: 'Clé API Balance',
        hint: 'Facultative. Permet d’afficher le solde du compte.',
        required: false,
        secret: true,
      },
    ],
    webhookSecret: {
      label: 'Secret de signature des webhooks',
      hint: 'Fourni par Wave lorsque vous déclarez l’URL de notification.',
    },
    setupSteps: [
      'Ouvrez votre espace Wave Business, section développeurs.',
      'Créez une clé API avec les droits nécessaires (Checkout, et si besoin Payout et Balance).',
      'Collez les clés ci-dessous. Elles sont chiffrées avant d’être enregistrées.',
      'Déclarez chez Wave l’URL de notification que Paylance vous fournira.',
    ],
  },
  {
    id: 'ORANGE_MONEY',
    name: 'Orange Money',
    description: 'Paiements marchands Orange Money par QR code et code de paiement.',
    directAuthorization: {
      available: false,
      reason:
        'Orange Money ne propose pas d’autorisation directe. La connexion utilise les identifiants API fournis par Orange pour votre compte marchand.',
    },
    credentialFields: [
      { key: 'clientId', label: 'Client ID', required: true, secret: false },
      { key: 'clientSecret', label: 'Client secret', required: true, secret: true },
      {
        key: 'merchantCode',
        label: 'Code marchand',
        hint: 'Le code de votre compte marchand Orange Money.',
        required: true,
        secret: false,
      },
      {
        key: 'merchantName',
        label: 'Nom du marchand',
        hint: 'Facultatif. Affiché au client lors du paiement.',
        required: false,
        secret: false,
      },
    ],
    webhookSecret: {
      label: 'Clé de notification',
      hint: 'La clé que vous choisissez et déclarez à Orange pour signer les notifications.',
    },
    setupSteps: [
      'Récupérez auprès d’Orange les identifiants API (Client ID et Client secret) de votre compte marchand.',
      'Munissez-vous de votre code marchand.',
      'Collez ces informations ci-dessous. Elles sont chiffrées avant d’être enregistrées.',
      'Déclarez chez Orange l’URL de notification que Paylance vous fournira.',
    ],
  },
];

export function findProvider(id: PaymentProvider): ProviderDefinition {
  const provider = PROVIDERS.find((item) => item.id === id);
  if (!provider) throw new Error(`Prestataire inconnu : ${id}`);
  return provider;
}
