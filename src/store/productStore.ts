import { getBrands, getCategories, getProducts } from "@/src/api/products"
import { Brand, Category, Product, ProductParams } from "@/src/types"
import { create } from "zustand"

interface ProductsState {
  products: Product[]
  newProducts: Product[]
  onSaleProducts: Product[]
  popularProducts: Product[]
  filteredProducts: Product[]
  categories: Category[]
  selectedCategory: string | null
  brands: Brand[]

  loading: boolean
  newArrivalsLoading: boolean
  popularLoading: boolean
  saleLoading: boolean
  categoriesLoading: boolean
  error: string | null

  // Actions
  fetchProducts: (
    params: ProductParams
  ) => Promise<{ products: Product[]; total: number }>
  fetchNewArrivals: () => Promise<void>
  fetchOnSaleProducts: () => Promise<void>
  fetchPopularProducts: () => Promise<void>
  fetchCategories: () => Promise<void>
  fetchBrands: () => Promise<void>
  setCategory: (category: string | null) => void
  searchProductsRealTime: (query: string) => Promise<void>
  clearError: () => void
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  newProducts: [],
  onSaleProducts: [],
  popularProducts: [],
  filteredProducts: [],
  categories: [],
  brands: [],
  selectedCategory: null,

  loading: false,
  newArrivalsLoading: false,
  popularLoading: false,
  saleLoading: false,
  categoriesLoading: false,
  error: null,

  fetchProducts: async (params: ProductParams) => {
    try {
      set({ loading: true, error: null })
      const result = await getProducts(params)

      if (!params.start || params.start === 0) {
        set({
          products: result.products || [],
          filteredProducts: result.products || [],
          loading: false,
        })
      } else {
        set({ loading: false })
      }

      return result
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  fetchNewArrivals: async () => {
    try {
      set({ newArrivalsLoading: true, error: null })
      const result = await getProducts({ limit: 8 })
      set({
        newProducts: result.products || [],
        newArrivalsLoading: false,
      })
    } catch (error: any) {
      set({ error: error.message, newArrivalsLoading: false })
    }
  },

  fetchOnSaleProducts: async () => {
    try {
      set({ saleLoading: true, error: null })
      const result = await getProducts({ onSale: true, limit: 4 })
      set({
        onSaleProducts: result.products || [],
        saleLoading: false,
      })
    } catch (error: any) {
      set({ error: error.message, saleLoading: false })
    }
  },

  fetchPopularProducts: async () => {
    try {
      set({ popularLoading: true, error: null })
      const result = await getProducts({ popular: true, limit: 6 })
      set({
        popularProducts: result.products || [],
        popularLoading: false,
      })
    } catch (error: any) {
      set({ error: error.message, popularLoading: false })
    }
  },

  fetchCategories: async () => {
    try {
      set({ categoriesLoading: true, error: null })
      const categories = await getCategories()
      set({ categories: categories || [], categoriesLoading: false })
    } catch (error: any) {
      set({ error: error.message, categoriesLoading: false })
    }
  },

  fetchBrands: async () => {
    try {
      set({ loading: true, error: null })
      const brands = await getBrands()
      set({ brands: brands || [], loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  setCategory: (category: string | null) => {
    set({ selectedCategory: category })
  },

  searchProductsRealTime: async (query: string) => {
    try {
      set({ loading: true, error: null })

      if (!query || query.trim() === "") {
        set({ filteredProducts: [], loading: false })
        return
      }

      const result = await getProducts({ query })
      set({
        filteredProducts: result.products || [],
        loading: false,
      })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
