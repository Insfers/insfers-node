export type CatalogItemType = 'PRODUCT' | 'SERVICE';
export type CatalogBillingType = 'ONE_TIME' | 'RECURRING';
export type BillingInterval =
  | 'HOURLY'
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY'
  | string;

export interface CatalogCategory {
  id: string;
  name: string;
  description?: string | null;
  color?: string;
  merchantId?: string;
  itemCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCatalogCategoryParams {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateCatalogCategoryParams {
  name?: string;
  description?: string;
  color?: string;
}

export interface CatalogItemDeleteResult {
  deleted: boolean;
  deactivated: boolean;
}

export interface CatalogItemCategoryRef {
  id: string;
  name: string;
  color: string;
}

export interface CatalogItemSubscriptionStats {
  activeCount: number;
  pausedCount: number;
  cancelledCount: number;
  monthlyRecurringRevenue: number;
  subscribers?: any[];
}

export interface CatalogItemSalesTrend {
  date: string;
  units: number;
  revenue: number;
}

export interface CatalogItemRecentPayment {
  id: string;
  amount: number;
  currency: string;
  createdAt: string;
  network?: string;
  customerName?: string | null;
}

export interface CatalogItem {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  type: CatalogItemType;
  billingType: CatalogBillingType;
  price: number;
  currency: string;
  billingUnit?: string;
  interval?: BillingInterval | null;
  trialDays: number;
  isActive: boolean;
  planId?: string | null;
  category: CatalogItemCategoryRef;
  merchantId?: string;
  createdAt: string;
  updatedAt?: string;

  /** Sales metrics returned by list and retrieve */
  unitsSold?: number;
  revenue?: number;
  lastSoldAt?: string | null;
  unitsLast30Days?: number;
  trendPct?: number;

  /** Detailed subscription economics and trends (returned by retrieve for single item) */
  subscriptions?: CatalogItemSubscriptionStats | null;
  salesLast30Days?: CatalogItemSalesTrend[];
  recentPayments?: CatalogItemRecentPayment[];
}

export interface CreateOneTimeCatalogItemParams {
  name: string;
  categoryId: string;
  sku?: string;
  price: number;
  currency?: 'USDC' | 'EURC' | string;
  type?: CatalogItemType;
  billingType?: 'ONE_TIME';
  description?: string;
  billingUnit?: string;
  interval?: never;
  trialDays?: never;
}

export interface CreateRecurringCatalogItemParams {
  name: string;
  categoryId: string;
  sku?: string;
  price: number;
  currency?: 'USDC';
  type?: CatalogItemType;
  billingType: 'RECURRING';
  interval: BillingInterval;
  description?: string;
  billingUnit?: string;
  trialDays?: number;
}

export type CreateCatalogItemParams =
  | CreateOneTimeCatalogItemParams
  | CreateRecurringCatalogItemParams;

export interface UpdateCatalogItemParams {
  categoryId?: string;
  sku?: string;
  name?: string;
  description?: string;
  type?: CatalogItemType;
  price?: number;
  billingUnit?: string;
  interval?: BillingInterval;
  trialDays?: number;
  isActive?: boolean;
}

export interface ListCatalogItemsQuery {
  search?: string;
  categoryId?: string;
  status?: 'all' | 'active' | 'inactive';
  billingType?: CatalogBillingType;
  page?: number;
  limit?: number;
}

export interface CatalogPerformanceItem {
  id: string;
  sku: string;
  name: string;
  currency: string;
  isActive: boolean;
  category: CatalogItemCategoryRef;
  rank: number;
  revenue: number;
  unitsSold: number;
  lastSoldAt?: string | null;
  unitsLast30Days: number;
  trendPct: number;
  shareOfTop: number;
}

export interface CatalogPerformanceResponse {
  items: CatalogPerformanceItem[];
}

export interface CatalogSummary {
  totalItems: number;
  activeItems: number;
  categories: number;
  revenueByCurrency: Record<string, number>;
  topPerformer: CatalogPerformanceItem | null;
}
