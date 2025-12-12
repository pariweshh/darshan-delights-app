import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import React, { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
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

import EmptyState from "@/src/components/common/EmptyState"
import Wrapper from "@/src/components/common/Wrapper"
import RatingSummary from "@/src/components/reviews/RatingSummary"
import ReviewCard from "@/src/components/reviews/ReviewCard"
import WriteReviewModal from "@/src/components/reviews/WriteReviewModal"

type SortOption = "newest" | "oldest" | "highest" | "lowest"

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
]

const PAGE_SIZE = 10

export default function ProductReviewsScreen() {
  const router = useRouter()
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>()
  const { token } = useAuthStore()

  // State
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [showSortPicker, setShowSortPicker] = useState(false)

  // User review state
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [canReview, setCanReview] = useState(false)
  const [reviewOrderId, setReviewOrderId] = useState<number | undefined>()
  const [showWriteReviewModal, setShowWriteReviewModal] = useState(false)

  // Fetch reviews
  const fetchReviews = useCallback(
    async (pageNum: number = 0, sort: SortOption = sortBy, refresh = false) => {
      if (!id) return

      try {
        if (refresh) {
          setIsRefreshing(true)
        } else if (pageNum === 1) {
          setIsLoading(true)
        } else {
          setIsLoadingMore(true)
        }

        const response = await getProductReviews(
          Number(id),
          pageNum,
          PAGE_SIZE,
          sort
        )

        if (pageNum === 1 || refresh) {
          setReviews(response.data)
          setReviewStats(response.stats)
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
        setIsRefreshing(false)
        setIsLoadingMore(false)
      }
    },
    [id, sortBy]
  )

  // Check user review status
  const checkUserReviewStatus = useCallback(async () => {
    if (!token || !id) return

    try {
      const existingReview = await getUserProductReview(Number(id), token)
      setUserReview(existingReview)

      if (!existingReview) {
        const result = await canUserReviewProduct(Number(id), token)
        setCanReview(result.canReview)
        setReviewOrderId(result.orderId)
      }
    } catch (err) {
      if ((err as any)?.response?.status !== 404) {
        console.error("Error checking review status:", err)
      }
    }
  }, [token, id])

  // Initial fetch
  useEffect(() => {
    fetchReviews(0)
    checkUserReviewStatus()
  }, [])

  // Handlers
  const handleRefresh = () => {
    fetchReviews(0, sortBy, true)
  }

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading) {
      fetchReviews(page + 1)
    }
  }

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort)
    setShowSortPicker(false)
    fetchReviews(0, sort)
  }

  const handleReviewSuccess = (review: Review) => {
    setUserReview(review)
    setCanReview(false)
    fetchReviews(0)
  }

  const handleEditReview = () => {
    setShowWriteReviewModal(true)
  }

  const handleDeleteReview = async () => {
    if (!userReview || !token) return

    try {
      await deleteReview(userReview.id, token)
      setUserReview(null)

      const result = await canUserReviewProduct(Number(id), token)
      setCanReview(result.canReview)
      setReviewOrderId(result.orderId)

      fetchReviews(0)

      Toast.show({
        type: "success",
        text1: "Deleted",
        text2: "Your review has been deleted",
        visibilityTime: 2000,
      })
    } catch (err) {
      console.error("Error deleting review:", err)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete review",
        visibilityTime: 2000,
      })
    }
  }

  // Render header
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Rating Summary */}
      {reviewStats && reviewStats.totalReviews > 0 && (
        <RatingSummary stats={reviewStats} />
      )}

      {/* Write Review Button */}
      {token && (canReview || userReview) && (
        <TouchableOpacity
          style={styles.writeReviewButton}
          onPress={() => setShowWriteReviewModal(true)}
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

      {/* Sort Row */}
      {reviews.length > 0 && (
        <View style={styles.sortRow}>
          <Text style={styles.reviewCountText}>
            {reviewStats?.totalReviews || 0} Reviews
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
              name={showSortPicker ? "chevron-up" : "chevron-down"}
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

  // Render review item
  const renderItem = ({ item }: { item: Review }) => {
    // Skip user's own review in the list
    if (userReview && item.id === userReview.id) {
      return null
    }

    return <ReviewCard review={item} showActions={false} />
  }

  // Render empty
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

  // Render footer
  const renderFooter = () => {
    if (!isLoadingMore) return null

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={AppColors.primary[500]} />
      </View>
    )
  }

  return (
    <Wrapper style={styles.container} edges={[]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary[500]} />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={
            reviews.length === 0 ? styles.emptyContainer : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[AppColors.primary[500]]}
              tintColor={AppColors.primary[500]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Write Review Modal */}
      <WriteReviewModal
        visible={showWriteReviewModal}
        onClose={() => setShowWriteReviewModal(false)}
        onSuccess={handleReviewSuccess}
        productId={Number(id)}
        productName={name || "Product"}
        existingReview={userReview}
        orderId={reviewOrderId}
      />
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.secondary,
    borderTopWidth: 0.5,
    borderTopColor: AppColors.gray[200],
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
    marginTop: 12,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  // Header
  headerContainer: {
    padding: 16,
    backgroundColor: AppColors.background.secondary,
  },
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
  reviewCountText: {
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
