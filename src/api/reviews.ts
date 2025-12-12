import {
  ProductReviewsResponse,
  Review,
  ReviewFormData,
  ReviewStats,
} from "../types/review"
import api from "./client"

/**
 * Get reviews for a product
 */
export async function getProductReviews(
  productId: number,
  page: number = 0,
  pageSize: number = 10,
  sortBy: "newest" | "oldest" | "highest" | "lowest" = "newest"
): Promise<ProductReviewsResponse> {
  const sortMap = {
    newest: "createdAt:desc",
    oldest: "createdAt:asc",
    highest: "rating:desc",
    lowest: "rating:asc",
  }

  const response = await api.get(`/reviews/product/${productId}`, {
    params: {
      page,
      pageSize,
      sort: sortMap[sortBy],
    },
  })

  return response.data
}

/**
 * Get review stats for a product
 */
export async function getProductReviewStats(
  productId: number
): Promise<ReviewStats> {
  const response = await api.get(`/reviews/product/${productId}/stats`)
  return response.data
}

/**
 * Get user's review for a product (if exists)
 */
export async function getUserProductReview(
  productId: number,
  token: string
): Promise<Review | null> {
  try {
    const response = await api.get(`/reviews/user/product/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data.data
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Check if user can review a product (has purchased it)
 */
export async function canUserReviewProduct(
  productId: number,
  token: string
): Promise<{ canReview: boolean; orderId?: number }> {
  const response = await api.get(`/reviews/can-review/${productId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

/**
 * Create a new review
 */
export async function createReview(
  data: ReviewFormData,
  token: string
): Promise<Review> {
  const response = await api.post(
    "/reviews",
    {
      data: {
        rating: data.rating,
        title: data.title || null,
        message: data.message,
        product: data.productId,
        order: data.orderId || null,
      },
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  return response.data.data
}

/**
 * Update an existing review
 */
export async function updateReview(
  reviewId: number,
  data: Partial<ReviewFormData>,
  token: string
): Promise<Review> {
  const response = await api.put(
    `/reviews/${reviewId}`,
    {
      data: {
        rating: data.rating,
        title: data.title || null,
        message: data.message,
      },
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  return response.data.data
}

/**
 * Delete a review
 */
export async function deleteReview(
  reviewId: number,
  token: string
): Promise<{ success: boolean }> {
  const response = await api.delete(`/reviews/${reviewId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  return response.data
}

/**
 * Mark a review as helpful
 */
export async function markReviewHelpful(
  reviewId: number,
  token: string
): Promise<{ helpfulCount: number }> {
  const response = await api.post(
    `/reviews/${reviewId}/helpful`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  return response.data
}

/**
 * Get all reviews by the current user
 */
export async function getUserReviews(
  token: string,
  page: number = 0,
  pageSize: number = 10
): Promise<{ data: Review[]; meta: any }> {
  const response = await api.get("/reviews/user", {
    headers: { Authorization: `Bearer ${token}` },
    params: { page, pageSize },
  })

  return response.data
}
