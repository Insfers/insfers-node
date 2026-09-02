export interface CreateRefundParams {
  /**
   * Original payment ID to refund.
   */
  paymentId: string;

  /**
   * Amount to refund in USDC. If omitted, full payment amount is refunded.
   */
  amount?: number;

  /**
   * Reason for issuing the refund.
   */
  reason?: string;

  /**
   * Whether to issue as a claimable refund link or direct on-chain wallet return.
   */
  claimable?: boolean;
}

export interface Refund {
  id: string;
  paymentId: string;
  merchantId: string;
  amount: number;
  currency: string;
  reason?: string | null;
  status: 'PENDING' | 'SUCCEEDED' | 'CLAIMABLE' | 'CLAIMED' | 'FAILED' | string;
  txHash?: string | null;
  claimToken?: string | null;
  claimUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}
