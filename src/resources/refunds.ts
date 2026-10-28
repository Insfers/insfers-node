import { BaseResource } from './base';
import { listAutoPaging } from '../pagination';
import { cleanDecimal } from '../utils';
import type { RequestOptions, ListQuery, PaginatedList } from '../types/common';
import type { CreateRefundParams, Refund, RefundableDetails } from '../types/refunds';

export class RefundsResource extends BaseResource {
  /**
   * Issues a direct on-chain USDC refund or creates a claimable refund link.
   *
   * @param params Refund parameters (paymentId, amount, type, reason, claimable)
   * @param options Per-request options
   */
  async create(params: CreateRefundParams, options?: RequestOptions): Promise<Refund> {
    const refundType = params.type || (params.claimable ? 'CLAIMABLE' : 'DIRECT');
    const payload = {
      paymentId: params.paymentId,
      amount: cleanDecimal(params.amount),
      type: refundType,
      ...(params.reason ? { reason: params.reason } : {}),
      ...(params.destinationChain ? { destinationChain: params.destinationChain } : {}),
      ...(params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : {}),
    };

    return this.http.request<Refund>('/refunds', {
      method: 'POST',
      body: payload,
      ...options,
    });
  }

  /**
   * Retrieves the refundable balance breakdown for a payment, including the max refundable amount
   * (capped at merchant net amount minus any prior refunded or reserved amounts).
   *
   * @param paymentId Payment identifier
   * @param options Per-request options
   */
  async getRefundable(paymentId: string, options?: RequestOptions): Promise<RefundableDetails> {
    return this.http.request<RefundableDetails>(`/refunds/refundable/${paymentId}`, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Returns a paginated list of refund transactions.
   *
   * @param query Query parameters (limit, offset)
   * @param options Per-request options
   */
  async list(query?: ListQuery, options?: RequestOptions): Promise<PaginatedList<Refund>> {
    return this.http.requestList<Refund>('/refunds', query, options);
  }

  /**
   * Returns an async iterator that automatically handles pagination across all refunds.
   */
  listAutoPaging(query?: ListQuery, options?: RequestOptions): AsyncIterable<Refund> {
    return listAutoPaging((q) => this.list(q, options), query);
  }

  /**
   * Retrieves a single refund transaction by its identifier.
   *
   * @param id Refund identifier
   * @param options Per-request options
   */
  async retrieve(id: string, options?: RequestOptions): Promise<Refund> {
    return this.http.request<Refund>(`/refunds/${id}`, {
      method: 'GET',
      ...options,
    });
  }
}
