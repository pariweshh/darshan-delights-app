import {
  addToCart,
  deleteBasket,
  deleteCartItem,
  getUserCartItems,
  updateCartItem,
} from '@/src/api/cart'
import { CartItem } from '@/src/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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
    staleTime: 1000 * 30, // 30s — mutations invalidate immediately, so this is safe
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
      const previousCart = queryClient.getQueryData<CartItem[]>(CART_KEYS.detail())

      queryClient.setQueryData<CartItem[]>(CART_KEYS.detail(), (old = []) => {
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
    onError: (_err, _variables, context) => {
      if (context?.previousCart !== undefined) {
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
      const previousCart = queryClient.getQueryData<CartItem[]>(CART_KEYS.detail())

      queryClient.setQueryData<CartItem[]>(CART_KEYS.detail(), (old = []) =>
        old.map((item) =>
          item.basket_item_id === cartItemId ? { ...item, ...data } : item
        )
      )

      return { previousCart }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCart !== undefined) {
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
    mutationFn: ({ cartItemId, token }: { cartItemId: number; token: string }) =>
      deleteCartItem(cartItemId, token),
    onMutate: async ({ cartItemId }) => {
      await queryClient.cancelQueries({ queryKey: CART_KEYS.detail() })
      const previousCart = queryClient.getQueryData<CartItem[]>(CART_KEYS.detail())

      queryClient.setQueryData<CartItem[]>(CART_KEYS.detail(), (old = []) =>
        old.filter((item) => item.basket_item_id !== cartItemId)
      )

      return { previousCart }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCart !== undefined) {
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
      const previousCart = queryClient.getQueryData<CartItem[]>(CART_KEYS.detail())
      queryClient.setQueryData(CART_KEYS.detail(), [])
      return { previousCart }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCart !== undefined) {
        queryClient.setQueryData(CART_KEYS.detail(), context.previousCart)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEYS.detail() })
    },
  })
}
