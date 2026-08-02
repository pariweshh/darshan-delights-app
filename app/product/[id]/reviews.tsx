import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import React, { useCallback, useMemo, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import Toast from "react-native-toast-message"

import AppColors from "@/src/constants/Colors"
import {
  REVIEW_SORT_OPTIONS,
  REVIEWS_KEYS,
  ReviewSortOption,
  useDeleteReview,
  useInfiniteProductReviews,
  useUserReviewStatus,
} from "@/src/hooks/queries/useReviews"
import { useAuthStore } from "@/src/store/authStore"
import { useQueryClient } from "@tanstack/react-query"

import EmptyState from "@/src/components/common/EmptyState"
import Wrapper from "@/src/components/common/Wrapper"
import { Review } from "@/src/types/review"
import RatingSummary from "@/src/components/reviews/RatingSummary"
import ReviewCard from "@/src/components/reviews/ReviewCard"
import WriteReviewModal from "@/src/components/reviews/WriteReviewModal"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"

export default function ProductReviewsScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>()
  const { token, user } = useAuthStore()
  const userId = user?.id ?? null
  const queryClient = useQueryClient()

  const productId = Number(id)

  const [sortBy, setSortBy] = useState<ReviewSortOption>("newest")
  const [showSortPicker, setShowSortPicker] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showWriteReviewModal, setShowWriteReviewModal] = useState(false)

  const {
    data: reviewsData,
    isLoading,
    isFetchingNextPage: isLoadingMore,
    hasNextPage: hasMore,
    fetchNextPage,
    refetch,
  } = useInfiniteProductReviews({ productId, sortBy })

  const { userReview, canReview, reviewOrderId } = useUserReviewStatus(productId, token, userId)

  const { reviews, reviewStats } = useMemo(() => {
    const all = reviewsData?.pages.flatMap((p) => p.data) ?? []
    return {
      reviews: userReview ? all.filter((r) => r.id !== userReview.id) : all,
      reviewStats: reviewsData?.pages[0]?.stats ?? null,
    }
  }, [reviewsData, userReview])

  const { mutate: deleteMutate } = useDeleteReview()

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }, [refetch])

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      fetchNextPage()
    }
  }, [hasMore, isLoadingMore, fetchNextPage])

  const handleSortChange = useCallback((sort: ReviewSortOption) => {
    setSortBy(sort)
    setShowSortPicker(false)
  }, [])

  const handleReviewSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: REVIEWS_KEYS.productInfinite(productId, sortBy) })
    queryClient.invalidateQueries({ queryKey: REVIEWS_KEYS.userProductReview(productId, userId) })
    queryClient.invalidateQueries({ queryKey: REVIEWS_KEYS.canReview(productId, userId) })
  }, [queryClient, productId, sortBy, userId])

  const handleDeleteReview = useCallback(() => {
    if (!userReview || !token) return

    deleteMutate(
      { reviewId: userReview.id, token },
      {
        onSuccess: () => {
          Toast.show({ type: "success", text1: "Deleted", text2: "Your review has been deleted", visibilityTime: 2000 })
        },
        onError: () => {
          Toast.show({ type: "error", text1: "Error", text2: "Failed to delete review", visibilityTime: 2000 })
        },
      }
    )
  }, [userReview, token, deleteMutate])

  const header = useMemo(() => (
    <View style={styles.headerContainer}>
      {reviewStats && reviewStats.totalReviews > 0 && (
        <RatingSummary stats={reviewStats} />
      )}

      {token && (canReview || userReview) && (
        <DebouncedTouchable
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
        </DebouncedTouchable>
      )}

      {userReview && (
        <View style={styles.userReviewSection}>
          <Text style={styles.userReviewTitle}>Your Review</Text>
          <ReviewCard
            review={userReview}
            onEdit={() => setShowWriteReviewModal(true)}
            onDelete={handleDeleteReview}
          />
        </View>
      )}

      {reviews.length > 0 && (
        <View style={styles.sortRow}>
          <Text style={styles.reviewCountText}>
            {reviewStats?.totalReviews || 0} Reviews
          </Text>
          <DebouncedTouchable
            style={styles.sortButton}
            onPress={() => setShowSortPicker((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Text style={styles.sortLabel}>
              {REVIEW_SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
            </Text>
            <Ionicons
              name={showSortPicker ? "chevron-up" : "chevron-down"}
              size={16}
              color={AppColors.text.secondary}
            />
          </DebouncedTouchable>
        </View>
      )}

      {showSortPicker && (
        <View style={styles.sortPicker}>
          {REVIEW_SORT_OPTIONS.map((option) => (
            <DebouncedTouchable
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
                <Ionicons name="checkmark" size={16} color={AppColors.primary[600]} />
              )}
            </DebouncedTouchable>
          ))}
        </View>
      )}
    </View>
  ), [reviewStats, token, canReview, userReview, reviews.length, sortBy, handleSortChange, handleDeleteReview])

  const renderItem = useCallback(
    ({ item }: { item: Review }) => <ReviewCard review={item} showActions={false} />,
    []
  )

  const renderEmpty = useCallback(() => {
    if (isLoading) return null
    return (
      <EmptyState
        icon="chatbubble-outline"
        message="No Reviews Yet"
        subMessage="Be the first to review this product!"
      />
    )
  }, [isLoading])

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={AppColors.primary[500]} />
      </View>
    )
  }, [isLoadingMore])

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
          ListHeaderComponent={header}
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

      <WriteReviewModal
        visible={showWriteReviewModal}
        onClose={() => setShowWriteReviewModal(false)}
        onSuccess={handleReviewSuccess}
        productId={productId}
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
  loadingFooter: {
    paddingVertical: 16,
    alignItems: "center",
  },
})
