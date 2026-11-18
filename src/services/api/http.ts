import { env } from '../../config/env';
import { ApiError, type ErrorResponseBody } from './errors';

const REQUEST_TIMEOUT_MS = 15_000;

/** En-tête attendu par le backend pour choisir l'organisation (OrganizationAccess.HEADER). */
export const ORGANIZATION_HEADER = 'X-Organization-Id';

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Jeton Bearer (JWT Keycloak). */
  token?: string;
  organizationId?: string;
  /**
   * Clé d'idempotence (en-tête `Idempotency-Key`) des créations sensibles : paiement,
   * remboursement, programmation. Réutilisée telle quelle si l'utilisateur relance après une
   * erreur réseau, pour que le serveur ne crée pas l'opération deux fois.
   */
  idempotencyKey?: string;
};

/** `Retry-After` en secondes (forme numérique ou date HTTP). */
function retryAfterOf(response: Response): number | null {
  const value = response.headers.get('Retry-After');
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, Math.ceil(seconds));
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, Math.ceil((date - Date.now()) / 1_000));
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/**
 * Appel JSON vers l'API Paylance. Lève toujours une `ApiError`
 * (réseau, délai dépassé ou réponse non 2xx avec le corps `ErrorResponse`).
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!env.apiUrl) {
    throw new ApiError('network', 'VITE_API_URL n’est pas configuré.');
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.organizationId) headers[ORGANIZATION_HEADER] = options.organizationId;
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${env.apiUrl}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === 'AbortError';
    throw new ApiError(aborted ? 'timeout' : 'network', 'Échec de la requête', { cause: error });
  } finally {
    window.clearTimeout(timer);
  }

  const data = await readJson(response);
  if (!response.ok) {
    throw ApiError.fromResponse(
      response.status,
      data as ErrorResponseBody | null,
      retryAfterOf(response),
    );
  }
  return data as T;
}
