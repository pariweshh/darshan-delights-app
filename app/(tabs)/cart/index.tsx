import { AntDesign, Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useCallback, useState } from "react"
import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
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

export default function CartScreen() {
  const router = useRouter()
  const { config, isTablet, isLandscape, width } = useResponsive()
  const [refreshing, setRefreshing] = useState(false)

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<ValidatedCoupon | null>(
    null
  )

  const { token, user } = useAuthStore()
  const { cart, clearCart, isLoading, getTotalPrice, fetchCart } =
    useCartStore()

  const subtotal = getTotalPrice()
  const discountAmount = appliedCoupon?.discountAmount || 0
  const totalAfterDiscount = subtotal - discountAmount
  const itemCount = cart?.length || 0

  // Layout configuration for tablets
  const useHorizontalLayout = isTablet && isLandscape
  const cartListWidth = useHorizontalLayout ? width * 0.55 : width
  const summaryWidth = useHorizontalLayout ? width * 0.45 : width

  // Grid columns for tablet portrait
  const numColumns = isTablet && !isLandscape ? 2 : 1

  // Recalculate discount when subtotal changes
  const handleCouponApply = (coupon: ValidatedCoupon) => {
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
  }

  const handleCouponRemove = () => {
    setAppliedCoupon(null)
  }

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    if (!token) return

    setRefreshing(true)
    try {
      await fetchCart(token)

      if (appliedCoupon) {
        const newSubtotal = getTotalPrice()
        let newDiscountAmount = 0
        if (appliedCoupon.discountType === "percentage") {
          newDiscountAmount = (newSubtotal * appliedCoupon.discountValue) / 100
        } else {
          newDiscountAmount = Math.min(appliedCoupon.discountValue, newSubtotal)
        }
        setAppliedCoupon((prev) =>
          prev
            ? {
                ...prev,
                discountAmount: Math.round(newDiscountAmount * 100) / 100,
              }
            : null
        )
      }
    } catch (error) {
      console.error("Error refreshing cart:", error)
    } finally {
      setRefreshing(false)
    }
  }, [token, fetchCart, appliedCoupon, getTotalPrice])

  // Clear cart with confirmation
  const handleClearCart = () => {
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
  }

  const navigateToShop = () => {
    router.push("/shop")
  }

  const navigateToLogin = () => {
    router.push("/(auth)/login")
  }

  const proceedToCheckout = () => {
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
  }

  // Render cart item
  const renderCartItem = useCallback(
    ({ item, index }: { item: CartItem; index: number }) => {
      // For 2-column grid on tablet portrait
      const isLastInRow = numColumns === 2 && (index + 1) % 2 === 0
      const marginRight = numColumns === 2 && !isLastInRow ? config.gap : 0

      return (
        <View
          style={{
            width:
              numColumns === 2
                ? (cartListWidth - config.horizontalPadding * 2 - config.gap) /
                  2
                : undefined,
            marginRight,
          }}
        >
          <CartItemCard
            item={item}
            token={token || ""}
            userId={user?.id || ""}
          />
        </View>
      )
    },
    [
      token,
      user?.id,
      numColumns,
      config.gap,
      config.horizontalPadding,
      cartListWidth,
    ]
  )

  // Render header
  const renderHeader = () => (
    <View style={[styles.listHeader, { paddingVertical: isTablet ? 16 : 12 }]}>
      <Text style={[styles.itemCount, { fontSize: config.bodyFontSize }]}>
        {itemCount} {itemCount === 1 ? "item" : "items"}
      </Text>
      {itemCount > 0 && (
        <TouchableOpacity
          onPress={handleClearCart}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.clearText, { fontSize: config.bodyFontSize }]}>
            Clear All
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )

  // Guest user - show login prompt
  if (!token || !user) {
    const guestIconSize = isTablet ? 80 : 64
    const guestContainerSize = isTablet ? 140 : 120

    return (
      <Wrapper style={styles.container} edges={[]}>
        <View
          style={[
            styles.guestContainer,
            { padding: config.horizontalPadding + 8 },
          ]}
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
                fontSize: config.bodyFontSize,
                lineHeight: config.bodyFontSize * 1.5,
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
            <Button title="Sign In" onPress={navigateToLogin} />
          </View>
          <TouchableOpacity
            style={[styles.browseButton, { marginTop: isTablet ? 20 : 16 }]}
            onPress={navigateToShop}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.browseText, { fontSize: config.bodyFontSize }]}
            >
              Browse Products
            </Text>
          </TouchableOpacity>
        </View>
      </Wrapper>
    )
  }

  // Loading state
  if (isLoading && itemCount === 0) {
    return (
      <Wrapper style={styles.container}>
        {/* Skeleton Cart Items */}
        <View
          style={{
            paddingHorizontal: config.horizontalPadding,
            paddingTop: 16,
          }}
        >
          {/* Header skeleton */}
          <View
            style={[styles.listHeader, { paddingVertical: isTablet ? 16 : 12 }]}
          >
            <SkeletonBase width={80} height={config.bodyFontSize + 2} />
            <SkeletonBase width={50} height={config.bodyFontSize + 2} />
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
                paddingHorizontal: config.horizontalPadding + 4,
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
              borderRadius={config.cardBorderRadius}
            />
          </View>
        </View>
      </Wrapper>
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

  // Render summary section
  const renderSummary = () => (
    <View style={styles.footer}>
      <CouponInput
        subtotal={subtotal}
        appliedCoupon={appliedCoupon}
        onApply={handleCouponApply}
        onRemove={handleCouponRemove}
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
            paddingHorizontal: config.horizontalPadding + 4,
            paddingBottom:
              Platform.OS === "ios" ? (isTablet ? 20 : 24) : isTablet ? 20 : 16,
          },
        ]}
      >
        <Button
          title="Proceed to Checkout"
          onPress={proceedToCheckout}
          disabled={isLoading || itemCount === 0}
          loading={isLoading}
          icon={
            <Ionicons
              name="arrow-forward"
              size={config.iconSize}
              color="white"
            />
          }
        />
      </View>
    </View>
  )

  // Tablet landscape: side-by-side layout
  if (useHorizontalLayout) {
    return (
      <Wrapper style={styles.container}>
        <View style={styles.horizontalContainer}>
          {/* Cart Items Column */}
          <View style={{ width: cartListWidth }}>
            <FlatList
              data={cart}
              renderItem={renderCartItem}
              keyExtractor={(item) =>
                item.basket_item_id?.toString() || item.product_id.toString()
              }
              contentContainerStyle={[
                styles.listContent,
                { paddingHorizontal: config.horizontalPadding },
              ]}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={renderHeader}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={AppColors.primary[500]}
                  colors={[AppColors.primary[500]]}
                />
              }
            />
          </View>

          {/* Summary Column */}
          <View style={[styles.summaryColumn, { width: summaryWidth }]}>
            {renderSummary()}
          </View>
        </View>
      </Wrapper>
    )
  }

  // Phone & tablet portrait: vertical layout
  return (
    <Wrapper style={styles.container}>
      <FlatList
        key={`cart-${numColumns}`}
        data={cart}
        renderItem={renderCartItem}
        keyExtractor={(item) =>
          item.basket_item_id?.toString() || item.product_id.toString()
        }
        numColumns={numColumns}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: config.horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={AppColors.primary[500]}
            colors={[AppColors.primary[500]]}
          />
        }
      />

      {renderSummary()}
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
