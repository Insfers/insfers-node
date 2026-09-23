import React, { useState, useEffect, useRef } from 'react';
import {
  resolveCheckoutUrl,
  preconnectCheckout,
  prefetchCheckout,
  CHECKOUT_IFRAME_SANDBOX,
} from '../checkout-url';

export interface InsfersIframeModalProps {
  /**
   * Payment link identifier, public token, or full checkout URL.
   * e.g. "b1702c0a-727d-41ff-8324-ebacb2b07313" or "https://dev.insfers.com/pay/b1702c0a..."
   */
  link: string;
  /**
   * Modal visibility state.
   */
  isOpen: boolean;
  /**
   * Callback fired when modal is closed by the customer or backdrop.
   */
  onClose: () => void;
  /**
   * Optional background pre-warm flag.
   */
  warm?: boolean;
  /**
   * Callback fired upon successful on-chain settlement.
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
   * Callback fired when iframe finishes loading the checkout payload.
   */
  onReady?: (data?: any) => void;
  /**
   * API base URL or hosted pay app URL override.
   * Defaults to 'https://checkout.insfers.com' (or 'http://localhost:5173' in dev).
   */
  baseUrl?: string;
  /**
   * Optional custom CSS class name for the modal overlay.
   */
  className?: string;
  /**
   * Optional z-index for the modal overlay (defaults to 999999).
   */
  zIndex?: number;
}

// resolveCheckoutUrl, preconnectCheckout, prefetchCheckout are now imported from '../checkout-url'
// Re-export for backward compatibility with any external consumers
export { resolveCheckoutUrl, preconnectCheckout, prefetchCheckout } from '../checkout-url';

const INITIAL_HEIGHT = 615;

function ModalSkeleton() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '615px', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
        @keyframes insfers-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        .insfers-shimmer {
          animation: insfers-pulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: 13, height: 13, borderRadius: 4, background: '#E2E8F0' }} />
          <div style={{ width: 90, height: 12, borderRadius: 4, background: '#E2E8F0' }} />
        </div>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F1F5F9' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="insfers-shimmer" style={{ width: 32, height: 32, borderRadius: 8, background: '#E2E8F0', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="insfers-shimmer" style={{ width: 128, height: 14, borderRadius: 4, background: '#E2E8F0' }} />
            <div className="insfers-shimmer" style={{ width: 80, height: 10, borderRadius: 4, background: '#F1F5F9' }} />
          </div>
        </div>
        <div className="insfers-shimmer" style={{ width: 64, height: 20, borderRadius: 4, background: '#E2E8F0' }} />
      </div>

      <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        <div className="insfers-shimmer" style={{ width: '100%', borderRadius: 16, border: '1px solid #E2E8F0', background: '#F8FAFC', padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#E2E8F0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ width: 96, height: 12, borderRadius: 4, background: '#E2E8F0' }} />
              <div style={{ width: 64, height: 16, borderRadius: 4, background: '#E2E8F0' }} />
            </div>
          </div>
          <div style={{ width: 112, height: 36, borderRadius: 9999, background: '#E2E8F0' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="insfers-shimmer" style={{ width: 112, height: 12, borderRadius: 4, background: '#E2E8F0' }} />
            <div className="insfers-shimmer" style={{ width: 48, height: 10, borderRadius: 4, background: '#F1F5F9' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="insfers-shimmer" style={{ height: 44, borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }} />
            <div className="insfers-shimmer" style={{ height: 44, borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="insfers-shimmer" style={{ width: 96, height: 12, borderRadius: 4, background: '#E2E8F0' }} />
            <div className="insfers-shimmer" style={{ width: 64, height: 20, borderRadius: 9999, background: '#F1F5F9' }} />
          </div>
          <div className="insfers-shimmer" style={{ height: 54, borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }} />
        </div>

        <div style={{ borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="insfers-shimmer" style={{ width: 64, height: 12, borderRadius: 4, background: '#E2E8F0' }} />
            <div className="insfers-shimmer" style={{ width: 48, height: 12, borderRadius: 4, background: '#E2E8F0' }} />
          </div>
          <div className="insfers-shimmer" style={{ width: 112, height: 10, borderRadius: 4, background: '#E2E8F0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #E2E8F0' }}>
            <div className="insfers-shimmer" style={{ width: 80, height: 14, borderRadius: 4, background: '#E2E8F0' }} />
            <div className="insfers-shimmer" style={{ width: 64, height: 14, borderRadius: 4, background: '#E2E8F0' }} />
          </div>
        </div>

        <div style={{ paddingTop: 4, borderTop: '1px solid #F1F5F9' }}>
          <div className="insfers-shimmer" style={{ height: 44, borderRadius: 12, background: 'rgba(0,0,255,0.15)' }} />
        </div>

        <div style={{ paddingTop: 8, paddingBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: '#94A3B8' }}>
          <span>Powered by</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, color: '#0F172A' }}>
            Insfers
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Insfers Sandboxed Checkout Modal (`InsfersCheckoutModal` / `InsfersIframeModal`).
 *
 * Renders an isolated, secure iframe overlay connected with the parent merchant page
 * via cross-window postMessage events (`insfers:checkout_ready`, `insfers:checkout_success`, `insfers:checkout_close`).
 */
export const InsfersIframeModal: React.FC<InsfersIframeModalProps> = ({
  link,
  isOpen,
  warm = false,
  onClose,
  onSuccess,
  onError,
  onReady,
  baseUrl,
  className = '',
  zIndex = 999999,
}) => {
  const [hasMounted, setHasMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [contentHeight, setContentHeight] = useState<number>(INITIAL_HEIGHT);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const callbacksRef = useRef({ onSuccess, onClose, onError, onReady });
  callbacksRef.current = { onSuccess, onClose, onError, onReady };

  const checkoutUrl = resolveCheckoutUrl(link, baseUrl);

  useEffect(() => {
    preconnectCheckout(checkoutUrl);
  }, [checkoutUrl]);

  // Mount iframe when opened, warmed by hover/focus, or after browser idle (never hogging during initial page load)
  useEffect(() => {
    if (hasMounted || isOpen || warm) {
      if (!hasMounted) setHasMounted(true);
      return;
    }
    if (typeof window === 'undefined') return;

    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;
    if ('requestIdleCallback' in window) {
      idleId = (window as any).requestIdleCallback(() => setHasMounted(true), { timeout: 2000 });
    } else {
      timerId = setTimeout(() => setHasMounted(true), 1200);
    }
    return () => {
      if (idleId && 'cancelIdleCallback' in window) (window as any).cancelIdleCallback(idleId);
      if (timerId) clearTimeout(timerId);
    };
  }, [hasMounted, isOpen, warm]);

  // Handle postMessage events from the checkout iframe
  useEffect(() => {
    if (!hasMounted && !isOpen) return;

    prefetchCheckout(checkoutUrl);

    const fallbackTimer = setTimeout(() => {
      setIsLoading(false);
    }, 6000);

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
        setIsLoading(false);
        callbacksRef.current.onReady?.(data.data);
      } else if (data.type === 'insfers:checkout_resize' && typeof data.height === 'number' && data.height > 100) {
        setContentHeight((prev) => (Math.abs(prev - data.height) > 8 ? data.height : prev));
      } else if (data.type === 'insfers:checkout_success') {
        callbacksRef.current.onSuccess?.(data.data);
      } else if (data.type === 'insfers:checkout_close') {
        handleClose();
      } else if (data.type === 'insfers:checkout_error') {
        clearTimeout(fallbackTimer);
        setIsLoading(false);
        callbacksRef.current.onError?.(new Error(data.error?.message || 'Checkout failed'));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener('message', handleMessage);
    };
  }, [hasMounted, isOpen, checkoutUrl]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  if (!link && !isOpen) return null;
  if (!hasMounted && !isOpen) return null;

  const isVisible = isOpen && !isClosing;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-hidden={!isOpen}
      className={className}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: isOpen ? zIndex : -1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: isVisible ? 'blur(8px)' : 'none',
        WebkitBackdropFilter: isVisible ? 'blur(8px)' : 'none',
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? 'visible' : 'hidden',
        pointerEvents: isVisible ? 'auto' : 'none',
        transition: 'opacity 200ms ease-out, visibility 200ms ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      {/* Modal Dialog Card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          height: `min(${contentHeight}px, 94vh)`,
          maxHeight: '94vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: isVisible
            ? '0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 1px rgba(0, 0, 0, 0.2)'
            : 'none',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          transform: isVisible ? 'scale(1)' : 'scale(0.96)',
          transition:
            'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), height 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* The Secure Isolated Checkout Iframe */}
        <iframe
          ref={iframeRef}
          src={checkoutUrl}
          title="Insfers Secure Checkout"
          sandbox={CHECKOUT_IFRAME_SANDBOX}
          allow="payment; camera; clipboard-write"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            backgroundColor: '#FFFFFF',
          }}
        />

        {/* Instant skeleton overlay — smooth fade out when iframe sends checkout_ready */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            backgroundColor: '#FFFFFF',
            pointerEvents: isLoading ? 'auto' : 'none',
            opacity: isLoading ? 1 : 0,
            visibility: isLoading ? 'visible' : 'hidden',
            transition: 'opacity 180ms ease-out, visibility 180ms ease-out',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <ModalSkeleton />
        </div>
      </div>
    </div>
  );
};

export const InsfersCheckoutModal = InsfersIframeModal;
export type InsfersCheckoutModalProps = InsfersIframeModalProps;
export default InsfersIframeModal;
