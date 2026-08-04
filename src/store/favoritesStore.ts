import { FAVORITES_KEYS } from '@/src/hooks/queries/useFavorites'
import { create } from 'zustand'

interface FavoritesState {
  clearFavoritesOnLogout: () => void
}

export const useFavoritesStore = create<FavoritesState>()(() => ({
  clearFavoritesOnLogout: () => {
    import('@/src/providers/QueryProvider').then(({ queryClientInstance }) => {
      // Keys are token-scoped (Bug #8) — clear every user's favorites cache on logout
      queryClientInstance?.setQueriesData(
        { queryKey: FAVORITES_KEYS.all },
        { products: [] }
      )
    })
  },
}))
