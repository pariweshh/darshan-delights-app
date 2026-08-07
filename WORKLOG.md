# WORKLOG

Live checkpoint file. Disposable working state. Durable state lives in `BUILD_STATE.md`.

---

## Active task — 2026-08-04 (evening)

**HomeCarousel on-device defect — investigated, fixed, closed**

Status: **Completed, validated.** `npx tsc --noEmit` = 1 known error (ShippingNoticeModal, unchanged);
`npm run lint` = 0 errors / 79 warnings (unchanged). Code-reviewed; no functional issues.

### Root cause (all confirmed in code; URLs themselves verified live — 5/5 Unsplash URLs return HTTP 200)

1. **`isPausedRef` was dead code** — declared and read by the 3.5s auto-play timer but **never written
   `true`**. The timer called `scrollToOffset(animated: true)` every 3.5s *even mid-drag*, hijacking the
   user's touch → "manual swiping broken" on device.
2. **Android nested-list blank cells** — the horizontal `FlatList` sits inside the home vertical
   `ScrollView`, and `removeClippedSubviews` defaults to `true` on Android → cells (and their images)
   clip/blank out → "images not loading on device".
3. **No `onError` fallback** — a failed/filtered image left a dead dark `#1E293B` slab (no graceful
   degradation).
4. **No `recyclingKey`** on the slide `Image` (expo-image best practice for lists).
5. **No AppState pause** — timer kept spinning while backgrounded.
6. **Tablet width overflow** — `carouselWidth = width - 32` while the home ScrollView pads 24/tablet.

### Fix (src/components/home/HomeCarousel.tsx)

- Wired `isPausedRef`: pause on `onScrollBeginDrag`, resume on `onScrollEndDrag` + `onMomentumScrollEnd`,
  and pause whenever `AppState` leaves `active` (matches FlashSaleBanner pattern).
- `removeClippedSubviews={false}` + `nestedScrollEnabled` on the FlatList.
- Per-slide `onError` → branded `LinearGradient` fallback (badgeBg → dark) instead of a dead slab.
- `recyclingKey={`home-carousel-${item.id}`}` on the expo-image.
- `carouselWidth = width - config.horizontalPadding * 2` (16 phone / 24 tablet) via `useResponsive`.

### Caveat

This is a code fix; the user confirmed the defect already shipped in the live OTA. **No on-device
verification has been done for this fix yet** — needs a manual smoke test on device before the next
OTA goes out. Auto-play mid-momentum race is theoretical (3.5s cadence vs ~300ms deceleration); the
`onScrollEndDrag` resume is deliberate (a no-momentum drag never fires `onMomentumScrollEnd`).

---

## Active task — 2026-08-04 (later)

**Full-repo lint sweep — 66 pre-existing errors → 0**

Status: **Completed, validated.** `npm run lint` = **0 errors / 79 warnings** (baseline at session
start was 66 errors / 86 warnings). `npx tsc --noEmit` unchanged at **exactly 1 known error**
(ShippingNoticeModal Timeout).

### What was fixed

- **41 × `react/display-name`** — added `X.displayName = "X"` after every `memo()` component across
  13 files: cart, home, more/favorites, more/notifications, more/reviews, products, search,
  app/favorites, app/notifications, product/[id], shop, HomeCarousel, QueryProvider.
  (Script-generated after each memo close; `QuickAccessSection` in products handled manually because
  its body tripped the naive parser.)
- **25 × `react/no-unescaped-entities`** — JSX expression form (`{"'"}` / `{"\""}`) instead of HTML
  entities, which React Native renders literally. 14 files: auth screens (forgot-password, login,
  verify-email, verify-reset-otp), help (contact, faqs, refund-request), notification-preferences,
  products, search, +not-found, payment-success, ErrorBoundary, RatingPromptModal.

### Verification

`npm run lint` → 0 errors, 79 warnings (all warnings pre-existing `react-hooks`/`no-unused-vars`
— none touch this sweep). `npx tsc --noEmit` → 1 known error. Code-reviewed after implementation.

---

## Active task — 2026-08-04

**Bugs #4–#9 FIXED + first optimization pass (see per-item entries below)**

Status: **Completed, validated.** `npx tsc --noEmit` = **1 error** (down from 3 — the two
`useNotifications` implicit-any errors were part of the optimization list and are now properly
typed; only the known `ShippingNoticeModal` Timeout error remains). eslint: no new issues in any
changed file (the `react/display-name` and exhaustive-deps warnings are pre-existing repo-wide
baseline).

### Bugs fixed this pass

| # | Bug | Fix |
|---|---|---|
| 4 | `appRating.ts:9-10` un-prefixed env vars → `apps.apple.com/app/idundefined` | `EXPO_PUBLIC_APP_STORE_ID` / `EXPO_PUBLIC_PLAY_STORE_ID` with fallbacks (`6757019626` iOS / `com.darshandelights.app` Android); also removed unused `data` in `showRatingPrompt` (adjacent lint warning) |
| 5 | `cart/index.tsx` state update inside `useMemo` (discount recalc) | `useMemo` → `useEffect`; deps `[subtotal, appliedCoupon]` |
| 6 | `OfflineBanner.tsx:27` stray `console.log` on every render | removed |
| 7 | `ProductGrid.tsx` magic-number `getItemLayout` (desync risk) | removed `getItemLayout` + `CONTENT_TEXT_HEIGHT`/`CARD_BOTTOM_MARGIN`/`itemHeight` — VirtualizedList now measures each cell |
| 8 | cart/favorites query keys not user-scoped | `CART_KEYS.detail(token)` / `FAVORITES_KEYS.detail(token)` (guest fallback); all mutation hooks pass `variables.token`; logout clears via `setQueriesData({queryKey: all})` |
| 9 | dead code & nits | removed unused `serverCheckTimeout`; `requireNetwork` now surfaces `customMessage`; `orders.tsx` bottom `SkeletonBase` import hoisted to top; `ScrollProductList` eslint-disable explained; `share.ts` fallback App Store ID `6757019672`→`6757019626` |

### Optimizations completed this pass

- **API client (biggest perf win):** in-memory auth-token cache (`getAuthToken` + `invalidateAuthTokenCache`) replaces `SecureStore.getItemAsync` + `NetInfo.fetch()` on every request; NetInfo state now read from the network store. Invalidation wired into `setUserAuth`/`removeUserAuth` (storage.ts) and the 401 handler — cache can't outlive a session change.
- **useNotifications `any` types** (the 2 remaining tsc errors): cache updaters now typed via `NotificationsQueryData` interface → **tsc is non-green with only 1 error now** (ShippingNoticeModal).
- **Stacked retries:** QueryProvider `retry: 3 → 1` (was 16× GET multiplier + ~6s stall with the axios interceptor's own retries).
- **Cart double-fetch on focus:** dropped `refetchOnWindowFocus: true` from `useCart` (inherits provider default = web-only); the `useFocusEffect` refetch remains the single native source.
- **Orders screen N+1:** per-order `reviewedProductIds` cache (`reviewedCacheRef`) — reopening the details modal no longer re-issues one `getUserProductReview` per product; updated on review success.
- **FlashSaleBanner interval:** 1s ticker now stops at sale end and pauses on AppState background, resumes on active.

### Remaining (not yet done)

- **ProductCard query fan-out** — every card subscribes to `useCart` + `useFavorites` (40 selector subscriptions on a 20-card grid). Needs a shared-selector refactor; not attempted this pass.

---

## Active task — 2026-08-04

**Deep bug/optimization triage — full-codebase scan (read-only)**

Status: **Triage complete. Fixes in progress, worked through one at a time (user-directed).**

Scanned stores, API layer, query hooks, and all high-traffic screens. No files modified during the scan itself. Prioritized list — each is logged and fixed one-by-one on request:

### Bugs (priority order)

1. **HIGH — `checkConnection()` always returns `true`** (`src/store/networkStore.ts:107-123`). Inverted return: offline branch does `return !isOnline` (= true), online branch does `return isOnline` (= true). Breaks `OfflineScreen` retry (always fires) and `checkFullConnectivity` (never short-circuits to `"offline"`, offline users get mislabeled `"server_unavailable"`). **FIXED 2026-08-04** (see next entry).
2. **HIGH — orphan draft orders on payment failure paths** (`app/(tabs)/cart/payment.tsx`). `initError` branch (`:237-243`) and non-canceled `presentError` branch (`:274-284`) return **without** `deleteOrder`; only `code === "Canceled"` cleans up (`:260`). **FIXED 2026-08-04** (see entry below).
3. **HIGH — auto-retry retries non-idempotent POSTs** (`src/api/client.ts:157-190`). `shouldRetry()` checks only network error / 5xx status, never the HTTP method → a `POST /api/orders` or cart-add that times out *after* server processing gets retried → duplicate orders / double cart adds. **FIXED 2026-08-04** (see entry below).
4. **MEDIUM — `appRating.ts` builds `apps.apple.com/app/idundefined`** — **FIXED 2026-08-04** (see entry above).
5. **MEDIUM — state update inside `useMemo`** (`cart/index.tsx`) — **FIXED 2026-08-04** (→ `useEffect`).
6. **MEDIUM — stray debug log** (`OfflineBanner.tsx:27`) — **FIXED 2026-08-04**.
7. **MEDIUM — fragile `getItemLayout` hardcoded heights** (`ProductGrid.tsx`) — **FIXED 2026-08-04** (removed; let list measure).
8. **LOW — cart/favorites query keys not user-scoped** — **FIXED 2026-08-04** (token-scoped keys).
9. **LOW — dead code & nits** — **FIXED 2026-08-04** (all five items).

### Optimization opportunities (not yet assigned numbers)

- ~~API client: `NetInfo.fetch()` + `SecureStore.getItemAsync` on every request~~ → **DONE 2026-08-04** (in-memory token cache + store NetInfo state).
- ~~Orders screen N+1~~ → **DONE 2026-08-04** (per-order review cache).
- ~~Cart double-fetch on focus~~ → **DONE 2026-08-04** (dropped `refetchOnWindowFocus` override).
- **ProductCard query fan-out: every card subscribes to `useCart` + `useFavorites` (40 selector subscriptions on a 20-card grid) — NOT YET DONE.**
- ~~`FlashSaleBanner` 1s `setInterval`~~ → **DONE 2026-08-04** (pauses on background, stops at zero).
- ~~Retry backoff stalls UX ~6s~~ → **DONE 2026-08-04** (QueryProvider `retry: 1`).
- ~~`useNotifications.ts:55,103` `any` types~~ → **DONE 2026-08-04** — tsc now down to 1 error.

---

## Active task — 2026-08-04

**Bug #3 FIXED — auto-retry on non-idempotent POSTs (duplicate-order risk)**

Status: **Completed** (validation below).

`src/api/client.ts` response interceptor's `shouldRetry()` retried on network errors and 5xx statuses **regardless of HTTP method**. A `POST /api/orders` or cart-add that timed out after the server processed it would be retried, creating duplicate orders / double cart adds.

### Changes
1. Added `isIdempotentMethod()` helper — checks `config?.method || "get"`, uppercases, returns true only for `GET` / `HEAD` (axios stores methods lowercase and defaults unset methods to GET, so this covers both).
2. Early `if (!isIdempotentMethod()) return false` in `shouldRetry()` — non-idempotent requests now skip the retry block entirely and fall through to the **unchanged** error-handling path (failure counter, network-store updates, error construction all intact).
3. The retry recursion `api.request(config)` reuses the same config, so the gate is re-evaluated on every retry iteration — it can't be bypassed.

### Notes
- PUT/DELETE are also excluded — they're technically idempotent in HTTP semantics, but the user explicitly scoped to "GET/HEAD only" (conservative, matches instruction).
- React Query `useQuery` already retries GETs up to 3× by default, so GET auto-retry now stacks on top of RQ's — pre-existing, out of scope, flagged for a future optimization pass.

### Verification
`npx tsc --noEmit` = only 3 known pre-existing errors (none in this file); `expo lint` clean for `client.ts`. Reviewer confirmed: method check reliable in axios, non-idempotent falls through correctly, recursion can't bypass the gate, retry logging no longer fires for non-idempotent requests.

---

## Active task — 2026-08-04

**Bug #2 FIXED — orphan draft orders on payment failure paths**

Status: **Completed** (validation below).

`app/(tabs)/cart/payment.tsx` previously called `deleteOrder` only on `presentError.code === "Canceled"`; the `initPaymentSheet` error branch and non-canceled `presentPaymentSheet` errors returned without cleanup, leaking unpublished draft orders + PaymentIntents.

### Changes
1. Added `cleanupDraftOrder(orderId, token)` `useCallback` — guards on both args, wraps `deleteOrder` in try/catch, dev-only `console.error` on failure (a failed cleanup can never mask the real payment error).
2. Wired it into **all four** leak paths: no-clientSecret branch, `initError` branch, non-canceled `presentError` branch, and replaced the direct `deleteOrder` in the `Canceled` branch.
3. Hoisted `let createdOrderId` above the `try` (assigned after `createPaymentIntent` returns) and added best-effort cleanup in the **outer catch** — covers the edge case where `initPaymentSheet`/`presentPaymentSheet` *rejects* (throws) instead of resolving `{ error }`. Reviewer-verified no double-clean path (inner branches `return` or fall through without reaching catch).
4. Added `cleanupDraftOrder` to `handlePayment`'s deps array; toast-first ordering in catch (cleanup hits the network and must not delay user feedback); documented the `allowsDelayedPaymentMethods` caveat (delayed method could still resolve to paid server-side — draft is unpublished, webhook owns the real order, deleting the pending draft is the lesser evil).

### Verification
`npx tsc --noEmit` = only 3 known pre-existing errors (none in this file); `expo lint` clean for `payment.tsx`. Reviewer confirmed: success & freeOrder paths never clean (correct — those orders are placed); all four failure paths clean exactly once.

---

## Active task — 2026-08-04

**Bug #1 FIXED — inverted `checkConnection()` return**

Status: **Completed** (validation below).

`src/store/networkStore.ts` `checkConnection`: both branches returned `true` (offline branch had `return !isOnline`). Changed offline branch to `return isOnline` (`false` when offline). Verified callers expect `false` on offline: `OfflineScreen.tsx:20-22` (retry only fires when actually connected) and `checkFullConnectivity` (correctly short-circuits to `"offline"`).

---

## Active task — 2026-08-04

**Bottom Dock — 7th pass: vertical breathing room inside dock items**

Status: **Completed** (`npx tsc --noEmit` = only 3 known pre-existing errors; `expo lint` clean for this file).

User feedback: "a bit more space on the top and bottom of the dock item." The whisper pill previously spanned the full 64px dock height edge-to-edge.

### Changes (`app/(tabs)/_layout.tsx`)

1. Added `ITEM_PILL_INSET_V = 4` — `itemPill` changed from `absoluteFillObject` to `position: absolute` with `top: 4, bottom: 4, left: 0, right: 0`, so the active highlight floats 4px clear of the dock's top/bottom edges.
2. `dockItem` `paddingVertical: 5 → 7` — more space around the icon/label stack.

Reviewer confirmed: content (icon 22 + gap 2 + label ~10 ≈ 34px) + padding 14 fits comfortably inside the 56px pill; the capsule indicator (`marginTop: -1`) still hugs the pill top ~3px below the dock edge; no badge/truncation interaction. The 4px inset + radius 16 reads consistent with the dock's 20px curved corners.

---

## Active task — 2026-08-04

**Source of Truth reconciliation — docs updated to match on-disk reality**

Status: **Completed**.

All source-of-truth files reconciled against reality (`git status`, real file tree, current dock code):

- **DESIGN.md** — dock spec updated: opaque cream surface + 1.5px saffron gradient border supersede the frosted-glass spec; active state = whisper pill + saffron capsule; glassmorphism don't-line corrected.
- **.impeccable/design.json** — Bottom Dock component CSS/description updated to match implementation.
- **ARCHITECTURE.md** — directory topology rewritten to the real file tree (tabs are home/products/cart/more/search; added shop/, product/[id]/, (auth)/, banner routes, skeletons, hooks/queries, etc.).
- **BUILD_STATE.md** — branch is now `ui_update_aug_2026`, audit date → 2026-08-04, recent work + working-tree reality documented.
- **CONVENTIONS.md** — `npx expo lint` added to the mandatory verification protocol.
- **DECISION_LOG.md** — ADR-007 records the dock surface decision (opaque cream + gradient border over frosted glass).

---

## Active task — 2026-08-04

**Bottom Dock — 6th pass: curved (not fully-rounded) dock + tighter bottom gap**

Status: **Completed** (`npx tsc --noEmit` shows only the 3 known pre-existing errors; `expo lint` clean for this file).

User feedback: (1) still too much space below the dock; (2) a fully-rounded pill dock (radius 32) clashes with the curved selected-tab highlight — keep the dock **curved** per DESIGN.md.

### Changes (`app/(tabs)/_layout.tsx`)

1. `DOCK_RADIUS = DOCK_HEIGHT / 2` (32, full pill) → **constant 20** — curved rounded-rect, matching the DESIGN.md dock spec ("Floating pill, 20px radius, 64px height"). `dockOuter`/`dockGradient`/`dockInner`/`tabBarStyle` all derive from it, so the gradient border stays consistent (inner radius 18.5 = 20 − 1.5 border).
2. `bottomGap = Math.max(8, insets.bottom + 4)` (~38px below dock on iPhone) → **`Math.max(10, insets.bottom - 12)`** (~22px) — dock hugs the bottom edge, sitting just above the visible home-indicator bar. Floor keeps it clear on inset-less devices. Verified from `BottomTabView.tsx` that the tab bar is in column flow at the bottom of the full-screen container, so `marginBottom` alone controls the gap.

Reviewer notes (no blocking issues): on Android gesture-nav (insets.bottom ≈ 24) the gap drops to 12px and may slightly overlap the gesture handle — acceptable per explicit user request, but worth an eyeball check on a real device.

### Carousel — still open

Images not loading on device + manual swiping still under investigation (unchanged this session).

---

## Active task — 2026-08-04

**Bottom Dock — 5th pass: unequal active-pill widths (after user screenshots #4/#5)**

Status: **Completed** (`npx tsc --noEmit` shows only the 3 known pre-existing errors; `expo lint` clean for this file).

User reported the active pill's width varied per tab — slim under "Home"/"Cart"/"More", wide under "Products". Read `TabBarIcon.tsx` to confirm the mechanism:

- v7 renders `tabBarIcon` inside an outer wrapper (my `tabBarIconStyle`, width/height 100%) that contains **two absolutely-positioned inner Views** (`styles.icon`, width/height 100%).
- That inner View hardcodes `alignItems: "center"` — so the DockItem child **shrink-wraps to its content width** instead of filling the slot. Since the whisper pill is `absoluteFillObject` *inside* the DockItem, the pill inherited that variable width (43pt under "Home" vs ~60pt under "Products").
- **Fix (1 line): `alignSelf: "stretch"` on `styles.dockItem`.** This overrides the parent's cross-axis centering and makes every tab's pill span the identical full-slot width. Nothing else touched — dock margins, pill shape, padding fix, capsule centering, badge, label math all intact.

### Carousel — still open

Images not loading on device + manual swiping still under investigation (unchanged this session).

---

## Active task — 2026-08-03

**Bottom Dock — 4th pass: active-tab capsule off-center (after user screenshot #3)**

Status: **Completed** (`npx tsc --noEmit` shows only the 3 known pre-existing errors; `expo lint` clean for this file).

User reported the capsule ("line above the selected icon") was off-center on Home/Cart/More but fine on Products. **Pixel-verified** from the screenshot (converted PNG→BMP via `sips`, measured with a pure-Python script):

- True item centers (dock padding accounted): Home 206, Products 461, Cart 717, More 972 (px @3x).
- Icons + labels are **correctly centered** (item4 icon at 972 = exact center; item1 icon ~208 vs 206).
- Whisper pill (DockItem bounds) correctly centered: x 141–269, center **206**, width 43pt (shrink-wrapped).
- **Capsule center = 230 → 24px (≈8pt) right** of the item center. So the capsule was the mis-centered element, and the `left: "50%" + marginLeft: -10` percentage-positioning trick was unreliable here.

**Fix**: the capsule is now a **child of the whisper pill**, centered with flexbox `alignItems: "center"` on the pill (the same mechanism that demonstrably centers the icons) — no more percentage positioning. Removed `position: absolute`/`left`/`marginLeft` from the capsule; added `marginTop: -1` to keep hugging the pill top. Nothing else touched (all prior fixes intact).

### Carousel — still open

Images not loading on device + manual swiping still under investigation (unchanged this session).

---

## Active task — 2026-08-03

**Bottom Dock — 3rd pass: floating pill + side margins (after user screenshot #2)**

Status: **Completed** (`npx tsc --noEmit` shows only the 3 known pre-existing errors; `expo lint` clean for this file).

User screenshot (8:44pm) showed labels now rendering (padding fix worked) **but the dock full-width with no side gaps, not a pill, and floating too high**. Diagnosis from `BottomTabView.tsx`: the tab bar renders in a **column-flex container** and v7's base style sets logical `start: 0`/`end: 0`, which **beat physical `left`/`right`** in the merged style — so my `position: absolute; left/right` insets silently failed (only `bottom` applied, producing the full-width bar at bottom:44). Margin insets are the reliable mechanism (matches how the original pre-rewrite code floated).

### Changes (`app/(tabs)/_layout.tsx`)

1. **Side gaps**: removed `position: absolute` + `left`/`right`; now `marginHorizontal: dockMargin` (phone **18px**, tablet `Math.max(48, (width−640)/2)` = centered 640px max).
2. **Bottom gap reduced**: `bottomGap = Math.max(8, insets.bottom + 4)` (was insets.bottom + 10) → dock sits ~4px above the home indicator instead of 10px.
3. **Fully rounded pill**: `DOCK_RADIUS = DOCK_HEIGHT / 2 = 32` (was 20 → rounded rect).
4. Shadow opacity 0.12 → 0.15 (strong-lift) so the float reads on the near-white background.
5. Label-width math updated to use `dockMargin`.

### Root causes confirmed across all 3 passes (for the record)

- **Pass 1**: labels horizontally truncated — the 52×32 `wrapperUikit` icon box (fixed via `tabBarIconStyle` width/height 100%).
- **Pass 2**: labels vertically clipped — lib's `paddingBottom: insets.bottom` (fixed via `paddingTop/Bottom: 0` in `tabBarStyle`). Also: v7 double-renders `tabBarIcon` (active/inactive copies cross-faded) → per-copy static active styling, reanimated removed as dead code.
- **Pass 3**: dock full-width — physical `left`/`right` lose to logical `start`/`end` in the base style (fixed via margin insets).

### Carousel — still open

Images not loading on device + manual swiping still under investigation (unchanged this session).

---

## Active task — 2026-08-03

**Bottom Dock — ROOT CAUSE FOUND & Fixed (2nd pass, after user screenshot)**

Status: **Completed** (`npx tsc --noEmit` shows only the 3 known pre-existing errors; `expo lint` clean for this file).

User screenshot (2026-08-03 8:20pm) showed the dock rendering **icons only — no labels, no visible active state, no visible gradient border**. The first polish pass had misattributed the truncation to font scaling. Reading `@react-navigation/bottom-tabs@7.9.0` source (`BottomTabBar.tsx` / `BottomTabItem.tsx` / `TabBarIcon.tsx`) revealed the **actual root causes**:

1. **Labels vertically clipped — `paddingBottom: insets.bottom` (34px on iPhone home-indicator devices) is applied by the lib AFTER `tabBarStyle` is merged, and my style never overrode it.** A 64px dock therefore had only ~30px of usable content → the 36px icon+label stack overflowed → labels pushed out of view. **Fix: `paddingTop: 0, paddingBottom: 0` in `tabBarStyle`** (tabBarStyle merges last, so it wins).
2. **Labels horizontally truncated — v7 wraps `tabBarIcon` in a fixed `52×32` box (`wrapperUikit`); my `tabBarIconStyle` only set `height: "100%"`, so each DockItem stayed 52px wide → label slot ~40px → "Products" clipped.** **Fix: `tabBarIconStyle: { width: "100%", height: "100%" }`** so the DockItem spans the full item width. The width-derived fontSize now matches reality.
3. **Pill animation was dead code — v7 renders `tabBarIcon` TWICE per tab** (one copy always `focused: true`, one always `focused: false`, cross-faded by the lib). Each DockItem's `focused` prop never changes, so the reanimated `withTiming` never fired. **Fix: static per-copy active styling; the lib's opacity cross-fade provides the transition. Reanimated removed from this file.**

### Polish applied (spec-aligned)

- **Active state now clearly visible**: full **Saffron Whisper (#FFF7ED) pill** behind the item + a **3px Saffron Flame capsule** at the top of the pill (unmistakable active marker). Icon/label = Saffron Deep `primary[600]`; inactive = Slate-500, no background (spec).
- **Gradient border strengthened** so it reads on white: `rgba(249,115,22,0.30/0.70/0.30)` (was 0.15/0.45/0.15 — imperceptible).
- **Cream surface** (`#FEFEFE`) per Warm Neutrals Rule (was pure `#FFFFFF`); badge border updated to match.
- **Icons 22px**, labels 10px phone / 11px tablet; truncation belt-and-suspenders kept (`maxFontSizeMultiplier={1.15}` + `adjustsFontSizeToFit` + `minimumFontScale`).
- **Responsive**: `useResponsive()` (fixes the `getDeviceType(width, width)` landscape bug), dock capped at 640px & centered on tablets, `Math.max(12, insets.bottom + 10)` bottom offset (now uses the previously-unused insets). Height 64px / radius 20px per spec, strong-lift shadow `0 8px 24px rgba(31,41,55,0.12)`.

### Verification limits

Web preview cannot verify this — the app **crashes on web** at module load (`@stripe/stripe-react-native` is native-only, imported unconditionally by `app/_layout.tsx`). Verified instead by reading the installed `@react-navigation/bottom-tabs@7.9.0` source and `tsc`/`lint`. The user's dev server (pid 33569, port 8081) was left untouched.

### Carousel — still open

Images not loading on device + manual swiping still under investigation (unchanged this session).

---

## Active task — 2026-08-02

**Dock Polish & Carousel Fix (in progress)**

Status: **In progress.**

### Carousel (HomeCarousel.tsx)
- Rewrote from ScrollView → FlatList for horizontal paging
- Fixed broken Unsplash image URL (slide 3, "60% OFF Clearance")
- Images still not loading on device (needs further investigation)
- Manual swiping still not working (needs further investigation)
- File: `src/components/home/HomeCarousel.tsx`

### Bottom Dock (app/(tabs)/_layout.tsx)
- Removed BlurView, made fully opaque white background
- Added gradient border around entire dock (orange gradient, 1.5px border width)
- Dock is pill-shaped (borderRadius = height/2 = 36)
- Dock height: 72px
- bottomOffset: 4px
- paddingHorizontal: 6px on tabBarStyle
- Items have `adjustsFontSizeToFit` on labels to prevent truncation
- Vertical centering: using `height: "100%"` on tabBarItemStyle and tabBarIconStyle
- **ISSUE**: "Products" label still truncating to "Prod..." — `adjustsFontSizeToFit` was just added, awaiting user feedback
- File: `app/(tabs)/_layout.tsx`

### Impeccable Setup
- Created `PRODUCT.md` — register: product, personality: Warm/Authentic/Vibrant
- Created `DESIGN.md` — North Star: "The Spice Market", full warm palette, lifted elevation
- Created `.impeccable/design.json` — sidecar with tonal ramps, shadows, component HTML/CSS

### Next action
- Verify dock text truncation fix (`adjustsFontSizeToFit`)
- Continue investigating carousel image loading and swiping issues

Status: **Completed.**

Next action: launch development server (`npx expo start`) to preview UI on iOS/Android.

### What was done

1. **Fixed [HomeCarousel.tsx](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/src/components/home/HomeCarousel.tsx)**: Applied explicit `height: slideHeight` constraints directly to the horizontal `ScrollView` and outer `container` to resolve Flexbox height collapse. Featured slide cards now render with 100% visibility above pagination dots.
2. **Generated 5 Banner Assets**: Created promotional banner designs for Highlighted Products, 8848 Momo brand, 60% OFF Short-Dated sale, Catering Bulk Orders, and Popular Products.
3. **Target Navigation Routes**: Created stub routes for target pages:
   - [highlighted-products.tsx](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/app/highlighted-products.tsx)
   - [short-dated.tsx](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/app/short-dated.tsx)
   - [bulk-orders.tsx](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/app/bulk-orders.tsx)
   - [popular-products.tsx](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/app/popular-products.tsx)
   - Integrated shop brand filter route (`/shop?brand=8848-momo`).
4. **Polished [_layout.tsx](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/app/(tabs)/_layout.tsx)**:
   - Fixed dock spacing and text truncation ("Products" label clipping).
   - Added `useSafeAreaInsets()` to dynamically compute bottom offsets above the home indicator.
   - Refined light frosted glassmorphism styling (`BlurView tint="light"`, `rgba(255, 255, 255, 0.78)` background, white glass border, soft ambient shadow, and warm orange active pill highlight `AppColors.primary[600]`).
5. **Updated [home/index.tsx](file:///Users/pariwesh/Projects/DARSHAN_DELIGHTS/darshan_delights_mobile/app/(tabs)/home/index.tsx)**: Positioned `<HomeCarousel />` right between `<CategoryList />` and `<AppExclusiveBanner />`.

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

---

## Shipping delay notice removed — 2026-08-07

The notice advertised "no orders ship until 5th August", now past. The user asked to remove the popup
and the banner. A grep sweep found **four** render sites, not two — all four removed:

| # | Location | What it was |
|---|---|---|
| 1 | `app/_layout.tsx:3,398` | `<ShippingNoticeModal />` — the popup (import + mount) |
| 2 | `app/(tabs)/home/index.tsx:15,461` | `<ShippingNoticeBanner />` — home banner (import + mount) |
| 3 | `src/components/cart/CartSummary.tsx:43-77` + styles `251-270` | inline "Shipping Delay Notice" card |
| 4 | `app/(tabs)/cart/select-shipping.tsx:812-853` | inline "Dispatch Schedule Notice" card |

Sites 3 and 4 were **not** mentioned in the request and were not separate components — they were
hardcoded inline blocks carrying the same expired 5th-August date. Removed because leaving them would
have defeated the point of the request. Flagged to the user.

`Ionicons` is still used elsewhere in both edited files (4 and 20 remaining uses), so imports were left
alone. Only the notice-specific styles were deleted.

### Component files — unmounted, NOT deleted

`src/components/common/ShippingNoticeModal.tsx` and `ShippingNoticeBanner.tsx` still exist on disk but
are referenced by nothing. Metro only bundles reachable modules, so they do **not** ship — confirmed by
the absence of their AsyncStorage keys in the built bundle.

They are **untracked**, so deleting them now would be unrecoverable. Recommended sequence: commit once
(capturing them in history), then `git rm` them in a follow-up commit. They are a reusable
dismissible-notice pattern worth keeping for the next shipping pause.

Orphaned AsyncStorage keys left on user devices (`@shipping_notice_modal_seen`,
`@shipping_notice_banner_dismissed`) are inert — no cleanup needed.

### Verification — 2026-08-07

`npx tsc --noEmit` (clean run, no stale buildinfo): **1 error**, down from 13. The single remaining
error is `ShippingNoticeModal.tsx:20` (`number` vs `Timeout`) — inside the now-dead component file, so
it disappears when that file is deleted. The two `useNotifications.ts` implicit-`any` errors no longer
reproduce.

Fresh production-environment export (`<scratch>/preflight3`) — all checks pass:

| Check | Expected | Actual |
|---|---|---|
| `pk_live_` | 1 | **1** ✅ |
| `merchant.com.darshandelights` | 1 | **1** ✅ |
| App Store ID `6757019626` | 1 | **1** ✅ |
| `REVIEW_SORT_OPTIONS` | 1 | **1** ✅ |
| `5th August` | 0 | **0** ✅ |
| `Shipping Notice` | 0 | **0** ✅ |
| `Shipping Delay Notice` | 0 | **0** ✅ |
| `Dispatch Schedule Notice` | 0 | **0** ✅ |
| `will ship until` | 0 | **0** ✅ |
| `shipping_notice` storage keys | 0 | **0** ✅ |

---

## HomeCarousel disabled — 2026-08-07

Hero carousel was not ready for release. Commented out at both sites in
`app/(tabs)/home/index.tsx` (matching the existing `{/* <FeaturedFlipBook /> */}` precedent in the same
file):

- `:19` — `// import HomeCarousel from "@/src/components/home/HomeCarousel"`
- `:504` — `{/* <HomeCarousel /> */}`

Commenting out only the import (as literally asked) would have left `<HomeCarousel />` referencing an
undefined identifier and crashed the home screen, so the JSX usage was commented out too.
`src/components/home/HomeCarousel.tsx` is untouched and stays on disk for later.

---

## FINAL PRE-PUBLISH STATE — 2026-08-07

`npx tsc --noEmit`: **1 error**, `ShippingNoticeModal.tsx:20`, inside a dead unmounted file.
No test suite exists in this project.

Verified bundle: `<scratch>/preflight4/_expo/static/js/ios/*.hbc`

| Check | Expected | Actual |
|---|---|---|
| `pk_live_` | 1 | **1** ✅ |
| `merchant.com.darshandelights` | 1 | **1** ✅ |
| App Store ID `6757019626` | 1 | **1** ✅ |
| `REVIEW_SORT_OPTIONS` | 1 | **1** ✅ |
| `5th August` | 0 | **0** ✅ |
| `Dispatch Schedule Notice` | 0 | **0** ✅ |
| `HomeCarousel` | 0 | **0** ✅ |
| `localhost:1337` / `192.168.` | 0 | **0** ✅ |

### Open threads

- Awaiting a single go-ahead covering the commit **and** the production publish. The user's earlier
  stated preference was to run the publish themselves; they have since said "update the production via
  eas", so this needs one explicit confirmation before anything goes live.
- Decide whether to `git rm` the two unmounted shipping-notice component files (after the commit).
- Offered but not done: `ShippingNoticeModal.tsx:20` type error (moot if the file is deleted).
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
