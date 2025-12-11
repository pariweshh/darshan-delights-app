export interface Review {
  id: number
  rating: number
  title?: string
  message: string
  isVerifiedPurchase?: boolean
  helpfulCount?: number
  status?: "pending" | "approved" | "rejected"
  user: {
    id: number
    username: string
    fName?: string
    lName?: string
  }
  product: {
    id: number
    name: string
  }
  order?: {
    id: number
    orderNumber: string
  }
  createdAt: string
  updatedAt: string
}

export interface ReviewFormData {
  rating: number
  title?: string
  message: string
  productId: number
  orderId?: number
}

export interface ReviewStats {
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

export interface ProductReviewsResponse {
  data: Review[]
  stats: ReviewStats
  meta: {
    pagination: {
      page: number
      pageSize: number
      total: number
      pageCount: number
    }
  }
}
