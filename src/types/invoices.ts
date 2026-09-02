export interface InvoiceLineItem {
  description: string;
  qty?: number;
  quantity?: number;
  price?: number;
  unitPrice?: number;
}

export interface CreateInvoiceParams {
  customerName?: string;
  customerEmail?: string;
  customerId?: string;
  dueDate: string;
  lineItems?: InvoiceLineItem[];
  items?: InvoiceLineItem[];
  address?: string;
  network?: string;
  taxPercent?: number;
  currency?: string;
}

export interface SendReminderParams {
  customMessage?: string;
}

export interface Invoice {
  id: string;
  merchantId?: string;
  customerId?: string | null;
  customerName: string;
  customerEmail?: string | null;
  invoiceNumber?: string;
  displayId?: string;
  lineItems: Array<{ description: string; qty: number; price: number }>;
  subtotal: number;
  taxPercent?: number | null;
  total: number;
  currency: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'VOID' | 'OVERDUE' | string;
  dueDate: string;
  paidAt?: string | null;
  paymentUrl?: string | null;
  paymentLink?: any;
  createdAt: string;
  updatedAt?: string;
}
