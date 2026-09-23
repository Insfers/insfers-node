# Insfers SDK – AI Agent & Developer Integration Guide

> **Package**: `@insfers/sdk` (Node.js & TypeScript)  
> **Repository**: `insfers-node`

---

## 1. Executive Summary & Critical Constraints

`@insfers/sdk` is the official client for **Insfers B2B Cross-Chain Payments, Multi-Chain Treasury, Recurring Subscriptions, and Agentic Commerce**.

### ⚠️ HARD RULES FOR AI AGENTS & DEVELOPERS
1. **SERVER-SIDE ONLY FOR SECRET KEYS**: Never import or invoke `@insfers/sdk` inside client-side browser components (`React`, `Vue`, `Svelte`, browser window). The core SDK includes a built-in guard that throws `SecurityError` if `window` or `document` is detected to prevent secret key leakage. Execute SDK operations exclusively inside Next.js Server Actions, Route Handlers, Express, NestJS, or Cloudflare Workers.
2. **CLIENT-SIDE CHECKOUT SUITE**: For browser-facing UI, import exclusively from `@insfers/sdk/react` (`InsfersCheckoutButton`, `InsfersEmbeddedCheckout`) or `@insfers/sdk/embed` (`renderInsfersButton`, `openInsfersCheckout`). These components package the official branded checkout button and sandboxed modal, require zero API keys, and communicate securely with the Insfers checkout sandbox via verified, origin-locked `postMessage`.
3. **ENVIRONMENT VARIABLES**: Always read the secret API key from `process.env.INSFERS_API_KEY`.
4. **CURRENCY STANDARD**: All amounts are standard decimal numbers denominated in **USDC** (e.g. `10.50` represents $10.50 USDC).
5. **SINGLE-USE SESSIONS**: Payment links are single-use checkout sessions that expire after one settlement to prevent double payments and replay attacks. Always generate fresh links dynamically via `createLink` callbacks when customers initiate checkout.

---

## 2. Installation & Quickstart

```bash
npm install @insfers/sdk
# or: pnpm add @insfers/sdk / yarn add @insfers/sdk / bun add @insfers/sdk
```

### Environment Configuration (`.env`)
```env
# Required: Your secret API key from dashboard.insfers.com (Developer tab)
INSFERS_API_KEY=sk_live_... # or sk_test_... for sandbox

# Optional: Base API URL override (defaults to https://develop.insfers.com)
INSFERS_BASE_URL=https://develop.insfers.com
```

### Initialization

```typescript
import Insfers from '@insfers/sdk';

// Automatically reads process.env.INSFERS_API_KEY
const insfers = new Insfers();

// Or explicit configuration
const insfers = new Insfers({
  apiKey: process.env.INSFERS_API_KEY!,
  baseUrl: process.env.INSFERS_BASE_URL || 'https://develop.insfers.com',
  timeout: 30000,   // 30s timeout
  maxRetries: 3,    // Auto retry on 429 and transient 5xx errors with exponential backoff
});
```

---

## 3. Core Backend SDK Recipes

### Recipe A: Query Real-Time Vault Balances
Retrieves multi-chain balances across all merchant vaults (Arc, Ethereum, Base, Polygon, Arbitrum, Solana).

```typescript
import Insfers from '@insfers/sdk';

const insfers = new Insfers();

async function checkBalances() {
  const balances = await insfers.balances.retrieve();
  
  for (const chain of balances.chains) {
    console.log(`[${chain.network}] Total: ${chain.total} USDC | Available: ${chain.available} USDC`);
  }
}
```

---

### Recipe B: Create a Hosted Multi-Chain Checkout Link
Generates a payment link with instant deposit wallet resolution for customer checkout.

```typescript
import Insfers from '@insfers/sdk';

const insfers = new Insfers();

async function createCheckoutLink() {
  const link = await insfers.paymentLinks.create({
    title: 'Enterprise Annual Subscription',
    amount: 1200.00,
    acceptedNetworks: ['ARC-TESTNET', 'BASE-SEPOLIA', 'ETH-SEPOLIA'],
    description: 'Instant B2B software license with automated cross-chain settlement',
    redirectUrl: 'https://your-app.com/checkout/success',
  });

  console.log('Payment Link ID:', link.id);
  console.log('Checkout URL:', link.url);
  console.log('Checkout Token:', link.token);
  return link.token;
}
```

---

### Recipe C: Issue a B2B Invoice & Stream PDF
Issues a formal tax-calculated invoice and retrieves the raw PDF stream.

```typescript
import Insfers from '@insfers/sdk';
import * as fs from 'fs';

const insfers = new Insfers();

async function issueInvoice() {
  const invoice = await insfers.invoices.create({
    customerName: 'Acme Global Corp',
    customerEmail: 'billing@acme.corp',
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    lineItems: [
      { description: 'Cloud Infrastructure Gateway (Hours)', qty: 160, price: 15.00 },
      { description: 'Custom Smart Contract Security Audit', qty: 1, price: 2500.00 },
    ],
    taxPercent: 5.0,
    network: 'arc',
  });

  console.log(`Invoice ${invoice.invoiceNumber} created. Total: $${invoice.totalAmount} USDC`);

  // Download PDF binary buffer
  const pdfBuffer = await insfers.invoices.downloadPdf(invoice.id);
  fs.writeFileSync(`invoice_${invoice.invoiceNumber}.pdf`, pdfBuffer);
  console.log('Saved invoice PDF to disk.');
}
```

---

### Recipe D: Programmatic Payout / Disbursement (Vendor Payout)
Disburses USDC to an external contractor or vendor wallet on any supported blockchain.

```typescript
import Insfers from '@insfers/sdk';

const insfers = new Insfers();

async function disburseVendorPayout() {
  const payout = await insfers.payouts.create({
    recipientName: 'Security Researcher Alice',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    amount: 500.00,
    blockchain: 'ARC-TESTNET',
    reason: 'Bug bounty program payout #412',
  });

  console.log(`Payout initiated! ID: ${payout.id}, Status: ${payout.status}`);
}
```

---

### Recipe E: Recurring Subscriptions & Billing Plans
Manage automated recurring USDC subscriptions, billing cycles, and selective sequence refunds.

```typescript
import Insfers from '@insfers/sdk';

const insfers = new Insfers();

// 1. Create a Recurring Billing Plan
async function createPlan() {
  const plan = await insfers.plans.create({
    name: 'Pro SaaS Membership',
    price: 49.00,
    interval: 'MONTHLY', // HOURLY | DAILY | WEEKLY | BIWEEKLY | MONTHLY | QUARTERLY | YEARLY
    trialDays: 14,
    description: 'Full platform access with 14-day free trial',
  });
  console.log('Created Plan ID:', plan.id);
  return plan.id;
}

// 2. Query Active Subscriptions & Manage Lifecycle
async function manageSubscriptions() {
  const subscriptions = await insfers.subscriptions.list();

  for (const sub of subscriptions) {
    console.log(`Sub [${sub.id}]: Status=${sub.status}, Amount=$${sub.amount} USDC`);
  }

  // Retrieve detailed billing history
  const detail = await insfers.subscriptions.retrieve('sub_123');
  console.log('Payment history cycles:', detail.paymentHistory?.length);

  // Pause / Resume / Cancel
  await insfers.subscriptions.pause('sub_123');
  await insfers.subscriptions.resume('sub_123');
  await insfers.subscriptions.cancel('sub_123');

  // Selectively refund a historical billing sequence (e.g. Sequence #1)
  await insfers.subscriptions.refundPayment('sub_123', 1, {
    amount: 49.00,
    reason: 'Service dissatisfaction',
  });
}
```

---

### Recipe F: Autonomous Agent-to-Agent Commerce (x402 Protocol)
Allows autonomous AI agents to parse and pay HTTP 402 Payment Required challenges natively.

```typescript
import Insfers from '@insfers/sdk';

const insfers = new Insfers();

async function accessPaidAgentService(targetUrl: string) {
  // Step 1: Query endpoint; if HTTP 402 is returned, parse the challenge
  const response = await fetch(targetUrl);

  if (response.status === 402) {
    const challengeHeader =
      response.headers.get('WWW-Authenticate') ||
      response.headers.get('x-402-challenge');
    
    // Parse challenge parameters
    const parsedChallenge = insfers.agents.parse402Challenge(challengeHeader);
    console.log(`Service requires ${parsedChallenge.amount} USDC on ${parsedChallenge.network}`);

    // Step 2: Settle payment autonomously
    const payment = await insfers.agents.pay402Challenge(parsedChallenge);

    // Step 3: Re-request the protected resource with proof of payment
    const authorizedResponse = await fetch(targetUrl, {
      headers: {
        'Authorization': `Bearer ${payment.txHash}`,
      },
    });

    return await authorizedResponse.json();
  }

  return await response.json();
}
```

---

## 4. Client-Side Hosted Checkout Suite (`@insfers/sdk/react` & `@insfers/sdk/embed`)

Insfers provides three zero-dependency integration options to accept multi-chain payments:
- **Zero Web3 Dependencies**: No `wagmi`, `ethers`, `viem`, or `@solana/web3.js` needed in your merchant frontend.
- **Full Wallet Support**: The modal iframe natively handles MetaMask, Coinbase Wallet, Phantom, Rainbow, WalletConnect, and mobile QR scans.
- **Origin-Locked Security**: Cross-window `postMessage` protocol strictly verifies sender window identity (`e.source === iframe.contentWindow`) and validates expected origin.
- **Single-Use Architecture**: Generates fresh, single-use checkout sessions on demand via `createLink` to prevent double payments.

---

### Option 1: Sandboxed Checkout Modal (`InsfersCheckoutButton`) [Recommended]

Drops an Apple Pay-style checkout button into any React application. Clicking it opens a sandboxed modal overlay with micro-animations, skeleton loading, and automatic height adjustment.

#### Step 1: Merchant Backend Endpoint (e.g. Next.js App Router `/api/checkout/route.ts`)
```typescript
import { NextResponse } from 'next/server';
import Insfers from '@insfers/sdk';

const insfers = new Insfers();

export async function POST() {
  try {
    // Generate a single-use payment link for this checkout session
    const link = await insfers.paymentLinks.create({
      title: 'Pro Annual Plan',
      amount: 99.00,
      acceptedNetworks: ['ARC-TESTNET', 'BASE-SEPOLIA', 'ETH-SEPOLIA', 'SOLANA-DEVNET'],
    });

    return NextResponse.json({ token: link.token });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### Step 2: Merchant React Component
```tsx
'use client';

import React from 'react';
import { InsfersCheckoutButton } from '@insfers/sdk/react';

export function PricingCard() {
  return (
    <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <h3 className="text-xl font-bold text-slate-900">Pro License</h3>
      <p className="text-slate-500 mb-6">$99.00 USDC / year</p>

      <InsfersCheckoutButton
        createLink={async () => {
          const res = await fetch('/api/checkout', { method: 'POST' });
          const data = await res.json();
          return data.token; // Returns public single-use token
        }}
        shape="pill" // 'pill' | 'rounded' | 'square'
        fullWidth
        onReady={(data) => console.log('Checkout modal ready:', data)}
        onSuccess={(res) => {
          console.log('Payment settled on-chain!', res.txHash, res.amount, res.chain);
          window.location.href = `/order/confirmation?tx=${res.txHash}`;
        }}
        onError={(err) => {
          console.error('Checkout error:', err.message);
          alert(`Checkout failed: ${err.message}`);
        }}
        onClose={() => console.log('Customer closed checkout modal')}
      />
    </div>
  );
}
```

#### `InsfersCheckoutButton` Props Reference

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `createLink` | `() => Promise<string \| { token: string }>` | **Required** | Async function invoked on click to generate a fresh single-use payment token. |
| `shape` | `'pill' \| 'rounded' \| 'square'` | `'pill'` | Button border radius style. |
| `fullWidth` | `boolean` | `false` | Stretches button to 100% of container width. |
| `disabled` | `boolean` | `false` | Disables interaction and button clicks. |
| `onSuccess` | `(result: PaymentResult) => void` | `undefined` | Callback fired upon verified on-chain payment settlement. |
| `onError` | `(error: Error) => void` | `undefined` | Callback fired on checkout error or failed initialization. |
| `onClose` | `() => void` | `undefined` | Callback fired when customer dismisses the modal or presses ESC. |
| `onReady` | `(data?: any) => void` | `undefined` | Callback fired when checkout iframe and networks finish loading. |
| `baseUrl` | `string` | `'https://checkout.insfers.com'` | Hosted checkout app domain override. |
| `className` | `string` | `''` | Custom CSS class name for button element. |
| `style` | `React.CSSProperties` | `{}` | Inline styles for button element. |

---

### Option 2: Inline Embedded Checkout (`InsfersEmbeddedCheckout`)

Embeds the sandboxed checkout experience directly within existing billing layouts (e.g. split checkout columns or embedded billing steps).

```tsx
'use client';

import React from 'react';
import { InsfersEmbeddedCheckout } from '@insfers/sdk/react';

export function CheckoutSection() {
  return (
    <div className="max-w-xl mx-auto my-8">
      <InsfersEmbeddedCheckout
        createLink={async () => {
          const res = await fetch('/api/checkout', { method: 'POST' });
          const { token } = await res.json();
          return token;
        }}
        height="640px"
        onSuccess={(res) => {
          console.log('Inline payment completed:', res.txHash);
        }}
      />
    </div>
  );
}
```

---

### Option 3: Vanilla JavaScript / Script Tag (`@insfers/sdk/embed`)

For non-React platforms (Vanilla HTML, Shopify, Webflow, WordPress, Vue, Svelte), use `@insfers/sdk/embed`.

#### 3A. Recommended: Render the Official Electric Blue Checkout Button (`renderInsfersButton`)
Automatically mounts the official brand-standard Electric Blue pill button with the white circular logo mark and binds the sandboxed checkout modal overlay:

```html
<!-- Container element for the button -->
<div id="insfers-checkout-container"></div>

<!-- ES Module Import -->
<script type="module">
  import { renderInsfersButton } from 'https://cdn.jsdelivr.net/npm/@insfers/sdk/dist/embed.js';
  // or local: import { renderInsfersButton } from '@insfers/sdk/embed';

  renderInsfersButton('#insfers-checkout-container', {
    createLink: async () => {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const { token } = await res.json();
      return token;
    },
    shape: 'pill', // 'pill' | 'rounded' | 'square'
    fullWidth: false,
    onSuccess: (res) => {
      console.log('Payment successful!', res.txHash);
      window.location.href = `/order/confirmation?tx=${res.txHash}`;
    },
    onError: (err) => alert(`Error: ${err.message}`),
    onClose: () => console.log('Checkout dismissed'),
  });
</script>
```

#### 3B. Programmatic Modal Launch (`openInsfersCheckout`)
If triggering checkout programmatically from custom UI flows, ensure the trigger adheres to the official Electric Blue brand button standard (`#0000FF` background, white text, and white Insfers logo disc):

```javascript
import { openInsfersCheckout } from '@insfers/sdk/embed';

openInsfersCheckout({
  createLink: async () => {
    const res = await fetch('/api/checkout', { method: 'POST' });
    const { token } = await res.json();
    return token;
  },
  onSuccess: (res) => console.log('Paid:', res.txHash),
  onError: (err) => console.error(err.message),
  onClose: () => console.log('Modal dismissed'),
});
```


---

## 5. LLM Function Calling / AI Tool Definitions

Agents can directly expose Insfers payment capabilities to OpenAI, Claude, LangChain, or Vercel AI SDK using pre-packaged JSON tool schemas:

```json
[
  {
    "type": "function",
    "function": {
      "name": "insfers_create_payment_link",
      "description": "Create a multi-chain USDC checkout payment link for a customer or B2B client.",
      "parameters": {
        "type": "object",
        "properties": {
          "title": { "type": "string", "description": "Product or invoice title" },
          "amount": { "type": "number", "description": "Amount in USDC (e.g. 49.00)" },
          "description": { "type": "string", "description": "Payment description or line items" },
          "acceptedNetworks": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Allowed networks (e.g. ['ARC-TESTNET', 'BASE-SEPOLIA', 'ETH-SEPOLIA', 'SOLANA-DEVNET'])"
          }
        },
        "required": ["title", "amount"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "insfers_get_balances",
      "description": "Check current treasury balances of USDC across all blockchains.",
      "parameters": {
        "type": "object",
        "properties": {}
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "insfers_disburse_payout",
      "description": "Send a USDC vendor payout or disbursement to an EVM wallet address.",
      "parameters": {
        "type": "object",
        "properties": {
          "recipientName": { "type": "string" },
          "walletAddress": { "type": "string", "description": "Recipient 0x address" },
          "amount": { "type": "number", "description": "Amount in USDC" },
          "blockchain": { "type": "string", "default": "ARC-TESTNET" }
        },
        "required": ["recipientName", "walletAddress", "amount"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "insfers_create_subscription_plan",
      "description": "Create a recurring subscription plan (monthly, yearly, hourly).",
      "parameters": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "description": "Plan name" },
          "price": { "type": "number", "description": "Billing cycle price in USDC" },
          "interval": { "type": "string", "enum": ["HOURLY", "DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"] },
          "trialDays": { "type": "number", "description": "Free trial days (optional)" }
        },
        "required": ["name", "price", "interval"]
      }
    }
  }
]
```

---

## 6. Typed Error Handling

Always wrap mutating SDK operations in a `try / catch` handling typed errors from `@insfers/sdk`:

```typescript
import Insfers, {
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  NotFoundError,
  SecurityError,
  APIError,
} from '@insfers/sdk';

try {
  await insfers.paymentLinks.create({ ... });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid or expired API Key. Verify INSFERS_API_KEY.');
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit reached. Automatically retried with backoff.');
  } else if (error instanceof InvalidRequestError) {
    console.error('Invalid request parameters:', error.message);
  } else if (error instanceof SecurityError) {
    console.error('CRITICAL: Core SDK executed in browser environment! Move to backend.');
  } else if (error instanceof APIError) {
    console.error(`Server error [${error.status}]:`, error.message);
  }
}
```

---

## 7. Supported Networks Reference

| Network Identifier | Chain Type | Settlement Speed | Asset |
| :--- | :--- | :--- | :--- |
| `ARC-TESTNET` | Arc L1 (Primary) | Sub-second | USDC / EURC |
| `BASE-SEPOLIA` | EVM L2 | ~2 seconds | USDC |
| `ETH-SEPOLIA` | EVM L1 | ~12 seconds | USDC |
| `POLYGON-AMOY` | EVM L2 | ~2 seconds | USDC |
| `ARB-SEPOLIA` | EVM L2 | ~1 second | USDC |
| `SOLANA-DEVNET` | SVM | Sub-second | USDC |
