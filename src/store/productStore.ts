import { create } from 'zustand'

interface ProductsState {
  selectedCategory: string | null
  setCategory: (category: string | null) => void
}

export const useProductsStore = create<ProductsState>()((set) => ({
  selectedCategory: null,
  setCategory: (category) => set({ selectedCategory: category }),
}))
