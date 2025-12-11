import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { RecentlyViewedProduct } from "../types/recentlyViewed"

const MAX_RECENT_PRODUCTS = 20
const STORAGE_KEY = "recently-viewed-products"

interface RecentlyViewedState {
  products: RecentlyViewedProduct[]

  // Actions
  addProduct: (product: Omit<RecentlyViewedProduct, "viewedAt">) => void
  removeProduct: (productId: number) => void
  clearAll: () => void
  getProducts: (limit?: number) => RecentlyViewedProduct[]
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      products: [],

      addProduct: (product) => {
        set((state) => {
          // remove if already exists (readd on top)
          const filtered = state.products.filter((p) => p.id !== product.id)

          // add new product on top
          const newProduct: RecentlyViewedProduct = {
            ...product,
            viewedAt: Date.now(),
          }

          // keep only the last MAX_RECENT_PRODUCTS
          const updated = [newProduct, ...filtered].slice(
            0,
            MAX_RECENT_PRODUCTS
          )

          return { products: updated }
        })
      },

      removeProduct: (productId) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== productId),
        }))
      },

      clearAll: () => {
        set({ products: [] })
      },

      getProducts: (limit?: number) => {
        const { products } = get()
        if (limit) {
          return products.slice(0, limit)
        }
        return products
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
