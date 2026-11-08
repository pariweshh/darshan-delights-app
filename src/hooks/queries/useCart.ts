import {
  addToCart,
  deleteBasket,
  deleteCartItem,
  getUserCartItems,
  updateCartItem,
} from '@/src/api/cart'
import { CartItem } from '@/src/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

// Query keys are scoped by token so cart cache can never bleed between
// accounts on the same device.
export const CART_KEYS = {
  all: ['cart'] as const,
  detail: (token?: string | null) =>
    [...CART_KEYS.all, 'detail', token ?? 'guest'] as const,
}

interface UseCartParams {
  token: string | null
  enabled?: boolean
}

export function useCart({ token, enabled = true }: UseCartParams) {
  return useQuery({
    queryKey: CART_KEYS.detail(token),
    queryFn: () => getUserCartItems(token!),
    enabled: enabled && !!token,
    staleTime: 1000 * 30, // 30s — mutations invalidate immediately, so this is safe
  })
}

/**
 * Fine-grained selector hook returning only the cart quantity for a specific product.
 * Compares scalar number output; skips re-rendering when other items in the cart change.
 */
export function useCartItemQuantity(productId: number, token: string | null) {
  const selectQuantity = useCallback(
    (items: CartItem[]) =>
      items?.find((item) => +item.product_id === +productId)?.quantity ?? 0,
    [productId]
  )

  return useQuery({
    queryKey: CART_KEYS.detail(token),
    queryFn: () => getUserCartItems(token!),
    enabled: !!token && productId > 0,
    staleTime: 1000 * 30,
    select: selectQuantity,
  })
}

/**
 * Fine-grained selector hook returning only the count of unique items in cart.
 * Prevents re-renders of headers/badges when item quantities change but count remains unchanged.
 */
export function useCartCount(token: string | null) {
  const selectCount = useCallback(
    (items: CartItem[]) => items?.length ?? 0,
    []
  )

  const { data: count = 0 } = useQuery({
    queryKey: CART_KEYS.detail(token),
    queryFn: () => getUserCartItems(token!),
    enabled: !!token,
    staleTime: 1000 * 30,
    select: selectCount,
  })

  return count
}

export function useAddToCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ product, token }: { product: CartItem; token: string }) =>
      addToCart(product, token),
    onMutate: async (newItem) => {
      const key = CART_KEYS.detail(newItem.token)
      await queryClient.cancelQueries({ queryKey: key })
      const previousCart = queryClient.getQueryData<CartItem[]>(key)

      queryClient.setQueryData<CartItem[]>(key, (old = []) => {
        const existing = old.find((item) => +item.product_id === +newItem.product.product_id)
        if (existing) {
          return old.map((item) =>
            +item.product_id === +newItem.product.product_id
              ? {
                  ...item,
                  quantity: item.quantity + newItem.product.quantity,
                  amount: item.amount + newItem.product.amount,
                }
              : item
          )
        }
        return [...old, newItem.product]
      })

      return { previousCart }
    },
    onError: (_err, variables, context) => {
      if (context?.previousCart !== undefined) {
        queryClient.setQueryData(
          CART_KEYS.detail(variables.token),
          context.previousCart
        )
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: CART_KEYS.detail(variables.token),
      })
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
    onMutate: async ({ cartItemId, data, token }) => {
      const key = CART_KEYS.detail(token)
      await queryClient.cancelQueries({ queryKey: key })
      const previousCart = queryClient.getQueryData<CartItem[]>(key)

      queryClient.setQueryData<CartItem[]>(key, (old = []) =>
        old.map((item) =>
          item.basket_item_id === cartItemId ? { ...item, ...data } : item
        )
      )

      return { previousCart }
    },
    onError: (_err, variables, context) => {
      if (context?.previousCart !== undefined) {
        queryClient.setQueryData(
          CART_KEYS.detail(variables.token),
          context.previousCart
        )
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: CART_KEYS.detail(variables.token),
      })
    },
  })
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cartItemId, token }: { cartItemId: number; token: string }) =>
      deleteCartItem(cartItemId, token),
    onMutate: async ({ cartItemId, token }) => {
      const key = CART_KEYS.detail(token)
      await queryClient.cancelQueries({ queryKey: key })
      const previousCart = queryClient.getQueryData<CartItem[]>(key)

      queryClient.setQueryData<CartItem[]>(key, (old = []) =>
        old.filter((item) => item.basket_item_id !== cartItemId)
      )

      return { previousCart }
    },
    onError: (_err, variables, context) => {
      if (context?.previousCart !== undefined) {
        queryClient.setQueryData(
          CART_KEYS.detail(variables.token),
          context.previousCart
        )
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: CART_KEYS.detail(variables.token),
      })
    },
  })
}

export function useClearCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (token: string) => deleteBasket(token),
    onMutate: async (token) => {
      const key = CART_KEYS.detail(token)
      await queryClient.cancelQueries({ queryKey: key })
      const previousCart = queryClient.getQueryData<CartItem[]>(key)
      queryClient.setQueryData(key, [])
      return { previousCart }
    },
    onError: (_err, token, context) => {
      if (context?.previousCart !== undefined) {
        queryClient.setQueryData(
          CART_KEYS.detail(token),
          context.previousCart
        )
      }
    },
    onSettled: (_data, _error, token) => {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.detail(token) })
    },
  })
}
