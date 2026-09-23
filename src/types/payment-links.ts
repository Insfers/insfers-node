export interface CreatePaymentLinkParams {
  name?: string;
  title?: string;
  amount: number;
  network?: string;
  networks?: string[];
  acceptedNetworks?: string[];
  description?: string;
  address?: string;
  currency?: string;
  expiresInDays?: number;
  redirectUrl?: string;
  logoUrl?: string;
  brandColor?: string;
  type?: 'ONE_TIME' | 'RECURRING';
  planId?: string;
  interval?: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | string;
  trialDays?: number;
  gracePeriodDays?: number;
  promoCode?: string;
}

export interface ConfirmPaymentLinkParams {
  name: string;
  email: string;
  chain: string;
  txHash?: string | null;
  onChainSubId?: string;
  promoCode?: string;
  subscriberWallet?: string;
}

export interface ValidatePromoResponse {
  valid: boolean;
  code?: string;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue?: number;
  discountedAmount?: number;
  duration?: 'FIRST_CYCLE' | 'FOREVER' | 'REPEATING' | string;
  durationCycles?: number | null;
  savings?: number;
  promoCodeId?: string;
  message?: string;
}

export interface PaymentLinkBranding {
  brandColor?: string;
  logoUrl?: string | null;
}

export interface PaymentLink {
  id: string;
  publicToken: string;
  token?: string;
  merchantId?: string;
  name: string;
  description?: string | null;
  amount: number;
  currency: string;
  status: 'ACTIVE' | 'PAID' | 'EXPIRED' | 'CANCELLED' | string;
  type?: 'ONE_TIME' | 'RECURRING';
  planId?: string | null;
  interval?: string | null;
  trialDays?: number;
  gracePeriodDays?: number;
  network?: string;
  chain?: string;
  networks?: Array<{
    circleCode: string;
    displayName: string;
    chainIdHex?: string;
    tokenAddress?: string;
    payToAddress?: string;
  }> | string[];
  chainCodesOffered?: string[];
  depositWallets?: Record<string, string>;
  merchantAddress?: string;
  payUrl?: string;
  url?: string;
  expiresAt?: string;
  paidAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}
