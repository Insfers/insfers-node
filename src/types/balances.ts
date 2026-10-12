export interface ChainBalance {
  id?: string;
  network?: string;
  blockchain?: string;
  walletAddress?: string;
  amount?: number | null;
  total?: number | null;
  available?: number | null;
  inEscrow?: number;
  reserved?: number;
  tokenBalances?: Record<string, number | null>;
  currency?: string;
}

export interface BalanceSummary {
  totalUsdc?: number | null;
  availableUsdc?: number | null;
  pendingUsdc?: number;
  chains: ChainBalance[];
}
