import { env } from '../config/env';
import { normalizePhone, type LeadFormValues } from './leadSchema';

const REQUEST_TIMEOUT_MS = 15_000;

/** Corps envoyé à POST /api/v1/public/leads. */
export type LeadPayload = {
  name: string;
  company: string;
  email: string;
  /** Format E.164, ex. +221771234567 */
  phone: string;
  sector: string;
  monthlyVolume: string;
  subject: string;
  message?: string;
  locale: 'fr';
  source: 'landing';
};

export class LeadSubmissionError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'LeadSubmissionError';
  }
}

function toPayload(values: LeadFormValues): LeadPayload {
  return {
    name: values.name,
    company: values.company,
    email: values.email,
    phone: normalizePhone(values.phone),
    sector: values.sector,
    monthlyVolume: values.volume,
    subject: values.subject,
    message: values.message || undefined,
    locale: 'fr',
    source: 'landing',
  };
}

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const leadService = {
  /**
   * Envoie une demande de contact / d'accès anticipé.
   * Lève une `LeadSubmissionError` en cas d'échec réseau ou de réponse non 2xx.
   */
  async submit(values: LeadFormValues): Promise<void> {
    const payload = toPayload(values);

    if (!env.apiUrl) {
      // TODO(api) : simulation tant que VITE_API_URL n'est pas défini.
      // Supprimer cette branche dès que l'endpoint POST /api/v1/public/leads est déployé.
      console.warn(
        '[leadService] VITE_API_URL absent : envoi simulé, aucune donnée transmise.',
        import.meta.env.DEV ? payload : '',
      );
      await wait(800);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${env.apiUrl}/api/v1/public/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (error) {
      throw new LeadSubmissionError('Échec réseau', { cause: error });
    } finally {
      window.clearTimeout(timer);
    }

    if (!response.ok) {
      throw new LeadSubmissionError(`Réponse HTTP ${response.status}`);
    }
  },
};
