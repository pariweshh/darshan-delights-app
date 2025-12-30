import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useCallback, useState } from "react"
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

import { applyCoupon } from "@/src/api/coupon"
import { createOrderAndPaymentIntent, deleteOrder } from "@/src/api/orders"
import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
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
  ephemeralKey: string
  freeOrder?: boolean
}

export default function PaymentScreen() {
  const router = useRouter()
  const { config, isTablet, isLandscape, width } = useResponsive()
  const { orderData } = useLocalSearchParams()
  const parsedOrderData = JSON.parse(orderData as string)

  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const clearCart = useCartStore((state) => state.clearCart)

  const { initPaymentSheet, presentPaymentSheet } = useStripe()

  const [loading, setLoading] = useState(false)
  const [paymentReady, setPaymentReady] = useState(false)

  const coupon = parsedOrderData?.coupon
  const discountAmount = parsedOrderData?.discountAmount || 0

  // Layout configuration
  const useHorizontalLayout = isTablet && isLandscape
  const contentMaxWidth = isTablet && !isLandscape ? 500 : undefined

  const calculateGST = useCallback((totalAmount: number): number => {
    return (totalAmount * GST_RATE) / (100 + GST_RATE)
  }, [])

  const stripeTheme = {
    colors: {
      // Brand
      primary: AppColors.primary[500],

      // Backgrounds
      background: "#F9FAFB",
      componentBackground: "#F3F4F6",
      surface: "#F3F4F6",

      // Borders & dividers
      componentBorder: "#E5E7EB",
      componentDivider: "#E5E7EB",

      // Text — explicitly dark
      primaryText: "#111827",
      secondaryText: "#374151",
      placeholderText: "#6B7280",
      surfaceText: "#111827",

      // Icons
      icon: "#374151",
    },

    shapes: {
      borderRadius: 12,
      borderWidth: 1,
    },

    primaryButton: {
      colors: {
        background: AppColors.primary[500],
        text: "#FFFFFF",
        border: AppColors.primary[500],
      },
      shapes: {
        borderRadius: 12,
      },
    },
  }

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

        // if (!data?.paymentIntent?.clientSecret) {
        //   Toast.show({
        //     type: "error",
        //     text1: "Payment intent failed",
        //     text2: "Failed to create payment intent",
        //     position: "bottom",
        //     visibilityTime: 2000,
        //   })
        //   return null
        // }

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

      console.log({ paymentData })

      if (!paymentData) {
        setLoading(false)
        return
      }
      const {
        paymentIntent,
        order_id,
        order_number,
        customer_id,
        ephemeralKey,
        freeOrder,
      } = paymentData

      if (freeOrder) {
        await handlePaymentSuccess(order_id, order_number || "")
        return
      }
      // Check if paymentIntent exists (should always exist if not freeOrder)
      if (!paymentIntent?.clientSecret) {
        Toast.show({
          type: "error",
          text1: "Payment Error",
          text2: "Unable to process payment. Please try again.",
          visibilityTime: 3000,
        })
        setLoading(false)
        return
      }

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Darshan Delights",
        customerId: customer_id,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent.clientSecret,

        applePay: {
          merchantCountryCode: "AU",
        },

        googlePay: {
          merchantCountryCode: "AU",
          testEnv: false,
        },

        returnURL: "darshandelights://payment-success",

        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: parsedOrderData.billingDetails?.name,
          email: parsedOrderData.billingDetails?.email,
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
        appearance: stripeTheme,
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
            console.error("Failed to track coupon usage:", couponError)
          }
        }

        if (token) {
          await clearCart(token)
        }

        Toast.show({
          type: "success",
          text1: "Payment Successful! 🎉",
          text2: "Your order has been placed",
          visibilityTime: 2000,
        })

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
    [token, clearCart, router, coupon, discountAmount]
  )

  const formatShippingAddress = useCallback((shippingDetails: any): string => {
    if (!shippingDetails) return "Address not provided"

    if (typeof shippingDetails.address === "string") {
      return shippingDetails.address
    }

    const parts = [
      shippingDetails.address?.line1 || shippingDetails.street,
      shippingDetails.address?.line2 || shippingDetails.apartment,
      shippingDetails.address?.city || shippingDetails.city,
      shippingDetails.address?.state || shippingDetails.state,
      shippingDetails.address?.postal_code || shippingDetails.postalCode,
    ].filter(Boolean)

    return parts.length > 0 ? parts.join(", ") : "Address not provided"
  }, [])

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

  // Card styles helper
  const getCardStyle = () => [
    styles.card,
    {
      padding: isTablet ? 20 : 16,
      borderRadius: config.cardBorderRadius + 4,
      marginBottom: isTablet ? 20 : 16,
    },
  ]

  // Render order summary
  const renderOrderSummary = () => (
    <View style={getCardStyle()}>
      <Text style={[styles.cardTitle, { fontSize: isTablet ? 18 : 16 }]}>
        Order Summary
      </Text>

      <View style={[styles.summaryRow, { marginBottom: isTablet ? 12 : 10 }]}>
        <Text style={[styles.summaryLabel, { fontSize: config.bodyFontSize }]}>
          Subtotal ({parsedOrderData.cart?.length || 0} items)
        </Text>
        <Text style={[styles.summaryValue, { fontSize: config.bodyFontSize }]}>
          ${(parsedOrderData.subtotal || 0).toFixed(2)}
        </Text>
      </View>

      {coupon && discountAmount > 0 && (
        <View style={[styles.summaryRow, { marginBottom: isTablet ? 12 : 10 }]}>
          <View style={styles.discountLabelRow}>
            <Ionicons
              name="pricetag"
              size={config.iconSizeSmall}
              color="#16A34A"
            />
            <Text
              style={[
                styles.discountLabelText,
                { fontSize: config.bodyFontSize },
              ]}
            >
              Discount ({coupon.code})
            </Text>
          </View>
          <Text
            style={[
              styles.discountValueText,
              { fontSize: config.bodyFontSize },
            ]}
          >
            -${discountAmount.toFixed(2)}
          </Text>
        </View>
      )}

      {parsedOrderData.shippingCost > 0 && (
        <View style={[styles.summaryRow, { marginBottom: isTablet ? 12 : 10 }]}>
          <Text
            style={[styles.summaryLabel, { fontSize: config.bodyFontSize }]}
          >
            Shipping
          </Text>
          <Text
            style={[styles.summaryValue, { fontSize: config.bodyFontSize }]}
          >
            ${parsedOrderData.shippingCost.toFixed(2)}
          </Text>
        </View>
      )}

      {parsedOrderData.shippingCost === 0 && !parsedOrderData.localPickup && (
        <View style={[styles.summaryRow, { marginBottom: isTablet ? 12 : 10 }]}>
          <Text
            style={[styles.summaryLabel, { fontSize: config.bodyFontSize }]}
          >
            Shipping
          </Text>
          <Text
            style={[
              styles.summaryValue,
              styles.freeText,
              { fontSize: config.bodyFontSize },
            ]}
          >
            FREE
          </Text>
        </View>
      )}

      <View style={[styles.divider, { marginVertical: isTablet ? 16 : 12 }]} />

      <View style={styles.summaryRow}>
        <Text style={[styles.totalLabel, { fontSize: isTablet ? 18 : 16 }]}>
          Total
        </Text>
        <Text style={[styles.totalValue, { fontSize: isTablet ? 24 : 20 }]}>
          ${(parsedOrderData.totalAmount || 0).toFixed(2)}
        </Text>
      </View>

      <Text style={[styles.gstNote, { fontSize: config.smallFontSize }]}>
        Includes ${calculateGST(parsedOrderData.totalAmount || 0).toFixed(2)}{" "}
        GST
      </Text>
    </View>
  )

  // Render delivery info
  const renderDeliveryInfo = () => (
    <View style={getCardStyle()}>
      <View style={styles.deliveryRow}>
        <View
          style={[
            styles.deliveryIconContainer,
            {
              width: isTablet ? 56 : 48,
              height: isTablet ? 56 : 48,
              borderRadius: isTablet ? 14 : 12,
            },
          ]}
        >
          <Ionicons
            name={deliveryInfo.icon}
            size={config.iconSizeLarge}
            color={AppColors.primary[500]}
          />
        </View>
        <View style={[styles.deliveryInfo, { marginLeft: isTablet ? 16 : 12 }]}>
          <Text
            style={[styles.deliveryTitle, { fontSize: config.bodyFontSize }]}
          >
            {deliveryInfo.title}
          </Text>
          <Text
            style={[
              styles.deliveryAddress,
              { fontSize: config.bodyFontSize - 1 },
            ]}
          >
            {deliveryInfo.address}
          </Text>
        </View>
      </View>
    </View>
  )

  // Render contact info
  const renderContactInfo = () => (
    <View style={getCardStyle()}>
      <Text style={[styles.cardTitle, { fontSize: isTablet ? 18 : 16 }]}>
        Contact Information
      </Text>
      <Text style={[styles.contactText, { fontSize: config.bodyFontSize }]}>
        {parsedOrderData.customerName}
      </Text>
      <Text style={[styles.contactText, { fontSize: config.bodyFontSize }]}>
        {parsedOrderData.customerEmail}
      </Text>
      <Text style={[styles.contactText, { fontSize: config.bodyFontSize }]}>
        {parsedOrderData.customerPhone}
      </Text>
    </View>
  )

  // Render pay button
  const renderPayButton = () => (
    <View
      style={[
        styles.footer,
        {
          padding: isTablet ? 20 : 16,
          paddingTop: isTablet ? 16 : 12,
          paddingBottom:
            Platform.OS === "ios" ? (isTablet ? 20 : 24) : isTablet ? 20 : 16,
        },
      ]}
    >
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
            <Ionicons name="lock-closed" size={config.iconSize} color="white" />
          ) : undefined
        }
      />
      <View style={[styles.secureContainer, { marginTop: isTablet ? 16 : 12 }]}>
        <Ionicons
          name="shield-checkmark"
          size={config.iconSizeSmall}
          color={AppColors.success}
        />
        <Text style={[styles.secureText, { fontSize: config.smallFontSize }]}>
          Secure payment powered by Stripe
        </Text>
      </View>
    </View>
  )

  // Icon size calculations
  const iconCircleSize = isTablet ? 96 : 80
  const iconSize = isTablet ? 48 : 40

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {useHorizontalLayout ? (
        // Tablet Landscape: Side-by-side layout
        <View style={styles.horizontalContainer}>
          {/* Left Column - Order Details */}
          <ScrollView
            style={styles.leftColumn}
            contentContainerStyle={[
              styles.scrollContent,
              { padding: config.horizontalPadding + 4 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Icon */}
            <View
              style={[
                styles.iconContainer,
                { marginBottom: isTablet ? 24 : 20 },
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  {
                    width: iconCircleSize,
                    height: iconCircleSize,
                    borderRadius: iconCircleSize / 2,
                  },
                ]}
              >
                <Ionicons
                  name="card-outline"
                  size={iconSize}
                  color={AppColors.primary[500]}
                />
              </View>
            </View>

            {/* Title */}
            <Text style={[styles.title, { fontSize: isTablet ? 28 : 24 }]}>
              Complete Your Payment
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  fontSize: config.bodyFontSize,
                  marginBottom: isTablet ? 28 : 24,
                },
              ]}
            >
              Review your order and confirm payment
            </Text>

            {renderDeliveryInfo()}
            {renderContactInfo()}
          </ScrollView>

          {/* Right Column - Summary & Pay */}
          <View style={styles.rightColumn}>
            <ScrollView
              contentContainerStyle={{ padding: config.horizontalPadding }}
              showsVerticalScrollIndicator={false}
            >
              {renderOrderSummary()}
            </ScrollView>
            {renderPayButton()}
          </View>
        </View>
      ) : (
        // Phone & Tablet Portrait: Vertical layout
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              {
                padding: config.horizontalPadding + 4,
                paddingBottom: isTablet ? 48 : 40,
                maxWidth: contentMaxWidth,
                alignSelf: contentMaxWidth ? "center" : undefined,
                width: contentMaxWidth ? "100%" : undefined,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Icon */}
            <View
              style={[
                styles.iconContainer,
                { marginBottom: isTablet ? 24 : 20 },
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  {
                    width: iconCircleSize,
                    height: iconCircleSize,
                    borderRadius: iconCircleSize / 2,
                  },
                ]}
              >
                <Ionicons
                  name="card-outline"
                  size={iconSize}
                  color={AppColors.primary[500]}
                />
              </View>
            </View>

            {/* Title */}
            <Text style={[styles.title, { fontSize: isTablet ? 28 : 24 }]}>
              Complete Your Payment
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  fontSize: config.bodyFontSize,
                  marginBottom: isTablet ? 28 : 24,
                },
              ]}
            >
              Review your order and confirm payment
            </Text>

            {renderOrderSummary()}
            {renderDeliveryInfo()}
            {renderContactInfo()}
          </ScrollView>

          {renderPayButton()}
        </>
      )}
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
  scrollContent: {},
  horizontalContainer: {
    flex: 1,
    flexDirection: "row",
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    width: "40%",
    backgroundColor: AppColors.background.primary,
    borderLeftWidth: 1,
    borderLeftColor: AppColors.gray[200],
  },
  // Icon
  iconContainer: {
    alignItems: "center",
  },
  iconCircle: {
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  // Title
  title: {
    fontFamily: "Poppins_700Bold",
    color: AppColors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    textAlign: "center",
  },
  // Card
  card: {
    backgroundColor: AppColors.background.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
    marginBottom: 12,
  },
  // Summary
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  summaryValue: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
  },
  freeText: {
    color: AppColors.success,
    fontFamily: "Poppins_600SemiBold",
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.gray[200],
  },
  totalLabel: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  totalValue: {
    fontFamily: "Poppins_700Bold",
    color: AppColors.primary[600],
  },
  gstNote: {
    fontFamily: "Poppins_400Regular",
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
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  deliveryAddress: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    marginTop: 2,
  },
  // Contact
  contactText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    marginBottom: 4,
  },
  // Footer
  footer: {
    backgroundColor: AppColors.background.primary,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
  },
  secureContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secureText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
  },
  discountLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  discountLabelText: {
    fontFamily: "Poppins_400Regular",
    color: "#16A34A",
  },
  discountValueText: {
    fontFamily: "Poppins_600SemiBold",
    color: "#16A34A",
  },
})
