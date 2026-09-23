import Insfers from '../src';

describe('Insfers SDK Subscriptions & Plans Resources', () => {
  let insfers: Insfers;
  let mockRequest: jest.SpyInstance;

  beforeEach(() => {
    insfers = new Insfers('sk_test_mock_secret_key_12345678901234567890');
    // Spy on the internal http.request method
    mockRequest = jest.spyOn((insfers as any).http, 'request').mockResolvedValue({});
  });

  afterEach(() => {
    mockRequest.mockRestore();
  });

  describe('insfers.subscriptions', () => {
    it('should list all merchant subscriptions via GET /subscriptions', async () => {
      mockRequest.mockResolvedValueOnce([
        { id: 'sub_1', displayId: 'sub_001', status: 'ACTIVE', amount: 49.0 },
      ]);

      const subs = await insfers.subscriptions.list();
      expect(subs).toHaveLength(1);
      expect(subs[0]?.id).toBe('sub_1');
      expect(mockRequest).toHaveBeenCalledWith('/subscriptions', expect.objectContaining({
        method: 'GET',
      }));
    });

    it('should retrieve a subscription by ID via GET /subscriptions/:id', async () => {
      mockRequest.mockResolvedValueOnce({
        id: 'sub_1',
        displayId: 'sub_001',
        status: 'ACTIVE',
        paymentHistory: [],
      });

      const sub = await insfers.subscriptions.retrieve('sub_1');
      expect(sub.id).toBe('sub_1');
      expect(mockRequest).toHaveBeenCalledWith('/subscriptions/sub_1', expect.objectContaining({
        method: 'GET',
      }));
    });

    it('should cancel a subscription via POST /subscriptions/:id/cancel', async () => {
      mockRequest.mockResolvedValueOnce({ id: 'sub_1', status: 'CANCELLED' });

      const res = await insfers.subscriptions.cancel('sub_1');
      expect(res.status).toBe('CANCELLED');
      expect(mockRequest).toHaveBeenCalledWith('/subscriptions/sub_1/cancel', expect.objectContaining({
        method: 'POST',
      }));
    });

    it('should pause a subscription via POST /subscriptions/:id/pause', async () => {
      mockRequest.mockResolvedValueOnce({ id: 'sub_1', status: 'PAUSED' });

      const res = await insfers.subscriptions.pause('sub_1');
      expect(res.status).toBe('PAUSED');
      expect(mockRequest).toHaveBeenCalledWith('/subscriptions/sub_1/pause', expect.objectContaining({
        method: 'POST',
      }));
    });

    it('should resume a paused subscription via POST /subscriptions/:id/resume', async () => {
      mockRequest.mockResolvedValueOnce({ id: 'sub_1', status: 'ACTIVE' });

      const res = await insfers.subscriptions.resume('sub_1');
      expect(res.status).toBe('ACTIVE');
      expect(mockRequest).toHaveBeenCalledWith('/subscriptions/sub_1/resume', expect.objectContaining({
        method: 'POST',
      }));
    });

    it('should retry a failed subscription charge via POST /subscriptions/:id/retry', async () => {
      mockRequest.mockResolvedValueOnce({ ok: true, status: 'RETRY_INITIATED' });

      const res = await insfers.subscriptions.retry('sub_1');
      expect(res.ok).toBe(true);
      expect(mockRequest).toHaveBeenCalledWith('/subscriptions/sub_1/retry', expect.objectContaining({
        method: 'POST',
      }));
    });

    it('should selectively refund a billing cycle sequence via POST /subscriptions/:id/payments/:seq/refund', async () => {
      mockRequest.mockResolvedValueOnce({
        ok: true,
        sequence: 1,
        status: 'REFUNDED',
        refundedAmount: 49.0,
      });

      const res = await insfers.subscriptions.refundPayment('sub_1', 1, {
        amount: 49.0,
        reason: 'Customer request',
      });
      expect(res.ok).toBe(true);
      expect(res.refundedAmount).toBe(49.0);
      expect(mockRequest).toHaveBeenCalledWith(
        '/subscriptions/sub_1/payments/1/refund',
        expect.objectContaining({
          method: 'POST',
          body: { amount: 49.0, reason: 'Customer request' },
        }),
      );
    });
  });

  describe('insfers.plans', () => {
    it('should create a plan via POST /plans with normalized payload', async () => {
      mockRequest.mockResolvedValueOnce({
        id: 'plan_1',
        name: 'Enterprise Plan',
        price: 99.0,
        interval: 'MONTHLY',
      });

      const plan = await insfers.plans.create({
        name: 'Enterprise Plan',
        price: 99.0,
        interval: 'monthly',
        trialDays: 14,
      });
      expect(plan.id).toBe('plan_1');
      expect(mockRequest).toHaveBeenCalledWith('/plans', expect.objectContaining({
        method: 'POST',
        body: {
          name: 'Enterprise Plan',
          price: 99.0,
          interval: 'MONTHLY',
          trialDays: 14,
          description: undefined,
        },
      }));
    });

    it('should list all merchant plans via GET /plans', async () => {
      mockRequest.mockResolvedValueOnce([
        { id: 'plan_1', name: 'Starter', price: 19.0 },
      ]);

      const plans = await insfers.plans.list();
      expect(plans).toHaveLength(1);
      expect(mockRequest).toHaveBeenCalledWith('/plans', expect.objectContaining({
        method: 'GET',
      }));
    });

    it('should retrieve plan details via GET /plans/:id', async () => {
      mockRequest.mockResolvedValueOnce({
        id: 'plan_1',
        name: 'Starter',
        price: 19.0,
        subscriberCount: 42,
      });

      const plan = await insfers.plans.retrieve('plan_1');
      expect(plan.id).toBe('plan_1');
      expect(mockRequest).toHaveBeenCalledWith('/plans/plan_1', expect.objectContaining({
        method: 'GET',
      }));
    });

    it('should update a plan via PATCH /plans/:id', async () => {
      mockRequest.mockResolvedValueOnce({
        id: 'plan_1',
        name: 'Starter Pro',
      });

      const plan = await insfers.plans.update('plan_1', { name: 'Starter Pro' });
      expect(plan.name).toBe('Starter Pro');
      expect(mockRequest).toHaveBeenCalledWith('/plans/plan_1', expect.objectContaining({
        method: 'PATCH',
        body: { name: 'Starter Pro' },
      }));
    });

    it('should delete a plan via DELETE /plans/:id', async () => {
      mockRequest.mockResolvedValueOnce({ ok: true });

      const res = await insfers.plans.delete('plan_1');
      expect(res.ok).toBe(true);
      expect(mockRequest).toHaveBeenCalledWith('/plans/plan_1', expect.objectContaining({
        method: 'DELETE',
      }));
    });
  });
});
