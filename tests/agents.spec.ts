import { AgentCommerceResource } from '../src/resources/agents';
import { HttpClient } from '../src/http';
import { InsfersToolDefinitions, getOpenAITools } from '../src/ai';
import { InvalidRequestError } from '../src/errors';

describe('AgentCommerceResource & x402 Protocol', () => {
  const http = new HttpClient('sk_test_123456');
  const agents = new AgentCommerceResource(http);

  it('correctly decodes comma-separated x402 challenge headers', () => {
    const header = 'amount=0.75,address=0x742d35Cc6634C0532925a3b844Bc454e4438f44e,currency=USDC';
    const parsed = agents.parse402Header(header);

    expect(parsed.amount).toBe(0.75);
    expect(parsed.recipientAddress).toBe('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
    expect(parsed.blockchain).toBe('ARC-TESTNET');
    expect(parsed.currency).toBe('USDC');
  });

  it('correctly decodes JSON formatted x402 challenge headers', () => {
    const jsonHeader = JSON.stringify({
      amount: '2.50',
      recipientAddress: '0x1234567890123456789012345678901234567890',
      blockchain: 'ARC-TESTNET',
      resourceUri: 'https://api.agentdata.com/v1/search',
    });
    const parsed = agents.parse402Header(jsonHeader);

    expect(parsed.amount).toBe(2.5);
    expect(parsed.recipientAddress).toBe('0x1234567890123456789012345678901234567890');
    expect(parsed.blockchain).toBe('ARC-TESTNET');
    expect(parsed.resourceUri).toBe('https://api.agentdata.com/v1/search');
  });

  it('throws InvalidRequestError if x402 challenge amount exceeds maxBudgetUsdc', async () => {
    await expect(
      agents.pay402({
        challenge: {
          amount: 15.0,
          recipientAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          blockchain: 'BASE-SEPOLIA',
        },
        maxBudgetUsdc: 5.0,
      }),
    ).rejects.toThrow(InvalidRequestError);
  });

  it('exports valid OpenAI Tool definitions', () => {
    const tools = getOpenAITools();
    expect(tools.length).toBe(4);
    expect(InsfersToolDefinitions.createPayment.name).toBe('create_payment');
    expect(InsfersToolDefinitions.pay402Challenge.name).toBe('pay_402_challenge');
  });
});
