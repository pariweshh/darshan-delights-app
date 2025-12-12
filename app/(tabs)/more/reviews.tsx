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
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

import { deleteReview, getUserReviews } from "@/src/api/reviews"
import EmptyState from "@/src/components/common/EmptyState"
import Rating from "@/src/components/reviews/Rating"
import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"
import { Review } from "@/src/types/review"

const PAGE_SIZE = 10

export default function MyReviewsScreen() {
  const router = useRouter()
  const { token } = useAuthStore()

  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

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
  const renderItem = ({ item }: { item: Review }) => {
    const productImage =
      (item.product as any)?.images?.[0]?.formats?.thumbnail?.url ||
      (item.product as any)?.images?.[0]?.url ||
      null

    return (
      <View style={styles.reviewCard}>
        {/* Product Info */}
        <TouchableOpacity
          style={styles.productInfo}
          onPress={() => handleProductPress(item)}
          activeOpacity={0.7}
        >
          {productImage ? (
            <Image source={{ uri: productImage }} style={styles.productImage} />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons
                name="cube-outline"
                size={24}
                color={AppColors.gray[400]}
              />
            </View>
          )}
          <View style={styles.productDetails}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.product?.name || "Product"}
            </Text>
            <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={AppColors.gray[400]}
          />
        </TouchableOpacity>

        {/* Rating */}
        <View style={styles.ratingRow}>
          <Rating rating={item.rating} size="small" />
          {item.isVerifiedPurchase && (
            <View style={styles.verifiedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={12}
                color={AppColors.success}
              />
              <Text style={styles.verifiedText}>Verified Purchase</Text>
            </View>
          )}
        </View>

        {/* Title */}
        {item.title && <Text style={styles.reviewTitle}>{item.title}</Text>}

        {/* Message */}
        <Text style={styles.reviewMessage} numberOfLines={3}>
          {item.message}
        </Text>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleProductPress(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="pencil-outline"
              size={16}
              color={AppColors.primary[600]}
            />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteReview(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color={AppColors.error} />
            <Text style={[styles.actionText, { color: AppColors.error }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

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
    if (!isLoadingMore) return null

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={AppColors.primary[500]} />
      </View>
    )
  }

  /**
   * Render header
   */
  const renderHeader = () => {
    if (reviews.length === 0) return null

    return (
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>
          {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary[500]} />
          <Text style={styles.loadingText}>Loading your reviews...</Text>
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.secondary,
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
    padding: 16,
  },
  // Header
  listHeader: {
    marginBottom: 12,
  },
  listHeaderText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.text.primary,
  },
  // Review Card
  reviewCard: {
    backgroundColor: AppColors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: AppColors.gray[100],
  },
  productImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: AppColors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.text.primary,
    textTransform: "capitalize",
  },
  reviewDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.tertiary,
    marginTop: 2,
  },
  // Rating Row
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verifiedText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: AppColors.success,
  },
  // Review Content
  reviewTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.text.primary,
    marginBottom: 4,
  },
  reviewMessage: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    lineHeight: 20,
  },
  // Actions
  actionsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.primary[600],
  },
  // Footer
  loadingFooter: {
    paddingVertical: 16,
    alignItems: "center",
  },
})
