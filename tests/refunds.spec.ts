import { Insfers } from '../src';

describe('Refunds & Refundable Balance API', () => {
  const apiKey = 'sk_test_mock_12345678901234567890';
  let insfers: Insfers;

  beforeEach(() => {
    insfers = new Insfers(apiKey, { baseUrl: 'https://api.insfers.com' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a direct refund with amount cleaned to 6 decimals', async () => {
    const mockRefund = {
      id: 'ref_123',
      displayId: 'REF-001',
      status: 'SUCCEEDED',
      amount: 49.50,
      currency: 'USDC',
      type: 'DIRECT',
      originalPaymentId: 'pay_999',
    };

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockRefund,
    });
    (globalThis as any).fetch = mockFetch;

    const res = await insfers.refunds.create({
      paymentId: 'pay_999',
      amount: 49.50,
      reason: 'Customer request',
    });

    expect(res.id).toBe('ref_123');
    expect(res.amount).toBe(49.50);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/refunds'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          paymentId: 'pay_999',
          amount: 49.5,
          type: 'DIRECT',
          reason: 'Customer request',
        }),
      }),
    );
  });

  it('maps claimable: true to type: CLAIMABLE and preserves idempotencyKey', async () => {
    const mockRefund = {
      id: 'ref_456',
      displayId: 'REF-002',
      status: 'CLAIMABLE',
      amount: 25.0,
      currency: 'USDC',
      type: 'CLAIMABLE',
      claimToken: 'tok_claim_123',
      claimUrl: 'https://checkout.insfers.com/claim/refund/tok_claim_123',
    };

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockRefund,
    });
    (globalThis as any).fetch = mockFetch;

    const res = await insfers.refunds.create({
      paymentId: 'pay_888',
      amount: 25.0,
      claimable: true,
      idempotencyKey: 'idem_key_abc',
      destinationChain: 'BASE-SEPOLIA',
    });

    expect(res.status).toBe('CLAIMABLE');
    expect(res.claimUrl).toBe('https://checkout.insfers.com/claim/refund/tok_claim_123');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/refunds'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          paymentId: 'pay_888',
          amount: 25,
          type: 'CLAIMABLE',
          destinationChain: 'BASE-SEPOLIA',
          idempotencyKey: 'idem_key_abc',
        }),
      }),
    );
  });

  it('queries refundable details and caps via getRefundable', async () => {
    const mockRefundable = {
      paymentId: 'pay_999',
      currency: 'USDC',
      grossAmount: 100.0,
      platformFeeAmount: 1.14,
      merchantNetAmount: 98.86,
      refundedOrReservedAmount: 20.0,
      maxRefundable: 78.86,
    };

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockRefundable,
    });
    (globalThis as any).fetch = mockFetch;

    const res = await insfers.refunds.getRefundable('pay_999');

    expect(res.paymentId).toBe('pay_999');
    expect(res.grossAmount).toBe(100.0);
    expect(res.platformFeeAmount).toBe(1.14);
    expect(res.merchantNetAmount).toBe(98.86);
    expect(res.maxRefundable).toBe(78.86);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/refunds/refundable/pay_999'),
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

