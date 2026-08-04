import { getFavorites, toggleFavorite } from '@/src/api/favorites'
import { Product } from '@/src/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface FavoriteItem {
  id?: number
  user_id?: number
  products: Product[]
}

// Query keys are scoped by token so favorites cache can never bleed between
// accounts on the same device (e.g. logging into a different user).
export const FAVORITES_KEYS = {
  all: ['favorites'] as const,
  detail: (token?: string | null) =>
    [...FAVORITES_KEYS.all, 'detail', token ?? 'guest'] as const,
}

interface UseFavoritesParams {
  token: string | null
  enabled?: boolean
}

export function useFavorites({ token, enabled = true }: UseFavoritesParams) {
  return useQuery<FavoriteItem>({
    queryKey: FAVORITES_KEYS.detail(token),
    queryFn: () => getFavorites(token!),
    enabled: enabled && !!token,
    staleTime: 1000 * 30,
    select: (data) => data ?? { products: [] },
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, token }: { productId: number; token: string }) =>
      toggleFavorite({ product_id: productId }, token),
    onMutate: async ({ productId, token }) => {
      const key = FAVORITES_KEYS.detail(token)
      await queryClient.cancelQueries({ queryKey: key })
      const previousFavorites = queryClient.getQueryData<FavoriteItem>(key)

      // Optimistic remove — if adding, we don't have full product data so skip optimistic add
      queryClient.setQueryData<FavoriteItem>(key, (old) => {
        const products = old?.products ?? []
        const exists = products.some((p) => p.id === productId)
        if (exists) {
          return { ...old, products: products.filter((p) => p.id !== productId) }
        }
        // For adds, keep existing data — server response will provide the full updated list
        return old
      })

      return { previousFavorites }
    },
    onSuccess: (data, variables) => {
      // Replace cache with authoritative server response
      queryClient.setQueryData<FavoriteItem>(
        FAVORITES_KEYS.detail(variables.token),
        data
      )
    },
    onError: (_err, variables, context) => {
      if (context?.previousFavorites !== undefined) {
        queryClient.setQueryData(
          FAVORITES_KEYS.detail(variables.token),
          context.previousFavorites
        )
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: FAVORITES_KEYS.detail(variables.token),
      })
    },
  })
}

export function useIsFavorite(productId: number, token: string | null) {
  const { data } = useFavorites({ token, enabled: !!token && productId !== 0 })
  return productId !== 0 && (data?.products?.some((p) => p.id === productId) ?? false)
}
