import { Insfers } from '../src/client';
import { AuthenticationError, InvalidRequestError } from '../src/errors';

describe('Insfers Client Initialization', () => {
  it('initializes successfully with valid test API key', () => {
    const client = new Insfers('sk_test_1234567890abcdef123456');
    expect(client).toBeInstanceOf(Insfers);
    expect(client.payments).toBeDefined();
    expect(client.paymentLinks).toBeDefined();
    expect(client.customers).toBeDefined();
    expect(client.invoices).toBeDefined();
    expect(client.payouts).toBeDefined();
    expect(client.balances).toBeDefined();
    expect(client.plans).toBeDefined();
    expect(client.subscriptions).toBeDefined();
    expect(client.agents).toBeDefined();
  });

  it('initializes successfully with valid live/production API key', () => {
    const client = new Insfers('sk_live_abcdef1234567890abcdef');
    expect(client).toBeInstanceOf(Insfers);
  });

  it('throws AuthenticationError when API key is missing or empty', () => {
    expect(() => new Insfers('')).toThrow(AuthenticationError);
    expect(() => new Insfers(null as any)).toThrow(AuthenticationError);
  });

  it('throws AuthenticationError when API key has invalid prefix', () => {
    expect(() => new Insfers('invalid_key_12345')).toThrow(AuthenticationError);
    expect(() => new Insfers('pk_live_12345')).toThrow(AuthenticationError);
  });

  it('throws InvalidRequestError when baseUrl is insecure HTTP for non-localhost', () => {
    expect(
      () =>
        new Insfers('sk_test_1234567890abcdef', {
          baseUrl: 'http://api.production.insfers.com',
        }),
    ).toThrow(InvalidRequestError);
  });

  it('allows HTTP baseUrl for localhost / 127.0.0.1 development', () => {
    const client = new Insfers('sk_test_1234567890abcdef', {
      baseUrl: 'http://localhost:3000',
    });
    expect(client).toBeInstanceOf(Insfers);
  });

  it('throws a security error if instantiated in browser environment', () => {
    const originalWindow = (globalThis as any).window;
    const originalDocument = (globalThis as any).document;

    (globalThis as any).window = {};
    (globalThis as any).document = {};

    try {
      expect(() => new Insfers('sk_test_1234567890abcdef')).toThrow(/Security Error/);
    } finally {
      delete (globalThis as any).window;
      delete (globalThis as any).document;
      if (originalWindow) (globalThis as any).window = originalWindow;
      if (originalDocument) (globalThis as any).document = originalDocument;
    }
  });
});
