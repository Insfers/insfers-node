import { Insfers } from './client';

export { Insfers };
export default Insfers;

// Re-export all error classes
export * from './errors';

// Re-export all parameter & response interfaces
export * from './types';

// Re-export pagination utilities
export { listAutoPaging } from './pagination';
export type { HttpClient } from './http';

// Re-export Vanilla JS / Scriptable Hosted Checkout Overlay
export { openInsfersCheckout } from './embed';
export type { OpenCheckoutOptions } from './embed';

