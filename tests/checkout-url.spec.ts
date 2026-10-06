import { resolveCheckoutUrl } from '../src/checkout-url';
import { Insfers } from '../src/client';

describe('Checkout URL & Portal URL Resolution', () => {
  afterEach(() => {
    delete (globalThis as any).window;
    delete process.env.INSFERS_CHECKOUT_URL;
    delete process.env.INSFERS_SUBSCRIPTIONS_URL;
  });

  it('resolves raw token to default production checkout host', () => {
    const url = resolveCheckoutUrl('plink_abc123');
    expect(url).toContain('https://checkout.insfers.com/pay/plink_abc123');
    expect(url).toContain('embed=true');
  });

  it('respects INSFERS_CHECKOUT_URL environment variable override', () => {
    process.env.INSFERS_CHECKOUT_URL = 'https://custom-checkout.insfers.com';
    const url = resolveCheckoutUrl('plink_abc123');
    expect(url).toContain('https://custom-checkout.insfers.com/pay/plink_abc123');
    expect(url).toContain('embed=true');
  });

  it('preserves full URL generated dynamically by backend', () => {
    const fullBackendUrl = 'https://custom-staging-checkout.insfers.com/pay/plink_backend_123';
    const url = resolveCheckoutUrl(fullBackendUrl);
    expect(url).toContain('https://custom-staging-checkout.insfers.com/pay/plink_backend_123');
    expect(url).toContain('embed=true');
  });

  it('respects explicit baseUrl override', () => {
    const url = resolveCheckoutUrl('plink_override', 'https://custom-checkout.insfers.com');
    expect(url).toContain('https://custom-checkout.insfers.com/pay/plink_override');
  });

  it('generates customer subscription portal url defaulting to production', () => {
    const client = new Insfers('sk_test_1234567890abcdef123456');
    const portalUrl = client.subscriptions.getPortalUrl('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
    expect(portalUrl).toBe(
      'https://subscriptions.insfers.com/portal/0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    );

    const genericPortal = client.subscriptions.getPortalUrl();
    expect(genericPortal).toBe('https://subscriptions.insfers.com/portal');
  });

  it('respects INSFERS_SUBSCRIPTIONS_URL environment variable override', () => {
    process.env.INSFERS_SUBSCRIPTIONS_URL = 'https://custom-subs.insfers.com';
    const client = new Insfers('sk_test_1234567890abcdef123456');
    const portalUrl = client.subscriptions.getPortalUrl('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
    expect(portalUrl).toBe(
      'https://custom-subs.insfers.com/portal/0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    );
  });
});
