import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import React, { memo, useCallback, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

import EmptyState from "@/src/components/common/EmptyState"
import Rating from "@/src/components/reviews/Rating"
import { ReviewCardSkeleton, SkeletonBase } from "@/src/components/skeletons"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import { useDeleteReview, useInfiniteUserReviews } from "@/src/hooks/queries/useReviews"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"
import { Review } from "@/src/types/review"
import { formatDate } from "@/src/utils/date"
import { Image } from "expo-image"

interface ReviewItemProps {
  item: Review
  index: number
  config: any
  isTablet: boolean
  useColumnsLayout: boolean
  numColumns: number
  itemWidth: number | undefined
  gap: number
  onProductPress: (review: Review) => void
  onDelete: (review: Review) => void
}

const ReviewItem = memo(
  ({
    item,
    index,
    config,
    isTablet,
    useColumnsLayout,
    numColumns,
    itemWidth,
    gap,
    onProductPress,
    onDelete,
  }: ReviewItemProps) => {
    const productImage =
      (item.product as any)?.images?.[0]?.formats?.thumbnail?.url ||
      (item.product as any)?.images?.[0]?.url ||
      null

    const productImageSize = isTablet ? 56 : 50
    const cardPadding = isTablet ? 18 : 16

    const handleProductPress = useCallback(
      () => onProductPress(item),
      [onProductPress, item]
    )
    const handleDelete = useCallback(() => onDelete(item), [onDelete, item])

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
        <DebouncedTouchable
          style={[styles.productInfo, { paddingBottom: isTablet ? 14 : 12 }]}
          onPress={handleProductPress}
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
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
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
            style={[styles.productDetails, { marginLeft: isTablet ? 14 : 12 }]}
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

        {item.title && (
          <Text
            style={[
              styles.reviewTitle,
              { fontSize: config.bodyFontSize, marginBottom: isTablet ? 6 : 4 },
            ]}
          >
            {item.title}
          </Text>
        )}

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
            onPress={handleProductPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name="pencil-outline"
              size={isTablet ? 18 : 16}
              color={AppColors.primary[600]}
            />
            <Text
              style={[styles.actionText, { fontSize: config.bodyFontSize - 1 }]}
            >
              Edit
            </Text>
          </DebouncedTouchable>

          <DebouncedTouchable
            style={[styles.actionButton, { gap: isTablet ? 6 : 4 }]}
            onPress={handleDelete}
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
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.rating === nextProps.item.rating &&
      prevProps.item.title === nextProps.item.title &&
      prevProps.item.message === nextProps.item.message &&
      prevProps.item.isVerifiedPurchase === nextProps.item.isVerifiedPurchase &&
      prevProps.index === nextProps.index &&
      prevProps.useColumnsLayout === nextProps.useColumnsLayout &&
      prevProps.numColumns === nextProps.numColumns &&
      prevProps.itemWidth === nextProps.itemWidth &&
      prevProps.gap === nextProps.gap
    )
  }
)
ReviewItem.displayName = "ReviewItem"

interface ListHeaderProps {
  reviewCount: number
  fontSize: number
  marginBottom: number
}

const ListHeader = memo(
  ({ reviewCount, fontSize, marginBottom }: ListHeaderProps) => {
    if (reviewCount === 0) return null

    return (
      <View style={[styles.listHeader, { marginBottom }]}>
        <Text style={[styles.listHeaderText, { fontSize }]}>
          {reviewCount} {reviewCount === 1 ? "Review" : "Reviews"}
        </Text>
      </View>
    )
  }
)
ListHeader.displayName = "ListHeader"

interface ListFooterProps {
  isLoadingMore: boolean
  fontSize: number
  bottomHeight: number
}

const ListFooter = memo(
  ({ isLoadingMore, fontSize, bottomHeight }: ListFooterProps) => {
    if (!isLoadingMore) return <View style={{ height: bottomHeight }} />

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={AppColors.primary[500]} />
        <Text style={[styles.loadingFooterText, { fontSize }]}>
          Loading more reviews...
        </Text>
      </View>
    )
  }
)
ListFooter.displayName = "ListFooter"

interface SkeletonStateProps {
  useColumnsLayout: boolean
  numColumns: number
  itemWidth: number | undefined
  gap: number
  horizontalPadding: number
  marginBottom: number
  fontSize: number
  contentMaxWidth: number | undefined
  skeletonCount: number
}

const SkeletonState = memo(
  ({
    useColumnsLayout,
    numColumns,
    itemWidth,
    gap,
    horizontalPadding,
    marginBottom,
    fontSize,
    contentMaxWidth,
    skeletonCount,
  }: SkeletonStateProps) => {
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
          style={[styles.skeletonContainer, { padding: horizontalPadding }]}
        >
          <View style={[styles.listHeader, { marginBottom }]}>
            <SkeletonBase width={100} height={fontSize + 2} />
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
            padding: horizontalPadding,
            maxWidth: contentMaxWidth,
            alignSelf: contentMaxWidth ? "center" : undefined,
            width: contentMaxWidth ? "100%" : undefined,
          },
        ]}
      >
        <View style={[styles.listHeader, { marginBottom }]}>
          <SkeletonBase width={100} height={fontSize + 2} />
        </View>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <ReviewCardSkeleton key={`skeleton-${index}`} />
        ))}
      </View>
    )
  }
)
SkeletonState.displayName = "SkeletonState"

export default function MyReviewsScreen() {
  const router = useRouter()
  const { config, isTablet, isLandscape, width } = useResponsive()
  const { token, user } = useAuthStore()
  const userId = user?.id ?? null

  const [isRefreshing, setIsRefreshing] = useState(false)

  const layoutConfig = useMemo(() => {
    const useColumnsLayout = isTablet && isLandscape
    const numColumns = useColumnsLayout ? 2 : 1
    const contentMaxWidth = isTablet && !isLandscape ? 600 : undefined
    const gap = config.gap
    const containerPadding = config.horizontalPadding
    const itemWidth = useColumnsLayout
      ? (width - containerPadding * 2 - gap) / 2
      : undefined

    return {
      useColumnsLayout,
      numColumns,
      contentMaxWidth,
      gap,
      containerPadding,
      itemWidth,
    }
  }, [isTablet, isLandscape, width, config.gap, config.horizontalPadding])

  const skeletonCount = useMemo(() => (isTablet ? 4 : 3), [isTablet])

  const flatListKey = useMemo(
    () => `reviews-${layoutConfig.numColumns}`,
    [layoutConfig.numColumns]
  )

  const {
    data: reviewsData,
    isLoading,
    isFetchingNextPage: isLoadingMore,
    hasNextPage: hasMore,
    fetchNextPage,
    refetch,
  } = useInfiniteUserReviews({ token, userId })

  const reviews = reviewsData?.pages.flatMap((p) => p.data) ?? []

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

  const handleProductPress = useCallback(
    (review: Review) => {
      if (review.product?.id) {
        router.push({
          pathname: "/product/[id]",
          params: { id: review.product.id.toString() },
        })
      }
    },
    [router]
  )

  const handleDeleteReview = useCallback(
    (review: Review) => {
      Alert.alert(
        "Delete Review",
        `Are you sure you want to delete your review for "${review.product?.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              if (!token) return
              deleteMutate(
                { reviewId: review.id, token },
                {
                  onSuccess: () => {
                    Toast.show({
                      type: "success",
                      text1: "Deleted",
                      text2: "Your review has been deleted",
                      visibilityTime: 2000,
                    })
                  },
                  onError: () => {
                    Toast.show({
                      type: "error",
                      text1: "Error",
                      text2: "Failed to delete review",
                      visibilityTime: 2000,
                    })
                  },
                }
              )
            },
          },
        ]
      )
    },
    [token, deleteMutate]
  )

  const renderItem = useCallback(
    ({ item, index }: { item: Review; index: number }) => (
      <ReviewItem
        item={item}
        index={index}
        config={config}
        isTablet={isTablet}
        useColumnsLayout={layoutConfig.useColumnsLayout}
        numColumns={layoutConfig.numColumns}
        itemWidth={layoutConfig.itemWidth}
        gap={layoutConfig.gap}
        onProductPress={handleProductPress}
        onDelete={handleDeleteReview}
      />
    ),
    [config, isTablet, layoutConfig, handleProductPress, handleDeleteReview]
  )

  const keyExtractor = useCallback((item: Review) => item.id.toString(), [])

  const ListHeaderComponent = useMemo(
    () => (
      <ListHeader
        reviewCount={reviews.length}
        fontSize={config.subtitleFontSize}
        marginBottom={isTablet ? 16 : 12}
      />
    ),
    [reviews.length, config.subtitleFontSize, isTablet]
  )

  const ListFooterComponent = useMemo(
    () => (
      <ListFooter
        isLoadingMore={isLoadingMore}
        fontSize={config.bodyFontSize}
        bottomHeight={isTablet ? 60 : 40}
      />
    ),
    [isLoadingMore, config.bodyFontSize, isTablet]
  )

  const ListEmptyComponent = useMemo(() => {
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
  }, [isLoading, router])

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <SkeletonState
          useColumnsLayout={layoutConfig.useColumnsLayout}
          numColumns={layoutConfig.numColumns}
          itemWidth={layoutConfig.itemWidth}
          gap={layoutConfig.gap}
          horizontalPadding={config.horizontalPadding}
          marginBottom={isTablet ? 16 : 12}
          fontSize={config.subtitleFontSize}
          contentMaxWidth={layoutConfig.contentMaxWidth}
          skeletonCount={skeletonCount}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <FlatList
        key={flatListKey}
        data={reviews}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={layoutConfig.numColumns}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        contentContainerStyle={[
          reviews.length === 0 ? styles.emptyContainer : styles.listContent,
          {
            padding: reviews.length > 0 ? config.horizontalPadding : 0,
            maxWidth: !layoutConfig.useColumnsLayout
              ? layoutConfig.contentMaxWidth
              : undefined,
            alignSelf:
              !layoutConfig.useColumnsLayout && layoutConfig.contentMaxWidth
                ? "center"
                : undefined,
            width:
              !layoutConfig.useColumnsLayout && layoutConfig.contentMaxWidth
                ? "100%"
                : undefined,
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
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        initialNumToRender={8}
        windowSize={5}
        updateCellsBatchingPeriod={50}
      />
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
