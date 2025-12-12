import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useCallback, useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

import { applyCoupon } from "@/src/api/coupon"
import { createOrderAndPaymentIntent, deleteOrder } from "@/src/api/orders"
import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"
import { useCartStore } from "@/src/store/cartStore"
import { useStripe } from "@stripe/stripe-react-native"

const GST_RATE = 10

interface PaymentIntentResponse {
  paymentIntent: {
    clientSecret: string
    id: string
  }
  order_id: number
  order_number: string
  customer_id: string
}

export default function PaymentScreen() {
  const router = useRouter()
  const { orderData } = useLocalSearchParams()
  const parsedOrderData = JSON.parse(orderData as string)

  console.log({ parsedOrderData })

  const { user, token } = useAuthStore()
  const { clearCart } = useCartStore()
  const { initPaymentSheet, presentPaymentSheet } = useStripe()

  const [loading, setLoading] = useState(false)
  const [paymentReady, setPaymentReady] = useState(false)

  const coupon = parsedOrderData?.coupon
  const discountAmount = parsedOrderData?.discountAmount || 0

  const calculateGST = useCallback((totalAmount: number): number => {
    console.log(totalAmount)
    return (totalAmount * GST_RATE) / (100 + GST_RATE)
  }, [])

  const createPaymentIntent =
    useCallback(async (): Promise<PaymentIntentResponse | null> => {
      if (!user || !token) {
        Toast.show({
          type: "error",
          text1: "Login Required",
          text2: "Please log in to complete payment",
          visibilityTime: 2000,
        })
        return null
      }

      try {
        const {
          cart,
          shippingCost,
          localPickup,
          customerName: user_name,
          customerEmail,
          selectedShipping,
          customerPhone: customer_phone,
          shippingDetails,
          billingDetails,
          totalAmount,
          discountAmount,
          coupon,
          subtotal,
        } = parsedOrderData

        const tax_amount = calculateGST(totalAmount)

        const data = await createOrderAndPaymentIntent({
          cart,
          user_name,
          customer_phone,
          selectedShipping,
          shippingCost,
          localPickup,
          tax_amount,
          shippingDetails,
          billingDetails,
          token,
          subtotal,
          discountAmount: discountAmount || 0,
          couponCode: coupon?.code || null,
          totalAmount,
          platform: "mobile",
        })

        if (!data?.paymentIntent?.clientSecret) {
          Toast.show({
            type: "error",
            text1: "Payment intent failed",
            text2: "Failed to create payment intent",
            position: "bottom",
            visibilityTime: 2000,
          })
          return null
        }

        return data
      } catch (error: any) {
        if (__DEV__) {
          console.error("Payment intent error:", error)
        }

        Toast.show({
          type: "error",
          text1: "Payment Error",
          text2: error.message || "Failed to setup payment",
          visibilityTime: 3000,
        })
        return null
      }
    }, [user, token, parsedOrderData, calculateGST])

  const handlePayment = useCallback(async () => {
    if (!user || !token) {
      Toast.show({
        type: "error",
        text1: "Login Required!",
        text2: "Please log in to place an order",
        position: "bottom",
        visibilityTime: 2000,
      })
      return
    }
    setLoading(true)

    try {
      const paymentData = await createPaymentIntent()

      if (!paymentData) {
        setLoading(false)
        return
      }
      const { paymentIntent, order_id, order_number, customer_id } = paymentData

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Darshan Delights",
        customerId: customer_id,
        paymentIntentClientSecret: paymentIntent.clientSecret,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: parsedOrderData.billingDetails?.name,
          email: parsedOrderData.billingDeatails?.email,
          phone: parsedOrderData.billingDetails?.phone,
          address: parsedOrderData.billingDetails?.address,
        },
        ...(parsedOrderData.shippingDetails && {
          defaultShippingDetails: {
            name: parsedOrderData.shippingDetails?.name,
            phone: parsedOrderData.shippingDetails?.phone,
            address: parsedOrderData.shippingDetails?.address,
          },
        }),
        style: "alwaysLight",

        appearance: {
          colors: {
            primary: AppColors.primary[500],
            background: "#ffffff",
            componentBackground: "#F9FAFB",
            componentBorder: "#E5E7EB",
            componentDivider: "#E5E7EB",
            primaryText: "#111827",
            secondaryText: "#4B5563",
            placeholderText: "#9CA3AF",
            icon: "#6B7280",
          },
          shapes: {
            borderRadius: 12,
            borderWidth: 1,
          },
          primaryButton: {
            colors: {
              background: AppColors.primary[500],
              text: "#FFFFFF",
              border: "F97316",
            },
            shapes: {
              borderRadius: 12,
            },
          },
        },
      })

      if (initError) {
        if (__DEV__) {
          console.error("Payment sheet init error:", initError)
        }
        Toast.show({
          type: "error",
          text1: "Payment Setup Failed",
          text2: initError.message || "Unable to initialize payment",
          visibilityTime: 3000,
        })
        setLoading(false)
        return
      }

      setPaymentReady(true)

      const { error: presentError } = await presentPaymentSheet()

      if (presentError) {
        if (presentError.code === "Canceled") {
          await deleteOrder(order_id, token as string)
          Toast.show({
            type: "info",
            text1: "Payment Canceled",
            text2: "Your order has been canceled",
            visibilityTime: 2000,
          })
        } else {
          if (__DEV__) {
            console.error("Payment presentation error:", presentError)
          }
          Toast.show({
            type: "error",
            text1: "Payment Failed",
            text2: presentError.message || "Please try again",
            visibilityTime: 3000,
          })
        }
      } else {
        await handlePaymentSuccess(order_id, order_number || "")
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error("Payment flow error:", error)
      }
      Toast.show({
        type: "error",
        text1: "Payment Error",
        text2: error.message || "An unexpected error occurred",
        visibilityTime: 3000,
      })
    } finally {
      setLoading(false)
      setPaymentReady(false)
    }
  }, [
    user,
    token,
    createPaymentIntent,
    initPaymentSheet,
    presentPaymentSheet,
    parsedOrderData,
  ])

  const handlePaymentSuccess = useCallback(
    async (orderId: number, orderNumber: string) => {
      try {
        // Apply coupon usage if one was used
        if (coupon?.code && token) {
          try {
            await applyCoupon(
              coupon.code,
              orderId,
              orderNumber,
              discountAmount,
              token
            )
          } catch (couponError) {
            // Don't fail the order if coupon tracking fails
            console.error("Failed to track coupon usage:", couponError)
          }
        }

        // clear cart
        if (token) {
          await clearCart(token)
        }

        Toast.show({
          type: "success",
          text1: "Payment Successful! 🎉",
          text2: "Your order has been placed",
          visibilityTime: 2000,
        })

        // navigate to success screen
        router.replace({
          pathname: "/payment-success",
          params: { orderId: orderId.toString() },
        })
      } catch (error) {
        if (__DEV__) {
          console.error("Post-payment error:", error)
        }

        router.replace("/(tabs)/home")
      }
    },
    [token, clearCart, router, coupon]
  )

  // Helper function to format shipping details
  const formatShippingAddress = useCallback((shippingDetails: any): string => {
    if (!shippingDetails) return "Address not provided"

    // If address is a string
    if (typeof shippingDetails.address === "string") {
      return shippingDetails.address
    }

    // Build from object fields
    const parts = [
      shippingDetails.address?.line1 || shippingDetails.street,
      shippingDetails.address?.line2 || shippingDetails.apartment,
      shippingDetails.address?.city || shippingDetails.city,
      shippingDetails.address?.state || shippingDetails.state,
      shippingDetails.address?.postal_code || shippingDetails.postalCode,
    ].filter(Boolean)

    return parts.length > 0 ? parts.join(", ") : "Address not provided"
  }, [])

  // Delivery info for display
  const deliveryInfo = parsedOrderData.localPickup
    ? {
        title: "Store Pickup",
        address: "8 Lethbridge Road, Austral, NSW 2179",
        icon: "storefront-outline" as const,
      }
    : {
        title: "Home Delivery",
        address: formatShippingAddress(parsedOrderData.shippingDetails),
        icon: "location-outline" as const,
      }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons
              name="card-outline"
              size={40}
              color={AppColors.primary[500]}
            />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Complete Your Payment</Text>
        <Text style={styles.subtitle}>
          Review your order and confirm payment
        </Text>

        {/* Order Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Subtotal ({parsedOrderData.cart?.length || 0} items)
            </Text>
            <Text style={styles.summaryValue}>
              ${(parsedOrderData.subtotal || 0).toFixed(2)}
            </Text>
          </View>

          {/* Discount Row */}
          {coupon && discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <View style={styles.discountLabelRow}>
                <Ionicons name="pricetag" size={14} color="#16A34A" />
                <Text style={styles.discountLabelText}>
                  Discount ({coupon.code})
                </Text>
              </View>
              <Text style={styles.discountValueText}>
                -${discountAmount.toFixed(2)}
              </Text>
            </View>
          )}

          {parsedOrderData.shippingCost > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>
                ${parsedOrderData.shippingCost.toFixed(2)}
              </Text>
            </View>
          )}

          {parsedOrderData.shippingCost === 0 &&
            !parsedOrderData.localPickup && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping</Text>
                <Text style={[styles.summaryValue, styles.freeText]}>FREE</Text>
              </View>
            )}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ${(parsedOrderData.totalAmount || 0).toFixed(2)}
            </Text>
          </View>

          <Text style={styles.gstNote}>
            Includes $
            {calculateGST(parsedOrderData.totalAmount || 0).toFixed(2)} GST
          </Text>
        </View>

        {/* Delivery Info Card */}
        <View style={styles.card}>
          <View style={styles.deliveryRow}>
            <View style={styles.deliveryIconContainer}>
              <Ionicons
                name={deliveryInfo.icon}
                size={24}
                color={AppColors.primary[500]}
              />
            </View>
            <View style={styles.deliveryInfo}>
              <Text style={styles.deliveryTitle}>{deliveryInfo.title}</Text>
              <Text style={styles.deliveryAddress}>{deliveryInfo.address}</Text>
            </View>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          <Text style={styles.contactText}>{parsedOrderData.customerName}</Text>
          <Text style={styles.contactText}>
            {parsedOrderData.customerEmail}
          </Text>
          <Text style={styles.contactText}>
            {parsedOrderData.customerPhone}
          </Text>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.footer}>
        <Button
          title={
            loading
              ? "Processing..."
              : `Pay $${(parsedOrderData.totalAmount || 0).toFixed(2)}`
          }
          onPress={handlePayment}
          loading={loading}
          disabled={loading}
          icon={
            !loading ? (
              <Ionicons name="lock-closed" size={18} color="white" />
            ) : undefined
          }
        />
        <View style={styles.secureContainer}>
          <Ionicons
            name="shield-checkmark"
            size={14}
            color={AppColors.success}
          />
          <Text style={styles.secureText}>
            Secure payment powered by Stripe
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  // Icon
  iconContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  // Title
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: AppColors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
    textAlign: "center",
    marginBottom: 24,
  },
  // Card
  card: {
    backgroundColor: AppColors.background.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.text.primary,
    marginBottom: 12,
  },
  // Summary
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  summaryValue: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.primary,
  },
  freeText: {
    color: AppColors.success,
    fontFamily: "Poppins_600SemiBold",
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.gray[200],
    marginVertical: 12,
  },
  totalLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.text.primary,
  },
  totalValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: AppColors.primary[600],
  },
  gstNote: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.tertiary,
    textAlign: "right",
    marginTop: 4,
  },
  // Delivery
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  deliveryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: AppColors.text.primary,
  },
  deliveryAddress: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    marginTop: 2,
  },
  // Contact
  contactText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
    marginBottom: 4,
  },
  // Footer
  footer: {
    padding: 16,
    paddingTop: 12,
    backgroundColor: AppColors.background.primary,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
  },
  secureContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 6,
  },
  secureText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.tertiary,
  },
  discountLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  discountLabelText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#16A34A",
  },
  discountValueText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#16A34A",
  },
})
