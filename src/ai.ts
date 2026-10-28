/**
 * Pre-configured AI tool calling schemas for OpenAI, Anthropic Claude, Vercel AI SDK, and LangChain.
 */
export const InsfersToolDefinitions = {
  /**
   * Tool definition for creating an on-chain USDC payment.
   */
  createPayment: {
    name: 'create_payment',
    description: 'Initiate an on-chain USDC payment or transfer to a destination wallet on supported blockchains (e.g. ARC-TESTNET, BASE-SEPOLIA).',
    parameters: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Amount in USDC (e.g. 10.50).',
        },
        destination: {
          type: 'string',
          description: 'Recipient EVM wallet address (0x...).',
        },
        blockchain: {
          type: 'string',
          description: "Target blockchain network (e.g. 'ARC-TESTNET', 'BASE-SEPOLIA', 'ETH-SEPOLIA').",
          default: 'ARC-TESTNET',
        },
        description: {
          type: 'string',
          description: 'Reason or memo for the payment.',
        },
      },
      required: ['amount', 'destination'],
    },
  },

  /**
   * Tool definition for generating a multi-chain payment checkout link.
   */
  createPaymentLink: {
    name: 'create_payment_link',
    description: 'Generate a multi-chain hosted checkout payment link for a customer with automatic deposit wallet provisioning.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Product or invoice title displayed to the customer.',
        },
        amount: {
          type: 'number',
          description: 'Price in USDC.',
        },
        catalogItemId: {
          type: 'string',
          description: 'Optional catalog item ID to link to this checkout session.',
        },
        description: {
          type: 'string',
          description: 'Product description or details.',
        },
        acceptedNetworks: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of accepted blockchain networks.',
        },
      },
      required: ['title', 'amount'],
    },
  },

  /**
   * Tool definition for creating a new product or subscription plan in the merchant catalog.
   */
  createCatalogItem: {
    name: 'create_catalog_item',
    description: 'Add a new product or recurring subscription plan to the merchant catalog with automated SKU generation and plan provisioning.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Display name of the product, service, or membership tier.',
        },
        categoryId: {
          type: 'string',
          description: 'Target catalog category UUID.',
        },
        sku: {
          type: 'string',
          description: 'Stock Keeping Unit identifier (e.g. PRO-ANNUAL-01). Auto-derived if omitted.',
        },
        price: {
          type: 'number',
          description: 'Price in USDC (e.g. 49.00). Minimum 0.30.',
        },
        currency: {
          type: 'string',
          enum: ['USDC', 'EURC'],
          description: 'Token currency (default USDC; recurring subscription items must be USDC).',
        },
        type: {
          type: 'string',
          enum: ['PRODUCT', 'SERVICE'],
          description: 'Item classification (default SERVICE).',
        },
        billingType: {
          type: 'string',
          enum: ['ONE_TIME', 'RECURRING'],
          description: 'Whether this is a one-time purchase or recurring subscription.',
        },
        interval: {
          type: 'string',
          enum: ['HOURLY', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'],
          description: 'Billing cadence (required when billingType is RECURRING).',
        },
        trialDays: {
          type: 'number',
          description: 'Free trial duration in days for subscription items.',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the product or plan features.',
        },
      },
      required: ['name', 'categoryId', 'price'],
    },
  },

  /**
   * Tool definition for listing items and subscriptions from the catalog.
   */
  listCatalogItems: {
    name: 'list_catalog_items',
    description: 'Query products, services, and subscription plans in the merchant catalog.',
    parameters: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Keyword search across SKU, title, and description.',
        },
        billingType: {
          type: 'string',
          enum: ['ONE_TIME', 'RECURRING'],
          description: 'Filter by one-time or recurring subscription items.',
        },
        status: {
          type: 'string',
          enum: ['all', 'active', 'inactive'],
          description: "Filter by active status ('active', 'inactive', 'all'). When omitted, returns all items.",
        },
      },
    },
  },

  /**
   * Tool definition for checking live treasury balances.
   */
  getBalanceSummary: {
    name: 'get_balance_summary',
    description: 'Retrieve live multi-chain USDC balances across all merchant treasury wallets.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },

  /**
   * Tool definition for autonomous x402 payment execution.
   */
  pay402Challenge: {
    name: 'pay_402_challenge',
    description: 'Autonomously resolve and settle an HTTP 402 Payment Required challenge on behalf of an AI agent.',
    parameters: {
      type: 'object',
      properties: {
        challengeHeader: {
          type: 'string',
          description: 'The raw x402 challenge header string from the protected resource response.',
        },
        maxBudgetUsdc: {
          type: 'number',
          description: 'Maximum authorized budget limit in USDC for this payment.',
        },
      },
      required: ['challengeHeader'],
    },
  },
};

/**
 * Returns an array of all Insfers tool definitions ready for OpenAI or Vercel AI SDK function calling.
 */
export function getOpenAITools() {
  return [
    { type: 'function', function: InsfersToolDefinitions.createPayment },
    { type: 'function', function: InsfersToolDefinitions.createPaymentLink },
    { type: 'function', function: InsfersToolDefinitions.createCatalogItem },
    { type: 'function', function: InsfersToolDefinitions.listCatalogItems },
    { type: 'function', function: InsfersToolDefinitions.getBalanceSummary },
    { type: 'function', function: InsfersToolDefinitions.pay402Challenge },
  ];
}
