import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"
import React, { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

import { cancelOrder, getUserOrders } from "@/src/api/orders"
import { getUserProductReview } from "@/src/api/reviews"
import EmptyState from "@/src/components/common/EmptyState"
import Wrapper from "@/src/components/common/Wrapper"
import OrderCard from "@/src/components/orders/OrderCard"
import OrderDetailsModal from "@/src/components/orders/OrderDetailsModal"
import WriteReviewModal from "@/src/components/reviews/WriteReviewModal"
import { OrderCardSkeleton } from "@/src/components/skeletons"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"
import { CartItem, Order } from "@/src/types"
import { Review } from "@/src/types/review"

const ORDERS_PER_PAGE = 10
const REVIEWABLE_STATUSES = ["delivered", "picked up"]

export default function OrdersScreen() {
  const router = useRouter()
  const { config, isTablet, isLandscape, width } = useResponsive()
  const { user, token } = useAuthStore()
  const { orderId: deepLinkOrderId } = useLocalSearchParams<{
    orderId?: string
  }>()

  // Orders state
  const [orders, setOrders] = useState<Order[]>([])
  const [totalOrders, setTotalOrders] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Order Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<number>>(
    new Set()
  )

  // Review Modal state
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewProduct, setReviewProduct] = useState<CartItem | null>(null)
  const [reviewOrderId, setReviewOrderId] = useState<number | null>(null)
  const [existingReview, setExistingReview] = useState<Review | null>(null)

  // Error state
  const [error, setError] = useState<string | null>(null)

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

  // Handle deep link to specific order
  useEffect(() => {
    if (deepLinkOrderId && orders.length > 0 && !isLoading) {
      const order = orders.find((o) => o.id.toString() === deepLinkOrderId)
      if (order) {
        setTimeout(() => {
          handleViewDetails(order)
        }, 300)
      }
    }
  }, [deepLinkOrderId, orders, isLoading])

  /**
   * Fetch orders from API
   */
  const fetchOrders = useCallback(
    async (reset: boolean = true) => {
      if (!token || !user) {
        setError("Please login to view your orders")
        setIsLoading(false)
        return
      }

      try {
        if (reset) {
          setIsLoading(true)
          setError(null)
        }

        const startIndex = reset ? 0 : currentPage * ORDERS_PER_PAGE
        const data = await getUserOrders(token, ORDERS_PER_PAGE, startIndex)

        if (data?.orders) {
          if (reset) {
            setOrders(data.orders)
            setCurrentPage(1)
          } else {
            setOrders((prev) => {
              const existingIds = new Set(prev.map((o) => o.id))
              const newOrders = data.orders.filter(
                (o: Order) => !existingIds.has(o.id)
              )
              return [...prev, ...newOrders]
            })
            setCurrentPage((prev) => prev + 1)
          }

          setTotalOrders(data.totalOrders)
          const currentCount = reset
            ? data.orders.length
            : orders.length + data.orders.length
          setHasMore(
            data.orders.length === ORDERS_PER_PAGE &&
              currentCount < data.totalOrders
          )
        } else {
          if (reset) {
            setOrders([])
            setTotalOrders(0)
          }
          setHasMore(false)
        }
      } catch (err: any) {
        console.error("Error fetching orders:", err)
        setError(err.message || "Failed to load orders")
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
        setIsLoadingMore(false)
      }
    },
    [token, user, currentPage, orders.length]
  )

  /**
   * Fetch reviewed products for an order
   */
  const fetchReviewedProducts = useCallback(
    async (order: Order) => {
      if (!token) return

      const isReviewable =
        order?.delivery_status &&
        REVIEWABLE_STATUSES.includes(order.delivery_status.toLowerCase())
      if (!isReviewable) {
        setReviewedProductIds(new Set())
        return
      }

      const reviewedIds = new Set<number>()

      let products: CartItem[] = []
      try {
        if (typeof order.orders === "string") {
          const parsed = JSON.parse(order.orders)
          products = parsed?.products || parsed || []
        } else if (order.orders?.products) {
          products = order.orders.products
        }
      } catch (error) {
        console.error("Error parsing order products:", error)
      }

      try {
        await Promise.all(
          products.map(async (product) => {
            try {
              const review = await getUserProductReview(
                Number(product.product_id),
                token
              )
              if (review) {
                reviewedIds.add(Number(product.product_id))
              }
            } catch (error) {
              // No review exists
            }
          })
        )
      } catch (error) {
        console.error("Error fetching review status:", error)
      }
      setReviewedProductIds(reviewedIds)
    },
    [token]
  )

  /**
   * Handle pull to refresh
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchOrders(true)
  }, [fetchOrders])

  /**
   * Handle load more (infinite scroll)
   */
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading) {
      setIsLoadingMore(true)
      fetchOrders(false)
    }
  }, [isLoadingMore, hasMore, isLoading, fetchOrders])

  /**
   * Handle cancel order
   */
  const handleCancelOrder = useCallback(
    async (orderId: number) => {
      if (!token) return

      try {
        const result = await cancelOrder(orderId, token)

        if (result?.order_status === "canceled") {
          setOrders((prev) =>
            prev.map((order) =>
              order.id === orderId
                ? {
                    ...order,
                    order_status: "canceled",
                    delivery_status: "canceled",
                  }
                : order
            )
          )

          Toast.show({
            type: "success",
            text1: "Order Canceled",
            text2: `Order #${orderId} has been canceled`,
            visibilityTime: 2500,
          })
        }
      } catch (err: any) {
        console.error("Error canceling order:", err)
        Toast.show({
          type: "error",
          text1: "Cancel Failed",
          text2: err.message || "Failed to cancel order",
          visibilityTime: 2500,
        })
      }
    },
    [token]
  )

  /**
   * Handle view order details
   */
  const handleViewDetails = useCallback(
    async (order: Order) => {
      setSelectedOrder(order)
      await fetchReviewedProducts(order)
      setShowOrderModal(true)
    },
    [fetchReviewedProducts]
  )

  /**
   * Handle close modal
   */
  const handleCloseOrderModal = useCallback(() => {
    setShowOrderModal(false)
    setSelectedOrder(null)
    setReviewedProductIds(new Set())
  }, [])

  /**
   * Handle write review
   */
  const handleWriteReview = useCallback(
    (product: CartItem, orderId: number, existingReview: Review | null) => {
      setReviewProduct(product)
      setReviewOrderId(orderId)
      setExistingReview(existingReview)
      setShowReviewModal(true)
    },
    []
  )

  /**
   * Handle close review modal
   */
  const handleCloseReviewModal = useCallback(() => {
    setShowReviewModal(false)
    setReviewProduct(null)
    setReviewOrderId(null)
    setExistingReview(null)
  }, [])

  /**
   * Handle review success
   */
  const handleReviewSuccess = useCallback(
    (review: Review) => {
      if (reviewProduct) {
        setReviewedProductIds((prev) => {
          const newSet = new Set(prev)
          newSet.add(Number(reviewProduct.product_id))
          return newSet
        })
      }

      handleCloseReviewModal()

      Toast.show({
        type: "success",
        text1: "Review Submitted",
        text2: "Thank you for your feedback!",
        visibilityTime: 2000,
      })

      if (selectedOrder) {
        setTimeout(() => {
          setShowOrderModal(true)
        }, 300)
      }
    },
    [reviewProduct, handleCloseReviewModal, selectedOrder]
  )

  /**
   * Navigate to shop
   */
  const handleStartShopping = useCallback(() => {
    router.push("/shop")
  }, [router])

  /**
   * Render order item
   */
  const renderOrderItem = useCallback(
    ({ item, index }: { item: Order; index: number }) => {
      if (useColumnsLayout) {
        const isLastInRow = (index + 1) % numColumns === 0
        const marginRight = isLastInRow ? 0 : gap

        return (
          <View style={{ width: itemWidth, marginRight, marginBottom: gap }}>
            <OrderCard
              order={item}
              onCancel={handleCancelOrder}
              onViewDetails={handleViewDetails}
            />
          </View>
        )
      }

      return (
        <OrderCard
          order={item}
          onCancel={handleCancelOrder}
          onViewDetails={handleViewDetails}
        />
      )
    },
    [
      handleCancelOrder,
      handleViewDetails,
      useColumnsLayout,
      numColumns,
      itemWidth,
      gap,
    ]
  )

  /**
   * Render list footer
   */
  const renderFooter = () => {
    if (!isLoadingMore) return <View style={{ height: isTablet ? 60 : 40 }} />

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={AppColors.primary[500]} />
        <Text
          style={[styles.loadingFooterText, { fontSize: config.bodyFontSize }]}
        >
          Loading more orders...
        </Text>
      </View>
    )
  }

  /**
   * Render list header
   */
  const renderHeader = () => {
    if (orders.length === 0) return null

    return (
      <View style={[styles.listHeader, { marginBottom: isTablet ? 16 : 12 }]}>
        <Text style={[styles.orderCount, { fontSize: config.bodyFontSize }]}>
          {totalOrders} {totalOrders === 1 ? "order" : "orders"}
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
            <SkeletonBase width={80} height={config.bodyFontSize + 2} />
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
                    <OrderCardSkeleton />
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
          <SkeletonBase width={80} height={config.bodyFontSize + 2} />
        </View>

        {Array.from({ length: skeletonCount }).map((_, index) => (
          <OrderCardSkeleton key={`skeleton-${index}`} />
        ))}
      </View>
    )
  }

  // Fetch orders on focus
  useFocusEffect(
    useCallback(() => {
      fetchOrders(true)
    }, [])
  )

  // Loading state with skeleton
  if (isLoading) {
    return (
      <Wrapper style={styles.container} edges={[]}>
        {renderSkeleton()}
      </Wrapper>
    )
  }

  // Error state
  if (error && orders.length === 0) {
    return (
      <Wrapper style={styles.container} edges={[]}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={isTablet ? 80 : 64}
            color={AppColors.error}
          />
          <Text style={[styles.errorTitle, { fontSize: config.titleFontSize }]}>
            Oops!
          </Text>
          <Text style={[styles.errorText, { fontSize: config.bodyFontSize }]}>
            {error}
          </Text>
        </View>
      </Wrapper>
    )
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <EmptyState
          icon="receipt-outline"
          message="No orders yet"
          subMessage="When you place orders, they will appear here"
          actionLabel="Start Shopping"
          onAction={handleStartShopping}
        />
      </SafeAreaView>
    )
  }

  // Create a key for FlatList to force re-render when columns change
  const flatListKey = `orders-${numColumns}`

  return (
    <Wrapper style={styles.container} edges={[]}>
      <FlatList
        key={flatListKey}
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrderItem}
        numColumns={numColumns}
        contentContainerStyle={[
          styles.listContent,
          {
            padding: config.horizontalPadding,
            paddingBottom: isTablet ? 60 : 40,
            maxWidth: !useColumnsLayout ? contentMaxWidth : undefined,
            alignSelf:
              !useColumnsLayout && contentMaxWidth ? "center" : undefined,
            width: !useColumnsLayout && contentMaxWidth ? "100%" : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={AppColors.primary[500]}
            colors={[AppColors.primary[500]]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        removeClippedSubviews
        initialNumToRender={ORDERS_PER_PAGE}
        maxToRenderPerBatch={ORDERS_PER_PAGE}
        windowSize={5}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        visible={showOrderModal}
        order={selectedOrder}
        onClose={handleCloseOrderModal}
        onWriteReview={handleWriteReview}
        reviewedProductIds={reviewedProductIds}
      />

      <WriteReviewModal
        visible={showReviewModal}
        onClose={handleCloseReviewModal}
        onSuccess={handleReviewSuccess}
        productId={reviewProduct ? Number(reviewProduct.product_id) : 0}
        productName={reviewProduct?.name ?? ""}
        existingReview={existingReview}
        orderId={reviewOrderId || undefined}
      />
    </Wrapper>
  )
}

// Need to import SkeletonBase for the header skeleton
import { SkeletonBase } from "@/src/components/skeletons"

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.secondary,
    borderTopWidth: 0.5,
    borderTopColor: AppColors.gray[200],
  },
  listContent: {},
  listHeader: {},
  orderCount: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.secondary,
  },
  loadingFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 8,
  },
  loadingFooterText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.primary[500],
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorTitle: {
    fontFamily: "Poppins_700Bold",
    color: AppColors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  skeletonContainer: {
    flex: 1,
  },
  skeletonRow: {
    flexDirection: "row",
  },
})
