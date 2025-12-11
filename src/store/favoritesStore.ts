import { getFavorites, toggleFavorite } from "@/src/api/favorites"
import { Product } from "@/src/types"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

// Favorites response structure from your API
interface FavoriteItem {
  id?: number
  user_id?: number
  products: Product[]
}

interface FavoritesState {
  favoriteList: FavoriteItem
  isLoading: boolean
  error: string | null

  fetchFavorites: (token: string) => Promise<void>
  toggleFavorite: (data: { product_id: number }, token: string) => Promise<void>
  isFavorite: (productId: number) => boolean
  resetFavorites: () => void
  clearFavoritesOnLogout: () => void
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteList: {} as FavoriteItem,
      isLoading: false,
      error: null,

      fetchFavorites: async (token: string) => {
        set({ isLoading: true, error: null })
        try {
          const data = await getFavorites(token)
          set({ favoriteList: data, isLoading: false, error: null })
        } catch (error: any) {
          set({ error: error.message, isLoading: false })
        }
      },

      toggleFavorite: async (data: { product_id: number }, token: string) => {
        set({ isLoading: true, error: null })
        try {
          const payload = await toggleFavorite(data, token)
          set({ favoriteList: payload, isLoading: false, error: null })
        } catch (error: any) {
          set({ error: error.message, isLoading: false })
        }
      },

      isFavorite: (productId: number) => {
        const { favoriteList } = get()
        return (
          favoriteList?.products?.some((item) => item.id === productId) ?? false
        )
      },

      resetFavorites: () => {
        set({ favoriteList: {} as FavoriteItem })
      },

      clearFavoritesOnLogout: () => {
        set({ favoriteList: {} as FavoriteItem, isLoading: false, error: null })
        AsyncStorage.removeItem("favorites-storage")
      },
    }),
    {
      name: "favorites-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
