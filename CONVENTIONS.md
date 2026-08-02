# CONVENTIONS — Development Standards & Verification Guidelines

Coding standards, TypeScript rules, component design principles, error handling guidelines, and pre-commit verification requirements for `darshan_delights_mobile`.

---

## 1. TypeScript & Code Style

- **Strict Type Safety:** Enable strict type checking. Do not use `any` types; prefer explicit interfaces or generic types defined in `src/types/`.
- **Absolute Imports:** Use path aliases mapped in `tsconfig.json` (`@/src/...`, `@/app/...`) instead of deeply nested relative imports (`../../components/...`).
- **Functional Components:** All React Native components must be functional components utilizing React hooks. Avoid class components.
- **Naming Conventions:**
  - Components: PascalCase (`ShippingNoticeModal.tsx`, `CartItemRow.tsx`).
  - Hooks: camelCase starting with `use` (`useAuth.ts`, `useCartStore.ts`).
  - Utilities/Services: camelCase (`formatCurrency.ts`, `appRating.ts`).
  - Types/Interfaces: PascalCase (`Product`, `OrderItem`, `StrapiResponse<T>`).

---

## 2. Component & Layout Design Guidelines

- **NativeWind & Tailwind Styling:**
  - Prefer NativeWind `className` strings for layout, typography, colors, and responsive padding/margins.
  - Avoid inline `style={{ ... }}` objects unless calculating dynamic animated values with `react-native-reanimated`.
- **Safe Area Insets:** Always handle device notches, island displays, and home indicators using `react-native-safe-area-context` (`useSafeAreaInsets()`) or `<SafeAreaView>`.
- **Image Optimization:** Use `expo-image` instead of default React Native `<Image>` for fast caching, memory optimization, and smooth placeholder transitions.

---

## 3. State Management Rules

- **Client-Side Synchronous State (Zustand):**
  - Use Zustand stores (`src/store/`) for persistent user state (Cart, Favorites, User Authentication).
  - Keep store actions pure and co-locate persistence selectors.
- **Server-Side Asynchronous State (React Query):**
  - Use `@tanstack/react-query` for all REST API data fetching, mutation, and caching.
  - Define explicit `queryKeys` as arrays (e.g. `['products', categoryId]`).
  - Always invalidate or update query cache on successful mutations (e.g. invalidating `['orders']` after payment).

---

## 4. Error Handling & Logging Rules

> [!IMPORTANT]
> **NO SILENT ERROR SWALLOWING:** Never catch an error and return silently without user feedback or logging.

- **User Feedback:** Present clear, action-oriented error messages via `Toast` (`react-native-toast-message`) or custom modal overlays when API requests or payment operations fail.
- **Console Removal:** All `console.log` statements are stripped in production builds via Babel. Use meaningful error logging during development.
- **Payment & Order Fallbacks:** If a payment initialization fails, handle state teardown cleanly to prevent orphan draft states or UI locking.

---

## 5. Mandatory Verification Protocol

Before submitting PRs, pushing to `dev`/`main`, or publishing OTA updates, you MUST run:

```bash
# 1. Check for TypeScript compilation errors
npx tsc --noEmit

# 2. Verify bundler compilation without errors
npx expo export --dry-run
```
