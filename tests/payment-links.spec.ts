import { Insfers } from '../src';

describe('Payment Links & Promo Acceptance', () => {
  const apiKey = 'sk_test_mock_12345678901234567890';
  let insfers: Insfers;

  beforeEach(() => {
    insfers = new Insfers(apiKey, { baseUrl: 'https://develop.insfers.com' });
  });

  it('should format promo validation request properly', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        valid: true,
        code: 'SUMMER50',
        discountType: 'PERCENTAGE',
        discountValue: 50,
        discountedAmount: 25,
      }),
    });
    (globalThis as any).fetch = mockFetch;

    const res = await insfers.paymentLinks.validatePromo('test-token', 'SUMMER50');

    expect(res.valid).toBe(true);
    expect(res.discountedAmount).toBe(25);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/payment-links/test-token/validate-promo'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ code: 'SUMMER50' }),
      })
    );
  });

  it('should format confirm payment request properly with customer contact and promoCode', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        status: 'CONFIRMED',
        txHash: '0x1234567890abcdef',
      }),
    });
    (globalThis as any).fetch = mockFetch;

    const res = await insfers.paymentLinks.confirm('test-token', {
      name: 'Alice Developer',
      email: 'alice@example.com',
      chain: 'ARC-TESTNET',
      txHash: '0x1234567890abcdef',
      promoCode: 'SUMMER50',
    });

    expect(res.status).toBe('CONFIRMED');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/payment-links/test-token/confirm'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Alice Developer',
          email: 'alice@example.com',
          chain: 'ARC-TESTNET',
          txHash: '0x1234567890abcdef',
          promoCode: 'SUMMER50',
        }),
      })
    );
  });

  it('should fetch default merchant branding', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        brandColor: '#0000FF',
        logoUrl: 'https://example.com/logo.png',
      }),
    });
    (globalThis as any).fetch = mockFetch;

    const res = await insfers.paymentLinks.getDefaultBranding();

    expect(res.brandColor).toBe('#0000FF');
    expect(res.logoUrl).toBe('https://example.com/logo.png');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/payment-links/default-branding'),
      expect.objectContaining({
        method: 'GET',
      })
    );
  });
});
