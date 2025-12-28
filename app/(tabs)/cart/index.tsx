import { AntDesign, Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import { memo, useCallback, useMemo, useRef, useState } from "react"
import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import Toast from "react-native-toast-message"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"
import { useCartStore } from "@/src/store/cartStore"
import { CartItem } from "@/src/types"

import { ValidatedCoupon } from "@/src/api/coupon"
import CartItemCard from "@/src/components/cart/CartItemCard"
import CartSummary from "@/src/components/cart/CartSummary"
import CouponInput from "@/src/components/cart/CouponInput"
import EmptyState from "@/src/components/common/EmptyState"
import Wrapper from "@/src/components/common/Wrapper"
import {
  CartItemSkeleton,
  CartSummarySkeleton,
  SkeletonBase,
} from "@/src/components/skeletons"
import Button from "@/src/components/ui/Button"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"

interface CartItemWrapperProps {
  item: CartItem
  token: string
  userId: string | number
  itemWidth: number | undefined
  marginRight: number
}

const CartItemWrapper = memo(
  ({ item, token, userId, itemWidth, marginRight }: CartItemWrapperProps) => (
    <View style={{ width: itemWidth, marginRight }}>
      <CartItemCard item={item} token={token} userId={userId} />
    </View>
  ),
  (prevProps, nextProps) => {
    return (
      prevProps.item.basket_item_id === nextProps.item.basket_item_id &&
      prevProps.item.quantity === nextProps.item.quantity &&
      prevProps.item.amount === nextProps.item.amount &&
      prevProps.itemWidth === nextProps.itemWidth &&
      prevProps.marginRight === nextProps.marginRight
    )
  }
)

// ==========================================
// Memoized Header Component
// ==========================================

interface ListHeaderProps {
  itemCount: number
  fontSize: number
  paddingVertical: number
  onClearCart: () => void
}

const ListHeader = memo(
  ({ itemCount, fontSize, paddingVertical, onClearCart }: ListHeaderProps) => (
    <View style={[styles.listHeader, { paddingVertical }]}>
      <Text style={[styles.itemCount, { fontSize }]}>
        {itemCount} {itemCount === 1 ? "item" : "items"}
      </Text>
      {itemCount > 0 && (
        <DebouncedTouchable
          onPress={onClearCart}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.clearText, { fontSize }]}>Clear All</Text>
        </DebouncedTouchable>
      )}
    </View>
  )
)

// ==========================================
// Memoized Guest State Component
// ==========================================

interface GuestStateProps {
  isTablet: boolean
  horizontalPadding: number
  fontSize: number
  onLogin: () => void
  onBrowse: () => void
}

const GuestState = memo(
  ({
    isTablet,
    horizontalPadding,
    fontSize,
    onLogin,
    onBrowse,
  }: GuestStateProps) => {
    const guestIconSize = isTablet ? 80 : 64
    const guestContainerSize = isTablet ? 140 : 120

    return (
      <Wrapper style={styles.container} edges={[]}>
        <View
          style={[styles.guestContainer, { padding: horizontalPadding + 8 }]}
        >
          <View
            style={[
              styles.guestIconContainer,
              {
                width: guestContainerSize,
                height: guestContainerSize,
                borderRadius: guestContainerSize / 2,
                marginBottom: isTablet ? 32 : 24,
              },
            ]}
          >
            <AntDesign
              name="shopping-cart"
              size={guestIconSize}
              color={AppColors.gray[300]}
            />
          </View>
          <Text style={[styles.guestTitle, { fontSize: isTablet ? 26 : 22 }]}>
            Your cart is waiting
          </Text>
          <Text
            style={[
              styles.guestSubtitle,
              {
                fontSize,
                lineHeight: fontSize * 1.5,
                paddingHorizontal: isTablet ? 40 : 20,
              },
            ]}
          >
            Sign in to add items to your cart and checkout
          </Text>
          <View
            style={{
              marginTop: isTablet ? 32 : 24,
              paddingHorizontal: isTablet ? 48 : 48,
            }}
          >
            <Button title="Sign In" onPress={onLogin} />
          </View>
          <DebouncedTouchable
            style={[styles.browseButton, { marginTop: isTablet ? 20 : 16 }]}
            onPress={onBrowse}
            activeOpacity={0.7}
          >
            <Text style={[styles.browseText, { fontSize }]}>
              Browse Products
            </Text>
          </DebouncedTouchable>
        </View>
      </Wrapper>
    )
  }
)

// ==========================================
// Memoized Loading Skeleton Component
// ==========================================

interface LoadingSkeletonProps {
  horizontalPadding: number
  fontSize: number
  paddingVertical: number
  isTablet: boolean
  cardBorderRadius: number
}

const LoadingSkeleton = memo(
  ({
    horizontalPadding,
    fontSize,
    paddingVertical,
    isTablet,
    cardBorderRadius,
  }: LoadingSkeletonProps) => (
    <Wrapper style={styles.container}>
      <View style={{ paddingHorizontal: horizontalPadding, paddingTop: 16 }}>
        {/* Header skeleton */}
        <View style={[styles.listHeader, { paddingVertical }]}>
          <SkeletonBase width={80} height={fontSize + 2} />
          <SkeletonBase width={50} height={fontSize + 2} />
        </View>

        {/* Cart item skeletons */}
        <CartItemSkeleton />
        <CartItemSkeleton />
        <CartItemSkeleton />
      </View>

      {/* Skeleton Summary */}
      <View style={styles.footer}>
        <CartSummarySkeleton />
        <View
          style={[
            styles.checkoutContainer,
            {
              paddingHorizontal: horizontalPadding + 4,
              paddingBottom:
                Platform.OS === "ios"
                  ? isTablet
                    ? 20
                    : 24
                  : isTablet
                  ? 20
                  : 16,
            },
          ]}
        >
          <SkeletonBase
            width="100%"
            height={isTablet ? 56 : 52}
            borderRadius={cardBorderRadius}
          />
        </View>
      </View>
    </Wrapper>
  )
)

// ==========================================
// Memoized Summary Section Component
// ==========================================

interface SummarySectionProps {
  subtotal: number
  itemCount: number
  discountAmount: number
  appliedCoupon: ValidatedCoupon | null
  token: string
  isLoading: boolean
  isTablet: boolean
  horizontalPadding: number
  iconSize: number
  onCouponApply: (coupon: ValidatedCoupon) => void
  onCouponRemove: () => void
  onCheckout: () => void
}

const SummarySection = memo(
  ({
    subtotal,
    itemCount,
    discountAmount,
    appliedCoupon,
    token,
    isLoading,
    isTablet,
    horizontalPadding,
    iconSize,
    onCouponApply,
    onCouponRemove,
    onCheckout,
  }: SummarySectionProps) => (
    <View style={styles.footer}>
      <CouponInput
        subtotal={subtotal}
        appliedCoupon={appliedCoupon}
        onApply={onCouponApply}
        onRemove={onCouponRemove}
        token={token}
      />
      <CartSummary
        subtotal={subtotal}
        itemCount={itemCount}
        discountAmount={discountAmount}
        couponCode={appliedCoupon?.code}
      />

      <View
        style={[
          styles.checkoutContainer,
          {
            paddingHorizontal: horizontalPadding + 4,
            paddingBottom:
              Platform.OS === "ios" ? (isTablet ? 20 : 24) : isTablet ? 20 : 16,
          },
        ]}
      >
        <Button
          title="Proceed to Checkout"
          onPress={onCheckout}
          disabled={isLoading || itemCount === 0}
          loading={isLoading}
          icon={<Ionicons name="arrow-forward" size={iconSize} color="white" />}
        />
      </View>
    </View>
  )
)

// ==========================================
// Main Component
// ==========================================

export default function CartScreen() {
  const router = useRouter()
  const { config, isTablet, isLandscape, width } = useResponsive()
  const [refreshing, setRefreshing] = useState(false)

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<ValidatedCoupon | null>(
    null
  )

  // Prevent duplicate fetches
  const isFetchingRef = useRef(false)

  // Auth store - individual selectors
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  // Cart store - individual selectors
  const cart = useCartStore((state) => state.cart)
  const clearCart = useCartStore((state) => state.clearCart)
  const isLoading = useCartStore((state) => state.isLoading)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice)
  const fetchCart = useCartStore((state) => state.fetchCart)

  const subtotal = useMemo(() => getTotalPrice(), [getTotalPrice, cart])
  const discountAmount = appliedCoupon?.discountAmount || 0
  const totalAfterDiscount = subtotal - discountAmount
  const itemCount = cart?.length || 0

  // Memoize layout configuration
  const layoutConfig = useMemo(() => {
    const useHorizontalLayout = isTablet && isLandscape
    const cartListWidth = useHorizontalLayout ? width * 0.55 : width
    const summaryWidth = useHorizontalLayout ? width * 0.45 : width
    const numColumns = isTablet && !isLandscape ? 2 : 1

    return {
      useHorizontalLayout,
      cartListWidth,
      summaryWidth,
      numColumns,
    }
  }, [isTablet, isLandscape, width])

  // Memoize item width calculation
  const itemWidthConfig = useMemo(() => {
    if (layoutConfig.numColumns === 2) {
      const itemWidth =
        (layoutConfig.cartListWidth -
          config.horizontalPadding * 2 -
          config.gap) /
        2
      return { itemWidth, hasMultipleColumns: true }
    }
    return { itemWidth: undefined, hasMultipleColumns: false }
  }, [
    layoutConfig.numColumns,
    layoutConfig.cartListWidth,
    config.horizontalPadding,
    config.gap,
  ])

  // fetch cart data every time the screen comes into focus
  // this ensures cross-device sync for the same user
  useFocusEffect(
    useCallback(() => {
      const loadCart = async () => {
        if (!token || isFetchingRef.current) return

        isFetchingRef.current = true
        try {
          await fetchCart(token)
        } finally {
          isFetchingRef.current = false
        }
      }

      loadCart()
    }, [token, fetchCart])
  )

  // Automatically recalculate discount when subtotal changes (e.g., after fetch)
  // Recalculate discount when subtotal changes
  useMemo(() => {
    if (appliedCoupon && subtotal > 0) {
      let newDiscountAmount = 0
      if (appliedCoupon.discountType === "percentage") {
        newDiscountAmount = (subtotal * appliedCoupon.discountValue) / 100
      } else {
        newDiscountAmount = Math.min(appliedCoupon.discountValue, subtotal)
      }

      const roundedDiscount = Math.round(newDiscountAmount * 100) / 100

      if (roundedDiscount !== appliedCoupon.discountAmount) {
        setAppliedCoupon((prev) =>
          prev ? { ...prev, discountAmount: roundedDiscount } : null
        )
      }
    }
  }, [subtotal, appliedCoupon?.discountType, appliedCoupon?.discountValue])

  const handleCouponApply = useCallback(
    (coupon: ValidatedCoupon) => {
      let newDiscountAmount = 0
      if (coupon.discountType === "percentage") {
        newDiscountAmount = (subtotal * coupon.discountValue) / 100
      } else {
        newDiscountAmount = Math.min(coupon.discountValue, subtotal)
      }

      setAppliedCoupon({
        ...coupon,
        discountAmount: Math.round(newDiscountAmount * 100) / 100,
      })
    },
    [subtotal]
  )

  const handleCouponRemove = useCallback(() => {
    setAppliedCoupon(null)
  }, [])

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    if (!token) return

    setRefreshing(true)
    try {
      await fetchCart(token)
    } catch (error) {
      console.error("Error refreshing cart:", error)
    } finally {
      setRefreshing(false)
    }
  }, [token, fetchCart])

  // Clear cart with confirmation
  const handleClearCart = useCallback(() => {
    Alert.alert(
      "Clear Cart",
      "Are you sure you want to remove all items from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            if (!token) return

            try {
              const result = await clearCart(token)

              if (result > 0) {
                setAppliedCoupon(null)
                Toast.show({
                  type: "success",
                  text1: "Cart cleared",
                  text2: "All items have been removed",
                  visibilityTime: 2000,
                })
              }
            } catch (error) {
              console.error("Error clearing cart:", error)
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to clear cart",
                visibilityTime: 2000,
              })
            }
          },
        },
      ]
    )
  }, [token, clearCart])

  const navigateToShop = useCallback(() => {
    router.push("/shop")
  }, [router])

  const navigateToLogin = useCallback(() => {
    router.push("/(auth)/login")
  }, [router])

  const proceedToCheckout = useCallback(() => {
    if (!user) {
      Toast.show({
        type: "error",
        text1: "Login Required",
        text2: "Please log in to place an order",
        visibilityTime: 2000,
      })
      return
    }

    const orderData = {
      cart,
      subtotal,
      discountAmount,
      coupon: appliedCoupon
        ? {
            code: appliedCoupon.code,
            discountType: appliedCoupon.discountType,
            discountValue: appliedCoupon.discountValue,
            discountAmount: appliedCoupon.discountAmount,
          }
        : null,
      totalAmount: totalAfterDiscount,
      shippingCost: 0,
      user: {
        user_name: `${user?.fName} ${user?.lName || ""}`.trim(),
        email: user?.email,
        phone: user?.phone,
        shipping_address: user?.shipping_address,
      },
    }

    router.push({
      pathname: "/(tabs)/cart/select-shipping",
      params: {
        orderData: JSON.stringify(orderData),
      },
    })
  }, [
    user,
    cart,
    subtotal,
    discountAmount,
    appliedCoupon,
    totalAfterDiscount,
    router,
  ])

  // Memoize renderItem
  const renderCartItem = useCallback(
    ({ item, index }: { item: CartItem; index: number }) => {
      const isLastInRow =
        itemWidthConfig.hasMultipleColumns && (index + 1) % 2 === 0
      const marginRight =
        itemWidthConfig.hasMultipleColumns && !isLastInRow ? config.gap : 0

      return (
        <CartItemWrapper
          item={item}
          token={token || ""}
          userId={user?.id || ""}
          itemWidth={itemWidthConfig.itemWidth}
          marginRight={marginRight}
        />
      )
    },
    [token, user?.id, itemWidthConfig, config.gap]
  )

  const keyExtractor = useCallback(
    (item: CartItem) =>
      item.basket_item_id?.toString() || item.product_id.toString(),
    []
  )

  // Memoize ListHeaderComponent
  const ListHeaderComponent = useMemo(
    () => (
      <ListHeader
        itemCount={itemCount}
        fontSize={config.bodyFontSize}
        paddingVertical={isTablet ? 16 : 12}
        onClearCart={handleClearCart}
      />
    ),
    [itemCount, config.bodyFontSize, isTablet, handleClearCart]
  )

  // Memoize SummarySection render
  const renderSummary = useMemo(
    () => (
      <SummarySection
        subtotal={subtotal}
        itemCount={itemCount}
        discountAmount={discountAmount}
        appliedCoupon={appliedCoupon}
        token={token || ""}
        isLoading={isLoading}
        isTablet={isTablet}
        horizontalPadding={config.horizontalPadding}
        iconSize={config.iconSize}
        onCouponApply={handleCouponApply}
        onCouponRemove={handleCouponRemove}
        onCheckout={proceedToCheckout}
      />
    ),
    [
      subtotal,
      itemCount,
      discountAmount,
      appliedCoupon,
      token,
      isLoading,
      isTablet,
      config.horizontalPadding,
      config.iconSize,
      handleCouponApply,
      handleCouponRemove,
      proceedToCheckout,
    ]
  )

  // Guest user - show login prompt
  if (!token || !user) {
    return (
      <GuestState
        isTablet={isTablet}
        horizontalPadding={config.horizontalPadding}
        fontSize={config.bodyFontSize}
        onLogin={navigateToLogin}
        onBrowse={navigateToShop}
      />
    )
  }

  // Loading state
  if (isLoading && itemCount === 0) {
    return (
      <LoadingSkeleton
        horizontalPadding={config.horizontalPadding}
        fontSize={config.bodyFontSize}
        paddingVertical={isTablet ? 16 : 12}
        isTablet={isTablet}
        cardBorderRadius={config.cardBorderRadius}
      />
    )
  }

  // Empty cart
  if (itemCount === 0) {
    return (
      <Wrapper>
        <EmptyState
          type="cart"
          message="Your cart is empty"
          subMessage="Browse our products and add items to your cart"
          actionLabel="Start Shopping"
          onAction={navigateToShop}
        />
      </Wrapper>
    )
  }

  // Tablet landscape: side-by-side layout
  if (layoutConfig.useHorizontalLayout) {
    return (
      <Wrapper style={styles.container}>
        <View style={styles.horizontalContainer}>
          {/* Cart Items Column */}
          <View style={{ width: layoutConfig.cartListWidth }}>
            <FlatList
              data={cart}
              renderItem={renderCartItem}
              keyExtractor={keyExtractor}
              contentContainerStyle={[
                styles.listContent,
                { paddingHorizontal: config.horizontalPadding },
              ]}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={ListHeaderComponent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={AppColors.primary[500]}
                  colors={[AppColors.primary[500]]}
                />
              }
              // Performance optimizations
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              initialNumToRender={10}
              windowSize={5}
              updateCellsBatchingPeriod={50}
            />
          </View>

          {/* Summary Column */}
          <View
            style={[styles.summaryColumn, { width: layoutConfig.summaryWidth }]}
          >
            {renderSummary}
          </View>
        </View>
      </Wrapper>
    )
  }

  // Phone & tablet portrait: vertical layout
  return (
    <Wrapper style={styles.container}>
      <FlatList
        key={`cart-${layoutConfig.numColumns}`}
        data={cart}
        renderItem={renderCartItem}
        keyExtractor={keyExtractor}
        numColumns={layoutConfig.numColumns}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: config.horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeaderComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={AppColors.primary[500]}
            colors={[AppColors.primary[500]]}
          />
        }
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={5}
        updateCellsBatchingPeriod={50}
      />

      {renderSummary}
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.secondary,
    borderTopWidth: 0.5,
    borderTopColor: AppColors.gray[200],
  },
  header: {
    paddingVertical: 16,
    backgroundColor: AppColors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  title: {
    fontFamily: "Poppins_700Bold",
    color: AppColors.text.primary,
  },
  horizontalContainer: {
    flex: 1,
    flexDirection: "row",
  },
  summaryColumn: {
    backgroundColor: AppColors.background.primary,
    borderLeftWidth: 1,
    borderLeftColor: AppColors.gray[200],
  },
  listContent: {
    paddingBottom: 16,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  itemCount: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.secondary,
  },
  clearText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.error,
    textDecorationLine: "underline",
  },
  footer: {
    backgroundColor: AppColors.background.primary,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
  checkoutContainer: {},
  // Guest styles
  guestContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.background.primary,
  },
  guestIconContainer: {
    backgroundColor: AppColors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  guestTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
    marginBottom: 8,
  },
  guestSubtitle: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    textAlign: "center",
  },
  browseButton: {
    paddingVertical: 12,
  },
  browseText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[500],
  },
})
