import { Insfers } from '../src';

describe('Merchant Catalog & Fee Engine SDK Integration', () => {
  const apiKey = 'sk_test_mock_12345678901234567890';
  let insfers: Insfers;

  beforeEach(() => {
    insfers = new Insfers(apiKey, { baseUrl: 'https://api.insfers.com' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Catalog Categories', () => {
    it('creates a catalog category with brand color', async () => {
      const mockCategory = {
        id: 'cat_software_01',
        name: 'SaaS Software',
        description: 'Cloud software and subscriptions',
        color: '#0000FF',
        createdAt: '2026-10-27T00:00:00.000Z',
      };

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockCategory,
      });
      (globalThis as any).fetch = mockFetch;

      const res = await insfers.catalog.categories.create({
        name: 'SaaS Software',
        description: 'Cloud software and subscriptions',
        color: '#0000FF',
      });

      expect(res.id).toBe('cat_software_01');
      expect(res.name).toBe('SaaS Software');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/catalog/categories'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'SaaS Software',
            description: 'Cloud software and subscriptions',
            color: '#0000FF',
          }),
        }),
      );
    });

    it('lists all catalog categories', async () => {
      const mockCategories = [
        { id: 'cat_1', name: 'Software', color: '#0000FF' },
        { id: 'cat_2', name: 'Services', color: '#00AAFF' },
      ];

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockCategories,
      });
      (globalThis as any).fetch = mockFetch;

      const res = await insfers.catalog.categories.list();

      expect(res).toHaveLength(2);
      expect(res[0]?.name).toBe('Software');
    });

    it('updates and deletes a category', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ id: 'cat_1', name: 'Updated Name' }),
      });
      (globalThis as any).fetch = mockFetch;

      const updated = await insfers.catalog.categories.update('cat_1', { name: 'Updated Name' });
      expect(updated.name).toBe('Updated Name');

      await insfers.catalog.categories.delete('cat_1');
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('/catalog/categories/cat_1'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('Catalog Items (Products & Subscriptions)', () => {
    it('creates a one-time catalog item with auto-derived SKU', async () => {
      const mockItem = {
        id: 'item_audit_01',
        categoryId: 'cat_services',
        sku: 'SECURITY-AUDIT',
        name: 'Security Audit',
        type: 'SERVICE',
        billingType: 'ONE_TIME',
        price: 1500.0,
        currency: 'USDC',
        isActive: true,
        createdAt: '2026-10-27T00:00:00.000Z',
      };

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockItem,
      });
      (globalThis as any).fetch = mockFetch;

      const res = await insfers.catalog.items.create({
        name: 'Security Audit',
        categoryId: 'cat_services',
        price: 1500.0,
        type: 'SERVICE',
        billingType: 'ONE_TIME',
      });

      expect(res.id).toBe('item_audit_01');
      expect(res.sku).toBe('SECURITY-AUDIT');
      expect(res.price).toBe(1500.0);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/catalog/items'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            categoryId: 'cat_services',
            sku: 'SECURITY-AUDIT',
            name: 'Security Audit',
            type: 'SERVICE',
            billingType: 'ONE_TIME',
            price: 1500.0,
            currency: 'USDC',
          }),
        }),
      );
    });

    it('creates a recurring subscription item with billing interval and trialDays', async () => {
      const mockItem = {
        id: 'item_pro_sub',
        categoryId: 'cat_saas',
        sku: 'PRO-SUB-MONTHLY',
        name: 'Pro Subscription',
        type: 'SERVICE',
        billingType: 'RECURRING',
        price: 49.0,
        currency: 'USDC',
        interval: 'MONTHLY',
        trialDays: 14,
        planId: 'plan_123',
        isActive: true,
        createdAt: '2026-10-27T00:00:00.000Z',
      };

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockItem,
      });
      (globalThis as any).fetch = mockFetch;

      const res = await insfers.catalog.items.create({
        name: 'Pro Subscription',
        categoryId: 'cat_saas',
        sku: 'PRO-SUB-MONTHLY',
        price: 49.0,
        billingType: 'RECURRING',
        interval: 'MONTHLY',
        trialDays: 14,
      });

      expect(res.billingType).toBe('RECURRING');
      expect(res.interval).toBe('MONTHLY');
      expect(res.trialDays).toBe(14);
      expect(res.planId).toBe('plan_123');
    });

    it('rejects recurring catalog items without an interval', async () => {
      await expect(
        insfers.catalog.items.create({
          name: 'Invalid Recurring Item',
          categoryId: 'cat_saas',
          price: 49.0,
          billingType: 'RECURRING',
        } as any),
      ).rejects.toThrow('Recurring catalog items require a billing interval.');
    });

    it('lists catalog items with filters and pagination', async () => {
      const mockResponse = {
        data: [
          { id: 'item_1', name: 'Item 1', sku: 'ITEM-1', price: 29.0 },
          { id: 'item_2', name: 'Item 2', sku: 'ITEM-2', price: 99.0 },
        ],
        total: 2,
        page: 1,
        limit: 25,
      };

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });
      (globalThis as any).fetch = mockFetch;

      const res = await insfers.catalog.items.list({
        search: 'Item',
        billingType: 'ONE_TIME',
        status: 'active',
      });

      expect(res.data).toHaveLength(2);
      expect(res.total).toBe(2);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/catalog\/items\?.*search=Item/),
        expect.objectContaining({ method: 'GET' }),
      );
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('search=Item');
      expect(calledUrl).toContain('status=active');
      expect(calledUrl).toContain('billingType=ONE_TIME');
    });

    it('retrieves and archives an item', async () => {
      const mockItem = { id: 'item_1', name: 'Test Item', isActive: true };
      const mockArchived = { id: 'item_1', name: 'Test Item', isActive: false };

      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockItem,
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockArchived,
        });
      (globalThis as any).fetch = mockFetch;

      const item = await insfers.catalog.items.retrieve('item_1');
      expect(item.isActive).toBe(true);

      const archived = await insfers.catalog.items.archive('item_1');
      expect(archived.isActive).toBe(false);
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('/catalog/items/item_1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ isActive: false }),
        }),
      );
    });

    it('deletes an item and returns whether it was deleted or deactivated', async () => {
      const mockDeleteResult = { deleted: false, deactivated: true };
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockDeleteResult,
      });
      (globalThis as any).fetch = mockFetch;

      const res = await insfers.catalog.items.delete('item_1');
      expect(res.deleted).toBe(false);
      expect(res.deactivated).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/catalog/items/item_1'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('Catalog Analytics & SKU Helper', () => {
    it('retrieves catalog sales summary and performance metrics matching API contract', async () => {
      const mockSummary = {
        totalItems: 12,
        activeItems: 10,
        categories: [
          { id: 'cat_1', name: 'Software', count: 8 },
          { id: 'cat_2', name: 'Services', count: 4 },
        ],
        revenueByCurrency: { USDC: 4950.0 },
        topPerformer: {
          id: 'item_1',
          sku: 'PRO-ANNUAL',
          name: 'Pro Annual',
          revenue: 4950.0,
        },
      };

      const mockPerformance = {
        items: [
          {
            id: 'item_1',
            sku: 'PRO-ANNUAL',
            name: 'Pro Annual',
            currency: 'USDC',
            isActive: true,
            category: { id: 'cat_1', name: 'Software', color: '#0000FF' },
            rank: 1,
            revenue: 4950.0,
            unitsSold: 50,
            lastSoldAt: '2026-10-27T00:00:00.000Z',
            unitsLast30Days: 10,
            trendPct: 15.5,
            shareOfTop: 1.0,
          },
        ],
      };

      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockSummary,
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockPerformance,
        });
      (globalThis as any).fetch = mockFetch;

      const summary = await insfers.catalog.summary();
      expect(summary.totalItems).toBe(12);
      expect(summary.activeItems).toBe(10);
      expect(summary.topPerformer?.revenue).toBe(4950.0);

      const performance = await insfers.catalog.performance();
      expect(performance.items).toHaveLength(1);
      expect(performance.items[0]?.sku).toBe('PRO-ANNUAL');
      expect(performance.items[0]?.revenue).toBe(4950.0);
      expect(performance.items[0]?.rank).toBe(1);
    });

    it('suggests a collision-free SKU', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ sku: 'DEV-API-PRO-02' }),
      });
      (globalThis as any).fetch = mockFetch;

      const res = await insfers.catalog.suggestSku('Developer API Pro');
      expect(res.sku).toBe('DEV-API-PRO-02');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/catalog/sku-suggestion?name=Developer+API+Pro'),
        expect.objectContaining({ method: 'GET' }),
      );
    });
  });

  describe('Payment Links & Fee Engine Audit Fields', () => {
    it('creates a payment link with catalogItemId snapshotting', async () => {
      const mockLink = {
        id: 'link_123',
        publicToken: 'tok_abc123',
        name: 'Enterprise Plan',
        amount: 499.0,
        currency: 'USDC',
        catalogItemId: 'item_ent_01',
        status: 'ACTIVE',
      };

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockLink,
      });
      (globalThis as any).fetch = mockFetch;

      const link = await insfers.paymentLinks.create({
        amount: 499.0,
        name: 'Enterprise Plan',
        catalogItemId: 'item_ent_01',
      });

      expect(link.token).toBe('tok_abc123');
      expect(link.catalogItemId).toBe('item_ent_01');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/payment-links'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"catalogItemId":"item_ent_01"'),
        }),
      );
    });

    it('preserves 6-decimal atomic precision on payment links without 2-decimal truncation', async () => {
      const mockLink = {
        id: 'link_atomic',
        publicToken: 'tok_atomic',
        name: 'Micro Item',
        amount: 0.123456,
        currency: 'USDC',
        status: 'ACTIVE',
      };

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockLink,
      });
      (globalThis as any).fetch = mockFetch;

      await insfers.paymentLinks.create({
        amount: 0.123456,
        name: 'Micro Item',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.amount).toBe(0.123456);
    });

    it('exposes platformFeeAmount, merchantNetAmount and feeCollectionMethod on payments', async () => {
      const mockPayment = {
        id: 'pay_999',
        merchantId: 'merch_123',
        amount: 100.0,
        currency: 'USDC',
        blockchain: 'SOL-DEVNET',
        status: 'SUCCESS',
        platformFeeAmount: 1.14,
        merchantNetAmount: 98.86,
        platformFeeStatus: 'COLLECTED',
        feeCollectionMethod: 'SOLANA_ATOMIC_SPLIT',
        platformFeeTxHash: '5xYz...solanaTx',
        platformFeeVault: 'VaultSolanaAddress',
        catalogItemId: 'item_ent_01',
        sku: 'ENT-PRO',
        itemName: 'Enterprise Plan',
      };

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockPayment,
      });
      (globalThis as any).fetch = mockFetch;

      const payment = await insfers.payments.retrieve('pay_999');

      expect(payment.amount).toBe(100.0);
      expect(payment.platformFeeAmount).toBe(1.14);
      expect(payment.merchantNetAmount).toBe(98.86);
      expect(payment.platformFeeStatus).toBe('COLLECTED');
      expect(payment.feeCollectionMethod).toBe('SOLANA_ATOMIC_SPLIT');
      expect(payment.platformFeeTxHash).toBe('5xYz...solanaTx');
      expect(payment.platformFeeVault).toBe('VaultSolanaAddress');
      expect(payment.sku).toBe('ENT-PRO');
      expect(payment.itemName).toBe('Enterprise Plan');
    });

    it('forwards catalogItemId and sku on invoice line items without dropping them', async () => {
      const mockInvoice = {
        id: 'inv_123',
        displayId: 'INV-2026-001',
        total: 100.0,
      };

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockInvoice,
      });
      (globalThis as any).fetch = mockFetch;

      await insfers.invoices.create({
        customerName: 'Acme Corp',
        customerEmail: 'billing@acme.corp',
        dueDate: '2026-11-15',
        lineItems: [
          {
            description: 'API Usage Pack',
            qty: 1,
            price: 100.0,
            catalogItemId: 'item_api_pack',
            sku: 'API-PACK-100',
          },
        ],
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.lineItems[0].catalogItemId).toBe('item_api_pack');
      expect(callBody.lineItems[0].sku).toBe('API-PACK-100');
      expect(callBody.address).toBeUndefined();
      expect(JSON.stringify(callBody)).not.toContain('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
    });

    it('forwards an explicit invoice address and omits a blank one', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ id: 'inv_addr', displayId: 'INV-ADDR' }),
      });
      (globalThis as any).fetch = mockFetch;

      const base = {
        customerName: 'Acme Corp',
        dueDate: '2026-11-15',
        lineItems: [{ description: 'Seat', qty: 1, price: 10 }],
      };

      await insfers.invoices.create({
        ...base,
        address: '0x1111111111111111111111111111111111111111',
      });
      expect(JSON.parse(mockFetch.mock.calls[0][1].body).address).toBe(
        '0x1111111111111111111111111111111111111111',
      );

      await insfers.invoices.create({ ...base, address: '   ' });
      expect(JSON.parse(mockFetch.mock.calls[1][1].body).address).toBeUndefined();
    });
  });
});
