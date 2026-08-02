import {
  canUserReviewProduct,
  deleteReview,
  getProductReviews,
  getUserProductReview,
  getUserReviews,
} from '@/src/api/reviews'
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export type ReviewSortOption = 'newest' | 'oldest' | 'highest' | 'lowest'

export const REVIEW_SORT_OPTIONS: { value: ReviewSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest', label: 'Lowest Rated' },
]

export const REVIEWS_KEYS = {
  all: ['reviews'] as const,
  productLists: () => [...REVIEWS_KEYS.all, 'product'] as const,
  productInfinite: (productId: number, sortBy: string) =>
    [...REVIEWS_KEYS.productLists(), productId, 'infinite', sortBy] as const,
  userLists: () => [...REVIEWS_KEYS.all, 'user'] as const,
  userInfinite: (userId: string | null) =>
    [...REVIEWS_KEYS.userLists(), 'infinite', userId] as const,
  userProductReview: (productId: number, userId: string | null) =>
    [...REVIEWS_KEYS.userLists(), 'product', productId, userId] as const,
  canReview: (productId: number, userId: string | null) =>
    [...REVIEWS_KEYS.userLists(), 'canReview', productId, userId] as const,
}

export function useInfiniteProductReviews({
  productId,
  sortBy,
  pageSize = 10,
}: {
  productId: number
  sortBy: ReviewSortOption
  pageSize?: number
}) {
  return useInfiniteQuery({
    queryKey: REVIEWS_KEYS.productInfinite(productId, sortBy),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      getProductReviews(productId, pageParam, pageSize, sortBy),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.length < pageSize) return undefined
      const { page, pageCount } = lastPage.meta.pagination
      return page + 1 < pageCount ? page + 1 : undefined
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  })
}

export function useInfiniteUserReviews({
  token,
  userId,
  pageSize = 10,
}: {
  token: string | null
  userId: string | null
  pageSize?: number
}) {
  return useInfiniteQuery({
    queryKey: REVIEWS_KEYS.userInfinite(userId),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      getUserReviews(token!, pageParam, pageSize),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.length < pageSize) return undefined
      const { page, pageCount } = lastPage.meta.pagination
      return page + 1 < pageCount ? page + 1 : undefined
    },
    enabled: !!token && !!userId,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  })
}

export function useUserReviewStatus(productId: number, token: string | null, userId: string | null) {
  const { data: userReview, isSuccess: userReviewLoaded } = useQuery({
    queryKey: REVIEWS_KEYS.userProductReview(productId, userId),
    queryFn: () => getUserProductReview(productId, token!),
    enabled: !!token && !!userId && !!productId,
    staleTime: 1000 * 60 * 5,
  })

  const { data: reviewStatus } = useQuery({
    queryKey: REVIEWS_KEYS.canReview(productId, userId),
    queryFn: () => canUserReviewProduct(productId, token!),
    enabled: !!token && !!userId && !!productId && userReviewLoaded && !userReview,
    staleTime: 1000 * 60 * 5,
  })

  return {
    userReview: userReview ?? null,
    canReview: reviewStatus?.canReview ?? false,
    reviewOrderId: reviewStatus?.orderId,
  }
}

export function useDeleteReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, token }: { reviewId: number; token: string }) =>
      deleteReview(reviewId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REVIEWS_KEYS.productLists() })
      queryClient.invalidateQueries({ queryKey: REVIEWS_KEYS.userLists() })
    },
  })
}
