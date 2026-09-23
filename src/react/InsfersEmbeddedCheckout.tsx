import React, { useState, useEffect, useRef } from 'react';
import { InsfersMark } from './InsfersMark';
import { resolveCheckoutUrl, CHECKOUT_IFRAME_SANDBOX } from '../checkout-url';

export interface InsfersEmbeddedCheckoutProps {
  /**
   * Dynamic on-demand link generator callback (Recommended).
   * Invoked on mount to generate a fresh single-use payment link for this checkout container.
   * Insfers payment links are single-use sessions that expire after one payment.
   */
  createLink?: () => Promise<string | { token?: string; publicToken?: string; link?: string; url?: string }>;
  /**
   * Optional one-time session token if already generated dynamically on the server for this specific checkout session.
   * NOTE: Payment links expire after one use; never pass static or reused links.
   */
  link?: string;
  /**
   * Callback fired upon successful payment settlement.
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
   * Callback fired when iframe finishes loading.
   */
  onReady?: (data?: any) => void;
  /**
   * API base URL or hosted pay app URL override.
   */
  baseUrl?: string;
  /**
   * Optional custom height (defaults to '720px').
   */
  height?: string | number;
  /**
   * Optional CSS class name.
   */
  className?: string;
  /**
   * Optional inline style.
   */
  style?: React.CSSProperties;
}

// resolveCheckoutUrl is now imported from '../checkout-url'

/**
 * Insfers Inline Embedded Checkout (`InsfersEmbeddedCheckout` / `InsfersInlineCheckout`).
 *
 * Embeds the Insfers multi-chain checkout directly into any layout container
 * (like a pricing table, checkout column, or order confirmation step).
 *
 * Single-Use Architecture:
 * Pay links expire after one use. Pass `createLink` to dynamically generate a fresh
 * checkout session on mount.
 *
 * @example
 * ```tsx
 * import { InsfersEmbeddedCheckout } from '@insfers/sdk/react';
 *
 * <InsfersEmbeddedCheckout
 *   createLink={async () => {
 *     const res = await fetch('/api/checkout/create-link', { method: 'POST' });
 *     const { token } = await res.json();
 *     return token;
 *   }}
 *   onSuccess={(res) => router.push(`/success?tx=${res.txHash}`)}
 * />
 * ```
 */
export const InsfersEmbeddedCheckout: React.FC<InsfersEmbeddedCheckoutProps> = ({
  link: initialLink,
  createLink,
  onSuccess,
  onError,
  onReady,
  baseUrl,
  height = '720px',
  className = '',
  style = {},
}) => {
  const [activeLink, setActiveLink] = useState(initialLink || '');
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const hasTriggeredRef = useRef(false);
  const createLinkRef = useRef(createLink);
  createLinkRef.current = createLink;

  const callbacksRef = useRef({ onSuccess, onError, onReady });
  callbacksRef.current = { onSuccess, onError, onReady };

  const loadedUrlRef = useRef('');

  useEffect(() => {
    if (initialLink) {
      setActiveLink(initialLink);
      return;
    }
    if (!hasTriggeredRef.current && createLinkRef.current && typeof createLinkRef.current === 'function') {
      hasTriggeredRef.current = true;
      setIsLoading(true);
      createLinkRef.current()
        .then((res) => {
          const token =
            typeof res === 'string'
              ? res
              : (res as any)?.token || (res as any)?.publicToken || (res as any)?.link || (res as any)?.url || '';
          if (token) setActiveLink(token);
        })
        .catch((err) => {
          hasTriggeredRef.current = false;
          setIsLoading(false);
          callbacksRef.current.onError?.(err instanceof Error ? err : new Error(String(err)));
        });
    }
  }, [initialLink]);

  const checkoutUrl = activeLink ? resolveCheckoutUrl(activeLink, baseUrl) : '';

  useEffect(() => {
    if (!checkoutUrl) return;
    if (loadedUrlRef.current === checkoutUrl) return;

    setIsLoading(true);

    const fallbackTimer = setTimeout(() => {
      loadedUrlRef.current = checkoutUrl;
      setIsLoading(false);
    }, 5000);

    const handleMessage = (e: MessageEvent) => {
      // 1. Source verification: Ensure message strictly comes from this checkout iframe contentWindow
      if (iframeRef.current && e.source !== iframeRef.current.contentWindow) {
        return;
      }

      // 2. Origin verification: Ensure message originates from expected checkout origin
      try {
        const expectedOrigin = new URL(checkoutUrl).origin;
        if (e.origin !== expectedOrigin && e.origin !== window.location.origin) {
          return;
        }
      } catch {
        return;
      }

      const data = e.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'insfers:checkout_ready') {
        clearTimeout(fallbackTimer);
        loadedUrlRef.current = checkoutUrl;
        setIsLoading(false);
        callbacksRef.current.onReady?.(data.data);
      } else if (data.type === 'insfers:checkout_success') {
        callbacksRef.current.onSuccess?.(data.data);
      } else if (data.type === 'insfers:checkout_error') {
        clearTimeout(fallbackTimer);
        loadedUrlRef.current = checkoutUrl;
        setIsLoading(false);
        callbacksRef.current.onError?.(new Error(data.error?.message || 'Checkout failed'));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener('message', handleMessage);
    };
  }, [checkoutUrl]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: '20px',
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.04)',
        ...style,
      }}
    >
      <style>{`
        @keyframes insfers-embed-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        .insfers-embed-shimmer {
          animation: insfers-embed-pulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Smooth crossfade skeleton overlay */}
      <div
        aria-hidden={!isLoading}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#FFFFFF',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          gap: '18px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          opacity: isLoading ? 1 : 0,
          pointerEvents: isLoading ? 'auto' : 'none',
          visibility: isLoading ? 'visible' : 'hidden',
          transition: 'opacity 220ms cubic-bezier(0.16, 1, 0.3, 1), visibility 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header skeleton */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '14px', borderBottom: '1px solid #F1F5F9' }}>
          <InsfersMark size={20} />
          <div className="insfers-embed-shimmer" style={{ width: '140px', height: '14px', borderRadius: '6px', backgroundColor: '#E2E8F0' }} />
        </div>

        {/* Product card skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="insfers-embed-shimmer" style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#E2E8F0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="insfers-embed-shimmer" style={{ width: '120px', height: '14px', borderRadius: '4px', backgroundColor: '#E2E8F0' }} />
              <div className="insfers-embed-shimmer" style={{ width: '80px', height: '10px', borderRadius: '4px', backgroundColor: '#F1F5F9' }} />
            </div>
          </div>
          <div className="insfers-embed-shimmer" style={{ width: '110px', height: '26px', borderRadius: '8px', backgroundColor: '#E2E8F0', marginTop: '4px' }} />
        </div>

        {/* Network pill shimmer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="insfers-embed-shimmer" style={{ width: '90px', height: '11px', borderRadius: '4px', backgroundColor: '#E2E8F0' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="insfers-embed-shimmer" style={{ width: '100px', height: '36px', borderRadius: '12px', backgroundColor: '#F1F5F9' }} />
            <div className="insfers-embed-shimmer" style={{ width: '100px', height: '36px', borderRadius: '12px', backgroundColor: '#F1F5F9' }} />
          </div>
        </div>

        {/* Form inputs shimmer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="insfers-embed-shimmer" style={{ width: '70px', height: '11px', borderRadius: '4px', backgroundColor: '#E2E8F0' }} />
            <div className="insfers-embed-shimmer" style={{ width: '100%', height: '40px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="insfers-embed-shimmer" style={{ width: '85px', height: '11px', borderRadius: '4px', backgroundColor: '#E2E8F0' }} />
            <div className="insfers-embed-shimmer" style={{ width: '100%', height: '40px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }} />
          </div>
        </div>

        {/* Action button shimmer */}
        <div className="insfers-embed-shimmer" style={{ marginTop: 'auto', width: '100%', height: '48px', borderRadius: '14px', backgroundColor: 'rgba(0, 0, 255, 0.12)' }} />
      </div>

      {checkoutUrl && (
        <iframe
          ref={iframeRef}
          src={checkoutUrl}
          title="Insfers Embedded Checkout"
          sandbox={CHECKOUT_IFRAME_SANDBOX}
          allow="payment; camera; clipboard-write"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            backgroundColor: '#FFFFFF',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 220ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      )}
    </div>
  );
};

export const InsfersInlineCheckout = InsfersEmbeddedCheckout;
export type InsfersInlineCheckoutProps = InsfersEmbeddedCheckoutProps;
export default InsfersEmbeddedCheckout;
