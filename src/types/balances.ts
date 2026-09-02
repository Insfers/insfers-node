export interface ChainBalance {
  blockchain: string;
  walletAddress: string;
  amount: number;
  currency: string;
}

export interface BalanceSummary {
  totalUsdc: number;
  availableUsdc: number;
  pendingUsdc: number;
  chains: ChainBalance[];
}
