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
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"
import { useCartStore } from "@/src/store/cartStore"
import { CartItem } from "@/src/types"

import { ValidatedCoupon } from "@/src/api/coupon"
import CartItemCard from "@/src/components/cart/CartItemCard"
import CartSummary from "@/src/components/cart/CartSummary"
import CouponInput from "@/src/components/cart/CouponInput"
import EmptyState from "@/src/components/common/EmptyState"
import Loader from "@/src/components/common/Loader"
import Wrapper from "@/src/components/common/Wrapper"
import Button from "@/src/components/ui/Button"

export default function CartScreen() {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  // coupon state
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

      // recalculate coupon discount if one is applied
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

  // Navigate to shop
  const navigateToShop = () => {
    router.push("/shop")
  }

  // Navigate to login
  const navigateToLogin = () => {
    router.push("/(auth)/login")
  }

  // Proceed to checkout
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
    ({ item }: { item: CartItem }) => (
      <CartItemCard item={item} token={token || ""} userId={user?.id || ""} />
    ),
    [token, user?.id]
  )

  // Render header
  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.itemCount}>
        {itemCount} {itemCount === 1 ? "item" : "items"}
      </Text>
      {itemCount > 0 && (
        <TouchableOpacity
          onPress={handleClearCart}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  // Guest user - show login prompt
  if (!token || !user) {
    return (
      <Wrapper style={styles.container} edges={[]}>
        <View style={styles.guestContainer}>
          <View style={styles.guestIconContainer}>
            <AntDesign
              name="shopping-cart"
              size={64}
              color={AppColors.gray[300]}
            />
          </View>
          <Text style={styles.guestTitle}>Your cart is waiting</Text>
          <Text style={styles.guestSubtitle}>
            Sign in to add items to your cart and checkout
          </Text>
          <Button
            title="Sign In"
            onPress={navigateToLogin}
            containerStyles="mt-6 px-12"
          />
          <TouchableOpacity
            style={styles.browseButton}
            onPress={navigateToShop}
            activeOpacity={0.7}
          >
            <Text style={styles.browseText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </Wrapper>
    )
  }

  // Loading state
  if (isLoading && itemCount === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Cart</Text>
        </View>
        <Loader text="Loading cart..." />
      </SafeAreaView>
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

  return (
    <Wrapper style={styles.container}>
      {/* Cart Items */}
      <FlatList
        data={cart}
        renderItem={renderCartItem}
        keyExtractor={(item) =>
          item.basket_item_id?.toString() || item.product_id.toString()
        }
        contentContainerStyle={styles.listContent}
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

      {/* Summary & Checkout */}
      <View style={styles.footer}>
        {/* Coupon Input */}
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

        <View style={styles.checkoutContainer}>
          <Button
            title="Proceed to Checkout"
            onPress={proceedToCheckout}
            disabled={isLoading || itemCount === 0}
            loading={isLoading}
            icon={<Ionicons name="arrow-forward" size={20} color="white" />}
          />
        </View>
      </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: AppColors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: AppColors.text.primary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  itemCount: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  clearText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.error,
    textDecorationLine: "underline",
  },
  footer: {
    backgroundColor: AppColors.background.primary,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
  checkoutContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
  },
  // Guest styles
  guestContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: AppColors.background.primary,
  },
  guestIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.gray[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  guestTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 22,
    color: AppColors.text.primary,
    marginBottom: 8,
  },
  guestSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  browseButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  browseText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: AppColors.primary[500],
  },
})
