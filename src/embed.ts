/**
 * Pure Vanilla JS / Scriptable Hosted Checkout Suite.
 *
 * Allows non-React sites (HTML, Vue, Svelte, Webflow, Shopify, WordPress)
 * to render the official Insfers checkout button and open the sandboxed checkout modal dynamically.
 */

import { resolveCheckoutUrl, prefetchCheckout, CHECKOUT_IFRAME_SANDBOX } from './checkout-url';
import { INSFERS_MARK_INVERTED, INSFERS_MARK_STANDARD } from './logo';

export { INSFERS_MARK_INVERTED, INSFERS_MARK_STANDARD };

export interface OpenCheckoutOptions {
  /**
   * Dynamic on-demand link generator callback (Required / Recommended).
   * Invoked upon opening checkout. Returns the generated single-use payment link token or URL.
   * Insfers payment links are single-use sessions that expire after one payment.
   */
  createLink?: () => Promise<string | { token?: string; publicToken?: string; link?: string; url?: string }>;
  /**
   * Optional one-time session token if already generated dynamically on the server for this specific checkout session.
   * NOTE: Payment links expire after one use; never pass static or reused links.
   */
  link?: string;
  /**
   * Optional base checkout URL (defaults to https://checkout.insfers.com).
   */
  baseUrl?: string;
  /**
   * Callback fired upon successful payment.
   */
  onSuccess?: (result: {
    txHash?: string;
    token?: string;
    amount?: number;
    currency?: string;
    chain?: string;
    customerName?: string;
    customerEmail?: string;
  }) => void;
  /**
   * Callback fired on checkout error.
   */
  onError?: (error: Error) => void;
  /**
   * Callback fired when popup is closed.
   */
  onClose?: () => void;
  /**
   * Callback fired when iframe is ready.
   */
  onReady?: (data?: any) => void;
}

export interface InsfersButtonOptions extends OpenCheckoutOptions {
  /**
   * Button border radius style. Defaults to 'pill' (Apple Pay style).
   */
  shape?: 'pill' | 'rounded' | 'square';
  /**
   * Stretches the button to 100% of container width. Defaults to false.
   */
  fullWidth?: boolean;
  /**
   * Button text label. Defaults to 'Insfers'.
   */
  label?: string;
  /**
   * Disables the button.
   */
  disabled?: boolean;
  /**
   * Additional custom CSS class name.
   */
  className?: string;
  /**
   * Optional custom inline styles.
   */
  style?: Partial<CSSStyleDeclaration>;
}

/**
 * Opens the sandboxed Insfers checkout overlay modal in any browser environment.
 */
export function openInsfersCheckout(options: OpenCheckoutOptions): { close: () => void } {
  if (typeof document === 'undefined') {
    throw new Error('openInsfersCheckout can only be called in a browser environment.');
  }

  const { link: initialLink, createLink, baseUrl, onSuccess, onError, onClose, onReady } = options;

  // Create overlay backdrop
  const overlay = document.createElement('div');
  overlay.id = 'insfers-checkout-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '999999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    opacity: '0',
    transition: 'opacity 200ms ease-out',
  });

  // Create card container
  const card = document.createElement('div');
  Object.assign(card.style, {
    position: 'relative',
    width: '100%',
    maxWidth: '480px',
    height: 'min(615px, 94vh)',
    maxHeight: '94vh',
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    transform: 'scale(0.96)',
    transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), height 200ms cubic-bezier(0.16, 1, 0.3, 1)',
  });

  // Iframe
  const iframe = document.createElement('iframe');
  iframe.title = 'Insfers Checkout';
  iframe.setAttribute('sandbox', CHECKOUT_IFRAME_SANDBOX);
  iframe.setAttribute('allow', 'payment; camera; clipboard-write');
  Object.assign(iframe.style, {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
    backgroundColor: '#FFFFFF',
  });

  card.appendChild(iframe);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // Animate in
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    card.style.transform = 'scale(1)';
  });

  const cleanup = () => {
    overlay.style.opacity = '0';
    card.style.transform = 'scale(0.96)';
    window.removeEventListener('message', handleMessage);
    window.removeEventListener('keydown', handleKeyDown);
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 200);
    onClose?.();
  };

  overlay.onclick = (e) => {
    if (e.target === overlay) cleanup();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') cleanup();
  };
  window.addEventListener('keydown', handleKeyDown);

  const handleMessage = (e: MessageEvent) => {
    // 1. Source verification: Ensure message strictly comes from this checkout iframe contentWindow
    if (iframe.contentWindow && e.source !== iframe.contentWindow) {
      return;
    }

    // 2. Origin verification: Ensure message originates from expected checkout origin
    try {
      const expectedOrigin = new URL(iframe.src).origin;
      if (e.origin !== expectedOrigin && e.origin !== window.location.origin) {
        return;
      }
    } catch {
      return;
    }

    const data = e.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'insfers:checkout_ready') {
      onReady?.(data.data);
    } else if (data.type === 'insfers:checkout_resize' && typeof data.height === 'number' && data.height > 100) {
      card.style.height = `min(${data.height}px, 94vh)`;
    } else if (data.type === 'insfers:checkout_success') {
      onSuccess?.(data.data);
    } else if (data.type === 'insfers:checkout_close') {
      cleanup();
    } else if (data.type === 'insfers:checkout_error') {
      onError?.(new Error(data.error?.message || 'Checkout failed'));
    }
  };
  window.addEventListener('message', handleMessage);

  if (createLink && typeof createLink === 'function') {
    createLink()
      .then((generated) => {
        const tokenOrUrl =
          typeof generated === 'string'
            ? generated
            : (generated as any)?.token || (generated as any)?.publicToken || (generated as any)?.link || (generated as any)?.url || '';
        if (!tokenOrUrl) {
          throw new Error('createLink callback did not return a valid payment link token or URL.');
        }
        iframe.src = resolveCheckoutUrl(tokenOrUrl, baseUrl);
      })
      .catch((err) => {
        onError?.(err instanceof Error ? err : new Error(String(err)));
        cleanup();
      });
  } else if (initialLink) {
    iframe.src = resolveCheckoutUrl(initialLink, baseUrl);
  }

  return { close: cleanup };
}

/**
 * Creates the official Insfers Electric Blue checkout button with the white circular logo mark.
 * Enforces the brand-standard design across Vanilla JS, Webflow, Shopify, WordPress, Vue, and Svelte.
 *
 * @returns Configured HTMLButtonElement
 */
export function createInsfersButton(options: InsfersButtonOptions = {}): HTMLButtonElement {
  if (typeof document === 'undefined') {
    throw new Error('createInsfersButton can only be called in a browser environment.');
  }

  const {
    shape = 'pill',
    fullWidth = false,
    label = 'Insfers',
    disabled = false,
    className = '',
    style = {},
  } = options;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('aria-label', `Pay with ${label}`);

  const borderRadius = shape === 'pill' ? '9999px' : shape === 'rounded' ? '14px' : '4px';

  Object.assign(btn.style, {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    height: '46px',
    minWidth: '160px',
    width: fullWidth ? '100%' : 'auto',
    padding: '0 26px',
    backgroundColor: '#0000FF',
    color: '#FFFFFF',
    border: 'none',
    borderRadius,
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif',
    fontSize: '16px',
    fontWeight: '700',
    letterSpacing: '-0.015em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? '0.6' : '1',
    outline: 'none',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    transform: 'scale(1)',
    transition: 'background-color 140ms ease, box-shadow 140ms ease, transform 100ms cubic-bezier(0.16, 1, 0.3, 1), opacity 140ms ease',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    ...style,
  });

  if (className) {
    btn.className = className;
  }

  // Set default button inner content with official logo mark
  const renderNormalContent = () => {
    btn.innerHTML = `
      <img
        src="${INSFERS_MARK_INVERTED}"
        alt="Insfers Mark"
        width="22"
        height="22"
        style="width:22px; height:22px; border-radius:50%; object-fit:contain; display:inline-block; vertical-align:middle; pointer-events:none; flex-shrink:0;"
        draggable="false"
      />
      <span style="font-weight:700; letter-spacing:-0.015em; color:#FFFFFF;">${label}</span>
    `;
  };

  const renderSpinner = () => {
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="animation:insfers-btn-spin 0.75s linear infinite; display:block;">
        <circle cx="12" cy="12" r="9.5" stroke="rgba(255, 255, 255, 0.25)" stroke-width="2.5"></circle>
        <path d="M12 2.5A9.5 9.5 0 0 1 21.5 12" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"></path>
      </svg>
    `;
  };

  renderNormalContent();

  // Inject keyframe animation if not already injected
  if (!document.getElementById('insfers-btn-keyframes')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'insfers-btn-keyframes';
    styleEl.textContent = `
      @keyframes insfers-btn-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleEl);
  }

  // Hover & Active States
  btn.addEventListener('mouseenter', () => {
    if (!btn.disabled) {
      btn.style.backgroundColor = '#0000D0';
      btn.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.14)';
      if (options.link) {
        try {
          const url = resolveCheckoutUrl(options.link, options.baseUrl);
          prefetchCheckout(url);
        } catch {}
      }
    }
  });

  btn.addEventListener('mouseleave', () => {
    if (!btn.disabled) {
      btn.style.backgroundColor = '#0000FF';
      btn.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)';
      btn.style.transform = 'scale(1)';
    }
  });

  btn.addEventListener('mousedown', () => {
    if (!btn.disabled) {
      btn.style.transform = 'scale(0.98)';
      btn.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.16)';
    }
  });

  btn.addEventListener('mouseup', () => {
    if (!btn.disabled) {
      btn.style.transform = 'scale(1)';
    }
  });

  // Click Action
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (btn.disabled) return;

    if (options.createLink && typeof options.createLink === 'function') {
      try {
        btn.disabled = true;
        renderSpinner();
        const linkResult = await options.createLink();
        const token =
          typeof linkResult === 'string'
            ? linkResult
            : (linkResult as any)?.token || (linkResult as any)?.publicToken || (linkResult as any)?.link || (linkResult as any)?.url;
        
        openInsfersCheckout({
          ...options,
          link: token,
          onClose: () => {
            btn.disabled = false;
            renderNormalContent();
            options.onClose?.();
          },
        });
      } catch (err: any) {
        btn.disabled = false;
        renderNormalContent();
        options.onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    } else {
      openInsfersCheckout(options);
    }
  });

  return btn;
}

/**
 * Mounts the official Insfers checkout button into a container element or CSS selector.
 *
 * @param container - Target HTMLElement or selector string (e.g. '#pay-container')
 * @param options - Button and checkout configuration options
 * @returns Object containing the mounted button and a destroy function
 */
export function renderInsfersButton(
  container: HTMLElement | string,
  options: InsfersButtonOptions = {},
): { button: HTMLButtonElement; destroy: () => void } {
  if (typeof document === 'undefined') {
    throw new Error('renderInsfersButton can only be called in a browser environment.');
  }

  const targetEl =
    typeof container === 'string' ? (document.querySelector(container) as HTMLElement) : container;

  if (!targetEl) {
    throw new Error(`Target container '${container}' was not found in the DOM.`);
  }

  const button = createInsfersButton(options);
  targetEl.appendChild(button);

  return {
    button,
    destroy: () => {
      if (button.parentNode) {
        button.parentNode.removeChild(button);
      }
    },
  };
}

/**
 * Injects official Insfers button CSS styles for classes `.insfers-btn` and `.insfers-checkout-button`.
 * Useful for static HTML, Shopify, Webflow, and CMS platforms.
 */
export function injectInsfersButtonStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('insfers-button-styles')) return;

  const styleEl = document.createElement('style');
  styleEl.id = 'insfers-button-styles';
  styleEl.textContent = `
    .insfers-btn, .insfers-checkout-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 46px;
      min-width: 160px;
      padding: 0 26px;
      background-color: #0000FF !important;
      color: #FFFFFF !important;
      border: none !important;
      border-radius: 9999px;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif !important;
      font-size: 16px !important;
      font-weight: 700 !important;
      letter-spacing: -0.015em !important;
      cursor: pointer;
      outline: none;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      text-decoration: none !important;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      transform: scale(1);
      transition: background-color 140ms ease, box-shadow 140ms ease, transform 100ms cubic-bezier(0.16, 1, 0.3, 1), opacity 140ms ease;
    }
    .insfers-btn:hover, .insfers-checkout-button:hover {
      background-color: #0000D0 !important;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.14) !important;
    }
    .insfers-btn:active, .insfers-checkout-button:active {
      transform: scale(0.98) !important;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.16) !important;
    }
    .insfers-btn:disabled, .insfers-checkout-button:disabled {
      opacity: 0.6 !important;
      cursor: not-allowed !important;
    }
    .insfers-btn img, .insfers-checkout-button img {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      object-fit: contain;
      display: inline-block;
      vertical-align: middle;
      pointer-events: none;
      flex-shrink: 0;
    }
  `;
  document.head.appendChild(styleEl);
}
