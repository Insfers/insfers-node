import { BaseResource } from './base';
import type { RequestOptions } from '../types/common';
import type { BalanceSummary } from '../types/balances';

export class BalancesResource extends BaseResource {
  /**
   * Retrieves aggregated live USDC balances across all merchant provisioned Circle wallets.
   *
   * @param options Per-request options
   */
  async getSummary(options?: RequestOptions): Promise<BalanceSummary> {
    return this.http.request<BalanceSummary>('/balances', {
      method: 'GET',
      ...options,
    });
  }

  /** Alias for getSummary() */
  async list(options?: RequestOptions): Promise<BalanceSummary> {
    return this.getSummary(options);
  }

  /** Alias for getSummary() */
  async get(options?: RequestOptions): Promise<BalanceSummary> {
    return this.getSummary(options);
  }
}
