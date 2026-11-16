import { z } from 'zod';
import {
  COMPANY_SIZES,
  COUNTRIES,
  CURRENCIES,
  LANGUAGES,
  SECTORS,
  TIMEZONES,
} from './referenceData';

/** Schémas de validation des formulaires (messages en français). */

export const PASSWORD_RULES = [
  { id: 'length', label: 'Au moins 10 caractères', test: (v: string) => v.length >= 10 },
  { id: 'lower', label: 'Une lettre minuscule', test: (v: string) => /[a-z]/.test(v) },
  { id: 'upper', label: 'Une lettre majuscule', test: (v: string) => /[A-Z]/.test(v) },
  { id: 'digit', label: 'Un chiffre', test: (v: string) => /\d/.test(v) },
] as const;

const email = z
  .string()
  .trim()
  .min(1, 'Saisissez votre adresse e-mail.')
  .email('Adresse e-mail invalide.')
  .max(200, 'Adresse e-mail trop longue.');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Saisissez votre mot de passe.'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Saisissez votre prénom.').max(80, 'Prénom trop long.'),
    lastName: z.string().trim().min(1, 'Saisissez votre nom.').max(80, 'Nom trop long.'),
    email,
    password: z
      .string()
      .max(128, 'Mot de passe trop long.')
      .refine((value) => PASSWORD_RULES.every((rule) => rule.test(value)), {
        message: 'Le mot de passe ne respecte pas toutes les règles.',
      }),
    confirmPassword: z.string().min(1, 'Confirmez votre mot de passe.'),
    acceptTerms: z.boolean().refine((value) => value, {
      message: 'Vous devez accepter les conditions pour créer un compte.',
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Les deux mots de passe ne correspondent pas.',
  });
export type RegisterValues = z.infer<typeof registerSchema>;

/** « +221 77 123 45 67 » → « +221771234567 » */
export function normalizePhone(value: string): string {
  return value.replace(/[\s.\-()]/g, '');
}

/** « exemple.sn » → « https://exemple.sn » */
export function normalizeWebsite(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const inList = (values: string[], message: string) =>
  z.string().refine((value) => values.includes(value), { message });

export const companySchema = z.object({
  tradeName: z.string().trim().min(2, 'Saisissez le nom commercial.').max(150, 'Nom trop long.'),
  legalName: z.string().trim().min(2, 'Saisissez la raison sociale.').max(150, 'Nom trop long.'),
  country: inList(
    COUNTRIES.map((c) => c.code),
    'Choisissez un pays.',
  ),
  sector: inList(SECTORS, 'Choisissez un secteur d’activité.'),
  phone: z.string().refine((value) => /^\+\d{8,15}$/.test(normalizePhone(value)), {
    message: 'Numéro invalide. Format attendu : indicatif puis numéro, ex. +221 77 123 45 67.',
  }),
  website: z
    .string()
    .trim()
    .max(200, 'Adresse trop longue.')
    .refine(
      (value) => {
        const url = normalizeWebsite(value);
        if (!url) return true;
        try {
          return new URL(url).hostname.includes('.');
        } catch {
          return false;
        }
      },
      { message: 'Adresse de site invalide, ex. www.exemple.sn' },
    ),
  size: inList(
    COMPANY_SIZES.map((s) => s.value),
    'Choisissez la taille de l’entreprise.',
  ),
});
export type CompanyValues = z.infer<typeof companySchema>;

export const preferencesSchema = z.object({
  currency: inList(
    CURRENCIES.map((c) => c.code),
    'Choisissez une devise.',
  ),
  timezone: inList(
    TIMEZONES.map((t) => t.value),
    'Choisissez un fuseau horaire.',
  ),
  language: z
    .enum(['fr', 'en'], { message: 'Choisissez une langue.' })
    .refine((value) => LANGUAGES.some((l) => l.value === value)),
  notifications: z.object({
    paymentSucceeded: z.boolean(),
    paymentFailed: z.boolean(),
    refunds: z.boolean(),
    providerIssues: z.boolean(),
    weeklySummary: z.boolean(),
  }),
});
export type PreferencesValues = z.infer<typeof preferencesSchema>;
