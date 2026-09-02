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
  merchantId: string;
  customerId?: string | null;
  amount: number;
  currency: string;
  blockchain: string;
  status: 'PENDING' | 'SETTLED' | 'FAILED' | 'REFUNDED' | string;
  txHash?: string | null;
  circleTransferId?: string | null;
  description?: string | null;
  feeAmount?: number | null;
  netAmount?: number | null;
  createdAt: string;
  updatedAt: string;
}
