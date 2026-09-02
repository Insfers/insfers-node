import { BaseResource } from './base';
import { InvalidRequestError } from '../errors';
import type { RequestOptions } from '../types/common';
import type { Payment } from '../types/payments';

export interface X402PaymentChallenge {
  /**
   * Amount required in USDC (e.g. 0.50).
   */
  amount: number;

  /**
   * Destination EVM wallet address to receive payment.
   */
  recipientAddress: string;

  /**
   * Target blockchain network (e.g. 'BASE-SEPOLIA', 'ARC-TESTNET').
   */
  blockchain: string;

  /**
   * Currency code (defaults to 'USDC').
   */
  currency?: string;

  /**
   * Optional resource URI or memo associated with the 402 challenge.
   */
  resourceUri?: string;
}

export interface Pay402Params {
  /**
   * Parsed x402 challenge object or raw 'x-402-challenge' header string.
   */
  challenge: X402PaymentChallenge | string;

  /**
   * Maximum budget in USDC the agent is authorized to spend on this single challenge.
   */
  maxBudgetUsdc?: number;

  /**
   * Optional description or agent task reference.
   */
  description?: string;
}

export class AgentCommerceResource extends BaseResource {
  /**
   * Parses an HTTP 402 Payment Required challenge header into a structured payment object.
   *
   * @param header Raw header value (e.g. 'amount=0.50,currency=USDC,address=0x...,network=BASE-SEPOLIA')
   */
  parse402Header(header: string): X402PaymentChallenge {
    if (!header || typeof header !== 'string') {
      throw new InvalidRequestError('Invalid or empty x402 challenge header.');
    }

    // Try parsing as JSON first
    try {
      const parsed = JSON.parse(header);
      if (parsed.amount && (parsed.recipientAddress || parsed.address)) {
        return {
          amount: parseFloat(parsed.amount),
          recipientAddress: parsed.recipientAddress || parsed.address,
          blockchain: parsed.blockchain || parsed.network || 'ARC-TESTNET',
          currency: parsed.currency || 'USDC',
          resourceUri: parsed.resourceUri,
        };
      }
    } catch {
      // Fall through to key-value parsing
    }

    // Parse key-value comma delimited (amount=1.0,address=0x...,network=...)
    const pairs = header.split(',').map((p) => p.trim());
    const dict: Record<string, string> = {};
    for (const pair of pairs) {
      const [k, ...v] = pair.split('=');
      if (k && v.length > 0) {
        dict[k.trim().toLowerCase()] = v.join('=').trim();
      }
    }

    const amount = parseFloat(dict['amount'] || '0');
    const recipientAddress = dict['address'] || dict['recipient'] || dict['recipientaddress'];
    const blockchain = dict['network'] || dict['blockchain'] || 'ARC-TESTNET';
    const currency = dict['currency'] || 'USDC';

    if (!amount || isNaN(amount) || !recipientAddress) {
      throw new InvalidRequestError(
        `Unable to parse x402 header. Header must contain 'amount' and 'address'. Received: ${header}`,
      );
    }

    return {
      amount,
      recipientAddress,
      blockchain,
      currency,
      resourceUri: dict['resource'] || dict['resourceuri'],
    };
  }

  /**
   * Autonomously executes a payment in response to an HTTP 402 Payment Required challenge.
   * Validates the requested amount against the agent's authorized budget before executing.
   *
   * @param params Challenge parameters and max budget limit
   * @param options Per-request options
   *
   * @example
   * ```typescript
   * const payment = await insfers.agents.pay402({
   *   challenge: 'amount=0.10,address=0x742d35Cc6634C0532925a3b844Bc454e4438f44e,network=BASE-SEPOLIA',
   *   maxBudgetUsdc: 1.00,
   *   description: 'LLM context retrieval payment',
   * });
   * ```
   */
  async pay402(params: Pay402Params, options?: RequestOptions): Promise<Payment> {
    const challenge =
      typeof params.challenge === 'string'
        ? this.parse402Header(params.challenge)
        : params.challenge;

    if (params.maxBudgetUsdc !== undefined && challenge.amount > params.maxBudgetUsdc) {
      throw new InvalidRequestError(
        `x402 challenge amount (${challenge.amount} USDC) exceeds agent maximum budget (${params.maxBudgetUsdc} USDC).`,
        { code: 'budget_exceeded', param: 'maxBudgetUsdc' },
      );
    }

    return this.http.request<Payment>('/payouts', {
      method: 'POST',
      body: {
        amount: challenge.amount,
        walletAddress: challenge.recipientAddress,
        recipientAddress: challenge.recipientAddress,
        recipientName: 'x402 Resource Provider',
        blockchain: challenge.blockchain,
        currency: challenge.currency || 'USDC',
        description: params.description || `Autonomous agent payment for ${challenge.resourceUri || 'x402 resource'}`,
      },
      ...options,
    });
  }
}
