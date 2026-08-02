# BUILD_STATE — Darshan Delights Mobile

Durable project state. Live/in-flight work lives in `WORKLOG.md`.

- **Repo:** `darshan_delights_mobile` (Expo SDK 54, expo-router v6, React Native 0.81.5, New Architecture on)
- **Backend:** Strapi v5 at `../strapi-cms` (its own `BUILD_STATE.md`)
- **Branch:** `dev` (main branch: `main`)
- **App version:** `1.0.2` · iOS bundle `com.darshandelights.identifier` · Android `com.darshandelights.app`
- **EAS project:** `d9dcf810-5b8e-4698-992a-f11a300d8f38`, owner `darshan-delights`
- **OTA:** `expo-updates` enabled, `runtimeVersion.policy = "appVersion"`, channel `production`
- **Last State Audit:** 2026-08-02

---

## Source of Truth Documentation Stack

- **[BUILD_STATE.md](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/BUILD_STATE.md)** — Durable architecture, environment topology, and confirmed defect state (this file).
- **[WORKLOG.md](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/WORKLOG.md)** — Active session checkpoint, active task state, and immediate next steps.
- **[.env.example](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/.env.example)** — Environment variable contract and Metro inlining topology.
- **[ARCHITECTURE.md](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/ARCHITECTURE.md)** — System architecture, directory map, state management, and Strapi checkout sequence.
- **[DECISION_LOG.md](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/DECISION_LOG.md)** — Architectural Decision Records (ADRs) explaining core design decisions.
- **[RUNBOOK.md](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/RUNBOOK.md)** — Standard operating procedures for dev server, EAS builds, OTA updates, and emergency rollbacks.
- **[CONVENTIONS.md](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/CONVENTIONS.md)** — TypeScript rules, NativeWind UI guidelines, error handling rules, and verification requirements.

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

## Recent work (git history, `dev`)

- `a81525b` minor changes to account delete feature
- `8b689d8` removed brand banner for now
- `eedaf23` updated purchased before component
- `67d44e4` corrected support email address
- `1c04b16` share.ts app share link; logo is a View not a Button
- `c2bf9ef` network error bug fixes; free-order handling (review purpose); missing images
- `eca9cdc` strip console logs in production; resend confirmation email from login

**Working tree is dirty** — a large number of modified files are uncommitted on `dev`.
