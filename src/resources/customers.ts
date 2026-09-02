import { BaseResource } from './base';
import { listAutoPaging } from '../pagination';
import type { RequestOptions, ListQuery, PaginatedList } from '../types/common';
import type {
  CreateCustomerParams,
  UpdateCustomerParams,
  Customer,
  CustomerWithHistory,
} from '../types/customers';

export class CustomersResource extends BaseResource {
  /**
   * Creates a new customer profile.
   *
   * @param params Customer parameters (name, email, wallet address)
   * @param options Per-request options
   */
  async create(params: CreateCustomerParams, options?: RequestOptions): Promise<Customer> {
    return this.http.request<Customer>('/customers', {
      method: 'POST',
      body: params,
      ...options,
    });
  }

  /**
   * Returns a paginated list of customers with aggregated spend metrics.
   *
   * @param query Query parameters (limit, offset)
   * @param options Per-request options
   */
  async list(query?: ListQuery, options?: RequestOptions): Promise<PaginatedList<Customer>> {
    return this.http.requestList<Customer>('/customers', query, options);
  }

  /**
   * Returns an async iterator that automatically handles pagination across all customers.
   */
  listAutoPaging(query?: ListQuery, options?: RequestOptions): AsyncIterable<Customer> {
    return listAutoPaging((q) => this.list(q, options), query);
  }

  /**
   * Retrieves a customer profile along with their transaction history.
   *
   * @param id Customer identifier
   * @param options Per-request options
   */
  async retrieve(id: string, options?: RequestOptions): Promise<CustomerWithHistory> {
    return this.http.request<CustomerWithHistory>(`/customers/${id}`, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Updates an existing customer profile.
   *
   * @param id Customer identifier
   * @param params Updated customer parameters
   * @param options Per-request options
   */
  async update(id: string, params: UpdateCustomerParams, options?: RequestOptions): Promise<Customer> {
    return this.http.request<Customer>(`/customers/${id}`, {
      method: 'PATCH',
      body: params,
      ...options,
    });
  }
}
