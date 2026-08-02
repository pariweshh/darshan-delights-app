# WORKLOG

Live checkpoint file. Disposable working state. Durable state lives in `BUILD_STATE.md`.

---

## Active task — 2026-08-02

**Standardize & Generate Complete Project Source of Truth Files**

Status: **Completed.**

Next action: proceed with app development or OTA fix publication per `RUNBOOK.md`.

### What was done

1. **Created [.env.example](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/.env.example)**: Comprehensive environment topology documentation outlining Metro inlining rules, local development variables, and EAS server-side production variables.
2. **Created [ARCHITECTURE.md](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/ARCHITECTURE.md)**: Full architecture document detailing Expo SDK 54 + New Architecture, `expo-router` v6 file layout, state management (Zustand + React Query), NativeWind v4 styling, and Strapi v5 sequence diagram.
3. **Created [DECISION_LOG.md](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/DECISION_LOG.md)**: Documented ADR-001 through ADR-006 covering Expo SDK 54, runtimeVersion policies, pre-checkout draft orders, Metro env inlining rules, and production console log stripping.
4. **Created [RUNBOOK.md](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/RUNBOOK.md)**: Operational guide detailing dev server startup, native EAS builds, safe OTA update publishing protocol (`--environment production`), post-export bundle verification (`grep`), and emergency rollback.
5. **Created [CONVENTIONS.md](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/CONVENTIONS.md)**: TypeScript standards, NativeWind layout rules, error handling mandates (no silent catching), and mandatory pre-commit verification steps (`npx tsc --noEmit`).
6. **Updated [BUILD_STATE.md](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/BUILD_STATE.md)**: Linked all new documentation stack files and updated state audit timestamp.

---

## Active task — 2026-07-31

**Triage: iOS payment fails with "`merchantIdentifier` is required, but none was found."**

Status: **Triage complete. Root cause confirmed. NO CODE CHANGES MADE (per user instruction).**

Next action: await user decision on remediation (see BUILD_STATE.md § Remediation options).

### What was done

Read-only investigation only. No files edited, no commands run that mutate state.

| # | Step | Result |
|---|------|--------|
| 1 | Located `StripeProvider` + `initPaymentSheet` call sites | `app/_layout.tsx:283`, `app/(tabs)/cart/payment.tsx:207` |
| 2 | Traced the exact error string to its source | `node_modules/@stripe/stripe-react-native/ios/ApplePayUtils.swift:417` — verbatim match with the screenshot |
| 3 | Traced the full JS→native causal chain | Confirmed (see BUILD_STATE.md) |
| 4 | Forensics on the exported OTA bundle in `dist/` | `pk_` occurrences = **0**. Key is absent from the shipped bundle. |
| 5 | Compared local `.env` vs `eas.json` vs EAS server-side environment | Key exists **only** in the EAS `production` environment |
| 6 | Confirmed live OTA update on the production channel | Group `8a650654-…`, runtime `1.0.2`, published ~1 week ago by `pariweshh` |

### Verification commands actually run

```
grep -ao "pk_[A-Za-z0-9_]\{0,12\}" dist/_expo/static/js/ios/entry-585b9dba7efa0b4036019362158b07d6.hbc   # -> 0 matches
grep -ac "6757019626" dist/_expo/static/js/ios/entry-585b9dba7efa0b4036019362158b07d6.hbc                 # -> 0 (EAS prod env not loaded)
grep -ao "merchant\.com\.[a-z.]*" dist/_expo/static/js/ios/entry-…hbc                                     # -> merchant.com.darshandelights (present)
npx eas-cli env:list production                                                                            # -> EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_… present
npx eas-cli channel:list / branch:list / update:list --branch production                                   # -> live group 8a650654-…, rtv 1.0.2
```

### Files touched this session

None. Investigation was read-only. Only `WORKLOG.md` and `BUILD_STATE.md` were created.

### Adversarial verification (workflow `wf_c1bbdb5a-39e`, 25/26 agents completed)

Root cause survived every refutation attempt. Refuted hypotheses — **do not chase these**:

- Native / entitlement / provisioning / Stripe-dashboard cause — structurally impossible. That error
  string is reachable only via `merchantIdentifier` being nil in JS-land, and a native regression
  cannot be delivered by OTA. The entitlement is correctly declared at `app.config.js:32-34`.
- `publishableKey` being the truthy string `"undefined"` — Babel emits the falsy `undefined`
  identifier, confirmed by executing `t.valueToNode(undefined)`.
- `dist/` being a stale unrelated artifact — its `assetmap.json` + dual-platform `.hbc.map` signature
  is exactly what `eas update`'s internal `expo export --dump-assetmap` produces.
- `eas update --environment production` with the key marked "Secret" — ruled out: all five EAS
  production vars are visibility PUBLIC, and the bundle contains `share.ts`'s hardcoded fallback App
  Store ID rather than the EAS value, proving no server env was applied at all.
- `EXPO_PUBLIC_APP_PUBLISHED` and `__DEV__` / console-stripping — behave identically either way.
- Backend — cleared (see BUILD_STATE.md).

Claims re-verified by the orchestrator directly (not taken on the agents' word): `eas build:list`
runtime versions per platform, `src/utils/share.ts:7`, `src/services/appRating.ts:9-10`,
`git show HEAD:app.config.js`, and the `eas update` invocation in `~/.zsh_history`.

One agent (`verify:refute-rootcause`, 1 of 4 on that lens) died on a connection error; its three peers
completed and agreed.

---

## Fix prep — 2026-07-31 (awaiting go-ahead)

Decisions taken by the user: republish **runtime 1.0.2 only** (1.0.1 build was superseded, never
reached users); the user runs the publish command themselves.

### Preflight — PASSED (nothing published)

Exported locally with the production environment loaded, into a scratch dir (not `dist/`):

```bash
npx eas-cli env:exec production "EXPO_NO_DOTENV=1 npx expo export --platform ios --output-dir <scratch>/preflight"
```

| Check | Live (broken) | Preflight (fixed) |
|---|---|---|
| `pk_live_` | 0 | **1** ✅ |
| App Store ID `6757019626` | 0 | **1** ✅ |
| bad `share.ts` fallback `6757019672` | 1 | **0** ✅ |
| `merchant.com.darshandelights` | 1 | 1 ✅ |
| `admino.darshandelights.com.au` | 1 | 1 ✅ |
| `localhost:1337` / `192.168.` | 0 | **0** ✅ |

Loading the production environment also fixes the `share.ts` App Store ID bug as a side effect — the
env var overrides the bad hardcoded fallback.

### Working tree

`git config core.fileMode false` was set (local only; undo with `git config core.fileMode true`).
216 of the 228 reported changes were chmod-only noise (`100644 => 100755`) with zero content diff.
Real change count is **55**: 43 modified, 1 deleted, 11 untracked.

`app/_layout.tsx` imports `@/src/providers/QueryProvider` and
`@/src/components/common/ShippingNoticeModal`, both of which are **untracked** — so HEAD does not build.
`git show HEAD:app.config.js` is version `1.0.0` with no `updates`/`runtimeVersion` block. Committing is
a genuine safety step, not tidiness. It is **not** a prerequisite for the publish (eas-cli bundles the
working tree either way).

### Definition of done — NOT met, stated explicitly

`npx tsc --noEmit` **FAILS** on the working tree. No test suite exists in this project (`package.json`
has no test script and no test framework). The republish is still strictly an improvement because these
failures are already live in the current OTA — no source file under `app/` or `src/` has been modified
since the 2026-07-23 18:45 export (`find app src -newermt` returns nothing).

---

## NEW BUG FOUND — product reviews screen crashes (already live)

Botched find-replace: `SORT_OPTIONS` → `REVIEW_SORT_OPTIONS` was applied to the *import specifiers* but
not the *usage sites*.

- [app/product/[id]/reviews.tsx:16,18](app/product/[id]/reviews.tsx:16) imports
  `REVIEW_REVIEW_SORT_OPTIONS` and `ReviewReviewSortOption` — neither exists.
  `src/hooks/queries/useReviews.ts:10,12` exports `ReviewSortOption` and `REVIEW_SORT_OPTIONS`.
- Lines `155` and `168` then reference bare `REVIEW_SORT_OPTIONS`, which is **not declared in that
  module** → `ReferenceError` in Hermes.
- Render guard is `{reviews.length > 0 && (` — so **any product that has at least one review** trips it.
  Caught by the ErrorBoundary at `app/_layout.tsx:281` rather than hard-crashing.
- Identical pattern in `src/components/reviews/ProductReviews.tsx:14,16,153,166`, which appears to be
  dead code (no importer found) — the live route is `app/product/[id]/reviews.tsx`.

### FIXED — 2026-07-31 (orchestrator / Opus, trivial surgical fix, no delegation)

Two import specifiers per file, nothing else touched:

| File | Before | After |
|---|---|---|
| `app/product/[id]/reviews.tsx:16,18` | `REVIEW_REVIEW_SORT_OPTIONS`, `ReviewReviewSortOption` | `REVIEW_SORT_OPTIONS`, `ReviewSortOption` |
| `src/components/reviews/ProductReviews.tsx:14,16` | same | same |

Usage sites were already correct and were left untouched. Repo-wide grep for the doubled names now
returns nothing.

**Verified:** `npx tsc --noEmit` went from **13 errors → 3**; all 10 reviews errors cleared. A fresh
production-environment export builds clean and the emitted bundle contains `REVIEW_SORT_OPTIONS` with
zero occurrences of the doubled name.

### Remaining tsc errors — 3, all type-only, pre-existing, NOT fixed (out of scope)

- `src/components/common/ShippingNoticeModal.tsx:20` — `Type 'number' is not assignable to type 'Timeout'`
  (React Native `setTimeout` return-type mismatch; correct at runtime).
- `src/hooks/queries/useNotifications.ts:55,103` — `Parameter 'old' implicitly has an 'any' type`
  (React Query cache-updater callbacks; correct at runtime).

None affect the bundle. `tsc` is therefore still non-green — stated explicitly per the definition of done.

---

## Preflight #2 — PASSED (post-reviews-fix, nothing published)

Artifact: `<scratch>/preflight2/_expo/static/js/ios/entry-86e75568c3fa6a90ac1bc823318099e4.hbc`

| Check | Expected | Actual |
|---|---|---|
| `pk_live_` | 1 | **1** ✅ |
| App Store ID `6757019626` | 1 | **1** ✅ |
| bad fallback `6757019672` | 0 | **0** ✅ |
| `merchant.com.darshandelights` | 1 | **1** ✅ |
| `localhost:1337` / `192.168.` | 0 | **0** ✅ |
| `REVIEW_REVIEW_SORT_OPTIONS` | 0 | **0** ✅ |
| `REVIEW_SORT_OPTIONS` | ≥1 | **1** ✅ |

### Open threads

- Awaiting go-ahead on the commit. The publish command is the user's to run.
- Offered but not done: the 3 remaining type-only tsc errors.
- Unverifiable from this machine — see BUILD_STATE.md § Not verifiable from this machine.

### Later (out of scope — do not action without approval)

See BUILD_STATE.md § Other confirmed defects. Ranked:

1. Wire up production error telemetry (`app/_layout.tsx:61-69` Sentry/Crashlytics are commented-out
   examples; `:102-104` swallows update errors). This outage was invisible for 8 days.
2. Call `deleteOrder` on the `initPaymentSheet` error path and the other three leaking paths in
   `payment.tsx`; cancel the PaymentIntent server-side.
3. Replace the `!` non-null assertion at `app/_layout.tsx:121` with a fail-fast check.
4. Fix `src/utils/share.ts:7` fallback App Store ID (`6757019672` → `6757019626`).
5. Fix `src/services/appRating.ts:9-10` un-prefixed env vars.
6. Add `.env.example`; remove the dead `EXPO_PUBLIC_API_URL` key from `eas.json:59`.
7. Commit the `app.config.js` `updates` / `runtimeVersion` block — it exists only in the working tree.
