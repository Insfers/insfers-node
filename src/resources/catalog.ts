import { BaseResource } from './base';
import { cleanDecimal } from '../utils';
import { InvalidRequestError } from '../errors';
import type { RequestOptions } from '../types/common';
import type {
  CatalogCategory,
  CatalogItem,
  CatalogItemDeleteResult,
  CatalogPerformanceResponse,
  CatalogSummary,
  CreateCatalogCategoryParams,
  CreateCatalogItemParams,
  ListCatalogItemsQuery,
  UpdateCatalogCategoryParams,
  UpdateCatalogItemParams,
} from '../types/catalog';

export class CatalogItemsResource extends BaseResource {
  /**
   * Create a new catalog item (One-Time product/service or Recurring subscription).
   * For RECURRING items, automatically provisions the underlying SubscriptionPlan.
   *
   * @param params Item details including name, categoryId, price, and billing cadence
   * @param options Per-request options
   */
  async create(params: CreateCatalogItemParams, options?: RequestOptions): Promise<CatalogItem> {
    const isRecurring = params.billingType === 'RECURRING';

    if (isRecurring) {
      if (!params.interval) {
        throw new InvalidRequestError('Recurring catalog items require a billing interval.');
      }
      if (params.currency && params.currency.toUpperCase() !== 'USDC') {
        throw new InvalidRequestError('Recurring items support USDC only.');
      }
    }

    const rawSku =
      params.sku ||
      params.name
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40)
        .replace(/-+$/, '') ||
      'ITEM';

    const payload = {
      categoryId: params.categoryId,
      sku: rawSku,
      name: params.name.trim(),
      description: params.description,
      type: params.type || 'SERVICE',
      billingType: params.billingType || 'ONE_TIME',
      price: cleanDecimal(params.price),
      currency: (params.currency || 'USDC').toUpperCase(),
      billingUnit: params.billingUnit,
      interval: params.interval,
      trialDays: params.trialDays !== undefined ? Number(params.trialDays) : undefined,
    };

    return this.http.request<CatalogItem>('/catalog/items', {
      method: 'POST',
      body: payload,
      ...options,
    });
  }

  /**
   * Returns a list of catalog items with filtering and pagination.
   *
   * @param query Filters (search, categoryId, status, billingType, page, limit)
   * @param options Per-request options
   */
  async list(
    query?: ListCatalogItemsQuery,
    options?: RequestOptions,
  ): Promise<{ data: CatalogItem[]; total: number; page?: number; limit?: number }> {
    const res = await this.http.request<any>('/catalog/items', {
      method: 'GET',
      query: query as any,
      ...options,
    });

    if (Array.isArray(res)) {
      return { data: res, total: res.length };
    }

    return {
      data: Array.isArray(res?.data) ? res.data : [],
      total: res?.total ?? (Array.isArray(res?.data) ? res.data.length : 0),
      page: res?.page,
      limit: res?.limit,
    };
  }

  /**
   * Retrieves a single catalog item by ID with full sales stats and subscription trends.
   *
   * @param id Catalog item UUID
   * @param options Per-request options
   */
  async retrieve(id: string, options?: RequestOptions): Promise<CatalogItem> {
    return this.http.request<CatalogItem>(`/catalog/items/${id}`, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Updates an existing catalog item.
   *
   * @param id Catalog item UUID
   * @param params Updated fields
   * @param options Per-request options
   */
  async update(id: string, params: UpdateCatalogItemParams, options?: RequestOptions): Promise<CatalogItem> {
    const payload = {
      ...params,
      price: params.price !== undefined ? cleanDecimal(params.price) : undefined,
      trialDays: params.trialDays !== undefined ? Number(params.trialDays) : undefined,
    };

    return this.http.request<CatalogItem>(`/catalog/items/${id}`, {
      method: 'PUT',
      body: payload,
      ...options,
    });
  }

  /**
   * Archives or deactivates a catalog item (soft-delete preserving transaction history).
   *
   * @param id Catalog item UUID
   * @param options Per-request options
   */
  async archive(id: string, options?: RequestOptions): Promise<CatalogItem> {
    return this.update(id, { isActive: false }, options);
  }

  /**
   * Deletes a catalog item. If the item has historical transactions, links, or subscriptions,
   * it is safely deactivated instead of deleted and returns `{ deleted: false, deactivated: true }`.
   *
   * @param id Catalog item UUID
   * @param options Per-request options
   */
  async delete(id: string, options?: RequestOptions): Promise<CatalogItemDeleteResult> {
    return this.http.request<CatalogItemDeleteResult>(`/catalog/items/${id}`, {
      method: 'DELETE',
      ...options,
    });
  }
}

export class CatalogCategoriesResource extends BaseResource {
  /**
   * Creates a new catalog category.
   *
   * @param params Category details (name, description, color)
   * @param options Per-request options
   */
  async create(params: CreateCatalogCategoryParams, options?: RequestOptions): Promise<CatalogCategory> {
    return this.http.request<CatalogCategory>('/catalog/categories', {
      method: 'POST',
      body: {
        name: params.name.trim(),
        description: params.description,
        color: params.color || '#0000FF',
      },
      ...options,
    });
  }

  /**
   * Lists all catalog categories for the merchant.
   *
   * @param options Per-request options
   */
  async list(options?: RequestOptions): Promise<CatalogCategory[]> {
    const res = await this.http.request<any>('/catalog/categories', {
      method: 'GET',
      ...options,
    });
    return Array.isArray(res) ? res : res?.data || [];
  }

  /**
   * Updates an existing catalog category.
   *
   * @param id Category UUID
   * @param params Updated fields
   * @param options Per-request options
   */
  async update(id: string, params: UpdateCatalogCategoryParams, options?: RequestOptions): Promise<CatalogCategory> {
    return this.http.request<CatalogCategory>(`/catalog/categories/${id}`, {
      method: 'PUT',
      body: params,
      ...options,
    });
  }

  /**
   * Deletes a catalog category.
   *
   * @param id Category UUID
   * @param options Per-request options
   */
  async delete(id: string, options?: RequestOptions): Promise<void> {
    await this.http.request<void>(`/catalog/categories/${id}`, {
      method: 'DELETE',
      ...options,
    });
  }
}

export class CatalogResource extends BaseResource {
  readonly items: CatalogItemsResource;
  readonly categories: CatalogCategoriesResource;

  constructor(http: any) {
    super(http);
    this.items = new CatalogItemsResource(http);
    this.categories = new CatalogCategoriesResource(http);
  }

  /**
   * Retrieves high-level catalog sales summary (active items, categories, revenue totals, top performer).
   *
   * @param options Per-request options
   */
  async summary(options?: RequestOptions): Promise<CatalogSummary> {
    return this.http.request<CatalogSummary>('/catalog/summary', {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Retrieves catalog performance ranking with 30-day sales velocity, revenue, and conversion metrics.
   * Returns `{ items: [...] }` where each row includes rank, revenue, unitsSold, and trend metrics.
   *
   * @param options Per-request options
   */
  async performance(options?: RequestOptions): Promise<CatalogPerformanceResponse> {
    const res = await this.http.request<any>('/catalog/performance', {
      method: 'GET',
      ...options,
    });
    // Handle both { items: [...] } and legacy/mock array if provided
    if (Array.isArray(res)) {
      return { items: res };
    }
    return {
      items: Array.isArray(res?.items) ? res.items : [],
    };
  }

  /**
   * Suggests an available, collision-free SKU for a given product or service name.
   *
   * @param name Name of the product or plan
   * @param excludeId Optional ID of the item being edited to exclude its current SKU from collisions
   * @param options Per-request options
   */
  async suggestSku(name: string, excludeId?: string, options?: RequestOptions): Promise<{ sku: string }> {
    return this.http.request<{ sku: string }>('/catalog/sku-suggestion', {
      method: 'GET',
      query: { name, excludeId },
      ...options,
    });
  }
}
