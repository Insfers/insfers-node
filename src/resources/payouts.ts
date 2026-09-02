import { BaseResource } from './base';
import { listAutoPaging } from '../pagination';
import type { RequestOptions, ListQuery, PaginatedList } from '../types/common';
import type { CreatePayoutParams, Payout } from '../types/payouts';

export class PayoutsResource extends BaseResource {
  /**
   * Programmatically disburses USDC to an external recipient EVM wallet address.
   *
   * @param params Payout parameters (amount, recipientAddress, blockchain)
   * @param options Per-request options
   */
  async create(params: CreatePayoutParams, options?: RequestOptions): Promise<Payout> {
    return this.http.request<Payout>('/payouts', {
      method: 'POST',
      body: params,
      ...options,
    });
  }

  /**
   * Returns a paginated list of payout disbursements.
   *
   * @param query Query parameters (limit, offset)
   * @param options Per-request options
   */
  async list(query?: ListQuery, options?: RequestOptions): Promise<PaginatedList<Payout>> {
    return this.http.requestList<Payout>('/payouts', query, options);
  }

  /**
   * Returns an async iterator that automatically handles pagination across all payouts.
   */
  listAutoPaging(query?: ListQuery, options?: RequestOptions): AsyncIterable<Payout> {
    return listAutoPaging((q) => this.list(q, options), query);
  }

  /**
   * Retrieves a single payout disbursement by its identifier.
   *
   * @param id Payout identifier
   * @param options Per-request options
   */
  async retrieve(id: string, options?: RequestOptions): Promise<Payout> {
    return this.http.request<Payout>(`/payouts/${id}`, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Refreshes the on-chain status of a payout from Circle / Blockchain indexers.
   *
   * @param id Payout identifier
   * @param options Per-request options
   */
  async sync(id: string, options?: RequestOptions): Promise<Payout> {
    return this.http.request<Payout>(`/payouts/${id}/sync`, {
      method: 'POST',
      ...options,
    });
  }
}
