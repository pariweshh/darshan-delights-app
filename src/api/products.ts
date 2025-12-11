import { Brand, Category, Product, ProductParams } from "../types"
import api from "./client"

export const getProducts = async (
  params: ProductParams
): Promise<{ products: Product[]; total: number }> => {
  try {
    const { data } = await api.get<{ products: Product[]; total: number }>(
      "/products",
      {
        params: {
          _start: params?.start,
          _limit: params?.limit,
          _sort: params?.sort || "createdAt:desc",
          category: params?.category,
          popular: params?.popular,
          onSale: params?.onSale,
          brand: params?.brand,
          query: params?.query,
          selectedBrands: params?.selectedBrands,
        },
      }
    )
    return data
  } catch (error) {
    console.error("[PRODUCTS ERROR - getProducts]:", error)
    throw error
  }
}

export const getProductById = async (id: number): Promise<Product> => {
  try {
    const { data } = await api.get<Product>(`/products/${id}`)
    return data
  } catch (error) {
    console.error("[PRODUCTS ERROR - getProductById]:", error)
    throw error
  }
}

export const getProductBySlug = async (slug: string): Promise<Product> => {
  if (!slug) throw new Error("Slug is required")
  try {
    const { data } = await api.get<{ products: Product[] }>("/products", {
      params: { slug },
    })
    return data.products[0]
  } catch (error) {
    console.error("[PRODUCTS ERROR - getProductBySlug]:", error)
    throw error
  }
}

export const searchProducts = async (
  query: string,
  limit?: number,
  start?: number,
  sort?: string
): Promise<{ products: Product[]; total: number }> => {
  if (!query || query.trim() === "") {
    return { products: [], total: 0 }
  }
  try {
    const { data } = await api.get<{ products: Product[]; total: number }>(
      "/products",
      {
        params: { query, _limit: limit, _start: start, _sort: sort },
      }
    )
    return data
  } catch (error) {
    console.error("[PRODUCTS ERROR - searchProducts]:", error)
    throw error
  }
}

export const getCategories = async (): Promise<Category[]> => {
  try {
    const { data } = await api.get<Category[]>("/categories")
    return data
  } catch (error) {
    console.error("[PRODUCTS ERROR - getCategories]:", error)
    throw error
  }
}

export const getBrands = async (): Promise<Brand[]> => {
  try {
    const { data } = await api.get<Brand[]>("/brands")
    return data
  } catch (error) {
    console.error("[PRODUCTS ERROR - getBrands]:", error)
    throw error
  }
}
