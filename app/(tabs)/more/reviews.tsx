import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import React, { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

import { deleteReview, getUserReviews } from "@/src/api/reviews"
import EmptyState from "@/src/components/common/EmptyState"
import Rating from "@/src/components/reviews/Rating"
import { ReviewCardSkeleton, SkeletonBase } from "@/src/components/skeletons"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"
import { Review } from "@/src/types/review"

const PAGE_SIZE = 10

export default function MyReviewsScreen() {
  const router = useRouter()
  const { config, isTablet, isLandscape, width } = useResponsive()
  const { token } = useAuthStore()

  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // Layout configuration
  const useColumnsLayout = isTablet && isLandscape
  const numColumns = useColumnsLayout ? 2 : 1
  const contentMaxWidth = isTablet && !isLandscape ? 600 : undefined

  // Calculate item width for grid
  const gap = config.gap
  const containerPadding = config.horizontalPadding
  const itemWidth = useColumnsLayout
    ? (width - containerPadding * 2 - gap) / 2
    : undefined

  /**
   * Fetch user reviews
   */
  const fetchReviews = useCallback(
    async (pageNum: number = 0, refresh: boolean = false) => {
      if (!token) return

      try {
        if (refresh) {
          setIsRefreshing(true)
        } else if (pageNum === 0) {
          setIsLoading(true)
        } else {
          setIsLoadingMore(true)
        }

        const response = await getUserReviews(token, pageNum, PAGE_SIZE)

        if (refresh || pageNum === 0) {
          setReviews(response.data)
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
          text2: "Failed to load your reviews",
          visibilityTime: 2000,
        })
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
        setIsLoadingMore(false)
      }
    },
    [token]
  )

  /**
   * Initial fetch
   */
  useEffect(() => {
    fetchReviews(0)
  }, [])

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    fetchReviews(0, true)
  }

  /**
   * Handle load more
   */
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading) {
      fetchReviews(page + 1)
    }
  }

  /**
   * Navigate to product
   */
  const handleProductPress = (review: Review) => {
    if (review.product?.id) {
      router.push({
        pathname: "/product/[id]",
        params: { id: review.product.id.toString() },
      })
    }
  }

  /**
   * Handle delete review
   */
  const handleDeleteReview = (review: Review) => {
    Alert.alert(
      "Delete Review",
      `Are you sure you want to delete your review for "${review.product?.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!token) return

            try {
              await deleteReview(review.id, token)
              setReviews((prev) => prev.filter((r) => r.id !== review.id))

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
          },
        },
      ]
    )
  }

  /**
   * Format date
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  /**
   * Render review item
   */
  const renderItem = useCallback(
    ({ item, index }: { item: Review; index: number }) => {
      const productImage =
        (item.product as any)?.images?.[0]?.formats?.thumbnail?.url ||
        (item.product as any)?.images?.[0]?.url ||
        null

      const productImageSize = isTablet ? 56 : 50
      const cardPadding = isTablet ? 18 : 16

      const reviewCard = (
        <View
          style={[
            styles.reviewCard,
            {
              padding: cardPadding,
              borderRadius: config.cardBorderRadius,
              marginBottom: useColumnsLayout ? 0 : isTablet ? 14 : 12,
            },
          ]}
        >
          {/* Product Info */}
          <DebouncedTouchable
            style={[styles.productInfo, { paddingBottom: isTablet ? 14 : 12 }]}
            onPress={() => handleProductPress(item)}
            activeOpacity={0.7}
          >
            {productImage ? (
              <Image
                source={{ uri: productImage }}
                style={[
                  styles.productImage,
                  {
                    width: productImageSize,
                    height: productImageSize,
                    borderRadius: isTablet ? 10 : 8,
                  },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.productImagePlaceholder,
                  {
                    width: productImageSize,
                    height: productImageSize,
                    borderRadius: isTablet ? 10 : 8,
                  },
                ]}
              >
                <Ionicons
                  name="cube-outline"
                  size={isTablet ? 28 : 24}
                  color={AppColors.gray[400]}
                />
              </View>
            )}
            <View
              style={[
                styles.productDetails,
                { marginLeft: isTablet ? 14 : 12 },
              ]}
            >
              <Text
                style={[styles.productName, { fontSize: config.bodyFontSize }]}
                numberOfLines={2}
              >
                {item.product?.name || "Product"}
              </Text>
              <Text
                style={[styles.reviewDate, { fontSize: config.smallFontSize }]}
              >
                {formatDate(item.createdAt)}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={isTablet ? 22 : 20}
              color={AppColors.gray[400]}
            />
          </DebouncedTouchable>

          {/* Rating */}
          <View style={[styles.ratingRow, { marginBottom: isTablet ? 10 : 8 }]}>
            <Rating rating={item.rating} size="small" />
            {item.isVerifiedPurchase && (
              <View style={[styles.verifiedBadge, { gap: isTablet ? 5 : 4 }]}>
                <Ionicons
                  name="checkmark-circle"
                  size={isTablet ? 14 : 12}
                  color={AppColors.success}
                />
                <Text
                  style={[
                    styles.verifiedText,
                    { fontSize: config.smallFontSize - 1 },
                  ]}
                >
                  Verified Purchase
                </Text>
              </View>
            )}
          </View>

          {/* Title */}
          {item.title && (
            <Text
              style={[
                styles.reviewTitle,
                {
                  fontSize: config.bodyFontSize,
                  marginBottom: isTablet ? 6 : 4,
                },
              ]}
            >
              {item.title}
            </Text>
          )}

          {/* Message */}
          <Text
            style={[
              styles.reviewMessage,
              {
                fontSize: config.bodyFontSize - 1,
                lineHeight: (config.bodyFontSize - 1) * 1.5,
              },
            ]}
            numberOfLines={3}
          >
            {item.message}
          </Text>

          {/* Actions */}
          <View
            style={[
              styles.actionsRow,
              {
                gap: isTablet ? 20 : 16,
                marginTop: isTablet ? 14 : 12,
                paddingTop: isTablet ? 14 : 12,
              },
            ]}
          >
            <DebouncedTouchable
              style={[styles.actionButton, { gap: isTablet ? 6 : 4 }]}
              onPress={() => handleProductPress(item)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="pencil-outline"
                size={isTablet ? 18 : 16}
                color={AppColors.primary[600]}
              />
              <Text
                style={[
                  styles.actionText,
                  { fontSize: config.bodyFontSize - 1 },
                ]}
              >
                Edit
              </Text>
            </DebouncedTouchable>

            <DebouncedTouchable
              style={[styles.actionButton, { gap: isTablet ? 6 : 4 }]}
              onPress={() => handleDeleteReview(item)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="trash-outline"
                size={isTablet ? 18 : 16}
                color={AppColors.error}
              />
              <Text
                style={[
                  styles.actionText,
                  { color: AppColors.error, fontSize: config.bodyFontSize - 1 },
                ]}
              >
                Delete
              </Text>
            </DebouncedTouchable>
          </View>
        </View>
      )

      if (useColumnsLayout) {
        const isLastInRow = (index + 1) % numColumns === 0
        const marginRight = isLastInRow ? 0 : gap

        return (
          <View style={{ width: itemWidth, marginRight, marginBottom: gap }}>
            {reviewCard}
          </View>
        )
      }

      return reviewCard
    },
    [
      config,
      isTablet,
      useColumnsLayout,
      numColumns,
      itemWidth,
      gap,
      handleProductPress,
      handleDeleteReview,
      formatDate,
    ]
  )

  /**
   * Render empty state
   */
  const renderEmpty = () => {
    if (isLoading) return null

    return (
      <EmptyState
        icon="chatbubble-outline"
        message="No Reviews Yet"
        subMessage="You haven't written any reviews yet. Purchase a product and share your experience!"
        actionLabel="Browse Products"
        onAction={() => router.push("/(tabs)/products")}
      />
    )
  }

  /**
   * Render footer
   */
  const renderFooter = () => {
    if (!isLoadingMore) return <View style={{ height: isTablet ? 60 : 40 }} />

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={AppColors.primary[500]} />
        <Text
          style={[styles.loadingFooterText, { fontSize: config.bodyFontSize }]}
        >
          Loading more reviews...
        </Text>
      </View>
    )
  }

  /**
   * Render header
   */
  const renderHeader = () => {
    if (reviews.length === 0) return null

    return (
      <View style={[styles.listHeader, { marginBottom: isTablet ? 16 : 12 }]}>
        <Text
          style={[styles.listHeaderText, { fontSize: config.subtitleFontSize }]}
        >
          {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
        </Text>
      </View>
    )
  }

  /**
   * Render skeleton loading
   */
  const renderSkeleton = () => {
    const skeletonCount = isTablet ? 4 : 3

    if (useColumnsLayout) {
      const rows: number[][] = []
      for (let i = 0; i < skeletonCount; i += numColumns) {
        const row: number[] = []
        for (let j = 0; j < numColumns && i + j < skeletonCount; j++) {
          row.push(i + j)
        }
        rows.push(row)
      }

      return (
        <View
          style={[
            styles.skeletonContainer,
            { padding: config.horizontalPadding },
          ]}
        >
          {/* Header skeleton */}
          <View
            style={[styles.listHeader, { marginBottom: isTablet ? 16 : 12 }]}
          >
            <SkeletonBase width={100} height={config.subtitleFontSize + 2} />
          </View>

          {rows.map((row, rowIndex) => (
            <View key={`skeleton-row-${rowIndex}`} style={styles.skeletonRow}>
              {row.map((_, colIndex) => {
                const isLastInRow = colIndex === numColumns - 1
                return (
                  <View
                    key={`skeleton-${rowIndex}-${colIndex}`}
                    style={{
                      width: itemWidth,
                      marginRight: isLastInRow ? 0 : gap,
                    }}
                  >
                    <ReviewCardSkeleton />
                  </View>
                )
              })}
            </View>
          ))}
        </View>
      )
    }

    return (
      <View
        style={[
          styles.skeletonContainer,
          {
            padding: config.horizontalPadding,
            maxWidth: contentMaxWidth,
            alignSelf: contentMaxWidth ? "center" : undefined,
            width: contentMaxWidth ? "100%" : undefined,
          },
        ]}
      >
        {/* Header skeleton */}
        <View style={[styles.listHeader, { marginBottom: isTablet ? 16 : 12 }]}>
          <SkeletonBase width={100} height={config.subtitleFontSize + 2} />
        </View>

        {Array.from({ length: skeletonCount }).map((_, index) => (
          <ReviewCardSkeleton key={`skeleton-${index}`} />
        ))}
      </View>
    )
  }

  // Create a key for FlatList to force re-render when columns change
  const flatListKey = `reviews-${numColumns}`

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {isLoading ? (
        renderSkeleton()
      ) : (
        <FlatList
          key={flatListKey}
          data={reviews}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={numColumns}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={[
            reviews.length === 0 ? styles.emptyContainer : styles.listContent,
            {
              padding: reviews.length > 0 ? config.horizontalPadding : 0,
              maxWidth: !useColumnsLayout ? contentMaxWidth : undefined,
              alignSelf:
                !useColumnsLayout && contentMaxWidth ? "center" : undefined,
              width: !useColumnsLayout && contentMaxWidth ? "100%" : undefined,
            },
          ]}
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.secondary,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  listContent: {},
  skeletonContainer: {
    flex: 1,
  },
  skeletonRow: {
    flexDirection: "row",
  },
  // Header
  listHeader: {},
  listHeaderText: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  // Review Card
  reviewCard: {
    backgroundColor: AppColors.background.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productInfo: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  productImage: {
    backgroundColor: AppColors.gray[100],
  },
  productImagePlaceholder: {
    backgroundColor: AppColors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
    textTransform: "capitalize",
  },
  reviewDate: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
    marginTop: 2,
  },
  // Rating Row
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifiedText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.success,
  },
  // Review Content
  reviewTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  reviewMessage: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  // Actions
  actionsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[600],
  },
  // Footer
  loadingFooter: {
    flexDirection: "row",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingFooterText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.primary[500],
  },
})
