import { BaseResource } from './base';
import { listAutoPaging } from '../pagination';
import type { RequestOptions, ListQuery, PaginatedList } from '../types/common';
import type { CreatePaymentParams, Payment } from '../types/payments';

export class PaymentsResource extends BaseResource {
  /**
   * Initiates a custodial USDC transfer or cross-chain payment.
   *
   * @param params Payment creation parameters including amount, destination, and network
   * @param options Per-request options such as custom idempotencyKey or timeout
   */
  async create(params: CreatePaymentParams, options?: RequestOptions): Promise<Payment> {
    return this.http.request<Payment>('/payments', {
      method: 'POST',
      body: params,
      ...options,
    });
  }

  /**
   * Returns a paginated list of payments for the authenticated merchant.
   *
   * @param query Query parameters (limit, offset)
   * @param options Per-request options
   */
  async list(query?: ListQuery, options?: RequestOptions): Promise<PaginatedList<Payment>> {
    return this.http.requestList<Payment>('/payments', query, options);
  }

  /**
   * Returns an async iterator that automatically handles pagination across all payments.
   *
   * @example
   * ```typescript
   * for await (const payment of insfers.payments.listAutoPaging({ limit: 100 })) {
   *   console.log(payment.id, payment.amount);
   * }
   * ```
   */
  listAutoPaging(query?: ListQuery, options?: RequestOptions): AsyncIterable<Payment> {
    return listAutoPaging((q) => this.list(q, options), query);
  }

  /**
   * Retrieves a single payment record by its unique identifier.
   *
   * @param id Payment identifier
   * @param options Per-request options
   */
  async retrieve(id: string, options?: RequestOptions): Promise<Payment> {
    return this.http.request<Payment>(`/payments/${id}`, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Refreshes and returns the on-chain settlement status of a payment.
   *
   * @param id Payment identifier
   * @param options Per-request options
   */
  async sync(id: string, options?: RequestOptions): Promise<Payment> {
    return this.http.request<Payment>(`/payments/${id}/sync`, {
      method: 'POST',
      ...options,
    });
  }
}
