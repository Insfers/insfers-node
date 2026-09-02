/**
 * Configuration options for initializing the Insfers SDK client.
 */
export interface InsfersConfig {
  /**
   * Your Insfers merchant API key ('sk_test_...' or 'sk_live_...').
   */
  apiKey?: string;

  /**
   * The base URL for the Insfers API.
   * Defaults to 'https://api.insfers.com'.
   */
  baseUrl?: string;

  /**
   * Maximum request timeout in milliseconds.
   * Defaults to 60,000ms (60 seconds).
   */
  timeout?: number;

  /**
   * Maximum number of automatic retries on transient network errors, rate limits, and 5xx server errors.
   * Defaults to 2.
   */
  maxRetries?: number;

  /**
   * API version header sent on all requests.
   * Defaults to '1.0'.
   */
  version?: string;

  /**
   * Additional custom headers attached to every outgoing HTTP request.
   */
  headers?: Record<string, string>;
}

/**
 * Per-request options to customize timeouts, idempotency, or cancellation.
 */
export interface RequestOptions {
  /**
   * Unique idempotency key to prevent duplicate charges or payouts on mutating operations.
   */
  idempotencyKey?: string;

  /**
   * Override timeout in milliseconds for this specific request.
   */
  timeout?: number;

  /**
   * Standard AbortSignal for request cancellation.
   */
  signal?: AbortSignal;

  /**
   * Extra custom HTTP headers for this specific request.
   */
  headers?: Record<string, string>;
}

/**
 * Standard query parameters for paginated list endpoints.
 */
export interface ListQuery {
  /**
   * Number of items to return (1 to 200). Default is 50.
   */
  limit?: number;

  /**
   * Number of items to skip. Default is 0.
   */
  offset?: number;
}

/**
 * Standard normalized pagination envelope.
 */
export interface PaginatedList<T> {
  /**
   * Array of resource items in the current page.
   */
  data: T[];

  /**
   * Total count of items matching the query.
   */
  total: number;

  /**
   * Whether more items are available on subsequent pages.
   */
  hasMore: boolean;
}

/**
 * Standard structured API error response envelope from the Insfers API.
 */
export interface ApiErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    param?: string;
    actionable_recovery?: string;
    [key: string]: unknown;
  };
  message?: string | string[];
  statusCode?: number;
}
