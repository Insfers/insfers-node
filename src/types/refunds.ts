export interface CreateRefundParams {
  /**
   * Original payment ID to refund.
   */
  paymentId: string;

  /**
   * Amount to refund in USDC. Cannot exceed remaining maxRefundable (merchantNetAmount - prior refunds).
   */
  amount: number;

  /**
   * Refund type: 'CLAIMABLE' (generates claim link for customer) or 'DIRECT' (instant send to payer wallet).
   * If omitted, defaults to 'CLAIMABLE' if `claimable: true`, else 'DIRECT'.
   */
  type?: 'CLAIMABLE' | 'DIRECT';

  /**
   * Reason for issuing the refund.
   */
  reason?: string;

  /**
   * Whether to issue as a claimable refund link or direct on-chain wallet return.
   * Shortcut for type: 'CLAIMABLE'.
   */
  claimable?: boolean;

  /**
   * Optional destination blockchain network for cross-chain refund (e.g. 'BASE-SEPOLIA').
   */
  destinationChain?: string;

  /**
   * Optional client-generated idempotency key to prevent duplicate refunds on retries.
   */
  idempotencyKey?: string;
}

export interface RefundableDetails {
  paymentId: string;
  currency: string;
  grossAmount: number;
  platformFeeAmount: number;
  merchantNetAmount: number;
  refundedOrReservedAmount: number;
  maxRefundable: number;
}

export interface Refund {
  id: string;
  displayId?: string;
  paymentId?: string;
  originalPaymentId?: string;
  merchantId?: string;
  amount: number;
  currency: string;
  reason?: string | null;
  status: 'PENDING' | 'SUCCEEDED' | 'CLAIMABLE' | 'COMPLETED' | 'FAILED' | string;
  type?: 'CLAIMABLE' | 'DIRECT' | string;
  chain?: string;
  settledChain?: string | null;
  crossChainPlatformFeeUsdc?: number | null;
  gatewayFeeUsdc?: number | null;
  idempotencyKey?: string | null;
  txHash?: string | null;
  transferId?: string | null;
  claimToken?: string | null;
  claimUrl?: string | null;
  claimWallet?: string | null;
  claimExpiresAt?: string | null;
  completedAt?: string | null;
  customerName?: string;
  walletAddress?: string | null;
  walletShort?: string | null;
  invoiceId?: string | null;
  invoiceDisplayId?: string | null;
  txExplorerUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
}
