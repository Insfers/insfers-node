import { BaseResource } from './base';
import type { RequestOptions } from '../types/common';
import type { Subscription, SubscriptionDetail } from '../types/subscriptions';

export class SubscriptionsResource extends BaseResource {
  /**
   * Returns a list of all active merchant subscriptions.
   *
   * @param options Per-request options
   */
  async list(options?: RequestOptions): Promise<Subscription[]> {
    return this.http.request<Subscription[]>('/subscriptions', {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Retrieves subscription details including customer profile and plan information.
   *
   * @param id Subscription identifier
   * @param options Per-request options
   */
  async retrieve(id: string, options?: RequestOptions): Promise<SubscriptionDetail> {
    return this.http.request<SubscriptionDetail>(`/subscriptions/${id}`, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Cancels a subscription immediately or at period end.
   *
   * @param id Subscription identifier
   * @param options Per-request options
   */
  async cancel(id: string, options?: RequestOptions): Promise<SubscriptionDetail> {
    return this.http.request<SubscriptionDetail>(`/subscriptions/${id}/cancel`, {
      method: 'POST',
      ...options,
    });
  }

  /**
   * Pauses recurring billing for a subscription.
   *
   * @param id Subscription identifier
   * @param options Per-request options
   */
  async pause(id: string, options?: RequestOptions): Promise<SubscriptionDetail> {
    return this.http.request<SubscriptionDetail>(`/subscriptions/${id}/pause`, {
      method: 'POST',
      ...options,
    });
  }

  /**
   * Resumes a paused subscription.
   *
   * @param id Subscription identifier
   * @param options Per-request options
   */
  async resume(id: string, options?: RequestOptions): Promise<SubscriptionDetail> {
    return this.http.request<SubscriptionDetail>(`/subscriptions/${id}/resume`, {
      method: 'POST',
      ...options,
    });
  }
}
