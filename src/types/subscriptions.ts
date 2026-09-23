export type PlanInterval =
  | 'HOURLY'
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export interface CreatePlanParams {
  name: string;
  description?: string;
  price?: number;
  amount?: number;
  currency?: string;
  interval?: PlanInterval | string;
  billingInterval?: PlanInterval | string;
  trialDays?: number;
  features?: string[];
}

export interface UpdatePlanParams {
  name?: string;
  description?: string;
  price?: number;
  amount?: number;
  interval?: PlanInterval | string;
  trialDays?: number;
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
  displayId?: string;
  customerName?: string;
  walletAddress?: string;
  baseAmount?: number;
  promoAmount?: number | null;
  promoCyclesRemaining?: number | null;
  amountLabel?: string;
  chain?: string;
  nextBillingAt?: string;
  failedRetries?: number;
  paymentHistory?: Array<{
    id: string;
    sequence: number;
    occurredAt: string;
    status: string;
    amount: number;
    amountLabel: string;
    txHash?: string | null;
    refundId?: string | null;
    refundedAmount?: number | null;
    refundReason?: string | null;
  }>;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  plan?: Plan;
}

export interface RefundSubscriptionPaymentParams {
  amount?: number;
  reason?: string;
  cancelSubscription?: boolean;
}

export interface RefundSubscriptionPaymentResponse {
  ok: boolean;
  sequence: number;
  status: string;
  refundedAmount: number;
  subscriptionCancelled: boolean;
  refund?: any;
}

export interface RetrySubscriptionResponse {
  ok: boolean;
  status: string;
}

