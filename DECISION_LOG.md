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

---

## ADR-007: Bottom Dock — Opaque Cream Surface over Frosted Glass

- **Status:** Accepted & Implemented
- **Date:** 2026-08-04
- **Context:** The design system (DESIGN.md) originally specified a frosted-glass dock (`BlurView` intensity 70, translucent `rgba(255,255,255,0.15)`). The first dock rewrite used this, but on-device feedback across seven polish passes converged on a warmer, more solid treatment: labels clipped, the dock read as washed-out, and the active state lacked definition.
- **Decision:**
  1. **Surface:** opaque cream `#FEFEFE` (Warm Neutrals Rule — no pure white) with a **1.5px saffron gradient hairline** border (`rgba(249,115,22,0.30/0.70/0.30)`). No `BlurView`.
  2. **Geometry:** floating **curved** bar — 64px tall, **20px radius** (NOT fully rounded; the full pill `radius = height/2` was explicitly rejected by the user 2026-08-04). Floated via margin insets (v7's base style uses logical `start`/`end`, which beat physical `left`/`right`). Phone side gap 18px; tablet capped at 640px and centered. Bottom gap `max(10, insets.bottom − 12)`.
  3. **Active tab:** Saffron Whisper `#FFF7ED` pill inset 4px vertically + **3px Saffron Flame capsule** indicator; Saffron Deep `#EA580C` icon/label. Centering is flexbox `alignItems` (percentage positioning was measurably ~8pt off-center).
  4. **v7 double-render:** `@react-navigation/bottom-tabs` v7 renders `tabBarIcon` twice per tab (active/inactive copies cross-faded) — active styling is therefore **static per copy**, and reanimated was removed from this file as dead code.
- **Consequences:** The dock is now unmistakable and consistent with the brand; the tradeoff is the tab labels cap accessibility font scaling at 1.15× (`maxFontSizeMultiplier`) — a deliberate exception to the 1.5× product requirement, standard practice for tab chrome. Frosted glass remains available for other surfaces (e.g., modals) but is not used by the dock.
