export interface CreatePlanParams {
  name: string;
  description?: string;
  amount: number;
  currency?: string;
  billingInterval: 'monthly' | 'yearly' | 'weekly';
  features?: string[];
}

export interface UpdatePlanParams {
  name?: string;
  description?: string;
  amount?: number;
  features?: string[];
}

export interface Plan {
  id: string;
  merchantId: string;
  name: string;
  description?: string | null;
  amount: number;
  currency: string;
  billingInterval: string;
  features?: string[];
  activeSubscribers?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanDetail extends Plan {
  mrr?: number;
  subscriberCount?: number;
}

export interface Subscription {
  id: string;
  merchantId: string;
  customerId: string;
  planId: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'PAST_DUE' | string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionDetail extends Subscription {
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  plan?: Plan;
}
