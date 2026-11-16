import { z } from 'zod';
import { fr, type Content } from '../content/fr';

/**
 * Numéro sénégalais : +221 suivi de 9 chiffres.
 * Préfixes acceptés : mobiles 70, 75, 76, 77, 78 et fixes 33.
 */
export const SENEGAL_PHONE_REGEX = /^\+221(70|75|76|77|78|33)\d{7}$/;

/** « +221 77 123 45 67 » → « +221771234567 » */
export function normalizePhone(value: string): string {
  return value.replace(/[\s.\-()]/g, '');
}

const valuesOf = (options: readonly { value: string }[]) => options.map((option) => option.value);

const oneOf = (values: readonly string[], message: string) =>
  z.string().refine((value) => values.includes(value), { message });

/** Fabrique du schéma : reçoit le contenu traduit pour produire des messages dans la bonne langue. */
export function createLeadSchema(t: Content['contact']) {
  const e = t.errors;
  return z.object({
    name: z.string().trim().min(2, e.nameRequired).max(120, e.tooLong),
    company: z.string().trim().min(2, e.companyRequired).max(160, e.tooLong),
    email: z.string().trim().email(e.emailInvalid).max(200, e.tooLong),
    phone: z
      .string()
      .refine((value) => SENEGAL_PHONE_REGEX.test(normalizePhone(value)), e.phoneInvalid),
    sector: oneOf(valuesOf(t.sectors), e.sectorRequired),
    volume: oneOf(valuesOf(t.volumes), e.volumeRequired),
    subject: oneOf(valuesOf(t.subjects), e.subjectRequired),
    message: z.string().trim().max(2000, e.tooLong),
  });
}

export const leadSchema = createLeadSchema(fr.contact);

export type LeadFormValues = z.infer<typeof leadSchema>;

export const SUBJECT_VALUES = valuesOf(fr.contact.subjects);

export function isSubject(value: string): boolean {
  return SUBJECT_VALUES.includes(value);
}
