# @insfers/sdk

[![npm version](https://img.shields.io/npm/v/@insfers/sdk.svg?style=flat-square)](https://www.npmjs.com/package/@insfers/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

The official **Node.js & TypeScript SDK** for [Insfers](https://insfers.com).

---

## Table of Contents
- [Key Features](#key-features)
- [Installation](#installation)
- [Quickstart](#quickstart)
- [Supported Networks Reference](#supported-networks-reference)
- [Core Payment Modules](#core-payment-modules)
  - [Payments & Cross-Chain Transfers](#1-payments--transfers)
  - [Payment Links & Hosted Checkout](#2-payment-links--hosted-checkout)
  - [Customer Management](#3-customer-crm)
  - [Invoicing & PDF Streaming](#4-invoices--pdf-generation)
  - [Payouts & Disbursements](#5-payouts--disbursements)
  - [Refunds & Claims](#6-refunds--claims)
  - [Treasury Balances](#7-treasury-balances)
  - [Subscriptions & Recurring Billing](#8-subscriptions--plans)
- [B2B Checkout Suite (@insfers/sdk/react & @insfers/sdk/embed)](#b2b-checkout-suite-insferssdkreact--insferssdkembed)
- [Autonomous Agent Commerce (x402 Protocol)](#autonomous-agent-commerce-x402-protocol)
- [AI Tool Calling & LLM Integrations](#ai-tool-calling--llm-integrations)
- [Idempotency & Financial Safety](#idempotency--financial-safety)
- [High-Volume Auto-Paging](#high-volume-auto-paging)
- [Error Handling](#error-handling)
- [Security Best Practices](#security-best-practices)

---

## Key Features

- **Strict Server-Side Security**: Hardened constructor guard preventing secret API key exposure in browser client bundles.
- **Enterprise Financial Safety**: Built-in cryptographic idempotency key reuse on network retries to guarantee at-most-once execution.
- **Resilient Network Layer**: Automated exponential backoff with full randomized jitter for rate limits (429) and transient 5xx server errors.
- **Autonomous Agent Commerce (x402)**: Native parsing and autonomous settlement of **HTTP 402 Payment Required** challenges.
- **AI Tool Calling Ready**: Exported function schemas for **OpenAI**, **Anthropic Claude**, **Vercel AI SDK**, and **LangChain**.
- **Universal JavaScript Compatibility**: Dual ECMAScript Modules (ESM) and CommonJS (CJS) with 100% strict TypeScript types.
- **Zero Heavy Dependencies**: Built purely on standard `fetch` with zero native binary bindings.

---

## Installation

```bash
# npm
npm install @insfers/sdk

# pnpm
pnpm add @insfers/sdk

# yarn
yarn add @insfers/sdk

# bun
bun add @insfers/sdk
```

### Environment Configuration (`.env`)

Obtain your secret API key (`sk_live_...` or `sk_test_...`) from the **[Insfers Developer Dashboard](https://dashboard.insfers.com/developers)**. If you don't already have one, sign up and generate an API key in the Developers tab.

```env
# Required: Secret API key from https://dashboard.insfers.com/developers
INSFERS_API_KEY=sk_live_... # or sk_test_... for sandbox

```

---

## Quickstart

```typescript
import Insfers from '@insfers/sdk';

// Automatically reads process.env.INSFERS_API_KEY, or configure explicitly
const insfers = new Insfers({
  apiKey: process.env.INSFERS_API_KEY!,
  baseUrl: process.env.INSFERS_BASE_URL || 'https://develop.insfers.com',
  timeout: 30000,   // 30s timeout
  maxRetries: 3,    // Auto retry on 429 and transient 5xx errors with exponential backoff
});

async function main() {
  // Create a multi-chain payment link (settles to merchant's Arc balance)
  const link = await insfers.paymentLinks.create({
    title: 'Enterprise Annual License',
    amount: 499.00,
    acceptedNetworks: ['ARC-TESTNET', 'BASE-SEPOLIA', 'ETH-SEPOLIA', 'POLYGON-AMOY', 'ARB-SEPOLIA', 'SOLANA-DEVNET'],
    description: 'Instant USDC payment link with automated deposit provisioning',
  });

  console.log('Payment Link ID:', link.id);
  console.log('Checkout URL:', link.url);
  console.log('Checkout Token:', link.token);
}

main().catch(console.error);
```

---

## Supported Networks Reference

| Network Identifier | Chain Type | Settlement Speed | Primary Asset |
| :--- | :--- | :--- | :--- |
| `ARC-TESTNET` | Arc L1 (Primary) | Sub-second | USDC / EURC |
| `BASE-SEPOLIA` | EVM L2 | ~2 seconds | USDC |
| `ETH-SEPOLIA` | EVM L1 | ~12 seconds | USDC |
| `POLYGON-AMOY` | EVM L2 | ~2 seconds | USDC |
| `ARB-SEPOLIA` | EVM L2 | ~1 second | USDC |
| `SOLANA-DEVNET` | SVM | Sub-second | USDC |

---

## Core Payment Modules

### 1. Payments & Transfers
Initiate custodial USDC transfers on Arc and sync on-chain statuses across supported blockchain networks.

```typescript
// Create an on-chain transfer on Arc
const payment = await insfers.payments.create({
  amount: 25.50,
  destination: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  blockchain: 'ARC-TESTNET',
  description: 'API Usage Tier Upgrade',
});

// Retrieve payment details
const retrieved = await insfers.payments.retrieve(payment.id);

// Refresh on-chain settlement status
const synced = await insfers.payments.sync(payment.id);
```

### 2. Payment Links & Hosted Checkout
Generate hosted multi-chain checkout pages with automated Circle deposit wallet provisioning per network (settling into merchant Arc treasury).

```typescript
const paymentLink = await insfers.paymentLinks.create({
  title: 'Consulting Retainer',
  amount: 1500.00,
  description: 'Monthly architectural review fee',
  acceptedNetworks: ['ARC-TESTNET', 'BASE-SEPOLIA'],
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
});

console.log('Direct Checkout URL:', paymentLink.url);
```

### 3. Customer CRM
Manage customer profiles and track aggregated spend history.

```typescript
// Create a customer
const customer = await insfers.customers.create({
  name: 'Acme Corporation',
  email: 'finance@acme.corp',
  walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
});

// Retrieve customer with transaction history
const profile = await insfers.customers.retrieve(customer.id);
console.log('Total Spent:', profile.totalSpent);
```

### 4. Invoices & PDF Generation
Generate invoices with calculated line items, dispatches reminder emails, and download binary PDF buffers.

```typescript
// Create an invoice
const invoice = await insfers.invoices.create({
  customerId: 'cust_123',
  items: [
    { description: 'Cloud API Compute (Hours)', quantity: 120, unitPrice: 2.50 },
    { description: 'Dedicated IP Gateway', quantity: 1, unitPrice: 50.00 },
  ],
  dueDate: '2026-09-15',
  autoSendEmail: true,
});

// Download binary PDF buffer
import * as fs from 'fs';
const pdfBuffer = await insfers.invoices.downloadPdf(invoice.id);
fs.writeFileSync(`invoice_${invoice.invoiceNumber}.pdf`, Buffer.from(pdfBuffer));
```

### 5. Payouts & Disbursements
Programmatically disburse USDC to vendor or contractor wallets.

```typescript
const payout = await insfers.payouts.create({
  amount: 250.00,
  recipientAddress: '0x1234567890123456789012345678901234567890',
  blockchain: 'BASE-SEPOLIA',
  description: 'August Bounty Payout',
});

console.log('Payout Status:', payout.status);
```

### 6. Refunds & Claims
Issue on-chain USDC refunds directly or generate customer self-claim refund links.

```typescript
// Create a customer claimable refund link
const refund = await insfers.refunds.create({
  paymentId: 'pay_123',
  amount: 75.00,
  reason: 'Customer requested refund',
  claimable: true,
});

console.log('Claim Token:', refund.claimToken);
console.log('Claim URL:', refund.claimUrl);

// Retrieve refund status
const status = await insfers.refunds.retrieve(refund.id);
```

### 7. Treasury Balances
Query real-time USDC balances aggregated across all provisioned Circle treasury wallets.

```typescript
const balances = await insfers.balances.getSummary();
console.log('Total Treasury USDC:', balances.totalUsdc);
for (const chain of balances.chains) {
  console.log(`${chain.blockchain}: ${chain.amount} USDC (${chain.walletAddress})`);
}
```

### 8. Subscriptions & Plans
Create recurring subscription plans and manage subscriber lifecycle.

```typescript
// Create a billing plan
const plan = await insfers.plans.create({
  name: 'Developer Pro',
  amount: 49.00,
  billingInterval: 'monthly',
  features: ['10,000 API Requests', 'Dedicated Webhook Delivery'],
});

// Manage subscriptions
const subs = await insfers.subscriptions.list();
await insfers.subscriptions.pause(subs[0].id);
await insfers.subscriptions.resume(subs[0].id);
```

---

## B2B Checkout Suite (`@insfers/sdk/react` & `@insfers/sdk/embed`)

> **Single-Use Architecture**: Insfers payment links expire after one use to prevent replay attacks and double payments. Client applications execute `createLink` on-demand when the customer clicks the checkout button to generate a fresh single-use payment link.

Insfers provides three client integration options to accept multi-chain payments:

### Option 1: Sandboxed Checkout Modal (`InsfersCheckoutButton` / `InsfersIframeButton`)
Zero Web3 or wallet dependencies required on the merchant site. Renders an isolated sandboxed modal communicating via verified cross-window `postMessage`.

```tsx
import React from 'react';
import { InsfersCheckoutButton } from '@insfers/sdk/react';

export function Checkout() {
  return (
    <InsfersCheckoutButton
      createLink={async () => {
        // Calls your backend route which invokes `insfers.paymentLinks.create(...)`
        const res = await fetch('/api/checkout/create-link', { method: 'POST' });
        const { token } = await res.json();
        return token;
      }}
      shape="pill" // 'pill' | 'rounded' | 'square'
      onSuccess={(res) => console.log('Paid via checkout modal!', res.txHash)}
      onClose={() => console.log('Dismissed')}
    />
  );
}
```

### Option 2: Inline Embedded Checkout (`InsfersEmbeddedCheckout`)
Embeds the hosted checkout flow directly inside your page layout (e.g. within an existing checkout or subscription container).

```tsx
import React from 'react';
import { InsfersEmbeddedCheckout } from '@insfers/sdk/react';

export function Checkout() {
  return (
    <InsfersEmbeddedCheckout
      createLink={async () => {
        const res = await fetch('/api/checkout/create-link', { method: 'POST' });
        const { token } = await res.json();
        return token;
      }}
      height="640px"
      onSuccess={(res) => console.log('Paid in-line!', res.txHash)}
    />
  );
}
```

### Option 3: Vanilla JavaScript & Script Tag (`@insfers/sdk/embed`)
For non-React platforms (Vanilla HTML, Shopify, Webflow, WordPress, Vue, Svelte).

#### 3A. Recommended: Mount the Official Branded Checkout Button (`renderInsfersButton`)
Automatically renders the official Electric Blue pill button with the white circular logo mark and binds the sandboxed checkout modal overlay:

```html
<!-- Container element for the button -->
<div id="insfers-checkout-container"></div>

<script type="module">
  import { renderInsfersButton } from '@insfers/sdk/embed';

  renderInsfersButton('#insfers-checkout-container', {
    createLink: async () => {
      const res = await fetch('/api/checkout/create-link', { method: 'POST' });
      const { token } = await res.json();
      return token;
    },
    shape: 'pill', // 'pill' | 'rounded' | 'square'
    fullWidth: false,
    onSuccess: (res) => console.log('Payment successful!', res.txHash),
    onError: (err) => alert(`Error: ${err.message}`),
    onClose: () => console.log('Checkout dismissed'),
  });
</script>
```

#### 3B. Programmatic Modal Launch (`openInsfersCheckout`)
Trigger the checkout modal from any custom UI or button click handler:

```typescript
import { openInsfersCheckout } from '@insfers/sdk/embed';

const payBtn = document.getElementById('pay-btn');
payBtn.addEventListener('click', () => {
  openInsfersCheckout({
    createLink: async () => {
      const res = await fetch('/api/checkout/create-link', { method: 'POST' });
      const { token } = await res.json();
      return token;
    },
    onSuccess: (res) => console.log('Success:', res.txHash),
    onClose: () => console.log('Dismissed'),
  });
});
```

---

## Autonomous Agent Commerce (x402 Protocol)

The SDK provides native support for AI agents executing autonomous micropayments in response to **HTTP 402 Payment Required** challenges.

```typescript
import Insfers from '@insfers/sdk';

const insfers = new Insfers(process.env.INSFERS_API_KEY!);

// Simulated autonomous agent workflow
async function fetchPaidResource(url: string) {
  const res = await fetch(url);

  if (res.status === 402) {
    const x402Challenge = res.headers.get('x-402-challenge')!;

    console.log('Received HTTP 402 challenge:', x402Challenge);

    // Autonomously settle the challenge within an authorized spending budget
    const payment = await insfers.agents.pay402({
      challenge: x402Challenge,
      maxBudgetUsdc: 2.00, // Agent budget safety limit
      description: 'Autonomous data access payment',
    });

    console.log('Settlement TxHash:', payment.txHash);

    // Re-fetch with proof of payment
    return fetch(url, {
      headers: { 'Authorization': `Bearer ${payment.txHash}` },
    });
  }

  return res.json();
}
```

---

## AI Tool Calling & LLM Integrations

The SDK exports pre-built function definitions ready to be registered directly with **OpenAI Function Calling**, **Anthropic Claude Tools**, **Vercel AI SDK**, or **LangChain**:

```typescript
import { getOpenAITools } from '@insfers/sdk/ai';
import OpenAI from 'openai';

const openai = new OpenAI();
const tools = getOpenAITools();

const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Generate a payment link for $50 for Web Design Services' }],
  tools,
});
```

---

## Idempotency & Financial Safety

> **Idempotency is automatic for all network retries.** Passing an explicit `idempotencyKey` is optional and only needed to bind payments to your own external Order IDs.

To protect against duplicate charges or payouts caused by network timeouts, all mutating requests support idempotency:

```typescript
// Explicit idempotency key
const payment = await insfers.payments.create(
  {
    amount: 100.00,
    destination: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  },
  {
    idempotencyKey: `order_${order.id}`, // Guaranteed at-most-once execution
  }
);
```

---

## High-Volume Auto-Paging

Easily iterate over thousands of records with zero manual offset handling using async iterators:

```typescript
// Seamlessly streams across all pages
for await (const payment of insfers.payments.listAutoPaging({ limit: 100 })) {
  console.log(`Payment: ${payment.id} - ${payment.amount} USDC`);
}
```

---

## Error Handling

All SDK exceptions inherit from `InsfersError` and provide structured error codes:

```typescript
import {
  InsfersError,
  AuthenticationError,
  RateLimitError,
  ConflictError,
  InvalidRequestError,
} from '@insfers/sdk';

try {
  await insfers.payments.create({ amount: -50, destination: 'invalid' });
} catch (err) {
  if (err instanceof AuthenticationError) {
    console.error('Invalid API Key provided.');
  } else if (err instanceof RateLimitError) {
    console.warn(`Rate limit hit! Retry after ${err.retryAfter} seconds.`);
  } else if (err instanceof ConflictError) {
    console.warn('Idempotency key reused with different request payload.');
  } else if (err instanceof InvalidRequestError) {
    console.error('Validation error:', err.param, err.message);
  } else if (err instanceof InsfersError) {
    console.error(`API error [${err.code}]:`, err.message);
  }
}
```

---

## Security Best Practices

1. **Keep Keys on the Server**: Never embed `sk_live_...` or `sk_test_...` in frontend browser applications or client mobile code.
2. **Environment Variables**: Always store keys in secure environment variables (`process.env.INSFERS_API_KEY`).
3. **Use Test Keys in Staging**: Always test integrations using `sk_test_...` before deploying `sk_live_...` keys to production.

## Support & Feedback

If you have questions, need assistance with your integration, or would like to report an issue, please contact our engineering and support team at **[support@Insfers.com](mailto:support@Insfers.com)**.

---

## License

[MIT License](LICENSE) © 2026 Insfers Inc.
