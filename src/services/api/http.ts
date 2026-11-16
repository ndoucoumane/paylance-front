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
};

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
    throw ApiError.fromResponse(response.status, data as ErrorResponseBody | null);
  }
  return data as T;
}
