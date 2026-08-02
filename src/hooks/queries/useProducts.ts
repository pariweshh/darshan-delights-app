import { getBrands, getCategories, getProductById, getProductBySlug, getProducts } from '@/src/api/products'
import { Brand, Category, Product, ProductParams } from '@/src/types'
import { keepPreviousData, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'

export const PRODUCTS_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCTS_KEYS.all, 'list'] as const,
  list: (params: ProductParams) => [...PRODUCTS_KEYS.lists(), params] as const,
  infiniteList: (params: Omit<ProductParams, 'start'>) =>
    [...PRODUCTS_KEYS.lists(), 'infinite', params] as const,
  details: () => [...PRODUCTS_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...PRODUCTS_KEYS.details(), id] as const,
  detailBySlug: (slug: string) => [...PRODUCTS_KEYS.details(), 'slug', slug] as const,
  categories: () => [...PRODUCTS_KEYS.all, 'categories'] as const,
  brands: () => [...PRODUCTS_KEYS.all, 'brands'] as const,
}

export function useProducts(params: ProductParams) {
  return useQuery({
    queryKey: PRODUCTS_KEYS.list(params),
    queryFn: () => getProducts(params),
    staleTime: 1000 * 30,
  })
}

export function useProductById(id: number) {
  return useQuery({
    queryKey: PRODUCTS_KEYS.detail(id),
    queryFn: () => getProductById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: PRODUCTS_KEYS.detailBySlug(slug),
    queryFn: () => getProductBySlug(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: PRODUCTS_KEYS.categories(),
    queryFn: getCategories,
    staleTime: 1000 * 60 * 10,
  })
}

export function useBrands() {
  return useQuery({
    queryKey: PRODUCTS_KEYS.brands(),
    queryFn: getBrands,
    staleTime: 1000 * 60 * 10,
  })
}

export function useProductsInvalidate() {
  const queryClient = useQueryClient()
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: PRODUCTS_KEYS.all }),
    invalidateList: (params?: ProductParams) =>
      queryClient.invalidateQueries({
        queryKey: params ? PRODUCTS_KEYS.list(params) : PRODUCTS_KEYS.lists(),
      }),
    invalidateDetail: (id?: number) =>
      queryClient.invalidateQueries({
        queryKey: id ? PRODUCTS_KEYS.detail(id) : PRODUCTS_KEYS.details(),
      }),
    invalidateDetailBySlug: (slug?: string) =>
      queryClient.invalidateQueries({
        queryKey: slug ? PRODUCTS_KEYS.detailBySlug(slug) : PRODUCTS_KEYS.details(),
      }),
  }
}

export function useInfiniteProducts(params: Omit<ProductParams, 'start'>) {
  return useInfiniteQuery({
    queryKey: PRODUCTS_KEYS.infiniteList(params),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      getProducts({ ...params, start: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.products.length < (params.limit ?? Infinity)) return undefined
      const fetched = allPages.flatMap((p) => p.products).length
      return fetched < lastPage.total ? fetched : undefined
    },
    staleTime: 1000 * 30,
    placeholderData: keepPreviousData,
  })
}
