# React Query Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Darshan Delights mobile app from Zustand-based data fetching to React Query for improved caching, deduplication, and background refetching.

**Architecture:** Hybrid approach - React Query handles server state (data fetching, caching, invalidation) while Zustand manages client UI state (loading flags removed, error states from React Query). Migration is incremental, starting with read-only queries, then mutations with optimistic updates.

**Tech Stack:** @tanstack/react-query v5, Expo Router, Zustand (UI state only), axios API client

---

## File Structure

**New Files:**
- `src/providers/QueryProvider.tsx` - QueryClient provider with configuration
- `src/hooks/queries/useProducts.ts` - Product queries
- `src/hooks/queries/useCart.ts` - Cart queries and mutations
- `src/hooks/queries/useFavorites.ts` - Favorites queries and mutations
- `src/hooks/queries/useOrders.ts` - Orders queries and mutations
- `src/hooks/queries/useAuth.ts` - Auth queries

**Modified Files:**
- `app/_layout.tsx` - Add QueryProvider
- `src/store/productStore.ts` - Remove fetch logic, keep UI state
- `src/store/cartStore.ts` - Remove fetch logic, add query invalidation
- `src/store/favoritesStore.ts` - Remove fetch logic, add query invalidation
- `app/(tabs)/home/index.tsx` - Migrate to use query hooks
- `app/(tabs)/cart/index.tsx` - Migrate to use query hooks
- `app/(tabs)/more/favorites.tsx` - Migrate to use query hooks

**Files to Check:**
- `src/api/client.ts` - Axios instance (keep as-is)
- `src/api/products.ts` - API functions (keep, use in queries)
- `src/api/cart.ts` - API functions (keep, use in mutations)
- `src/api/favorites.ts` - API functions (keep, use in mutations)

---

## Task 1: QueryClient Provider Setup

**Files:**
- Create: `src/providers/QueryProvider.tsx`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Create QueryProvider component**

```tsx
// src/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, memo } from 'react'
import { AppState, Platform } from 'react-native'

const STALE_TIME = {
  SHORT: 1000 * 30, // 30 seconds
  MEDIUM: 1000 * 60 * 5, // 5 minutes
  LONG: 1000 * 60 * 10, // 10 minutes
}

const GCACHE_TIME = {
  SHORT: 1000 * 60 * 5, // 5 minutes
  MEDIUM: 1000 * 60 * 30, // 30 minutes
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME.SHORT,
        gcTime: GCACHE_TIME.SHORT,
        retry: 3,
        refetchOnWindowFocus: Platform.OS === 'web',
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
      },
    },
  })
}

export const QueryProvider = memo(({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => createQueryClient())

  useState(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        queryClient.resumePausedMutations()
      }
    })
    return () => subscription.remove()
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
})
```

- [ ] **Step 2: Add QueryProvider to app layout**

Modify `app/_layout.tsx` - wrap the existing providers:

```tsx
import { QueryProvider } from '@/src/providers/QueryProvider'

// Inside the return statement, wrap StripeProvider:
<QueryProvider>
  <StripeProvider ...>
    {/* existing content */}
  </StripeProvider>
</QueryProvider>
```

- [ ] **Step 3: Verify setup compiles**

Run: `npm run typecheck` (or `npx tsc --noEmit`)
Expected: No errors related to QueryProvider

- [ ] **Step 4: Commit**

```bash
git add src/providers/QueryProvider.tsx app/_layout.tsx
git commit -m "feat: add React Query provider setup"
```

---

## Task 2: Products Query Hook

**Files:**
- Create: `src/hooks/queries/useProducts.ts`
- Modify: `src/store/productStore.ts`

- [ ] **Step 1: Create products query hook**

```tsx
// src/hooks/queries/useProducts.ts
import { getProducts, getProductBySlug, getCategories, getBrands } from '@/src/api/products'
import { Product, ProductParams, Category, Brand } from '@/src/types'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export const PRODUCTS_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCTS_KEYS.all, 'list'] as const,
  list: (params: ProductParams) => [...PRODUCTS_KEYS.lists(), params] as const,
  details: () => [...PRODUCTS_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...PRODUCTS_KEYS.details(), id] as const,
  detailBySlug: (slug: string) => [...PRODUCTS_KEYS.details(), 'slug', slug] as const,
  categories: () => [...PRODUCTS_KEYS.all, 'categories'] as const,
  brands: () => [...PRODUCTS_KEYS.all, 'brands'] as const,
}

export function useProducts(params: ProductParams) {
  return useQuery({
    queryKey: PRODUCTS_KEYS.list(params),
    queryFn: () => getProducts(params),
    staleTime: 1000 * 30, // 30 seconds
  })
}

export function useProductById(id: number) {
  return useQuery({
    queryKey: PRODUCTS_KEYS.detail(id),
    queryFn: () => getProductBySlug(String(id)), // API uses slug, adapt if needed
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: PRODUCTS_KEYS.detailBySlug(slug),
    queryFn: () => getProducts({ slug }),
    enabled: !!slug,
    select: (data) => data.products?.[0],
    staleTime: 1000 * 60 * 5,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: PRODUCTS_KEYS.categories(),
    queryFn: getCategories,
    staleTime: 1000 * 60 * 10, // 10 minutes - categories rarely change
  })
}

export function useBrands() {
  return useQuery({
    queryKey: PRODUCTS_KEYS.brands(),
    queryFn: getBrands,
    staleTime: 1000 * 60 * 10,
  })
}

// Helper to invalidate products cache
export function useProductsInvalidate() {
  const queryClient = useQueryClient()
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: PRODUCTS_KEYS.all }),
    invalidateList: (params?: ProductParams) =>
      queryClient.invalidateQueries({
        queryKey: params ? PRODUCTS_KEYS.list(params) : PRODUCTS_KEYS.lists(),
      }),
  }
}
```

- [ ] **Step 2: Update productStore to remove fetch logic**

Modify `src/store/productStore.ts`:

```tsx
// Remove fetch functions, keep only UI state
interface ProductsState {
  selectedCategory: string | null
  setCategory: (category: string | null) => void
  clearError: () => void // Keep for backwards compat, will be removed later
}

export const useProductsStore = create<ProductsState>((set) => ({
  selectedCategory: null,
  setCategory: (category: string | null) => set({ selectedCategory: category }),
  clearError: () => {}, // No-op, errors now from React Query
}))
```

- [ ] **Step 3: Write test for products hook**

Create: `src/hooks/queries/__tests__/useProducts.test.tsx`

```tsx
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useProducts, useCategories } from '../useProducts'
import * as productsApi from '@/src/api/products'

jest.mock('@/src/api/products')

const createWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('useProducts', () => {
  it('fetches products with params', async () => {
    const mockData = { products: [{ id: 1, name: 'Test' }], total: 1 }
    ;(productsApi.getProducts as jest.Mock).mockResolvedValue(mockData)

    const { result } = renderHook(() => useProducts({ limit: 10 }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockData)
  })

  it('fetches categories', async () => {
    const mockCategories = [{ id: 1, name: 'Snacks' }]
    ;(productsApi.getCategories as jest.Mock).mockResolvedValue(mockCategories)

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockCategories)
  })
})
```

- [ ] **Step 4: Run tests**

Run: `npm test -- src/hooks/queries/__tests__/useProducts.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/queries/useProducts.ts src/store/productStore.ts src/hooks/queries/__tests__/useProducts.test.tsx
git commit -m "feat: add products query hooks and migrate productStore"
```

---

## Task 3: Cart Query and Mutation Hooks

**Files:**
- Create: `src/hooks/queries/useCart.ts`
- Modify: `src/store/cartStore.ts`

- [ ] **Step 1: Create cart query and mutation hooks**

```tsx
// src/hooks/queries/useCart.ts
import {
  addToCart,
  deleteBasket,
  deleteCartItem,
  getUserCartItems,
  updateCartItem,
} from '@/src/api/cart'
import { CartItem } from '@/src/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export const CART_KEYS = {
  all: ['cart'] as const,
  detail: () => [...CART_KEYS.all, 'detail'] as const,
}

interface UseCartParams {
  token: string | null
  enabled?: boolean
}

export function useCart({ token, enabled = true }: UseCartParams) {
  return useQuery({
    queryKey: CART_KEYS.detail(),
    queryFn: () => getUserCartItems(token!),
    enabled: enabled && !!token,
    staleTime: 0, // Cart should always be fresh
    refetchOnWindowFocus: true,
  })
}

export function useAddToCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ product, token }: { product: CartItem; token: string }) =>
      addToCart(product, token),
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: CART_KEYS.detail() })
      const previousCart = queryClient.getQueryData(CART_KEYS.detail())

      // Optimistic update
      queryClient.setQueryData(CART_KEYS.detail(), (old: CartItem[] = []) => {
        const existing = old.find((item) => +item.product_id === +newItem.product.product_id)
        if (existing) {
          return old.map((item) =>
            +item.product_id === +newItem.product.product_id
              ? {
                  ...item,
                  quantity: item.quantity + newItem.product.quantity,
                  amount: (
                    parseFloat(item.amount) + parseFloat(newItem.product.amount)
                  ).toFixed(2),
                }
              : item
          )
        }
        return [...old, newItem.product]
      })

      return { previousCart }
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(CART_KEYS.detail(), context.previousCart)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.detail() })
    },
  })
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      cartItemId,
      data,
      token,
    }: {
      cartItemId: number
      data: Partial<CartItem>
      token: string
    }) => updateCartItem(cartItemId, data, token),
    onMutate: async ({ cartItemId, data }) => {
      await queryClient.cancelQueries({ queryKey: CART_KEYS.detail() })
      const previousCart = queryClient.getQueryData(CART_KEYS.detail())

      queryClient.setQueryData(CART_KEYS.detail(), (old: CartItem[] = []) =>
        old.map((item) =>
          item.basket_item_id === cartItemId ? { ...item, ...data } : item
        )
      )

      return { previousCart }
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(CART_KEYS.detail(), context.previousCart)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.detail() })
    },
  })
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      cartItemId,
      token,
    }: {
      cartItemId: number
      token: string
    }) => deleteCartItem(cartItemId, token),
    onMutate: async ({ cartItemId }) => {
      await queryClient.cancelQueries({ queryKey: CART_KEYS.detail() })
      const previousCart = queryClient.getQueryData(CART_KEYS.detail())

      queryClient.setQueryData(CART_KEYS.detail(), (old: CartItem[] = []) =>
        old.filter((item) => item.basket_item_id !== cartItemId)
      )

      return { previousCart }
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(CART_KEYS.detail(), context.previousCart)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.detail() })
    },
  })
}

export function useClearCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (token: string) => deleteBasket(token),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: CART_KEYS.detail() })
      const previousCart = queryClient.getQueryData(CART_KEYS.detail())
      queryClient.setQueryData(CART_KEYS.detail(), [])
      return { previousCart }
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(CART_KEYS.detail(), context.previousCart)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.detail() })
    },
  })
}

// Helper to get cart stats
export function useCartStats() {
  const { data: cart = [] } = useCart({ token: null, enabled: false }) // Will be used with selector

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

  return { itemCount, totalPrice }
}
```

- [ ] **Step 2: Update cartStore for UI state only**

Modify `src/store/cartStore.ts`:

```tsx
// Keep only UI state and query invalidation helpers
interface CartState {
  isAddingItem: boolean
  isUpdatingItem: boolean
  isRemovingItem: boolean
  error: string | null
  clearError: () => void
  clearCartOnLogout: (queryClient: any) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      isAddingItem: false,
      isUpdatingItem: false,
      isRemovingItem: false,
      error: null,
      clearError: () => set({ error: null }),
      clearCartOnLogout: (queryClient) => {
        queryClient?.setQueryData(['cart'], [])
        set({
          isAddingItem: false,
          isUpdatingItem: false,
          isRemovingItem: false,
          error: null,
        })
        AsyncStorage.removeItem('cart-storage')
      },
    }),
    {
      name: 'cart-ui-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Don't persist UI loading states
        error: state.error,
      }),
    }
  )
)
```

- [ ] **Step 3: Write test for cart hooks**

Create: `src/hooks/queries/__tests__/useCart.test.tsx`

```tsx
import { renderHook, act, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAddToCart, useCart } from '../useCart'
import * as cartApi from '@/src/api/cart'

jest.mock('@/src/api/cart')

const createWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('useAddToCart', () => {
  it('adds item to cart with optimistic update', async () => {
    const mockNewItem = { basket_item_id: 1, product_id: 1, quantity: 1, amount: '10.00' }
    ;(cartApi.addToCart as jest.Mock).mockResolvedValue(mockNewItem)

    const { result } = renderHook(
      () => {
        const mutation = useAddToCart()
        const query = useCart({ token: 'test-token' })
        return { mutation, query }
      },
      { wrapper: createWrapper() }
    )

    // Initial state
    expect(result.current.query.data).toBeUndefined()

    // Add item
    act(() => {
      result.current.mutation.mutate({
        product: { product_id: 1, quantity: 1, amount: '10.00' } as any,
        token: 'test-token',
      })
    })

    // Check optimistic update (item should appear before mutation completes)
    expect(result.current.query.data).toContainEqual(
      expect.objectContaining({ product_id: 1 })
    )

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))

    // Verify API was called
    expect(cartApi.addToCart).toHaveBeenCalledWith(
      expect.objectContaining({ product_id: 1 }),
      'test-token'
    )
  })
})
```

- [ ] **Step 4: Run tests**

Run: `npm test -- src/hooks/queries/__tests__/useCart.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/queries/useCart.ts src/store/cartStore.ts src/hooks/queries/__tests__/useCart.test.tsx
git commit -m "feat: add cart query/mutation hooks with optimistic updates"
```

---

## Task 4: Favorites Query and Mutation Hooks

**Files:**
- Create: `src/hooks/queries/useFavorites.ts`
- Modify: `src/store/favoritesStore.ts`

- [ ] **Step 1: Create favorites query and mutation hooks**

```tsx
// src/hooks/queries/useFavorites.ts
import { getFavorites, toggleFavorite } from '@/src/api/favorites'
import { Product } from '@/src/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface FavoriteItem {
  id?: number
  user_id?: number
  products: Product[]
}

export const FAVORITES_KEYS = {
  all: ['favorites'] as const,
  detail: () => [...FAVORITES_KEYS.all, 'detail'] as const,
}

interface UseFavoritesParams {
  token: string | null
  enabled?: boolean
}

export function useFavorites({ token, enabled = true }: UseFavoritesParams) {
  return useQuery<FavoriteItem>({
    queryKey: FAVORITES_KEYS.detail(),
    queryFn: () => getFavorites(token!),
    enabled: enabled && !!token,
    staleTime: 1000 * 30, // 30 seconds
    select: (data) => data ?? { products: [] },
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      productId,
      token,
    }: {
      productId: number
      token: string
    }) => toggleFavorite({ product_id: productId }, token),
    onMutate: async ({ productId }) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_KEYS.detail() })
      const previousFavorites = queryClient.getQueryData(FAVORITES_KEYS.detail())

      // Optimistic toggle
      queryClient.setQueryData(FAVORITES_KEYS.detail(), (old: FavoriteItem) => {
        const products = old?.products ?? []
        const exists = products.some((p) => p.id === productId)

        if (exists) {
          // Remove from favorites
          return {
            ...old,
            products: products.filter((p) => p.id !== productId),
          }
        } else {
          // Add to favorites - we don't have full product data, so just invalidate
          // The server response will give us the full updated list
          return old
        }
      })

      return { previousFavorites }
    },
    onSuccess: (data) => {
      // Update with server response
      queryClient.setQueryData(FAVORITES_KEYS.detail(), data)
    },
    onError: (err, variables, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(FAVORITES_KEYS.detail(), context.previousFavorites)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_KEYS.detail() })
    },
  })
}

export function useIsFavorite(productId: number) {
  const { data: favorites } = useFavorites({ token: null, enabled: false })
  return favorites?.products?.some((p) => p.id === productId) ?? false
}
```

- [ ] **Step 2: Update favoritesStore for UI state only**

Modify `src/store/favoritesStore.ts`:

```tsx
// Keep only UI state
interface FavoritesState {
  isLoading: boolean
  error: string | null
  clearError: () => void
  clearFavoritesOnLogout: (queryClient: any) => void
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      isLoading: false,
      error: null,
      clearError: () => set({ error: null }),
      clearFavoritesOnLogout: (queryClient) => {
        queryClient?.setQueryData(FAVORITES_KEYS.detail(), { products: [] })
        set({ isLoading: false, error: null })
        AsyncStorage.removeItem('favorites-storage')
      },
    }),
    {
      name: 'favorites-ui-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({}), // Don't persist UI state
    }
  )
)
```

- [ ] **Step 3: Write test for favorites hooks**

Create: `src/hooks/queries/__tests__/useFavorites.test.tsx`

```tsx
import { renderHook, act, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useToggleFavorite, useFavorites } from '../useFavorites'
import * as favoritesApi from '@/src/api/favorites'

jest.mock('@/src/api/favorites')

const createWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('useToggleFavorite', () => {
  it('toggles favorite with optimistic update', async () => {
    const mockResponse = { products: [{ id: 1, name: 'Test Product' }] }
    ;(favoritesApi.toggleFavorite as jest.Mock).mockResolvedValue(mockResponse)

    const { result } = renderHook(
      () => {
        const mutation = useToggleFavorite()
        const query = useFavorites({ token: 'test-token' })
        return { mutation, query }
      },
      { wrapper: createWrapper() }
    )

    // Toggle favorite
    act(() => {
      result.current.mutation.mutate({ productId: 1, token: 'test-token' })
    })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))

    expect(favoritesApi.toggleFavorite).toHaveBeenCalledWith(
      { product_id: 1 },
      'test-token'
    )
  })
})
```

- [ ] **Step 4: Run tests**

Run: `npm test -- src/hooks/queries/__tests__/useFavorites.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/queries/useFavorites.ts src/store/favoritesStore.ts src/hooks/queries/__tests__/useFavorites.test.tsx
git commit -m "feat: add favorites query/mutation hooks with optimistic updates"
```

---

## Task 5: Orders Query Hooks

**Files:**
- Create: `src/hooks/queries/useOrders.ts`

- [ ] **Step 1: Create orders query and mutation hooks**

```tsx
// src/hooks/queries/useOrders.ts
import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
} from '@/src/api/orders'
import { Order, CreateOrderInput } from '@/src/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export const ORDERS_KEYS = {
  all: ['orders'] as const,
  lists: () => [...ORDERS_KEYS.all, 'list'] as const,
  list: (userId: number) => [...ORDERS_KEYS.lists(), userId] as const,
  details: () => [...ORDERS_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...ORDERS_KEYS.details(), id] as const,
}

interface UseOrdersParams {
  userId: number | null
  token: string | null
  enabled?: boolean
}

export function useOrders({ userId, token, enabled = true }: UseOrdersParams) {
  return useQuery({
    queryKey: ORDERS_KEYS.list(userId!),
    queryFn: () => getUserOrders(token!),
    enabled: enabled && !!userId && !!token,
    staleTime: 1000 * 30,
  })
}

export function useOrderById(orderId: number) {
  return useQuery({
    queryKey: ORDERS_KEYS.detail(orderId),
    queryFn: () => getOrderById(orderId),
    enabled: !!orderId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data, token }: { data: CreateOrderInput; token: string }) =>
      createOrder(data, token),
    onSuccess: (data, { token }) => {
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.lists() })
      // Invalidate cart
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      orderId,
      token,
    }: {
      orderId: number
      token: string
    }) => cancelOrder(orderId, token),
    onSuccess: (data, { orderId, token }) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.detail(orderId) })
      queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.lists() })
    },
  })
}
```

- [ ] **Step 2: Write test for orders hooks**

Create: `src/hooks/queries/__tests__/useOrders.test.tsx`

```tsx
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useOrders, useCreateOrder } from '../useOrders'
import * as ordersApi from '@/src/api/orders'

jest.mock('@/src/api/orders')

const createWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('useOrders', () => {
  it('fetches user orders', async () => {
    const mockOrders = [{ id: 1, status: 'pending' }]
    ;(ordersApi.getUserOrders as jest.Mock).mockResolvedValue(mockOrders)

    const { result } = renderHook(
      () => useOrders({ userId: 1, token: 'test-token' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockOrders)
  })
})

describe('useCreateOrder', () => {
  it('creates order and invalidates cache', async () => {
    const mockOrder = { id: 1, status: 'created' }
    ;(ordersApi.createOrder as jest.Mock).mockResolvedValue(mockOrder)

    const { result } = renderHook(() => useCreateOrder(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate({
        data: { items: [], total: 100 } as any,
        token: 'test-token',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(ordersApi.createOrder).toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run tests**

Run: `npm test -- src/hooks/queries/__tests__/useOrders.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/hooks/queries/useOrders.ts src/hooks/queries/__tests__/useOrders.test.tsx
git commit -m "feat: add orders query/mutation hooks"
```

---

## Task 6: Migrate Home Screen to React Query

**Files:**
- Modify: `app/(tabs)/home/index.tsx`

- [ ] **Step 1: Update imports and remove store selectors**

```tsx
// Replace store imports
import { useProducts, useCategories, useProductsInvalidate } from '@/src/hooks/queries/useProducts'
import { useProductsStore } from '@/src/store/productStore'

// Remove individual selectors, use query directly
```

- [ ] **Step 2: Replace data fetching with useQuery**

```tsx
export default function HomeScreen() {
  const router = useRouter()
  const { config, isTablet, isLandscape } = useResponsive()
  const [refreshing, setRefreshing] = useState(false)

  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const { connectionStatus, checkFullConnectivity } = useNetwork()

  // React Query hooks
  const {
    data: categoriesData = [],
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategories()

  const {
    data: newArrivalsData,
    isLoading: newArrivalsLoading,
    error: newArrivalsError,
  } = useProducts({ limit: 8, sort: 'createdAt:desc' })

  const {
    data: saleData,
    isLoading: saleLoading,
    error: saleError,
  } = useProducts({ onSale: true, limit: 4 })

  const {
    data: popularData,
    isLoading: popularLoading,
    error: popularError,
  } = useProducts({ popular: true, limit: 6 })

  // Combine errors
  const error = categoriesError || newArrivalsError || saleError || popularError

  // Memoize computed values
  const horizontalProductCount = useMemo(
    () => (isTablet ? (isLandscape ? 10 : 8) : 8),
    [isTablet, isLandscape]
  )

  const gridProductCount = useMemo(
    () => (isTablet ? (isLandscape ? 8 : 6) : 4),
    [isTablet, isLandscape]
  )

  // Handlers
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([
      refetchCategories(),
      // Add refetch for other queries
    ])
    setRefreshing(false)
  }, [refetchCategories])

  // Rest of component...
```

- [ ] **Step 3: Update data references in render**

```tsx
// Replace:
const categories = useProductsStore((state) => state.categories)
const newProducts = useProductsStore((state) => state.newProducts)

// With:
const categories = categoriesData
const newProducts = newArrivalsData?.products ?? []
const onSaleProducts = saleData?.products ?? []
const popularProducts = popularData?.products ?? []
```

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Test home screen manually**

Run: `npm run ios` or `npm run android`
Expected: Home screen loads products correctly

- [ ] **Step 6: Commit**

```bash
git add app/\(tabs\)/home/index.tsx
git commit -m "refactor: migrate home screen to React Query"
```

---

## Task 7: Migrate Cart Screen to React Query

**Files:**
- Modify: `app/(tabs)/cart/index.tsx`
- Read first: `app/(tabs)/cart/index.tsx`

- [ ] **Step 1: Read current cart screen implementation**

Read the file to understand current implementation.

- [ ] **Step 2: Update imports**

```tsx
import {
  useCart,
  useAddToCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
} from '@/src/hooks/queries/useCart'
import { useAuthStore } from '@/src/store/authStore'
import { useCartStore } from '@/src/store/cartStore' // UI state only now
```

- [ ] **Step 3: Replace cart fetching with useQuery**

```tsx
const token = useAuthStore((state) => state.token)

const {
  data: cartItems = [],
  isLoading,
  error,
  refetch,
} = useCart({ token, enabled: !!token })

const addItem = useAddToCart()
const updateQuantity = useUpdateCartItem()
const removeItem = useRemoveCartItem()
const clearCart = useClearCart()
```

- [ ] **Step 4: Update cart actions to use mutations**

```tsx
// Update quantity
const handleUpdateQuantity = useCallback(
  async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      // Remove item
      await removeItem.mutateAsync({ cartItemId, token: token! })
      return
    }

    await updateQuantity.mutateAsync({
      cartItemId,
      data: { quantity: newQuantity },
      token: token!,
    })
  },
  [updateQuantity, removeItem, token]
)

// Clear cart
const handleClearCart = useCallback(async () => {
  await clearCart.mutateAsync(token!)
}, [clearCart, token])
```

- [ ] **Step 5: Handle loading and error states from React Query**

```tsx
if (isLoading) {
  return <CartSkeleton />
}

if (error) {
  return <ErrorState error={error.message} onRetry={refetch} />
}

if (!cartItems.length) {
  return <EmptyCart />
}
```

- [ ] **Step 6: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add app/\(tabs\)/cart/index.tsx
git commit -m "refactor: migrate cart screen to React Query"
```

---

## Task 8: Migrate Favorites Screen to React Query

**Files:**
- Modify: `app/(tabs)/more/favorites.tsx`
- Read first: `app/(tabs)/more/favorites.tsx`

- [ ] **Step 1: Read current favorites screen**

Read the file to understand current implementation.

- [ ] **Step 2: Update imports and hooks**

```tsx
import { useFavorites, useToggleFavorite } from '@/src/hooks/queries/useFavorites'
import { useAuthStore } from '@/src/store/authStore'
```

- [ ] **Step 3: Replace favorites fetching**

```tsx
const token = useAuthStore((state) => state.token)

const {
  data: favoritesData,
  isLoading,
  error,
  refetch,
} = useFavorites({ token, enabled: !!token })

const toggleFavorite = useToggleFavorite()

const favoriteProducts = favoritesData?.products ?? []
```

- [ ] **Step 4: Update toggle handler**

```tsx
const handleToggleFavorite = useCallback(
  async (productId: number) => {
    if (!token) {
      Toast.show({ type: 'info', text1: 'Please login' })
      return
    }
    await toggleFavorite.mutateAsync({ productId, token })
  },
  [toggleFavorite, token]
)
```

- [ ] **Step 5: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add app/\(tabs\)/more/favorites.tsx
git commit -m "refactor: migrate favorites screen to React Query"
```

---

## Task 9: Migrate Remaining Screens

**Files:**
- Modify: `app/(tabs)/more/orders.tsx`
- Modify: `app/(tabs)/products/index.tsx`
- Modify: `app/product/[id]/index.tsx` (or equivalent product detail file)

- [ ] **Step 1: Migrate orders screen**

Similar pattern - use `useOrders` and `useCancelOrder` hooks.

- [ ] **Step 2: Migrate products listing screens**

Use `useProducts` with appropriate filters.

- [ ] **Step 3: Migrate product detail screen**

Use `useProductBySlug` or `useProductById`.

- [ ] **Step 4: Run typecheck after each migration**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit after each screen**

```bash
git add app/\(tabs\)/more/orders.tsx
git commit -m "refactor: migrate orders screen to React Query"

git add app/\(tabs\)/products/index.tsx
git commit -m "refactor: migrate products screen to React Query"

git add app/product/\[id\]/*.tsx
git commit -m "refactor: migrate product detail to React Query"
```

---

## Task 10: Cleanup and Final Migration

**Files:**
- Modify: All remaining files using old store patterns
- Delete: `src/api/products.ts` (optional - keep if used elsewhere)
- Delete: `src/api/cart.ts` (optional)
- Delete: `src/api/favorites.ts` (optional)

- [ ] **Step 1: Search for remaining store usage**

Run: `grep -r "fetchProducts\|fetchCart\|fetchFavorites" src/ app/`
Expected: No results (or update remaining files)

- [ ] **Step 2: Update API client to work with React Query**

Modify `src/api/client.ts` to throw proper errors for React Query's error handling.

- [ ] **Step 3: Remove deprecated store methods**

Clean up `productStore.ts`, `cartStore.ts`, `favoritesStore.ts` to remove any remaining fetch methods.

- [ ] **Step 4: Run full test suite**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 5: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Manual testing checklist**

- [ ] Home screen loads and refreshes correctly
- [ ] Cart add/update/remove works with optimistic updates
- [ ] Favorites toggle works with optimistic updates
- [ ] Orders list and detail screens work
- [ ] Products listing with filters works
- [ ] Product detail screen works
- [ ] Pull-to-refresh works on all screens
- [ ] Offline handling works (queries fail gracefully)

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "refactor: complete React Query migration cleanup"
```

---

## Testing Strategy

**Unit Tests:**
- Each query hook tested with mocked API
- Optimistic update behavior verified
- Error handling tested

**Integration Tests:**
- Screen renders with loading/success/error states
- Pull-to-refresh triggers refetch
- Mutations invalidate correct queries

**Manual Testing:**
- All screens work end-to-end
- Optimistic updates feel instant
- Rollback works on mutation errors
- Offline mode shows appropriate errors

---

## Migration Checklist

- [ ] Task 1: QueryClient Provider setup
- [ ] Task 2: Products query hooks
- [ ] Task 3: Cart query/mutation hooks
- [ ] Task 4: Favorites query/mutation hooks
- [ ] Task 5: Orders query hooks
- [ ] Task 6: Home screen migration
- [ ] Task 7: Cart screen migration
- [ ] Task 8: Favorites screen migration
- [ ] Task 9: Remaining screens migration
- [ ] Task 10: Cleanup and final migration

---

Plan complete. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
