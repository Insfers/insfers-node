import { BaseResource } from './base';
import { listAutoPaging } from '../pagination';
import type { RequestOptions, ListQuery, PaginatedList } from '../types/common';
import type { CreatePaymentLinkParams, PaymentLink } from '../types/payment-links';

export class PaymentLinksResource extends BaseResource {
  /**
   * Generates a multi-chain hosted payment checkout link.
   * Provisions Circle deposit addresses per accepted network.
   *
   * @param params Checkout link parameters including name/title, amount, and networks
   * @param options Per-request options
   */
  async create(params: CreatePaymentLinkParams, options?: RequestOptions): Promise<PaymentLink> {
    const primaryNetwork = params.network || params.networks?.[0] || params.acceptedNetworks?.[0] || 'arc';
    const allNetworks = params.networks || params.acceptedNetworks || [primaryNetwork];

    const payload = {
      name: params.name || params.title || 'Payment Link',
      amount: Number(Number(params.amount).toFixed(2)),
      network: primaryNetwork,
      networks: allNetworks,
      description: params.description,
      address: params.address,
      currency: params.currency || 'USDC',
      expiresInDays: params.expiresInDays,
      redirectUrl: params.redirectUrl,
      logoUrl: params.logoUrl,
      brandColor: params.brandColor,
      type: params.type || 'ONE_TIME',
      planId: params.planId,
      interval: params.interval,
      trialDays: params.trialDays,
      gracePeriodDays: params.gracePeriodDays,
    };

    const res = await this.http.request<any>('/payment-links', {
      method: 'POST',
      body: payload,
      ...options,
    });

    return {
      ...res,
      token: res.publicToken || res.token,
      url: res.payUrl || res.url,
      status: res.status || 'ACTIVE',
    };
  }

  /**
   * Returns a paginated list of payment links created by the merchant.
   *
   * @param query Query parameters (limit, offset)
   * @param options Per-request options
   */
  async list(query?: ListQuery, options?: RequestOptions): Promise<PaginatedList<PaymentLink>> {
    return this.http.requestList<PaymentLink>('/payment-links', query, options);
  }

  /**
   * Returns an async iterator that automatically handles pagination across all payment links.
   */
  listAutoPaging(query?: ListQuery, options?: RequestOptions): AsyncIterable<PaymentLink> {
    return listAutoPaging((q) => this.list(q, options), query);
  }

  /**
   * Retrieves the details of a payment link by its unique checkout token.
   *
   * @param token Payment link unique token
   * @param options Per-request options
   */
  async retrieve(token: string, options?: RequestOptions): Promise<PaymentLink> {
    return this.http.request<PaymentLink>(`/payment-links/${token}`, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Validates a promotional discount coupon code for a specific payment link.
   *
   * @param token Payment link public token
   * @param code Promo coupon code (e.g. 'SUMMER50')
   * @param options Per-request options
   */
  async validatePromo(
    token: string,
    code: string,
    options?: RequestOptions,
  ): Promise<import('../types/payment-links').ValidatePromoResponse> {
    return this.http.request<import('../types/payment-links').ValidatePromoResponse>(
      `/payment-links/${token}/validate-promo`,
      {
        method: 'POST',
        body: { code },
        ...options,
      },
    );
  }

  /**
   * Confirms payment or subscription activation for a payment link.
   *
   * @param token Payment link public token
   * @param params Confirmation payload (name, email, chain, txHash, promoCode, etc.)
   * @param options Per-request options
   */
  async confirm(
    token: string,
    params: import('../types/payment-links').ConfirmPaymentLinkParams,
    options?: RequestOptions,
  ): Promise<any> {
    return this.http.request<any>(`/payment-links/${token}/confirm`, {
      method: 'POST',
      body: params,
      ...options,
    });
  }

  /**
   * Retrieves default or last-used payment link branding settings for the merchant.
   *
   * @param options Per-request options
   */
  async getDefaultBranding(
    options?: RequestOptions,
  ): Promise<import('../types/payment-links').PaymentLinkBranding> {
    return this.http.request<import('../types/payment-links').PaymentLinkBranding>(
      '/payment-links/default-branding',
      {
        method: 'GET',
        ...options,
      },
    );
  }
}

