import React, { useState, useEffect } from 'react';
import { InsfersMark } from './InsfersMark';
import { InsfersIframeModal } from './InsfersIframeModal';
import { resolveCheckoutUrl, prefetchCheckout } from '../checkout-url';

export interface InsfersIframeButtonProps {
  /**
   * Dynamic on-demand link generator callback (Required / Recommended).
   * Invoked upon clicking the button. Returns the generated payment link token or URL.
   * Insfers payment links are single-use sessions that expire after one payment.
   */
  createLink?: () => Promise<string | { token?: string; publicToken?: string; link?: string; url?: string }>;
  /**
   * Optional one-time session token if already generated dynamically on the server for this specific checkout session.
   * NOTE: Payment links expire after one use; never pass static or reused links.
   */
  link?: string;
  /**
   * Optional custom button shape. Defaults to 'pill' (Apple Pay style).
   */
  shape?: 'pill' | 'rounded' | 'square';
  /**
   * Optional custom width. Defaults to false (auto fit content).
   */
  fullWidth?: boolean;
  /**
   * Disables the button.
   */
  disabled?: boolean;
  /**
   * Callback fired upon successful on-chain payment settlement.
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
   * Callback fired when the iframe checkout is loaded and ready.
   */
  onReady?: (data?: any) => void;
  /**
   * API base URL or hosted checkout app URL override.
   */
  baseUrl?: string;
  /**
   * Optional CSS class name for the button.
   */
  className?: string;
  /**
   * Optional inline CSS style for the button.
   */
  style?: React.CSSProperties;
}

/**
 * Insfers Modal Checkout Button (`InsfersCheckoutButton` / `InsfersIframeButton`).
 *
 * Drops a sleek Insfers checkout button into any React app.
 * Clicking it opens an isolated, secure sandboxed modal checkout overlay.
 *
 * Single-Use Architecture:
 * Insfers payment links expire after one use. The button dynamically generates
 * a fresh payment link on-demand when the customer clicks via `createLink`.
 *
 * @example
 * ```tsx
 * import { InsfersCheckoutButton } from '@insfers/sdk/react';
 *
 * <InsfersCheckoutButton
 *   createLink={async () => {
 *     const order = await myBackend.createOrder();
 *     return order.paymentLinkToken;
 *   }}
 *   onSuccess={(res) => console.log('Payment successful!', res.txHash)}
 * />
 * ```
 */
export const InsfersIframeButton: React.FC<InsfersIframeButtonProps> = ({
  link: initialLink,
  createLink,
  shape = 'pill',
  fullWidth = false,
  disabled = false,
  onSuccess,
  onError,
  onClose,
  onReady,
  baseUrl,
  className = '',
  style = {},
}) => {
  const [activeLink, setActiveLink] = useState(initialLink || '');
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isWarmed, setIsWarmed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    if (initialLink) setActiveLink(initialLink);
  }, [initialLink]);

  const borderRadius =
    shape === 'pill' ? '9999px' : shape === 'rounded' ? '14px' : '4px';

  const handleWarmup = () => {
    setIsWarmed(true);
    if (activeLink) {
      try {
        const url = resolveCheckoutUrl(activeLink, baseUrl);
        prefetchCheckout(url);
      } catch {}
    }
  };

  const handleClick = async () => {
    if (disabled || isCreatingLink) return;

    if (createLink && typeof createLink === 'function') {
      try {
        setIsCreatingLink(true);
        const generated = await createLink();
        const tokenOrUrl =
          typeof generated === 'string'
            ? generated
            : (generated as any)?.token || (generated as any)?.publicToken || (generated as any)?.link || (generated as any)?.url || '';
        if (!tokenOrUrl) {
          throw new Error('createLink callback did not return a valid payment link token or URL.');
        }
        setActiveLink(tokenOrUrl);
        setIsOpen(true);
      } catch (err: any) {
        onError?.(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsCreatingLink(false);
      }
    } else {
      setIsOpen(true);
    }
  };

  return (
    <>
      <style>{`
        @keyframes insfers-btn-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <button
        type="button"
        disabled={disabled || isCreatingLink}
        onClick={handleClick}
        onMouseEnter={() => {
          setIsHovered(true);
          handleWarmup();
        }}
        onFocus={handleWarmup}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={isCreatingLink ? 'Generating payment link...' : 'Pay with Insfers'}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          height: '46px',
          minWidth: '160px',
          width: fullWidth ? '100%' : 'auto',
          padding: '0 26px',
          backgroundColor: isHovered && !disabled && !isCreatingLink ? '#0000D0' : '#0000FF',
          color: '#FFFFFF',
          border: 'none',
          borderRadius,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif',
          fontSize: '16px',
          fontWeight: 700,
          letterSpacing: '-0.015em',
          cursor: disabled || isCreatingLink ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          outline: 'none',
          boxShadow: isPressed && !disabled && !isCreatingLink
            ? '0 1px 2px rgba(0, 0, 0, 0.16)'
            : isHovered && !disabled && !isCreatingLink
            ? '0 2px 6px rgba(0, 0, 0, 0.14)'
            : '0 1px 3px rgba(0, 0, 0, 0.08)',
          transform: isPressed && !disabled && !isCreatingLink ? 'scale(0.98)' : 'scale(1)',
          transition:
            'background-color 140ms ease, box-shadow 140ms ease, transform 100ms cubic-bezier(0.16, 1, 0.3, 1), opacity 140ms ease',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          ...style,
        }}
      >
        {isCreatingLink ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              animation: 'insfers-btn-spin 0.75s linear infinite',
              display: 'block',
            }}
          >
            <circle
              cx="12"
              cy="12"
              r="9.5"
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="2.5"
            />
            <path
              d="M12 2.5A9.5 9.5 0 0 1 21.5 12"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <>
            <InsfersMark size={22} variant="inverted" />
            <span>Insfers</span>
          </>
        )}
      </button>

      {/* Sandboxed Checkout Modal Overlay */}
      <InsfersIframeModal
        link={activeLink}
        isOpen={isOpen}
        warm={isWarmed}
        onClose={() => {
          setIsOpen(false);
          onClose?.();
        }}
        onSuccess={(res) => {
          onSuccess?.(res);
        }}
        onError={onError}
        onReady={onReady}
        baseUrl={baseUrl}
      />
    </>
  );
};

export const InsfersCheckoutButton = InsfersIframeButton;
export type InsfersCheckoutButtonProps = InsfersIframeButtonProps;
export default InsfersIframeButton;
