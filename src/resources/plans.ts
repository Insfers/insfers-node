import { BaseResource } from './base';
import type { RequestOptions } from '../types/common';
import type { CreatePlanParams, UpdatePlanParams, Plan, PlanDetail } from '../types/subscriptions';

export class PlansResource extends BaseResource {
  /**
   * Creates a new recurring subscription billing plan.
   *
   * @param params Plan parameters (name, amount, billingInterval, features)
   * @param options Per-request options
   */
  async create(params: CreatePlanParams, options?: RequestOptions): Promise<Plan> {
    return this.http.request<Plan>('/plans', {
      method: 'POST',
      body: params,
      ...options,
    });
  }

  /**
   * Returns a list of subscription plans created by the merchant.
   *
   * @param options Per-request options
   */
  async list(options?: RequestOptions): Promise<Plan[]> {
    return this.http.request<Plan[]>('/plans', {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Retrieves a plan's details including active subscriber counts and MRR.
   *
   * @param id Plan identifier
   * @param options Per-request options
   */
  async retrieve(id: string, options?: RequestOptions): Promise<PlanDetail> {
    return this.http.request<PlanDetail>(`/plans/${id}`, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Updates an existing plan's metadata or pricing.
   *
   * @param id Plan identifier
   * @param params Updated plan parameters
   * @param options Per-request options
   */
  async update(id: string, params: UpdatePlanParams, options?: RequestOptions): Promise<PlanDetail> {
    return this.http.request<PlanDetail>(`/plans/${id}`, {
      method: 'PATCH',
      body: params,
      ...options,
    });
  }

  /**
   * Deletes or archives a subscription plan.
   *
   * @param id Plan identifier
   * @param options Per-request options
   */
  async delete(id: string, options?: RequestOptions): Promise<{ ok: boolean }> {
    return this.http.request<{ ok: boolean }>(`/plans/${id}`, {
      method: 'DELETE',
      ...options,
    });
  }
}
