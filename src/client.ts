import { HttpClient } from './http';
import { AuthenticationError, InvalidRequestError } from './errors';
import type { InsfersConfig } from './types/common';

import { PaymentsResource } from './resources/payments';
import { PaymentLinksResource } from './resources/payment-links';
import { CustomersResource } from './resources/customers';
import { RefundsResource } from './resources/refunds';
import { InvoicesResource } from './resources/invoices';
import { PayoutsResource } from './resources/payouts';
import { BalancesResource } from './resources/balances';
import { PlansResource } from './resources/plans';
import { SubscriptionsResource } from './resources/subscriptions';
import { AgentCommerceResource } from './resources/agents';

/**
 * Main client for interacting with the Insfers B2B Payments & Agentic Commerce platform.
 *
 * @example
 * ```typescript
 * import Insfers from '@insfers/sdk';
 *
 * const insfers = new Insfers(process.env.INSFERS_API_KEY!);
 *
 * // Create a payment link
 * const link = await insfers.paymentLinks.create({
 *   title: 'Pro Plan Subscription',
 *   amount: 49.00,
 * });
 * console.log('Checkout URL:', link.url);
 * ```
 */
export class Insfers {
  readonly payments: PaymentsResource;
  readonly paymentLinks: PaymentLinksResource;
  readonly customers: CustomersResource;
  readonly refunds: RefundsResource;
  readonly invoices: InvoicesResource;
  readonly payouts: PayoutsResource;
  readonly balances: BalancesResource;
  readonly plans: PlansResource;
  readonly subscriptions: SubscriptionsResource;
  readonly agents: AgentCommerceResource;

  private readonly http: HttpClient;

  constructor(apiKeyOrConfig: string | InsfersConfig, config: InsfersConfig = {}) {
    // Normalize string vs object arguments
    let rawApiKey: string | undefined;
    let finalConfig: InsfersConfig = {};

    if (typeof apiKeyOrConfig === 'string') {
      rawApiKey = apiKeyOrConfig;
      finalConfig = { ...config };
    } else if (apiKeyOrConfig && typeof apiKeyOrConfig === 'object') {
      rawApiKey = apiKeyOrConfig.apiKey || process.env.INSFERS_API_KEY;
      finalConfig = { ...apiKeyOrConfig };
    } else {
      rawApiKey = process.env.INSFERS_API_KEY;
    }

    // 1. Strict Server-Side Security Barrier
    const isBrowser =
      typeof (globalThis as any).window !== 'undefined' &&
      typeof (globalThis as any).document !== 'undefined';

    if (isBrowser) {
      throw new Error(
        '[@insfers/sdk] Security Error: The Insfers SDK is a server-side library and cannot be instantiated ' +
          'in a client-side browser environment with secret keys. Please route your checkout and payment ' +
          'calls through your backend server.',
      );
    }

    // 2. Key Format Validation
    if (!rawApiKey || typeof rawApiKey !== 'string') {
      throw new AuthenticationError('An API key is required to initialize the Insfers client.');
    }

    const trimmedKey = rawApiKey.trim();
    if (!trimmedKey.startsWith('sk_test_') && !trimmedKey.startsWith('sk_live_')) {
      throw new AuthenticationError(
        `Invalid API key format. The Insfers SDK requires an API key starting with 'sk_test_' (for Sandbox) or 'sk_live_' (for Development/Production). Received: '${trimmedKey.slice(0, 8)}...'`,
      );
    }

    // 3. Protocol Security Enforcement
    const baseUrl = finalConfig.baseUrl || 'https://api.insfers.com';
    const isLocalhost =
      baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || baseUrl.includes('0.0.0.0');

    if (!baseUrl.startsWith('https://') && !isLocalhost) {
      throw new InvalidRequestError(
        `Insecure baseUrl protocol: '${baseUrl}'. Production API endpoints must use HTTPS.`,
      );
    }

    this.http = new HttpClient(trimmedKey, finalConfig);

    // Initialize all 9 core B2B resource modules + Agent commerce
    this.payments = new PaymentsResource(this.http);
    this.paymentLinks = new PaymentLinksResource(this.http);
    this.customers = new CustomersResource(this.http);
    this.refunds = new RefundsResource(this.http);
    this.invoices = new InvoicesResource(this.http);
    this.payouts = new PayoutsResource(this.http);
    this.balances = new BalancesResource(this.http);
    this.plans = new PlansResource(this.http);
    this.subscriptions = new SubscriptionsResource(this.http);
    this.agents = new AgentCommerceResource(this.http);
  }
}
