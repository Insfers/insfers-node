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
  network?: string;
  chain?: string;
  networks?: string[];
  chainCodesOffered?: string[];
  depositWallets?: Record<string, string>;
  payUrl?: string;
  url?: string;
  expiresAt?: string;
  paidAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}
