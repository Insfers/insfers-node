import {
  InsfersError,
  AuthenticationError,
  PermissionError,
  InvalidRequestError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  APIConnectionError,
  InternalServerError,
} from './errors';
import type { InsfersConfig, RequestOptions, ApiErrorEnvelope, PaginatedList, ListQuery } from './types/common';

const DEFAULT_BASE_URL = 'https://api.insfers.com';
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_VERSION = '1.0';

export interface HttpRequestOptions extends RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, unknown>;
}

export class HttpClient {
  readonly baseUrl: string;
  readonly timeout: number;
  readonly maxRetries: number;
  readonly version: string;
  readonly defaultHeaders: Record<string, string>;
  private readonly apiKey: string;

  constructor(apiKey: string, config: InsfersConfig = {}) {
    this.apiKey = apiKey;
    this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.version = config.version || DEFAULT_VERSION;
    this.defaultHeaders = config.headers || {};
  }

  /**
   * Dispatches an HTTP request with automated retries, jittered backoff, and idempotency protection.
   */
  async request<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
    const res = await this.requestRaw(path, options);
    const contentType = res.headers.get('content-type') || '';

    if (!res.ok) {
      const errorBody = contentType.includes('application/json')
        ? ((await res.json()) as ApiErrorEnvelope)
        : await res.text();

      throw this.buildTypedError(res.status, errorBody, res.headers);
    }

    if (res.status === 204) {
      return {} as T;
    }

    if (contentType.includes('application/json')) {
      return (await res.json()) as T;
    }

    return (await res.text()) as unknown as T;
  }

  /**
   * Dispatches an HTTP request and parses paginated responses into a normalized envelope.
   */
  async requestList<T>(path: string, query: ListQuery = {}, options: RequestOptions = {}): Promise<PaginatedList<T>> {
    const res = await this.requestRaw(path, {
      method: 'GET',
      query: { ...query },
      ...options,
    });

    if (!res.ok) {
      const errorBody = (await res.json()) as ApiErrorEnvelope;
      throw this.buildTypedError(res.status, errorBody, res.headers);
    }

    const data = (await res.json()) as T[];
    const totalHeader = res.headers.get('x-total-count');
    const total = totalHeader ? parseInt(totalHeader, 10) : data.length;
    const offset = query.offset ?? 0;
    const hasMore = offset + data.length < total;

    return {
      data: Array.isArray(data) ? data : [],
      total,
      hasMore,
    };
  }

  /**
   * Dispatches raw fetch request handling backoff, timeout signals, and retry loops.
   */
  async requestRaw(path: string, options: HttpRequestOptions = {}): Promise<Response> {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${cleanPath}`);

    if (options.query) {
      for (const [k, v] of Object.entries(options.query)) {
        if (v !== undefined && v !== null) {
          url.searchParams.set(k, String(v));
        }
      }
    }

    // Preserve the idempotency key across all retries of this specific invocation
    const idempotencyKey =
      options.idempotencyKey ||
      (options.method && options.method !== 'GET' && options.method !== 'DELETE'
        ? `ik_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
        : undefined);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Insfers-Version': this.version,
      'User-Agent': '@insfers/sdk-node/1.0.0',
      ...this.defaultHeaders,
      ...options.headers,
    };

    if (options.body !== undefined && options.body !== null) {
      headers['Content-Type'] = 'application/json';
    }

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const requestTimeout = options.timeout ?? this.timeout;
    let attempt = 0;

    while (true) {
      attempt += 1;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

      const signal = options.signal
        ? this.combineSignals(controller.signal, options.signal)
        : controller.signal;

      try {
        const response = await fetch(url.toString(), {
          method: options.method || 'GET',
          headers,
          body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
          signal,
        });

        clearTimeout(timeoutId);

        // Check if status is retriable
        if (this.shouldRetryStatus(response.status) && attempt <= this.maxRetries) {
          const retryAfterSec = this.parseRetryAfter(response.headers.get('retry-after'));
          await this.sleepWithJitter(attempt, retryAfterSec);
          continue;
        }

        // Check for in-flight idempotency collision (transient retry)
        if (response.status === 409 && attempt <= this.maxRetries) {
          try {
            const cloned = response.clone();
            const body = (await cloned.json()) as ApiErrorEnvelope;
            if (body.error?.code === 'idempotency_in_flight') {
              await this.sleepWithJitter(attempt);
              continue;
            }
          } catch {
            // Ignore parse errors on check
          }
        }

        return response;
      } catch (err: any) {
        clearTimeout(timeoutId);

        const isAbort = err?.name === 'AbortError' || err?.name === 'TimeoutError';
        const isNetwork =
          err instanceof TypeError ||
          err?.code === 'ECONNRESET' ||
          err?.code === 'ETIMEDOUT' ||
          err?.code === 'ENOTFOUND';

        if ((isAbort || isNetwork) && attempt <= this.maxRetries) {
          await this.sleepWithJitter(attempt);
          continue;
        }

        throw new APIConnectionError(
          `Failed to communicate with Insfers API at ${url.origin}: ${err?.message || 'Network error'}`,
          { rawBody: err },
        );
      }
    }
  }

  private shouldRetryStatus(status: number): boolean {
    return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
  }

  private parseRetryAfter(header: string | null): number | undefined {
    if (!header) return undefined;
    const num = parseInt(header, 10);
    return isNaN(num) ? undefined : Math.min(num, 60); // Cap at 60s
  }

  private async sleepWithJitter(attempt: number, explicitDelaySeconds?: number): Promise<void> {
    if (explicitDelaySeconds !== undefined) {
      await new Promise((r) => setTimeout(r, explicitDelaySeconds * 1000));
      return;
    }
    const baseDelayMs = 400;
    const maxDelayMs = 8000;
    const exponential = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
    const jitter = 0.5 + 0.5 * Math.random();
    const delay = Math.floor(exponential * jitter);
    await new Promise((r) => setTimeout(r, delay));
  }

  private combineSignals(s1: AbortSignal, s2: AbortSignal): AbortSignal {
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    s1.addEventListener('abort', onAbort, { once: true });
    s2.addEventListener('abort', onAbort, { once: true });
    return controller.signal;
  }

  buildTypedError(status: number, errorBody: unknown, headers: Headers): InsfersError {
    const envelope = typeof errorBody === 'object' && errorBody !== null ? (errorBody as ApiErrorEnvelope) : {};
    const errorObj = envelope.error;

    let message =
      errorObj?.message ||
      (Array.isArray(envelope.message) ? envelope.message.join(', ') : envelope.message) ||
      (typeof errorBody === 'string' ? errorBody : `API request failed with HTTP ${status}`);

    // Mask any accidental API key echoes in error messages
    message = message.replace(/sk_(test|live)_[a-zA-Z0-9_-]{10,}/g, 'sk_$1_***REDACTED***');

    const code = errorObj?.code;
    const param = errorObj?.param;

    switch (status) {
      case 401:
        return new AuthenticationError(message, { rawBody: errorBody });
      case 403:
        return new PermissionError(message, { rawBody: errorBody });
      case 400:
      case 422:
        return new InvalidRequestError(message, { code, param, rawBody: errorBody });
      case 404:
        return new NotFoundError(message, { rawBody: errorBody });
      case 409:
        return new ConflictError(message, { code, param, rawBody: errorBody });
      case 429: {
        const retryAfter = this.parseRetryAfter(headers.get('retry-after'));
        return new RateLimitError(message, { retryAfter, rawBody: errorBody });
      }
      default:
        return new InternalServerError(message, { statusCode: status, rawBody: errorBody });
    }
  }
}
