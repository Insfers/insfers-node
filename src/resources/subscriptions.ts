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

  /**
   * Selectively refunds a specific payment sequence in a subscription's billing history.
   *
   * @param id Subscription identifier
   * @param sequence Payment cycle sequence number (e.g. 1 for first charge)
   * @param params Optional refund amount, reason, or cancellation flag
   * @param options Per-request options
   */
  async refundPayment(
    id: string,
    sequence: number,
    params?: import('../types/subscriptions').RefundSubscriptionPaymentParams,
    options?: RequestOptions,
  ): Promise<import('../types/subscriptions').RefundSubscriptionPaymentResponse> {
    return this.http.request<import('../types/subscriptions').RefundSubscriptionPaymentResponse>(
      `/subscriptions/${id}/payments/${sequence}/refund`,
      {
        method: 'POST',
        body: params,
        ...options,
      },
    );
  }

  /**
   * Manually retries a past due or failed recurring subscription charge.
   *
   * @param id Subscription identifier
   * @param options Per-request options
   */
  async retry(
    id: string,
    options?: RequestOptions,
  ): Promise<import('../types/subscriptions').RetrySubscriptionResponse> {
    return this.http.request<import('../types/subscriptions').RetrySubscriptionResponse>(
      `/subscriptions/${id}/retry`,
      {
        method: 'POST',
        ...options,
      },
    );
  }
}
