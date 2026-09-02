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
} from '../src/errors';
import { HttpClient } from '../src/http';

describe('Insfers Error Hierarchy', () => {
  it('instantiates all error subclasses correctly', () => {
    expect(new AuthenticationError()).toBeInstanceOf(InsfersError);
    expect(new PermissionError()).toBeInstanceOf(InsfersError);
    expect(new InvalidRequestError('bad input')).toBeInstanceOf(InsfersError);
    expect(new NotFoundError()).toBeInstanceOf(InsfersError);
    expect(new ConflictError()).toBeInstanceOf(InsfersError);
    expect(new RateLimitError('rate limit', { retryAfter: 30 })).toBeInstanceOf(InsfersError);
    expect(new APIConnectionError('net drop')).toBeInstanceOf(InsfersError);
    expect(new InternalServerError()).toBeInstanceOf(InsfersError);
  });

  it('masks sensitive API keys in error messages', () => {
    const http = new HttpClient('sk_test_secret123456');
    const headers = new Headers();
    const error = http.buildTypedError(
      400,
      {
        error: {
          message: 'Error with key sk_test_secret1234567890abcdef in request',
          code: 'invalid_request',
        },
      },
      headers,
    );

    expect(error.message).toContain('sk_test_***REDACTED***');
    expect(error.message).not.toContain('sk_test_secret1234567890abcdef');
  });

  it('correctly maps HTTP status codes to typed error subclasses', () => {
    const http = new HttpClient('sk_test_123456');
    const headers = new Headers({ 'retry-after': '45' });

    expect(http.buildTypedError(401, {}, headers)).toBeInstanceOf(AuthenticationError);
    expect(http.buildTypedError(403, {}, headers)).toBeInstanceOf(PermissionError);
    expect(http.buildTypedError(400, {}, headers)).toBeInstanceOf(InvalidRequestError);
    expect(http.buildTypedError(404, {}, headers)).toBeInstanceOf(NotFoundError);
    expect(http.buildTypedError(409, {}, headers)).toBeInstanceOf(ConflictError);

    const rateLimit = http.buildTypedError(429, {}, headers);
    expect(rateLimit).toBeInstanceOf(RateLimitError);
    expect((rateLimit as RateLimitError).retryAfter).toBe(45);

    expect(http.buildTypedError(500, {}, headers)).toBeInstanceOf(InternalServerError);
  });
});
