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

  constructor(
    kind: ApiErrorKind,
    message: string,
    options: {
      status?: number | null;
      details?: string[] | null;
      correlationId?: string | null;
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.kind = kind;
    this.status = options.status ?? null;
    this.details = options.details ?? [];
    this.correlationId = options.correlationId ?? null;
  }

  static fromResponse(status: number, body: ErrorResponseBody | null): ApiError {
    return new ApiError('http', body?.message || `Réponse HTTP ${status}`, {
      status,
      details: body?.details,
      correlationId: body?.correlationId,
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

/** Message affichable pour n'importe quelle erreur levée par un appel API. */
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
        if (error.status === 401) return 'Votre session a expiré. Reconnectez-vous.';
        if (error.status === 403)
          return 'Vous n’avez pas les droits nécessaires pour cette action.';
        if (error.status !== null && error.status >= 500) {
          return 'Une erreur est survenue sur le serveur. Réessayez dans un instant.';
        }
        return error.message;
    }
  }
  return 'Une erreur inattendue est survenue. Réessayez.';
}
