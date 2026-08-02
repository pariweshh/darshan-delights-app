import { FAVORITES_KEYS } from '@/src/hooks/queries/useFavorites'
import { create } from 'zustand'

interface FavoritesState {
  clearFavoritesOnLogout: () => void
}

export const useFavoritesStore = create<FavoritesState>()(() => ({
  clearFavoritesOnLogout: () => {
    import('@/src/providers/QueryProvider').then(({ queryClientInstance }) => {
      queryClientInstance?.setQueryData(FAVORITES_KEYS.detail(), { products: [] })
    })
  },
}))
