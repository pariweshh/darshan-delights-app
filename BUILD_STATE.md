# BUILD_STATE — Darshan Delights Mobile

Durable project state. Live/in-flight work lives in `WORKLOG.md`.

- **Repo:** `darshan_delights_mobile` (Expo SDK 54, expo-router v6, React Native 0.81.5, New Architecture on)
- **Backend:** Strapi v5 at `../strapi-cms` (its own `BUILD_STATE.md`)
- **Branch:** `ui_update_aug_2026` (UI/design work branch, in progress; main branch: `main`)
- **App version:** `1.0.2` · iOS bundle `com.darshandelights.identifier` · Android `com.darshandelights.app`
- **EAS project:** `d9dcf810-5b8e-4698-992a-f11a300d8f38`, owner `darshan-delights`
- **OTA:** `expo-updates` enabled, `runtimeVersion.policy = "appVersion"`, channel `production`
- **Last State Audit:** 2026-08-04

---

## Source of Truth Documentation Stack

- **[BUILD_STATE.md](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/BUILD_STATE.md)** — Durable architecture, environment topology, and confirmed defect state (this file).
- **[WORKLOG.md](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/WORKLOG.md)** — Active session checkpoint, active task state, and immediate next steps.
- **[.env.example](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/.env.example)** — Environment variable contract and Metro inlining topology.
- **[ARCHITECTURE.md](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/ARCHITECTURE.md)** — System architecture, directory map, state management, and Strapi checkout sequence.
- **[DECISION_LOG.md](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/DECISION_LOG.md)** — Architectural Decision Records (ADRs) explaining core design decisions (incl. ADR-007 dock surface).
- **[RUNBOOK.md](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/RUNBOOK.md)** — Standard operating procedures for dev server, EAS builds, OTA updates, and emergency rollbacks.
- **[CONVENTIONS.md](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/CONVENTIONS.md)** — TypeScript rules, NativeWind UI guidelines, error handling rules, and verification requirements.
- **[PRODUCT.md](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/PRODUCT.md)** — Product purpose, users, brand personality, design principles, accessibility requirements.
- **[DESIGN.md](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/DESIGN.md)** — Design system: "The Spice Market" palette, typography, elevation, component specs (incl. dock).
- **[.impeccable/design.json](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/.impeccable/design.json)** — Impeccable design-system sidecar (tonal ramps, shadows, motion, component HTML/CSS).

---

## Environment variable topology (important — this is where the bug came from)

`EXPO_PUBLIC_*` values are **inlined by Metro at bundle time**. Whatever environment is loaded when the
JS bundle is built is permanently baked into that bundle — including bundles shipped over OTA.

There are **three** competing sources of env vars, and they do not agree:

| Source | Contents | Loaded when |
|---|---|---|
| Local `.env` (gitignored) | `EXPO_PUBLIC_API_URL_DEV=https://admino.darshandelights.com.au`, `EXPO_PUBLIC_ENV=development` | Any **local** `expo export` / `eas update` run **without** `--environment` |
| `eas.json` → `build.production.env` | `APP_ENV`, `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_APP_STORE_ID` | `eas build --profile production` |
| **EAS server-side `production` environment** | `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_live_…), `EXPO_PUBLIC_API_URL_PROD`, `EXPO_PUBLIC_APP_PUBLISHED=false`, `EXPO_PUBLIC_APP_STORE_ID`, `EXPO_PUBLIC_ENV=production` | EAS builds, and `eas update --environment production` |

The Stripe publishable key exists in **exactly one** of these — the EAS server-side environment. It is
**not** in the local `.env` and **not** in `eas.json`.

Note: `eas.json` names the API var `EXPO_PUBLIC_API_URL`, but `src/config/constants.tsx:94` reads
`EXPO_PUBLIC_API_URL_PROD`. The `eas.json` name is dead and never consumed.

---

## Known issue — 2026-07-31: iOS payments broken in production

**Status:** root cause confirmed, **not yet fixed**. No code changes made.

**Symptom:** Tapping "Pay" shows toast `Payment Setup Failed / \`merchantIdentifier\` is required, but
none was found. Ensure…`. Affects the live App Store app.

**Affected:** **iOS only.** Only the two 2026-07-23 iOS builds carry a `runtimeVersion` (1.0.1, 1.0.2)
and can receive OTA updates. The newest Android production build (2026-01-10) predates the `updates`
block in `app.config.js` and has `runtimeVersion: None`, so no Android install ever received the bad
bundle. Verified via `eas build:list`.

**Root cause:** The OTA update was published with `eas update --channel production` and **no
`--environment production` flag** — confirmed verbatim in `~/.zsh_history`. Per eas-cli 21.1.0
`build/commands/update/index.js:190-195`, the EAS server-side environment is fetched *only* when that
flag is present; without it `EXPO_NO_DOTENV` is never set and `@expo/env` loads the local `.env`
instead, which has no Stripe key. Metro therefore inlined `undefined` at `app/_layout.tsx:121`
(`babel-preset-expo/build/inline-env-vars.js:34` emits the falsy `undefined` **identifier**, not the
string `"undefined"`). `StripeProvider` early-returns on a falsy `publishableKey` and never calls the
native `initialise()`, so `merchantIdentifier` is never handed to the iOS SDK and stays `nil`. The
`initPaymentSheet` call passes an `applePay` block, which requires it, and throws.

**Why it was silent:** eas-cli skips the environment prompt for Expo SDK < 55
(`build/update/utils.js:252-266`; this project is SDK 54). No prompt, no warning. Combined with zero
production error telemetry (`app/_layout.tsx:61-69` has Sentry/Crashlytics commented out;
`app/_layout.tsx:102-104` swallows every update error), an 8-day total-checkout outage was reported by
a user rather than by monitoring.

**Causal chain (all verified):**

1. `app/_layout.tsx:121` — `const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!`
2. `app/_layout.tsx:283-285` — `<StripeProvider publishableKey={…} merchantIdentifier="merchant.com.darshandelights">`
3. `@stripe/stripe-react-native/src/components/StripeProvider.tsx:81` — `if (!publishableKey) { return }` → native `initialise()` never runs
4. `…/ios/StripeSdkImpl.swift:15` — `var merchantIdentifier: String? = nil` stays nil
5. `…/ios/StripeSdkImpl+PaymentSheet.swift:31` — passes `self.merchantIdentifier` (nil) onward
6. `…/ios/ApplePayUtils.swift:367` — `guard let merchantId = merchantIdentifier else { throw .missingMerchantId }`
7. `…/ios/ApplePayUtils.swift:417` — that error's text is **verbatim** the toast in the screenshot
8. `app/(tabs)/cart/payment.tsx:213-215` — the `applePay: { merchantCountryCode: "AU" }` block is what reaches step 5

**Forensic evidence** (on `dist/_expo/static/js/ios/entry-585b9dba7efa0b4036019362158b07d6.hbc`, the
2026-07-23 export):

- `pk_` occurrences: **0** — the Stripe key is not in the shipped bundle
- `6757019626` (`EXPO_PUBLIC_APP_STORE_ID`, EAS-production-only): **0** — proves the EAS production
  environment was not loaded at export time
- `merchant.com.darshandelights`: **present** — a hardcoded literal, so the bundle does contain the
  current `_layout.tsx` code
- `admino.darshandelights.com.au`: **present** — sourced from the local `.env`'s `EXPO_PUBLIC_API_URL_DEV`

**Why it only broke now:** the App Store binary was built by EAS, which *did* load the production
environment, so the embedded bundle has a real `pk_live_…` and payments worked. The OTA update
replaced that JS bundle with the locally-exported one.

**Live OTA updates — both defective, both published ~1 week ago by `pariweshh`, both at 100% rollout:**

| Runtime | Group ID | Message |
|---|---|---|
| 1.0.2 | `8a650654-3a54-48c8-b033-6b14579e77aa` | "Fix shipping modal touch dismiss and scroll layout" |
| 1.0.1 | `be064d07-c066-490d-b2a4-f93dcd90ee6d` | "Add shipping delay notice for August 5th" |

There is exactly one update branch (`production`). Nothing has been published since.

---

## Remediation options (not yet applied — awaiting decision)

1. **Correct fix** — republish the OTA with the environment loaded:
   ```
   eas update --branch production --environment production --platform all \
     --message "Restore Stripe publishable key (missing from 2026-07-23 OTA)"
   ```
   Repeat for runtime 1.0.1 if that cohort has real users.
2. **Fastest mitigation** (if a republish isn't possible immediately) —
   `eas update:roll-back-to-embedded --branch production --runtime-version 1.0.2 --platform all`.
   Returns users to the EAS-built embedded bundle, which has the correct key, but also reverts the
   shipping-modal fix and the Aug 5 shipping notice.
3. **Prevent recurrence** — wire up error telemetry (highest value: this outage was invisible for 8
   days); fail fast when `publishableKey` is falsy instead of asserting with `!` at
   `app/_layout.tsx:121`; add a `.env.example`; reconcile the three env sources.

### Hard constraints on the fix

- **Do NOT `git stash` / `git checkout .` / `git clean` before publishing.** `app.config.js` at HEAD is
  version `1.0.0` with **no** `updates` or `runtimeVersion` block — the entire OTA configuration exists
  only as uncommitted working-tree changes. eas-cli bundles the working tree, not HEAD. Commit first.
- **Do NOT pass `--skip-bundler`** — it would re-upload the existing broken `dist/`.
- `--non-interactive` is safe: `eas.json` sets no `cli.requireCommit`, so the dirty tree is not gated.
- Republishing with `--environment production` sets `EXPO_PUBLIC_ENV=production`, which flips
  `src/config/constants.tsx:92-95` from the `_DEV` branch to `EXPO_PUBLIC_API_URL_PROD`. **Verified
  safe:** the EAS production environment sets that to `https://admino.darshandelights.com.au`, the same
  host the current bundle uses.

### Post-publish verification (must run against the freshly written `dist/`)

```bash
grep -ac "pk_live_" dist/_expo/static/js/ios/*.hbc
```

Must return `1`. It currently returns `0`.

---

## Other confirmed defects found during the 2026-07-31 triage (separate from the outage)

- **Orphaned draft orders.** `app/(tabs)/cart/payment.tsx:176` creates a real order + Stripe
  PaymentIntent *before* `:207` `initPaymentSheet`. The init-error branch (`:242-254`) returns without
  calling `deleteOrder`; `deleteOrder` is called at exactly one site (`:260`), inside the
  now-unreachable `presentError.code === "Canceled"` branch. Three other paths leak the same way
  (`:196-205`, `:267-277`, `:281-290`) and will keep leaking after the OTA is fixed. Orphans are
  unpublished drafts with `payment_status: "pending"` — invisible to customers and to the admin list,
  visible only in Content Manager drafts / SQL. No cron sweeper exists. **They do not decrement stock,
  send email/SMS/push, or consume coupon usage** — all of those hang off the `payment_intent.succeeded`
  webhook. No `paymentIntents.cancel` exists anywhere in the backend.
  **FIXED 2026-08-04 (Bug #2):** `cleanupDraftOrder` helper wired into all four leak paths + the
  outer catch (rejection edge case). See WORKLOG.
- **Product reviews screen crashed for any product with reviews** — `ReferenceError` from a botched
  find-replace that renamed the *import specifiers* (`REVIEW_REVIEW_SORT_OPTIONS`,
  `ReviewReviewSortOption`) but not the usage sites. **FIXED 2026-07-31** in
  `app/product/[id]/reviews.tsx:16,18` and `src/components/reviews/ProductReviews.tsx:14,16`; ships with
  the same OTA republish.
- **`src/utils/share.ts:7`** — fallback App Store ID is `6757019672`; the real one (`eas.json:60`,
  `ascAppId` `eas.json:69`) is `6757019626`. The current bundle uses the fallback, so share links point
  at a nonexistent app. Masked once the production environment is loaded (the env var wins), but still
  wrong in source — worth fixing separately.
- **`src/services/appRating.ts:9-10`** — reads un-prefixed `process.env.APP_STORE_ID` /
  `PLAY_STORE_ID`. Metro only inlines `EXPO_PUBLIC_*`, so these are undefined in *every* build;
  `appRating.ts:143` emits `apps.apple.com/app/idundefined`. Pre-existing, unrelated to the OTA.
- **`eas.json:57-61`** `env` block is inert for `eas update` (build-only), and its
  `EXPO_PUBLIC_API_URL` key is read by no source file.
- **`.env` fragility** — `EXPO_PUBLIC_ENV=development` with `EXPO_PUBLIC_API_URL_DEV` pointed at
  production. Uncommenting `.env:1` (the LAN IP) would OTA every user onto `192.168.1.121:1337`.

## Backend — CLEARED

`../strapi-cms` `origin/main` and `origin/dev` are both at `7d798f8` (2026-02-19); zero commits between
2026-07-13 and today. The response contract (`controllers/order.ts:531-540`, free-order `:484-492`)
still satisfies `payment.tsx:19-29`. The native error is thrown before `customerId`, `ephemeralKey`, or
`paymentIntentClientSecret` are read, so every failing attempt received a valid 2xx with a non-empty
client secret.

## Not verifiable from this machine

- Production Strapi `STRIPE_SECRET_KEY` live/test mode (`strapi-cms/.env` is a self-labelled dry-run
  placeholder). A live/test mismatch would currently be masked by this failure — re-check after the fix.
- Orphan draft-order count in the production DB; count of `requires_payment_method` PaymentIntents in
  Stripe since 2026-07-23.
- Whether iOS build `11369527` (runtime 1.0.1) is App Store-released or TestFlight-only — decides
  whether the 1.0.1 cohort needs its own republish.

---

## Recent work (git history, current branch `ui_update_aug_2026`)

- `5d252cf` docs: standardize project Source of Truth files and update dev features
- `a81525b` minor changes to account delete feature
- `8b689d8` removed brand banner for now
- `eedaf23` updated purchased before component
- `67d44e4` corrected support email address
- `1c04b16` share.ts app share link; logo is a View not a Button
- `c2bf9ef` network error bug fixes; free-order handling (review purpose); missing images
- `eca9cdc` strip console logs in production; resend confirmation email from login

**Working tree is dirty on `ui_update_aug_2026`** — uncommitted UI work (see below).

---

## Active UI update session — 2026-08-02 → 08-04 (branch `ui_update_aug_2026`)

Status: **In progress.** This is the current area of work. Everything below is on disk
but NOT committed; it sits on top of the standardize-docs commit `5d252cf`.

### What's on disk (uncommitted)

| Area | Files | Notes |
|---|---|---|
| Bottom dock redesign | `app/(tabs)/_layout.tsx` (modified) | 7 passes; now a floating curved bar, see ADR-007 |
| Home carousel rewrite | `src/components/home/HomeCarousel.tsx` (new) | ScrollView → FlatList; **images not loading + swiping broken FIXED 2026-08-04** — see WORKLOG (dead isPausedRef, Android removeClippedSubviews, onError fallback, recyclingKey, AppState pause, tablet width); on-device smoke test still pending |
| Home screen integration | `app/(tabs)/home/index.tsx` (modified) | `<HomeCarousel />` between `<CategoryList />` and `<AppExclusiveBanner />` |
| Banner target routes | `app/highlighted-products.tsx`, `app/short-dated.tsx`, `app/bulk-orders.tsx`, `app/popular-products.tsx` (new) | Stub routes for banner navigation |
| Design system | `DESIGN.md`, `PRODUCT.md`, `.impeccable/design.json` (new) | Impeccable setup: "The Spice Market" north star, warm palette |
| ESLint | `eslint.config.js` (new), `package.json`/`package-lock.json` (modified) | `eslint` + `eslint-config-expo` added; `npm run lint` → `expo lint` |
| Session artifacts | `WORKLOG.md` (modified), `.freebuff/` (new) | Live checkpoint + local tool db |

### Current dock implementation (reality, as of 2026-08-04)

- **Floating curved bar**, 64px tall, 20px radius (NOT fully rounded — user rejected the full pill), opaque cream (`#FEFEFE`) surface with a 1.5px saffron gradient hairline border.
- Floated via margin insets (v7 base style's logical `start`/`end` beat physical `left`/`right`), phone side gap 18px, tablet capped at 640px centered; `marginBottom = max(10, insets.bottom − 12)`.
- v7 renders `tabBarIcon` **twice** per tab (active/inactive copies cross-faded) → static per-copy styling; reanimated removed (dead code).
- Label no-truncation: `paddingTop/Bottom: 0` override of lib's `insets.bottom`, `tabBarIconStyle { width/height: 100% }` override of the 52×32 wrapper, `alignSelf: stretch` on the item (fixes unequal active-pill widths), width-derived fontSize, `maxFontSizeMultiplier`, `adjustsFontSizeToFit`.
- Active tab: Saffron Whisper pill (inset 4px vertically) + 3px Saffron Flame capsule indicator centered via flexbox; Saffron Deep icon/label. Badge on cart (item count) + more (unread notifications).
- `useResponsive()` hook for device detection; `useSafeAreaInsets()` for bottom offset.

### ESLint

`eslint.config.js` uses `eslint-config-expo`; run with `npm run lint` (expo lint).
**Lint is now GREEN — 0 errors** as of the 2026-08-04 full-repo sweep (was 66 errors / 86 warnings at
session start; 41 `react/display-name` + 25 `react/no-unescaped-entities` fixed). 79 warnings remain,
all pre-existing `react-hooks`/`no-unused-vars`.

### Open items

1. **HomeCarousel fix needs an on-device smoke test** — root causes fixed in code (2026-08-04, see WORKLOG); the fix has NOT been device-verified yet. The defect previously shipped in the live OTA.
2. iOS payment OTA defect (BUILD_STATE above) — still awaiting user decision on remediation; a correctly-flagged `eas update --environment production` is itself the fix.
3. `npx tsc --noEmit` still shows the 1 known pre-existing type-only error (ShippingNoticeModal Timeout).

---

## Bug-fix session — 2026-08-04 (full-codebase triage + fixes #1–#3)

Status: **In progress — paused on user request, will continue in a fresh session.**

Ran a full read-only bug/optimization triage across stores, API layer, query hooks, and screens; then
fixed the top three HIGH bugs one at a time (each validated with `tsc` + `lint`, code-reviewed).

### Fixed this session (all verified: tsc = only the 3 known pre-existing errors; lint clean)

| # | Bug | File | Fix |
|---|---|---|---|
| 1 | `checkConnection()` always returned `true` (inverted `return !isOnline`) — OfflineScreen retry always fired, `checkFullConnectivity` never reported `"offline"` | `src/store/networkStore.ts` | offline branch now returns `false`; single source of truth via explicit booleans (keeps `Promise<boolean>` contract) |
| 2 | Orphan draft orders leaked on `initPaymentSheet` error + non-canceled `presentPaymentSheet` errors (only "Canceled" cleaned up) | `app/(tabs)/cart/payment.tsx` | `cleanupDraftOrder` helper (swallows failures) wired into all 4 leak paths + hoisted `createdOrderId` + outer-catch cleanup for SDK rejections; toast-first ordering; `allowsDelayedPaymentMethods` caveat documented |
| 3 | Auto-retry retried non-idempotent POSTs after timeout/5xx → duplicate orders/double cart adds | `src/api/client.ts` | `isIdempotentMethod()` gate in `shouldRetry()` — only `GET`/`HEAD` auto-retry; POST/PUT/DELETE fall through to unchanged error handling |

### Remaining triage backlog

**Bugs #4–#9 — ALL FIXED 2026-08-04** (validated: tsc = 1 known error, lint no new issues). See WORKLOG for the full table. Summary: appRating env-var prefix + fallbacks (#4); cart `useMemo`→`useEffect` (#5); OfflineBanner log removed (#6); ProductGrid magic `getItemLayout` removed (#7); cart/favorites query keys token-scoped (#8); all five dead-code nits (#9).

**Optimizations — DONE 2026-08-04:** API-client in-memory token cache + NetInfo store reuse (biggest perf win); orders-screen per-order review cache (N+1); cart double-fetch removed; `FlashSaleBanner` interval pauses/stops; QueryProvider `retry: 3→1` (stacked retries); `useNotifications` `any` types fixed → **tsc is now non-green with only 1 error** (ShippingNoticeModal).

**Not yet done:** ProductCard query fan-out (40 selector subscriptions on a 20-card grid) — needs a shared-selector refactor, deferred.

### IMPORTANT — tsc baseline changed 2026-08-04

The two `useNotifications.ts:55,103` implicit-any errors (part of the optimization list) are now
fixed with proper typing. `npx tsc --noEmit` now reports **exactly 1 error**:
`src/components/common/ShippingNoticeModal.tsx:20` (`Timeout` mismatch). See CONVENTIONS.md note.

### IMPORTANT — lint baseline changed 2026-08-04 (full-repo sweep)

All 66 pre-existing lint errors eliminated (`react/display-name` ×41, `react/no-unescaped-entities`
×25). `npm run lint` = **0 errors / 79 warnings**. Verification protocol in CONVENTIONS.md is
unchanged — the "non-green" note no longer applies to lint.