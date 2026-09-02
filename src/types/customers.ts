export interface CreateCustomerParams {
  name: string;
  email: string;
  phone?: string;
  walletAddress?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateCustomerParams {
  name?: string;
  email?: string;
  phone?: string;
  walletAddress?: string;
  metadata?: Record<string, unknown>;
}

export interface Customer {
  id: string;
  merchantId: string;
  name: string;
  email: string;
  phone?: string | null;
  walletAddress?: string | null;
  totalSpent?: number;
  paymentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerWithHistory extends Customer {
  payments?: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
}
