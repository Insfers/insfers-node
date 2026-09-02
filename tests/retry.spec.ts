import { HttpClient } from '../src/http';
import { RateLimitError, InvalidRequestError } from '../src/errors';

describe('HttpClient Retry & Backoff Logic', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('retries on 500 internal server error and recovers on next attempt', async () => {
    let callCount = 0;

    globalThis.fetch = jest.fn().mockImplementation(async () => {
      callCount += 1;
      if (callCount === 1) {
        return new Response(JSON.stringify({ error: { message: 'Server rebooting' } }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ id: 'pay_999', status: 'SETTLED' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const http = new HttpClient('sk_test_123456', { maxRetries: 2 });
    const result = await http.request<{ id: string }>('/payments/pay_999');

    expect(callCount).toBe(2);
    expect(result.id).toBe('pay_999');
  });

  it('does NOT retry on 400 Bad Request client errors', async () => {
    let callCount = 0;

    globalThis.fetch = jest.fn().mockImplementation(async () => {
      callCount += 1;
      return new Response(JSON.stringify({ error: { message: 'Invalid address', code: 'bad_request' } }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const http = new HttpClient('sk_test_123456', { maxRetries: 2 });
    await expect(http.request('/payments')).rejects.toThrow(InvalidRequestError);
    expect(callCount).toBe(1); // Never retried
  });

  it('throws RateLimitError after exhausting retries on 429', async () => {
    let callCount = 0;

    globalThis.fetch = jest.fn().mockImplementation(async () => {
      callCount += 1;
      return new Response(JSON.stringify({ error: { message: 'Rate limit exceeded' } }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'retry-after': '0' },
      });
    });

    const http = new HttpClient('sk_test_123456', { maxRetries: 1 });
    await expect(http.request('/payments')).rejects.toThrow(RateLimitError);
    expect(callCount).toBe(2); // 1 initial + 1 retry
  });
});
