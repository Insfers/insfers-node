/**
 * Base error class for all exceptions thrown by the Insfers SDK.
 */
export class InsfersError extends Error {
  readonly statusCode?: number;
  readonly code?: string;
  readonly param?: string;
  readonly rawBody?: unknown;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      code?: string;
      param?: string;
      rawBody?: unknown;
    },
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = options?.statusCode;
    this.code = options?.code;
    this.param = options?.param;
    this.rawBody = options?.rawBody;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * 401 Unauthorized: Invalid, expired, or missing API key.
 */
export class AuthenticationError extends InsfersError {
  constructor(message = 'Invalid or revoked API key.', options?: { rawBody?: unknown }) {
    super(message, { statusCode: 401, code: 'authentication_error', ...options });
  }
}

/**
 * 403 Forbidden: Request blocked by security controls or sanctions screening.
 */
export class PermissionError extends InsfersError {
  constructor(message = 'Access denied by permissions or security screening.', options?: { rawBody?: unknown }) {
    super(message, { statusCode: 403, code: 'permission_error', ...options });
  }
}

/**
 * 400 Bad Request: Missing required parameters, invalid formats, or validation failure.
 */
export class InvalidRequestError extends InsfersError {
  constructor(message: string, options?: { code?: string; param?: string; rawBody?: unknown }) {
    super(message, { statusCode: 400, code: options?.code || 'invalid_request_error', ...options });
  }
}

/**
 * 404 Not Found: Requested resource or identifier does not exist.
 */
export class NotFoundError extends InsfersError {
  constructor(message = 'Requested resource not found.', options?: { rawBody?: unknown }) {
    super(message, { statusCode: 404, code: 'not_found', ...options });
  }
}

/**
 * 409 Conflict: Idempotency payload mismatch or state conflict.
 */
export class ConflictError extends InsfersError {
  constructor(
    message = 'Request conflicted with existing resource state or idempotency key.',
    options?: { code?: string; param?: string; rawBody?: unknown },
  ) {
    super(message, { statusCode: 409, code: options?.code || 'idempotency_conflict', ...options });
  }
}

/**
 * 429 Too Many Requests: Rate limit exceeded.
 */
export class RateLimitError extends InsfersError {
  readonly retryAfter?: number;

  constructor(
    message = 'Too many requests. Rate limit exceeded.',
    options?: { retryAfter?: number; rawBody?: unknown },
  ) {
    super(message, { statusCode: 429, code: 'rate_limit_exceeded', rawBody: options?.rawBody });
    this.retryAfter = options?.retryAfter;
  }
}

/**
 * Network disruption, DNS failure, connection timeout, or aborted fetch.
 */
export class APIConnectionError extends InsfersError {
  constructor(message: string, options?: { code?: string; rawBody?: unknown }) {
    super(message, { code: options?.code || 'api_connection_error', ...options });
  }
}

/**
 * 500 / 502 / 503 / 504: Server-side internal execution failure.
 */
export class InternalServerError extends InsfersError {
  constructor(message = 'An internal server error occurred on the Insfers platform.', options?: { statusCode?: number; rawBody?: unknown }) {
    super(message, { statusCode: options?.statusCode || 500, code: 'internal_server_error', ...options });
  }
}
