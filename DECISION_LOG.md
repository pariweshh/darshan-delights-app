# DECISION_LOG — Architecture Decision Records (ADRs)

Durable record of key architectural choices, technical decisions, rationale, and consequences for `darshan_delights_mobile`.

---

## ADR-001: Expo SDK 54 & React Native New Architecture

- **Status:** Accepted & Implemented
- **Date:** 2026-01-15
- **Context:** The application required improved UI rendering performance, faster bridge-less React Native execution, and full compatibility with Expo Router v6.
- **Decision:** Enable `newArchEnabled: true` in `app.config.js` and use Expo SDK 54 with React Native 0.81.5 and React 19.
- **Consequences:** All third-party native libraries must support the New Architecture / TurboModules. Libraries evaluated without TurboModule support must be replaced or polyfilled.

---

## ADR-002: Strict OTA Update Policy via `runtimeVersion.policy = "appVersion"`

- **Status:** Accepted & Implemented
- **Date:** 2026-07-01
- **Context:** Delivering Over-The-Air (OTA) JS bundle updates to mobile clients can cause native app crashes if a bundle compiled for a newer native binary is received by an older installed app.
- **Decision:** Set `runtimeVersion.policy = "appVersion"` in `app.config.js`.
- **Consequences:** OTA updates will only target app instances matching the exact `version` string (e.g. `1.0.2`). A native version bump (e.g. to `1.0.3`) requires a full EAS build and store submission.

---

## ADR-003: Pre-checkout Draft Order Creation

- **Status:** Accepted & Implemented
- **Date:** 2026-07-15
- **Context:** Creating a Stripe `PaymentIntent` requires knowing the exact AUD amount calculated by the backend (including shipping fees, taxes, and applied coupons).
- **Decision:** When the user enters the payment screen (`app/(tabs)/cart/payment.tsx`), the client requests `POST /api/orders` to create a Strapi order in `draft`/`pending` status and returns the associated Stripe `clientSecret`.
- **Consequences:** If the user abandons checkout without paying, a draft order record remains in Strapi. (Note: Draft orders do not decrement product stock or trigger emails until `payment_intent.succeeded` fires).

---

## ADR-004: Metro Environment Variable Inlining & EAS Release Protocol

- **Status:** Accepted & Implemented
- **Date:** 2026-07-31
- **Context:** `EXPO_PUBLIC_*` environment variables are inlined directly into the JS bundle by Metro at compilation time. Publishing OTA updates without passing the server-side environment caused missing Stripe publishable keys.
- **Decision:**
  1. All production OTA updates must be published using `eas update --branch production --environment production`.
  2. Post-export bundle verification (`grep -ac "pk_live_" dist/...`) is mandatory before confirming OTA releases.
- **Consequences:** Protects production users from receiving JS bundles compiled with development environment fallbacks.

---

## ADR-005: Production Console Log Removal

- **Status:** Accepted & Implemented
- **Date:** 2026-07-28
- **Context:** Sensitive API outputs, tokens, and debug information were being printed to system logs in production builds.
- **Decision:** Configure `babel-plugin-transform-remove-console` in `babel.config.js` to strip all `console.log`, `console.debug`, and `console.warn` statements when `NODE_ENV === "production"`.
- **Consequences:** Prevents data leaks in production while preserving logs during local development.

---

## ADR-006: Hybrid Local Storage Strategy

- **Status:** Accepted & Implemented
- **Date:** 2026-06-10
- **Context:** Different categories of client state have varying security and persistence requirements.
- **Decision:**
  - `expo-secure-store`: Used exclusively for sensitive authentication JWT tokens and biometric auth state.
  - `@react-native-async-storage/async-storage`: Used for non-sensitive persistent state (offline cart items, user preferences, favorite product IDs).
- **Consequences:** High security for credentials without incurring latency penalties on frequent cart state reads/writes.
