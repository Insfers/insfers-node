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
    { type: 'function', function: InsfersToolDefinitions.getBalanceSummary },
    { type: 'function', function: InsfersToolDefinitions.pay402Challenge },
  ];
}
