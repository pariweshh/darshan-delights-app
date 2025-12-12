import { Ionicons } from "@expo/vector-icons"
import React, { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import Toast from "react-native-toast-message"

import {
  canUserReviewProduct,
  deleteReview,
  getProductReviews,
  getUserProductReview,
} from "@/src/api/reviews"
import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"
import { Review, ReviewStats } from "@/src/types/review"
import EmptyState from "../common/EmptyState"
import RatingSummary from "./RatingSummary"
import ReviewCard from "./ReviewCard"
import WriteReviewModal from "./WriteReviewModal"

interface ProductReviewsProps {
  productId: number
  productName: string
}

type SortOption = "newest" | "oldest" | "highest" | "lowest"

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
]

const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  productName,
}) => {
  const { token, user } = useAuthStore()

  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [showSortPicker, setShowSortPicker] = useState(false)

  const [userReview, setUserReview] = useState<Review | null>(null)
  const [canReview, setCanReview] = useState(false)
  const [reviewOrderId, setReviewOrderId] = useState<number | undefined>()
  const [showWriteReview, setShowWriteReview] = useState(false)

  /**
   * Fetch reviews
   */
  const fetchReviews = useCallback(
    async (pageNum: number = 0, sort: SortOption = sortBy) => {
      try {
        if (pageNum === 0) {
          setIsLoading(true)
        } else {
          setIsLoadingMore(true)
        }

        const response = await getProductReviews(productId, pageNum, 10, sort)

        if (pageNum === 1) {
          setReviews(response.data)
          setStats(response.stats)
        } else {
          setReviews((prev) => [...prev, ...response.data])
        }

        setHasMore(pageNum < response.meta.pagination.pageCount)
        setPage(pageNum)
      } catch (error) {
        console.error("Error fetching reviews:", error)
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load reviews",
          visibilityTime: 2000,
        })
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [productId, sortBy]
  )

  /**
   * Check user's review status
   */
  const checkUserReviewStatus = useCallback(async () => {
    if (!token) return

    try {
      // Check if user has already reviewed
      const existingReview = await getUserProductReview(productId, token)
      setUserReview(existingReview)

      // Check if user can review (has purchased)
      if (!existingReview) {
        const { canReview: canUserReview, orderId } =
          await canUserReviewProduct(productId, token)
        setCanReview(canUserReview)
        setReviewOrderId(orderId)
      }
    } catch (error) {
      console.error("Error checking review status:", error)
    }
  }, [productId, token])

  /**
   * Initial fetch
   */
  useEffect(() => {
    fetchReviews(0)
    checkUserReviewStatus()
  }, [fetchReviews, checkUserReviewStatus])

  /**
   * Handle sort change
   */
  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort)
    setShowSortPicker(false)
    fetchReviews(0, sort)
  }

  /**
   * Handle load more
   */
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchReviews(page + 1)
    }
  }

  /**
   * Handle review submitted
   */
  const handleReviewSuccess = (review: Review) => {
    setUserReview(review)
    setCanReview(false)
    // Refresh reviews list
    fetchReviews(0)
  }

  /**
   * Handle edit review
   */
  const handleEditReview = () => {
    setShowWriteReview(true)
  }

  /**
   * Handle delete review
   */
  const handleDeleteReview = async () => {
    if (!userReview || !token) return

    try {
      await deleteReview(userReview.id, token)
      setUserReview(null)
      // Re-check if user can review
      const { canReview: canUserReview, orderId } = await canUserReviewProduct(
        productId,
        token
      )
      setCanReview(canUserReview)
      setReviewOrderId(orderId)
      // Refresh reviews
      fetchReviews(0)
      Toast.show({
        type: "success",
        text1: "Deleted",
        text2: "Your review has been deleted",
        visibilityTime: 2000,
      })
    } catch (error) {
      console.error("Error deleting review:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete review",
        visibilityTime: 2000,
      })
    }
  }

  /**
   * Render header
   */
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Rating Summary */}
      {stats && stats.totalReviews > 0 && <RatingSummary stats={stats} />}

      {/* Write Review Button */}
      {token && (canReview || userReview) && (
        <TouchableOpacity
          style={styles.writeReviewButton}
          onPress={() => setShowWriteReview(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={userReview ? "pencil" : "create-outline"}
            size={20}
            color={AppColors.primary[600]}
          />
          <Text style={styles.writeReviewText}>
            {userReview ? "Edit Your Review" : "Write a Review"}
          </Text>
        </TouchableOpacity>
      )}

      {/* User's Review */}
      {userReview && (
        <View style={styles.userReviewSection}>
          <Text style={styles.userReviewTitle}>Your Review</Text>
          <ReviewCard
            review={userReview}
            onEdit={handleEditReview}
            onDelete={handleDeleteReview}
          />
        </View>
      )}

      {/* Sort & Count */}
      {reviews.length > 0 && (
        <View style={styles.sortRow}>
          <Text style={styles.reviewCount}>
            {stats?.totalReviews || 0} Reviews
          </Text>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortPicker(!showSortPicker)}
            activeOpacity={0.7}
          >
            <Text style={styles.sortLabel}>
              {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={AppColors.text.secondary}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Sort Picker */}
      {showSortPicker && (
        <View style={styles.sortPicker}>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sortOption,
                sortBy === option.value && styles.sortOptionActive,
              ]}
              onPress={() => handleSortChange(option.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  sortBy === option.value && styles.sortOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
              {sortBy === option.value && (
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={AppColors.primary[600]}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )

  /**
   * Render review item
   */
  const renderItem = ({ item }: { item: Review }) => {
    // Skip user's own review in the list (shown separately)
    if (userReview && item.id === userReview.id) {
      return null
    }

    return <ReviewCard review={item} showActions={false} />
  }

  /**
   * Render empty
   */
  const renderEmpty = () => {
    if (isLoading) return null

    return (
      <EmptyState
        icon="chatbubble-outline"
        message="No Reviews Yet"
        subMessage="Be the first to review this product!"
      />
    )
  }

  /**
   * Render footer
   */
  const renderFooter = () => {
    if (!isLoadingMore) return null

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={AppColors.primary[500]} />
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary[500]} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* Write Review Modal */}
      <WriteReviewModal
        visible={showWriteReview}
        onClose={() => setShowWriteReview(false)}
        onSuccess={handleReviewSuccess}
        productId={productId}
        productName={productName}
        existingReview={userReview}
        orderId={reviewOrderId}
      />
    </View>
  )
}

export default ProductReviews

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  listContent: {
    flexGrow: 1,
  },
  // Header
  headerContainer: {
    padding: 16,
  },
  // Write Review Button
  writeReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: AppColors.primary[50],
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    borderWidth: 1,
    borderColor: AppColors.primary[200],
  },
  writeReviewText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.primary[600],
  },
  // User Review Section
  userReviewSection: {
    marginTop: 16,
  },
  userReviewTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.text.primary,
    marginBottom: 8,
  },
  // Sort Row
  sortRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
  reviewCount: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.text.primary,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sortLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.text.secondary,
  },
  // Sort Picker
  sortPicker: {
    backgroundColor: AppColors.background.primary,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    overflow: "hidden",
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  sortOptionActive: {
    backgroundColor: AppColors.primary[50],
  },
  sortOptionText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.primary,
  },
  sortOptionTextActive: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[600],
  },
  // Footer
  loadingFooter: {
    paddingVertical: 16,
    alignItems: "center",
  },
})
