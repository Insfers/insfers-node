export interface CreatePaymentParams {
  /**
   * Amount in USDC (e.g. 100.50).
   */
  amount: number;

  /**
   * Currency code (e.g. 'USDC').
   */
  currency?: string;

  /**
   * Destination customer ID or EVM wallet address.
   */
  destination: string;

  /**
   * Target blockchain network (e.g. 'ARC-TESTNET', 'BASE-SEPOLIA', 'ETH-SEPOLIA').
   */
  blockchain?: string;

  /**
   * Optional customer identifier.
   */
  customerId?: string;

  /**
   * Optional reference description.
   */
  description?: string;

  /**
   * Arbitrary metadata key-value pairs.
   */
  metadata?: Record<string, unknown>;
}

export interface Payment {
  id: string;
  merchantId?: string;
  customerId?: string | null;
  amount: number;
  currency: string;
  blockchain?: string;
  network?: string;
  sourceNetwork?: string | null;
  status: 'PENDING' | 'SUCCESS' | 'SETTLED' | 'TRIAL' | 'FAILED' | 'REFUNDED' | string;
  txHash?: string | null;
  circleTransferId?: string | null;
  transferId?: string | null;
  walletTo?: string | null;
  description?: string | null;
  feeAmount?: number | null;
  netAmount?: number | null;
  crossChainPlatformFeeUsdc?: number | null;
  platformFeeAmount?: number | null;
  platformFeeTxHash?: string | null;
  merchantNetAmount?: number | null;
  platformFeeStatus?: 'PENDING' | 'COLLECTED' | 'FAILED' | 'NOT_APPLICABLE' | 'DIRECT_SPLIT' | 'WAIVED' | string | null;
  feeCollectionMethod?: 'SOLANA_ATOMIC_SPLIT' | 'SUBSCRIPTION_CONTRACT_SPLIT' | 'BACKEND_COLLECTOR' | 'NONE' | string | null;
  platformFeeVault?: string | null;
  settlementTxHash?: string | null;
  catalogItemId?: string | null;
  sku?: string | null;
  itemName?: string | null;
  categoryName?: string | null;
  promoCodeId?: string | null;
  createdAt: string;
}
