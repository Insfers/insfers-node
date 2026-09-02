import { HttpClient } from '../src/http';

describe('HttpClient Idempotency & Headers', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('automatically adds Idempotency-Key on mutating POST requests', async () => {
    let capturedHeaders: Headers | undefined;

    globalThis.fetch = jest.fn().mockImplementation(async (_url, init) => {
      capturedHeaders = new Headers(init.headers);
      return new Response(JSON.stringify({ id: 'pay_123', status: 'SETTLED' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const http = new HttpClient('sk_test_123456');
    await http.request('/payments', {
      method: 'POST',
      body: { amount: 100, destination: '0x123' },
    });

    expect(capturedHeaders).toBeDefined();
    expect(capturedHeaders?.get('Idempotency-Key')).toMatch(/^ik_\d+_/);
    expect(capturedHeaders?.get('Authorization')).toBe('Bearer sk_test_123456');
    expect(capturedHeaders?.get('Insfers-Version')).toBe('1.0');
  });

  it('uses developer-supplied idempotencyKey when explicitly provided', async () => {
    let capturedHeaders: Headers | undefined;

    globalThis.fetch = jest.fn().mockImplementation(async (_url, init) => {
      capturedHeaders = new Headers(init.headers);
      return new Response(JSON.stringify({ id: 'pay_123' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const http = new HttpClient('sk_test_123456');
    await http.request('/payments', {
      method: 'POST',
      body: { amount: 100 },
      idempotencyKey: 'custom_order_9988',
    });

    expect(capturedHeaders?.get('Idempotency-Key')).toBe('custom_order_9988');
  });
});
