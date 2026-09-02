import { BaseResource } from './base';
import { listAutoPaging } from '../pagination';
import type { RequestOptions, ListQuery, PaginatedList } from '../types/common';
import type { CreateInvoiceParams, SendReminderParams, Invoice } from '../types/invoices';

export class InvoicesResource extends BaseResource {
  /**
   * Creates a formal B2B invoice with calculated line items and auto-generated payment link.
   *
   * @param params Invoice parameters (customerName, customerEmail, dueDate, items, address)
   * @param options Per-request options
   */
  async create(params: CreateInvoiceParams, options?: RequestOptions): Promise<Invoice> {
    const rawItems = params.lineItems || params.items || [];
    const lineItems = rawItems.map((item) => ({
      description: item.description,
      qty: item.qty ?? item.quantity ?? 1,
      price: item.price ?? item.unitPrice ?? 0,
    }));

    const payload = {
      customerName: params.customerName || 'Valued Customer',
      customerEmail: params.customerEmail,
      dueDate: params.dueDate,
      lineItems,
      address: params.address || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      network: params.network || 'arc',
      taxPercent: params.taxPercent || 0,
      currency: params.currency || 'USDC',
    };

    const res = await this.http.request<any>('/invoices', {
      method: 'POST',
      body: payload,
      ...options,
    });

    const rawInvoice = res.invoice || res;
    return {
      ...rawInvoice,
      invoiceNumber: rawInvoice.displayId || rawInvoice.invoiceNumber,
      paymentLink: res.paymentLink || rawInvoice.paymentLink,
    };
  }

  /**
   * Returns a paginated list of invoices for the merchant.
   *
   * @param query Query parameters (limit, offset)
   * @param options Per-request options
   */
  async list(query?: ListQuery, options?: RequestOptions): Promise<PaginatedList<Invoice>> {
    return this.http.requestList<Invoice>('/invoices', query, options);
  }

  /**
   * Returns an async iterator that automatically handles pagination across all invoices.
   */
  listAutoPaging(query?: ListQuery, options?: RequestOptions): AsyncIterable<Invoice> {
    return listAutoPaging((q) => this.list(q, options), query);
  }

  /**
   * Retrieves an invoice by its unique identifier.
   *
   * @param id Invoice identifier
   * @param options Per-request options
   */
  async retrieve(id: string, options?: RequestOptions): Promise<Invoice> {
    return this.http.request<Invoice>(`/invoices/${id}`, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Dispatches a payment reminder email to the customer.
   *
   * @param id Invoice identifier
   * @param params Custom message options
   * @param options Per-request options
   */
  async sendReminder(id: string, params?: SendReminderParams, options?: RequestOptions): Promise<{ success: boolean }> {
    return this.http.request<{ success: boolean }>(`/invoices/${id}/reminder`, {
      method: 'POST',
      body: params || {},
      ...options,
    });
  }

  /**
   * Cancels or voids an active invoice.
   *
   * @param id Invoice identifier
   * @param options Per-request options
   */
  async cancel(id: string, options?: RequestOptions): Promise<Invoice> {
    return this.http.request<Invoice>(`/invoices/${id}/cancel`, {
      method: 'POST',
      ...options,
    });
  }

  /**
   * Downloads the generated PDF binary buffer for the invoice.
   *
   * @param id Invoice identifier
   * @param options Per-request options
   * @returns ArrayBuffer containing the binary PDF stream
   */
  async downloadPdf(id: string, options?: RequestOptions): Promise<ArrayBuffer> {
    const res = await this.http.requestRaw(`/invoices/${id}/pdf`, {
      method: 'GET',
      ...options,
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
      const errorBody = contentType.includes('application/json')
        ? await res.json()
        : await res.text();
      throw this.http.buildTypedError(res.status, errorBody, res.headers);
    }

    return await res.arrayBuffer();
  }
}
