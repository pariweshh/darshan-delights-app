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
import Loader from "@/src/components/common/Loader"
import Wrapper from "@/src/components/common/Wrapper"
import OrderCard from "@/src/components/orders/OrderCard"
import OrderDetailsModal from "@/src/components/orders/OrderDetailsModal"
import WriteReviewModal from "@/src/components/reviews/WriteReviewModal"
import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"
import { CartItem, Order } from "@/src/types"
import { Review } from "@/src/types/review"

const ORDERS_PER_PAGE = 10
const REVIEWABLE_STATUSES = ["delivered", "picked up"]

export default function OrdersScreen() {
  const router = useRouter()
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

  // Handle deep link to specific order
  useEffect(() => {
    if (deepLinkOrderId && orders.length > 0 && !isLoading) {
      const order = orders.find((o) => o.id.toString() === deepLinkOrderId)
      if (order) {
        // Small delay to ensure UI is ready
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
            // Filter duplicates when loading more
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
              console.error("No review exists", error)
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
          // Update order in list
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
   * Handle write review (called from OrderDetailsModal)
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

      // Optionally re-open the order modal
      if (selectedOrder) {
        setTimeout(() => {
          setShowOrderModal(true)
        }, 300)
      }
    },
    [reviewProduct, handleCloseReviewModal]
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
    ({ item }: { item: Order }) => (
      <OrderCard
        order={item}
        onCancel={handleCancelOrder}
        onViewDetails={handleViewDetails}
      />
    ),
    [handleCancelOrder, handleViewDetails]
  )

  /**
   * Render list footer
   */
  const renderFooter = () => {
    if (!isLoadingMore) return null

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={AppColors.primary[500]} />
        <Text style={styles.loadingFooterText}>Loading more orders...</Text>
      </View>
    )
  }

  /**
   * Render list header
   */
  const renderHeader = () => {
    if (orders.length === 0) return null

    return (
      <View style={styles.listHeader}>
        <Text style={styles.orderCount}>
          {totalOrders} {totalOrders === 1 ? "order" : "orders"}
        </Text>
      </View>
    )
  }

  // Fetch orders on focus
  useFocusEffect(
    useCallback(() => {
      fetchOrders(true)
    }, [])
  )

  // Loading state
  if (isLoading) {
    return (
      <Wrapper style={styles.container} edges={[]}>
        <Loader fullScreen text="Loading orders..." />
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
            size={64}
            color={AppColors.error}
          />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error}</Text>
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

  return (
    <Wrapper style={styles.container} edges={[]}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContent}
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
        // Performance optimizations
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.secondary,
    borderTopWidth: 0.5,
    borderTopColor: AppColors.gray[200],
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  listHeader: {
    marginBottom: 12,
  },
  orderCount: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
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
    fontSize: 13,
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
    fontSize: 24,
    color: AppColors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
})
