import { Insfers } from '../src';

describe('Payment Links & Promo Acceptance', () => {
  const apiKey = 'sk_test_mock_12345678901234567890';
  let insfers: Insfers;

  beforeEach(() => {
    insfers = new Insfers(apiKey, { baseUrl: 'https://api.insfers.com' });
  });

  it('should format promo validation request properly and parse split and minimumApplied fields', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        valid: true,
        code: 'TINY99',
        discountType: 'PERCENTAGE',
        discountValue: 99,
        originalAmount: 1.0,
        discountedAmount: 0.3,
        savings: 0.7,
        minimumApplied: true,
        warning: 'The minimum checkout amount is $0.30 USDC. The discount was adjusted to meet this minimum.',
        split: {
          grossAtomic: '300000',
          feeAtomic: '252670',
          netAtomic: '47330',
        },
      }),
    });
    (globalThis as any).fetch = mockFetch;

    const res = await insfers.paymentLinks.validatePromo('test-token', 'TINY99');

    expect(res.valid).toBe(true);
    expect(res.originalAmount).toBe(1.0);
    expect(res.discountedAmount).toBe(0.3);
    expect(res.minimumApplied).toBe(true);
    expect(res.warning).toContain('minimum checkout amount is $0.30');
    expect(res.split?.grossAtomic).toBe('300000');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/payment-links/test-token/validate-promo'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ code: 'TINY99' }),
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
