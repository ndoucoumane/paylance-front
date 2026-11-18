/** Corps d'erreur renvoyé par le backend (record Java `ErrorResponse`). */
export type ErrorResponseBody = {
  timestamp?: string;
  status: number;
  error?: string;
  message?: string;
  path?: string;
  correlationId?: string | null;
  details?: string[] | null;
};

export type ApiErrorKind =
  /** Pas de réponse : hors ligne, DNS, CORS… */
  | 'network'
  | 'timeout'
  /** Réponse HTTP non 2xx. */
  | 'http'
  /** La fonctionnalité n'a pas encore d'endpoint côté backend. */
  | 'not-available';

/** Erreur unique pour tous les appels API : les écrans n'ont qu'un type à gérer. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly details: string[];
  readonly correlationId: string | null;
  /** `message` du corps `ErrorResponse`, rédigé par le serveur pour l'utilisateur. */
  readonly serverMessage: string | null;
  /** En-tête `Retry-After` (secondes), sur un `429`. */
  readonly retryAfter: number | null;

  constructor(
    kind: ApiErrorKind,
    message: string,
    options: {
      status?: number | null;
      details?: string[] | null;
      correlationId?: string | null;
      serverMessage?: string | null;
      retryAfter?: number | null;
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.kind = kind;
    this.status = options.status ?? null;
    this.details = options.details ?? [];
    this.correlationId = options.correlationId ?? null;
    // Une erreur HTTP construite à la main (démo, garde locale) porte un message affichable.
    this.serverMessage =
      'serverMessage' in options
        ? (options.serverMessage ?? null)
        : kind === 'http'
          ? message
          : null;
    this.retryAfter = options.retryAfter ?? null;
  }

  static fromResponse(
    status: number,
    body: ErrorResponseBody | null,
    retryAfter: number | null = null,
  ): ApiError {
    const serverMessage = body?.message?.trim() || null;
    return new ApiError('http', serverMessage ?? `Réponse HTTP ${status}`, {
      status,
      details: body?.details,
      correlationId: body?.correlationId,
      serverMessage,
      retryAfter,
    });
  }

  /** Appel vers une fonctionnalité dont l'endpoint backend n'existe pas encore. */
  static notAvailable(feature: string): ApiError {
    return new ApiError(
      'not-available',
      `${feature} : cette fonctionnalité n’est pas encore disponible sur le serveur Paylance.`,
    );
  }
}

/**
 * Message affichable pour n'importe quelle erreur levée par un appel API.
 * Le serveur fait foi : son `message` est affiché tel quel, quel que soit le statut.
 * Les textes ci-dessous ne servent que lorsqu'il n'en fournit pas.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.kind) {
      case 'network':
        return 'Connexion au serveur impossible. Vérifiez votre connexion internet puis réessayez.';
      case 'timeout':
        return 'Le serveur met trop de temps à répondre. Réessayez dans un instant.';
      case 'not-available':
        return error.message;
      case 'http':
        if (error.serverMessage) return error.serverMessage;
        if (error.status === 401) return 'Votre session a expiré. Reconnectez-vous.';
        if (error.status === 403)
          return 'Vous n’avez pas les droits nécessaires pour cette action.';
        if (error.status === 429) {
          return error.retryAfter
            ? `Trop de tentatives. Réessayez dans ${error.retryAfter} s.`
            : 'Trop de tentatives. Réessayez dans un instant.';
        }
        if (error.status !== null && error.status >= 500) {
          return 'Une erreur est survenue sur le serveur. Réessayez dans un instant.';
        }
        return error.message;
    }
  }
  return 'Une erreur inattendue est survenue. Réessayez.';
}
