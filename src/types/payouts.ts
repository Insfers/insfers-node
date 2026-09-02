export interface CreatePayoutParams {
  /**
   * Amount in USDC to disburse.
   */
  amount: number;

  /**
   * Recipient EVM wallet address (0x...).
   */
  recipientAddress: string;

  /**
   * Blockchain network for disbursement (e.g. 'BASE-SEPOLIA', 'ARC-TESTNET', 'ETH-SEPOLIA').
   */
  blockchain: string;

  /**
   * Currency code (defaults to 'USDC').
   */
  currency?: string;

  /**
   * Optional description or memo.
   */
  description?: string;
}

export interface Payout {
  id: string;
  merchantId: string;
  amount: number;
  currency: string;
  recipientAddress: string;
  blockchain: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | string;
  txHash?: string | null;
  circleTransferId?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}
