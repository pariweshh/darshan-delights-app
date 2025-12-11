import { useCallback } from "react"
import { useRecentlyViewedStore } from "../store/recentlyViewedStore"
import { Product } from "../types"

/**
 * Hook to manage recently viewed products
 */
export function useRecentlyViewed() {
  const { products, addProduct, removeProduct, clearAll, getProducts } =
    useRecentlyViewedStore()

  /**
   * Track a product view
   */
  const trackProductView = useCallback(
    (product: Product) => {
      if (!product?.id) return
      addProduct({
        id: product.id,
        name: product.name,
        slug: product.slug,
        cover: product?.cover?.url || product?.cover || "",
        rrp: product.rrp,
        sale_price: product.sale_price,
      })
    },
    [addProduct]
  )

  /**
   * Get recently viewed products
   */
  const getRecentProducts = useCallback(
    (limit?: number) => {
      return getProducts(limit)
    },
    [getProducts]
  )

  /**
   * Check if a product was recently viewed
   */
  const wasRecentlyViewed = useCallback(
    (productId: number) => {
      return products.some((p) => p.id === productId)
    },
    [products]
  )

  return {
    recentProducts: products,
    trackProductView,
    getRecentProducts,
    wasRecentlyViewed,
    removeProduct,
    clearAll,
  }
}
