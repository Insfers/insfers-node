/**
 * Shared checkout URL utilities for all SDK integration surfaces
 * (InsfersIframeModal, InsfersEmbeddedCheckout, and openInsfersCheckout).
 *
 * Single source of truth to prevent divergence across the three integration modes.
 */

/**
 * The HTML iframe `sandbox` attribute value used across all SDK checkout iframes.
 *
 * - `allow-scripts`: Required for checkout page JavaScript and wallet interactions.
 * - `allow-forms`: Required for form submissions within the checkout page.
 * - `allow-same-origin`: Required so the iframe can use its own cookies/storage and
 *   wallet provider communication (WalletConnect relay, injected wallets).
 * - `allow-popups`: Required for wallet connection flows (e.g., WalletConnect QR modal,
 *   mobile deep links, Coinbase Wallet popup).
 * - `allow-popups-to-escape-sandbox`: Required so wallet popups opened from the
 *   sandboxed iframe can function normally (e.g., MetaMask confirmation windows).
 * - `allow-top-navigation-by-user-activation`: Allows redirect-based wallet flows
 *   only when initiated by a user gesture (click).
 *
 * IMPORTANT: `allow-modals` is intentionally excluded to prevent `alert()`/`confirm()`
 * prompt injection from a compromised checkout origin.
 */
export const CHECKOUT_IFRAME_SANDBOX =
  'allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation';

/**
 * Resolves a payment link token, UUID, or full checkout URL into a fully-qualified
 * checkout URL with embed query parameters.
 *
 * @param link - Payment link token, UUID, or full URL
 * @param baseUrl - Optional override for the checkout host
 * @returns Fully-qualified checkout URL with `embed=true` and `parentOrigin` params
 */
export function resolveCheckoutUrl(link: string, baseUrl?: string): string {
  const trimmed = String(link ?? '').trim();
  const defaultHost =
    baseUrl ||
    (typeof window !== 'undefined' && window.location.hostname.includes('localhost')
      ? 'http://localhost:5173'
      : 'https://checkout.insfers.com');

  let token = trimmed;
  if (trimmed.includes('/pay/')) {
    const parts = trimmed.split('/pay/');
    const last = parts[parts.length - 1] || '';
    const withoutQuery = last.split('?')[0] || '';
    token = withoutQuery.split('#')[0] || '';
  }

  let fullUrl: string;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    fullUrl = trimmed;
  } else {
    fullUrl = `${defaultHost.replace(/\/$/, '')}/pay/${token}`;
  }

  const urlObj = new URL(
    fullUrl,
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
  );
  urlObj.searchParams.set('embed', 'true');
  if (typeof window !== 'undefined' && window.location.origin) {
    urlObj.searchParams.set('parentOrigin', window.location.origin);
  }
  return urlObj.toString();
}

const _preconnectedOrigins = new Set<string>();
/**
 * Injects a `<link rel="preconnect">` for the checkout origin to warm TCP+TLS.
 * Tracks per-origin to support multiple base URLs cleanly without redundant links.
 */
export function preconnectCheckout(url: string): void {
  if (typeof document === 'undefined') return;
  try {
    const origin = new URL(url).origin;
    if (_preconnectedOrigins.has(origin)) return;
    if (!document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) {
      const pc = document.createElement('link');
      pc.rel = 'preconnect';
      pc.href = origin;
      pc.crossOrigin = 'anonymous';
      document.head.appendChild(pc);
    }
    _preconnectedOrigins.add(origin);
  } catch {}
}

const _prefetchedUrls = new Set<string>();
/**
 * Injects a `<link rel="prefetch">` for the checkout document to warm the cache.
 * Tracks per-URL to support multiple checkout links cleanly.
 */
export function prefetchCheckout(url: string): void {
  if (typeof document === 'undefined') return;
  try {
    if (_prefetchedUrls.has(url)) return;
    if (!document.querySelector(`link[rel="prefetch"][href="${url}"]`)) {
      const pf = document.createElement('link');
      pf.rel = 'prefetch';
      pf.href = url;
      pf.as = 'document';
      document.head.appendChild(pf);
    }
    _prefetchedUrls.add(url);
  } catch {}
}

