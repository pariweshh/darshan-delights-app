# Zustand Persist Fix + FlatList getItemLayout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix stale-data data-loss risk in Zustand persist stores (cart, favorites) and add `getItemLayout` to `ProductGrid` for reduced layout measurement overhead.

**Architecture:** Two independent fixes — (1) `partialize` in cart/favorites stores so loading-state flags are not persisted, plus session-expiry clearing in `authStore.checkSession`; (2) a stable computed item-height fed into `FlatList.getItemLayout` in `ProductGrid`. Neither fix requires the React Query migration (see `2026-04-21-react-query-migration.md`), but both are compatible with it.

**Tech Stack:** Zustand 5.x, zustand/middleware `persist` + `partialize`, React Native FlatList, `useResponsive` hook

---

## Context

### Issue 1 — Zustand Persist (Data Loss Risk)

`cartStore` persists its **entire state** (including `cart[]`, `isLoading`, `error`, `lastOperation`, `lastOperationSuccess`) to AsyncStorage under the key `"cart-storage"`. `favoritesStore` persists its entire state (`favoriteList`, `isLoading`, `error`) under `"favorites-storage"`.

Two concrete problems:
1. Transient UI state (`isLoading: true`, stale `error`) is rehydrated on next app launch — the store wakes up in a broken UI state.
2. When a **token expires** without an explicit logout (e.g., user force-quits and re-opens the app), `authStore.checkSession` sets `user/token` to `null` but **never calls `clearCartOnLogout` or `clearFavoritesOnLogout`**. The stale cart/favorites data from the previous session remains in AsyncStorage and in the Zustand store, and will be visible the next time the user logs in with a different account on the same device.

Fix scope:
- `src/store/cartStore.ts` — add `partialize` to persist only `cart`
- `src/store/favoritesStore.ts` — add `partialize` to persist only `favoriteList`
- `src/store/authStore.ts` — in `checkSession`, when session is invalid, call the clear functions

### Issue 2 — FlatList `getItemLayout`

`ProductGrid` (`src/components/home/ProductGrid.tsx`) renders products in a `FlatList` with `scrollEnabled={false}` (it lives inside a `ScrollView`). Without `getItemLayout`, React Native must measure every item before it can lay out the list. Adding `getItemLayout` with a stable computed height eliminates those measurement calls.

The card height is predictable:
```
itemHeight = config.imageHeight          // 140 phone / 160 tablet
           + contentPadding * 2          // 24 phone / 28 tablet  (isTablet ? 14 : 12 each side)
           + CONTENT_TEXT_HEIGHT         // ~64px  (category + title + price row)
           + config.buttonHeight         // 44 phone / 48 tablet
           + gap                         // bottom margin between rows (12 phone / 16 tablet)
```

**Note:** product titles that wrap to a second line will make actual height exceed this estimate. In that case the list layout will still be correct (React Native falls back to measurement for that item) — `getItemLayout` is a hint, not a hard constraint. Set `CONTENT_TEXT_HEIGHT = 64` as default; if you observe consistent two-line titles, increase to 84.

---

## File Structure

**Modified Files:**
- `src/store/cartStore.ts` — add `partialize`, remove isLoading/error/lastOperation from AsyncStorage
- `src/store/favoritesStore.ts` — add `partialize`, remove isLoading/error from AsyncStorage
- `src/store/authStore.ts` — call clear functions in `checkSession` invalid-session branches
- `src/components/home/ProductGrid.tsx` — add `getItemLayout` and pass `isTablet` through

---

## Task 1: Add `partialize` to cartStore

**Files:**
- Modify: `src/store/cartStore.ts:39-246`

The current `persist(...)` call has no `partialize` — all state keys are written to AsyncStorage, including mutable UI flags.

- [ ] **Step 1: Add `partialize` to persist only the cart array**

In `src/store/cartStore.ts`, find the closing `persist` options object (currently just `{ name: "cart-storage", storage: ... }`).

Replace it with:

```ts
    {
      name: "cart-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ cart: state.cart }),
    }
```

The full `persist` call ends at line 246. The options object starts at line 243. Replace lines 243–245:

```ts
// Before
    {
      name: "cart-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }

// After
    {
      name: "cart-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ cart: state.cart }),
    }
```

- [ ] **Step 2: Verify type compatibility**

`partialize` receives the full `CartState`. The return type `{ cart: CartItem[] }` is a subset of `CartState` — Zustand merges this with the default state on rehydration, so transient keys (`isLoading`, `error`, etc.) will always start from their initial values.

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/store/cartStore.ts
git commit -m "fix: partialize cartStore persist to exclude transient UI state"
```

---

## Task 2: Add `partialize` to favoritesStore

**Files:**
- Modify: `src/store/favoritesStore.ts:69-73`

- [ ] **Step 1: Add `partialize` to persist only favoriteList**

In `src/store/favoritesStore.ts`, replace the persist options object (lines 69–72):

```ts
// Before
    {
      name: "favorites-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }

// After
    {
      name: "favorites-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ favoriteList: state.favoriteList }),
    }
```

- [ ] **Step 2: Verify type compatibility**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/store/favoritesStore.ts
git commit -m "fix: partialize favoritesStore persist to exclude transient UI state"
```

---

## Task 3: Clear cart and favorites on token expiry in `checkSession`

**Files:**
- Modify: `src/store/authStore.ts` — `checkSession` function (lines 322–366)

The `logout` action already clears cart/favorites via dynamic imports. The `checkSession` function does not — it just sets `user: null, token: null`. Any rehydrated cart/favorites data from the previous session persists.

- [ ] **Step 1: Call clear functions in the invalid-session branch**

In `src/store/authStore.ts`, locate the `checkSession` function. There are two places where user/token are set to null:

**Branch A** — when `res.session.isValid` is false (approximately lines 338–351):

```ts
// Before
      } else {
        const isActualError =
          res?.session?.error &&
          !res.session.error.toLowerCase().includes("no token") &&
          !res.session.error.toLowerCase().includes("not found") &&
          !res.session.error.toLowerCase().includes("no user")
        set({
          user: null,
          token: null,
          isLoading: false,
          error: isActualError ? res.session.error : null,
          biometricAuthEnabled: false,
        })
      }
```

```ts
// After
      } else {
        const isActualError =
          res?.session?.error &&
          !res.session.error.toLowerCase().includes("no token") &&
          !res.session.error.toLowerCase().includes("not found") &&
          !res.session.error.toLowerCase().includes("no user")
        set({
          user: null,
          token: null,
          isLoading: false,
          error: isActualError ? res.session.error : null,
          biometricAuthEnabled: false,
        })
        const { useCartStore } = await import("./cartStore")
        useCartStore.getState().clearCartOnLogout()
        const { useFavoritesStore } = await import("./favoritesStore")
        useFavoritesStore.getState().clearFavoritesOnLogout()
      }
```

- [ ] **Step 2: Handle the catch branch too**

**Branch B** — the `catch` block in `checkSession` (approximately lines 352–365), where errors like "no token" also result in session invalidation:

```ts
// Before (inside catch block)
      set({
        user: null,
        token: null,
        isLoading: false,
        error: isSessionMissingError ? null : error.message,
      })
```

```ts
// After (inside catch block)
      set({
        user: null,
        token: null,
        isLoading: false,
        error: isSessionMissingError ? null : error.message,
      })
      const { useCartStore } = await import("./cartStore")
      useCartStore.getState().clearCartOnLogout()
      const { useFavoritesStore } = await import("./favoritesStore")
      useFavoritesStore.getState().clearFavoritesOnLogout()
```

- [ ] **Step 3: Verify type compatibility**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Manually verify the flow**

Scenario to check:
1. Log in and add items to cart
2. Force-kill the app
3. In `authStore.ts`, temporarily make `checkSession` return `isValid: false` (or invalidate the stored token via SecureStore)
4. Relaunch — cart should be empty after `checkSession` runs

- [ ] **Step 5: Commit**

```bash
git add src/store/authStore.ts
git commit -m "fix: clear cart and favorites when checkSession detects expired/missing token"
```

---

## Task 4: Add `getItemLayout` to ProductGrid

**Files:**
- Modify: `src/components/home/ProductGrid.tsx`

`ProductGrid` renders all items in a non-scrolling `FlatList`. Without `getItemLayout`, RN measures each item after render. Providing a height estimate allows RN to skip measurement for most items.

- [ ] **Step 1: Add `isTablet` to the hook destructuring**

`useResponsive` already returns `isTablet`. Add it to the existing destructure on line 27:

```ts
// Before
  const { config, width } = useResponsive()

// After
  const { config, width, isTablet } = useResponsive()
```

- [ ] **Step 2: Compute `itemHeight` above the return statement**

Add these lines immediately after the `itemWidth` calculation (after line 33):

```ts
  // Fixed content area: category text + title (1 line) + price row + padding
  const CONTENT_TEXT_HEIGHT = 64
  const contentPadding = (isTablet ? 14 : 12) * 2
  const itemHeight =
    config.imageHeight + contentPadding + config.buttonHeight + CONTENT_TEXT_HEIGHT + gap
```

- [ ] **Step 3: Add `getItemLayout` prop to `FlatList`**

In the `FlatList` component (lines 87–100), add `getItemLayout` after `windowSize={3}`:

```tsx
      getItemLayout={(_data, index) => ({
        length: itemHeight,
        offset: itemHeight * Math.floor(index / columns),
        index,
      })}
```

The full FlatList block should now be:

```tsx
    <FlatList
      data={products}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      numColumns={columns}
      key={`grid-${columns}`}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      maxToRenderPerBatch={6}
      initialNumToRender={6}
      windowSize={3}
      getItemLayout={(_data, index) => ({
        length: itemHeight,
        offset: itemHeight * Math.floor(index / columns),
        index,
      })}
    />
```

- [ ] **Step 4: Verify `itemHeight` variables are not inside a closure that changes on each render**

`itemHeight` is derived from `config` and `gap`, both of which come from `useResponsive()`. Since `useResponsive` memoizes correctly (returns stable references for the same window dimensions), `itemHeight` will only recompute on orientation/size changes — which is correct. No extra memoization needed.

- [ ] **Step 5: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/components/home/ProductGrid.tsx
git commit -m "perf: add getItemLayout to ProductGrid FlatList to skip item measurements"
```

---

## Self-Review

### Spec coverage

| Issue | Task | Status |
|-------|------|--------|
| cartStore persists transient UI state | Task 1 | Covered |
| favoritesStore persists transient UI state | Task 2 | Covered |
| Stale cart/favorites persists after token expiry | Task 3 | Covered |
| FlatList missing `getItemLayout` | Task 4 | Covered |

### Placeholder scan

No TBDs, TODOs, or vague instructions remain. All steps include exact line numbers and complete code.

### Type consistency

- `partialize: (state) => ({ cart: state.cart })` — `CartItem[]` type matches `cart` in `CartState`. ✓
- `partialize: (state) => ({ favoriteList: state.favoriteList })` — `FavoriteItem` type matches. ✓
- Dynamic imports in `checkSession` match the pattern already used in `logout`. ✓
- `getItemLayout` returns `{ length, offset, index }` — matches `FlatList`'s `GetItemLayout` type. ✓

---

Plan complete and saved to `docs/superpowers/plans/2026-04-21-persist-and-flatlist-fixes.md`.

> **Note on Issue #1 (React Query migration):** A full implementation plan already exists at `docs/superpowers/plans/2026-04-21-react-query-migration.md` — 10 tasks covering QueryProvider setup through screen-by-screen migration and cleanup. Tasks 3 and 4 of that plan also strip the persist config down to UI-only state, so the Zustand persist fixes in this plan serve as a safe interim fix until that migration is executed.

**Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
