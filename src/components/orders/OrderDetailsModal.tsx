import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import React, { useCallback } from "react"
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import Toast from "react-native-toast-message"

import { getUserProductReview } from "@/src/api/reviews"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"
import { CartItem, Order } from "@/src/types"
import { Review } from "@/src/types/review"
import DebouncedTouchable from "../ui/DebouncedTouchable"
import OrderDeliveryProgress from "./OrderDeliveryProgress"

interface Props {
  visible: boolean
  order: Order | null
  onClose: () => void
  onWriteReview: (
    product: CartItem,
    orderId: number,
    existingReview: Review | null
  ) => void
  reviewedProductIds: Set<number>
}

const REVIEWABLE_STATUSES = ["delivered", "picked up"]

const OrderDetailsModal: React.FC<Props> = ({
  visible,
  order,
  onClose,
  onWriteReview,
  reviewedProductIds,
}) => {
  const router = useRouter()
  const { config, isTablet, isLandscape, width, height } = useResponsive()
  const { token } = useAuthStore()

  // Modal sizing
  const modalMaxWidth = isTablet ? (isLandscape ? 600 : 550) : undefined
  const modalMaxHeight = isTablet ? height * 0.9 : height * 0.85

  // Check if order is reviewable
  const isReviewable =
    order?.delivery_status &&
    REVIEWABLE_STATUSES.includes(order.delivery_status.toLowerCase())

  // Get products from order
  const getOrderProducts = (): CartItem[] => {
    if (!order?.orders) return []

    try {
      if (typeof order.orders === "string") {
        const parsed = JSON.parse(order.orders)
        return parsed?.products || parsed || []
      } else if (order.orders?.products) {
        return order.orders.products
      } else if (Array.isArray(order.orders)) {
        return order.orders
      }
    } catch (e) {
      console.error("Error parsing order products:", e)
    }

    return []
  }

  const orderProducts = getOrderProducts()

  const handleViewReceipt = async () => {
    if (!order?.receipt_url) {
      Alert.alert("No Receipt", "Receipt is not available for this order.")
      return
    }

    try {
      await WebBrowser.openBrowserAsync(order.receipt_url)
    } catch (error) {
      console.error("Error opening receipt:", error)
      Alert.alert("Error", "Unable to open receipt.")
    }
  }

  const handleWriteReview = useCallback(
    async (product: CartItem) => {
      if (!token || !order) {
        Toast.show({
          type: "info",
          text1: "Login Required",
          text2: "Please login to write a review",
          visibilityTime: 2000,
        })
        return
      }

      let existingReview: Review | null = null

      try {
        existingReview = await getUserProductReview(
          Number(product.product_id),
          token
        )
      } catch (error) {
        existingReview = null
      }

      onClose()

      setTimeout(() => {
        onWriteReview(product, order.id, existingReview)
      }, 300)
    },
    [token, order, onClose, onWriteReview]
  )

  const handleViewProduct = useCallback(
    (product: CartItem) => {
      onClose()
      setTimeout(() => {
        router.push({
          pathname: "/product/[id]",
          params: { id: product.product_id.toString() },
        })
      }, 300)
    },
    [onClose, router]
  )

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number): string => {
    return `$${(amount || 0).toFixed(2)}`
  }

  if (!order) return null

  const subtotal =
    (order.total_order_amount || 0) -
    (order.delivery_fee || 0) -
    (order.tax_amount || 0) +
    (order.discount_applied || 0)

  const shippingAddress =
    order.shipping_details?.address || order.shipping_details

  // Responsive sizes
  const productImageSize = isTablet ? 70 : 60
  const closeButtonSize = isTablet ? 40 : 36
  const sectionPadding = isTablet ? 18 : 16
  const cardBorderRadius = config.cardBorderRadius + 4

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <DebouncedTouchable
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.modalContainer,
            {
              maxHeight: modalMaxHeight,
              maxWidth: modalMaxWidth,
              alignSelf: modalMaxWidth ? "center" : undefined,
              width: modalMaxWidth ? "100%" : undefined,
              borderTopLeftRadius: isTablet ? 28 : 24,
              borderTopRightRadius: isTablet ? 28 : 24,
            },
          ]}
        >
          <LinearGradient
            colors={[AppColors.primary[50], "#FFFFFF"]}
            style={[
              styles.gradientHeader,
              {
                borderTopLeftRadius: isTablet ? 28 : 24,
                borderTopRightRadius: isTablet ? 28 : 24,
              },
            ]}
          >
            {/* Header */}
            <View
              style={[
                styles.header,
                {
                  padding: isTablet ? 24 : 20,
                  paddingBottom: isTablet ? 14 : 12,
                },
              ]}
            >
              <View style={styles.headerContent}>
                <Text
                  style={[styles.headerTitle, { fontSize: isTablet ? 22 : 20 }]}
                >
                  Order #{order.id || order.order_number}
                </Text>
                <Text
                  style={[
                    styles.headerDate,
                    { fontSize: config.bodyFontSize - 1 },
                  ]}
                >
                  {formatDate(order.createdAt)}
                </Text>
              </View>
              <DebouncedTouchable
                style={[
                  styles.closeButton,
                  {
                    width: closeButtonSize,
                    height: closeButtonSize,
                    borderRadius: closeButtonSize / 2,
                  },
                ]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={config.iconSizeLarge}
                  color={AppColors.text.primary}
                />
              </DebouncedTouchable>
            </View>

            {/* Delivery Progress */}
            <View
              style={[
                styles.progressSection,
                {
                  marginHorizontal: isTablet ? 20 : 16,
                  borderRadius: cardBorderRadius,
                  paddingHorizontal: isTablet ? 14 : 12,
                },
              ]}
            >
              <OrderDeliveryProgress
                status={order.delivery_status}
                isPickup={order.localPickup}
              />
            </View>
          </LinearGradient>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              {
                padding: isTablet ? 20 : 16,
                paddingTop: isTablet ? 12 : 8,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Review Prompt for Delivered Orders */}
            {isReviewable && (
              <View
                style={[
                  styles.reviewPromptCard,
                  {
                    padding: isTablet ? 16 : 14,
                    borderRadius: cardBorderRadius - 4,
                    marginBottom: isTablet ? 18 : 16,
                  },
                ]}
              >
                <View
                  style={[
                    styles.reviewPromptIcon,
                    {
                      width: isTablet ? 44 : 40,
                      height: isTablet ? 44 : 40,
                      borderRadius: isTablet ? 22 : 20,
                    },
                  ]}
                >
                  <Ionicons
                    name="star"
                    size={isTablet ? 22 : 20}
                    color={AppColors.star}
                  />
                </View>
                <View style={styles.reviewPromptContent}>
                  <Text
                    style={[
                      styles.reviewPromptTitle,
                      { fontSize: config.bodyFontSize },
                    ]}
                  >
                    How was your order?
                  </Text>
                  <Text
                    style={[
                      styles.reviewPromptText,
                      { fontSize: config.smallFontSize },
                    ]}
                  >
                    Share your experience by reviewing the products below
                  </Text>
                </View>
              </View>
            )}

            {/* Order Summary */}
            <View
              style={[styles.section, { marginBottom: isTablet ? 18 : 16 }]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    fontSize: config.subtitleFontSize,
                    marginBottom: isTablet ? 12 : 10,
                  },
                ]}
              >
                Order Summary
              </Text>
              <View
                style={[
                  styles.card,
                  {
                    padding: sectionPadding,
                    borderRadius: cardBorderRadius,
                  },
                ]}
              >
                <View
                  style={[
                    styles.summaryRow,
                    { marginBottom: isTablet ? 12 : 10 },
                  ]}
                >
                  <Text
                    style={[
                      styles.summaryLabel,
                      { fontSize: config.bodyFontSize },
                    ]}
                  >
                    Subtotal
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { fontSize: config.bodyFontSize },
                    ]}
                  >
                    {formatCurrency(subtotal)}
                  </Text>
                </View>

                {(order.discount_applied || 0) > 0 && (
                  <View
                    style={[
                      styles.summaryRow,
                      { marginBottom: isTablet ? 12 : 10 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.summaryLabel,
                        { fontSize: config.bodyFontSize },
                      ]}
                    >
                      Discount
                    </Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        styles.discountText,
                        { fontSize: config.bodyFontSize },
                      ]}
                    >
                      -{formatCurrency(order.discount_applied)}
                    </Text>
                  </View>
                )}

                <View
                  style={[
                    styles.summaryRow,
                    { marginBottom: isTablet ? 12 : 10 },
                  ]}
                >
                  <Text
                    style={[
                      styles.summaryLabel,
                      { fontSize: config.bodyFontSize },
                    ]}
                  >
                    {order.localPickup ? "Pickup" : "Delivery"}
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { fontSize: config.bodyFontSize },
                    ]}
                  >
                    {(order.delivery_fee || 0) === 0
                      ? "FREE"
                      : formatCurrency(order.delivery_fee)}
                  </Text>
                </View>

                {(order.tax_amount || 0) > 0 && (
                  <View
                    style={[
                      styles.summaryRow,
                      { marginBottom: isTablet ? 12 : 10 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.summaryLabel,
                        { fontSize: config.bodyFontSize },
                      ]}
                    >
                      GST
                    </Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        { fontSize: config.bodyFontSize },
                      ]}
                    >
                      {formatCurrency(order.tax_amount)}
                    </Text>
                  </View>
                )}

                <View
                  style={[
                    styles.divider,
                    { marginVertical: isTablet ? 12 : 10 },
                  ]}
                />

                <View style={styles.summaryRow}>
                  <Text
                    style={[
                      styles.totalLabel,
                      { fontSize: isTablet ? 18 : 16 },
                    ]}
                  >
                    Total
                  </Text>
                  <Text
                    style={[
                      styles.totalValue,
                      { fontSize: isTablet ? 20 : 18 },
                    ]}
                  >
                    {formatCurrency(order.total_order_amount)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Delivery/Pickup Info */}
            <View
              style={[styles.section, { marginBottom: isTablet ? 18 : 16 }]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    fontSize: config.subtitleFontSize,
                    marginBottom: isTablet ? 12 : 10,
                  },
                ]}
              >
                {order.localPickup ? "Pickup Details" : "Delivery Address"}
              </Text>
              <View
                style={[
                  styles.card,
                  {
                    padding: sectionPadding,
                    borderRadius: cardBorderRadius,
                  },
                ]}
              >
                <View style={[styles.infoRow, { gap: isTablet ? 14 : 12 }]}>
                  <Ionicons
                    name={
                      order.localPickup
                        ? "storefront-outline"
                        : "location-outline"
                    }
                    size={isTablet ? 22 : 20}
                    color={AppColors.primary[600]}
                  />
                  <View style={styles.infoContent}>
                    {order.localPickup ? (
                      <>
                        <Text
                          style={[
                            styles.infoTitle,
                            { fontSize: config.bodyFontSize },
                          ]}
                        >
                          Store Pickup
                        </Text>
                        <Text
                          style={[
                            styles.infoText,
                            { fontSize: config.bodyFontSize - 1 },
                          ]}
                        >
                          8 Lethbridge Road, Austral, NSW 2179
                        </Text>
                      </>
                    ) : shippingAddress ? (
                      <>
                        <Text
                          style={[
                            styles.infoTitle,
                            { fontSize: config.bodyFontSize },
                          ]}
                        >
                          {order.shipping_details?.name || order.name}
                        </Text>
                        <Text
                          style={[
                            styles.infoText,
                            { fontSize: config.bodyFontSize - 1 },
                          ]}
                        >
                          {shippingAddress.line1}
                          {shippingAddress.line2 &&
                            `, ${shippingAddress.line2}`}
                          {shippingAddress.city && `, ${shippingAddress.city}`}
                          {shippingAddress.state && ` ${shippingAddress.state}`}
                          {shippingAddress.postal_code &&
                            ` ${shippingAddress.postal_code}`}
                        </Text>
                      </>
                    ) : (
                      <Text
                        style={[
                          styles.infoText,
                          { fontSize: config.bodyFontSize - 1 },
                        ]}
                      >
                        Address not available
                      </Text>
                    )}
                  </View>
                </View>

                {order.phone && (
                  <View
                    style={[
                      styles.infoRow,
                      styles.infoRowLast,
                      {
                        gap: isTablet ? 14 : 12,
                        marginTop: isTablet ? 14 : 12,
                      },
                    ]}
                  >
                    <Ionicons
                      name="call-outline"
                      size={isTablet ? 22 : 20}
                      color={AppColors.primary[600]}
                    />
                    <Text
                      style={[
                        styles.infoText,
                        { fontSize: config.bodyFontSize - 1 },
                      ]}
                    >
                      {order.phone}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Products */}
            <View
              style={[styles.section, { marginBottom: isTablet ? 18 : 16 }]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    fontSize: config.subtitleFontSize,
                    marginBottom: isTablet ? 12 : 10,
                  },
                ]}
              >
                Items ({orderProducts.length})
              </Text>
              <View
                style={[
                  styles.card,
                  {
                    padding: sectionPadding,
                    borderRadius: cardBorderRadius,
                  },
                ]}
              >
                {orderProducts.map((item, index) => {
                  const isReviewed = reviewedProductIds.has(
                    Number(item.product_id)
                  )

                  return (
                    <React.Fragment key={`${item.product_id}-${index}`}>
                      {index > 0 && (
                        <View
                          style={[
                            styles.productDivider,
                            { marginVertical: isTablet ? 12 : 8 },
                          ]}
                        />
                      )}
                      <View
                        style={[
                          styles.productItem,
                          { paddingVertical: isTablet ? 10 : 8 },
                        ]}
                      >
                        <DebouncedTouchable
                          onPress={() => handleViewProduct(item)}
                          activeOpacity={0.7}
                        >
                          <Image
                            source={{ uri: item.cover }}
                            style={[
                              styles.productImage,
                              {
                                width: productImageSize,
                                height: productImageSize,
                                borderRadius: isTablet ? 12 : 10,
                              },
                            ]}
                            resizeMode="contain"
                          />
                        </DebouncedTouchable>

                        <View
                          style={[
                            styles.productInfo,
                            { marginLeft: isTablet ? 14 : 12 },
                          ]}
                        >
                          <DebouncedTouchable
                            onPress={() => handleViewProduct(item)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.productName,
                                { fontSize: config.bodyFontSize },
                              ]}
                              numberOfLines={2}
                            >
                              {item.name}
                            </Text>
                          </DebouncedTouchable>
                          <Text
                            style={[
                              styles.productPrice,
                              { fontSize: config.smallFontSize },
                            ]}
                          >
                            {formatCurrency(item.unit_price)} × {item.quantity}
                          </Text>
                          <Text
                            style={[
                              styles.productSubtotal,
                              { fontSize: config.bodyFontSize - 1 },
                            ]}
                          >
                            {formatCurrency(item.amount)}
                          </Text>

                          {/* Review Button */}
                          {isReviewable && (
                            <DebouncedTouchable
                              style={[
                                styles.reviewButton,
                                isReviewed && styles.reviewButtonReviewed,
                                {
                                  paddingVertical: isTablet ? 8 : 6,
                                  paddingHorizontal: isTablet ? 12 : 10,
                                  borderRadius: isTablet ? 8 : 6,
                                  marginTop: isTablet ? 10 : 8,
                                },
                              ]}
                              onPress={() => handleWriteReview(item)}
                              activeOpacity={0.7}
                            >
                              <Ionicons
                                name={
                                  isReviewed
                                    ? "checkmark-circle"
                                    : "star-outline"
                                }
                                size={isTablet ? 16 : 14}
                                color={
                                  isReviewed
                                    ? AppColors.success
                                    : AppColors.primary[600]
                                }
                              />
                              <Text
                                style={[
                                  styles.reviewButtonText,
                                  isReviewed && styles.reviewButtonTextReviewed,
                                  { fontSize: config.smallFontSize },
                                ]}
                              >
                                {isReviewed ? "Reviewed" : "Write Review"}
                              </Text>
                            </DebouncedTouchable>
                          )}
                        </View>
                      </View>
                    </React.Fragment>
                  )
                })}
              </View>
            </View>

            {/* Receipt Button */}
            {order.receipt_url && (
              <DebouncedTouchable
                style={[
                  styles.receiptButton,
                  {
                    borderRadius: cardBorderRadius - 4,
                    padding: isTablet ? 16 : 14,
                    marginBottom: isTablet ? 18 : 16,
                  },
                ]}
                onPress={handleViewReceipt}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="receipt-outline"
                  size={isTablet ? 22 : 20}
                  color={AppColors.primary[600]}
                />
                <Text
                  style={[
                    styles.receiptButtonText,
                    { fontSize: config.bodyFontSize },
                  ]}
                >
                  View Receipt
                </Text>
              </DebouncedTouchable>
            )}

            {/* Payment Method */}
            <View
              style={[
                styles.paymentInfo,
                { gap: isTablet ? 8 : 6, marginBottom: isTablet ? 12 : 8 },
              ]}
            >
              <Ionicons
                name="card-outline"
                size={isTablet ? 18 : 16}
                color={AppColors.text.tertiary}
              />
              <Text
                style={[styles.paymentText, { fontSize: config.smallFontSize }]}
              >
                Paid with {order.payment_method || "Card"}
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View
            style={[
              styles.footer,
              {
                padding: isTablet ? 20 : 16,
                paddingBottom:
                  Platform.OS === "ios"
                    ? isTablet
                      ? 28
                      : 32
                    : isTablet
                    ? 20
                    : 16,
              },
            ]}
          >
            <DebouncedTouchable
              style={[
                styles.closeFooterButton,
                {
                  borderRadius: isTablet ? 16 : 14,
                  paddingVertical: isTablet ? 18 : 16,
                },
              ]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.closeFooterButtonText,
                  { fontSize: isTablet ? 17 : 16 },
                ]}
              >
                Close
              </Text>
            </DebouncedTouchable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default OrderDetailsModal

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: "white",
    overflow: "hidden",
  },
  gradientHeader: {},
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    color: AppColors.text.primary,
  },
  headerDate: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    marginTop: 2,
  },
  closeButton: {
    backgroundColor: AppColors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  progressSection: {
    marginBottom: 8,
    backgroundColor: "white",
  },
  scrollView: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {},
  // Review Prompt
  reviewPromptCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF9C3",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  reviewPromptIcon: {
    backgroundColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  reviewPromptContent: {
    flex: 1,
  },
  reviewPromptTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: "#92400E",
  },
  reviewPromptText: {
    fontFamily: "Poppins_400Regular",
    color: "#A16207",
    marginTop: 2,
  },
  // Sections
  section: {},
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  card: {
    backgroundColor: AppColors.gray[50],
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
  discountText: {
    color: AppColors.success,
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
  // Info
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoRowLast: {
    marginBottom: 0,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
    marginBottom: 2,
  },
  infoText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    lineHeight: 19,
  },
  // Products
  productItem: {
    flexDirection: "row",
  },
  productImage: {
    backgroundColor: "white",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
    marginBottom: 4,
    textTransform: "capitalize",
  },
  productPrice: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  productSubtotal: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
    marginTop: 2,
  },
  productDivider: {
    height: 1,
    backgroundColor: AppColors.gray[200],
  },
  // Review Button
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: AppColors.primary[50],
    gap: 4,
    borderWidth: 1,
    borderColor: AppColors.primary[200],
  },
  reviewButtonReviewed: {
    backgroundColor: "#DCFCE7",
    borderColor: "#BBF7D0",
  },
  reviewButtonText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[600],
  },
  reviewButtonTextReviewed: {
    color: AppColors.success,
  },
  // Receipt
  receiptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.primary[50],
    gap: 8,
  },
  receiptButtonText: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.primary[600],
  },
  // Payment
  paymentInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
  },
  // Footer
  footer: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
  },
  closeFooterButton: {
    backgroundColor: AppColors.primary[500],
    alignItems: "center",
  },
  closeFooterButtonText: {
    fontFamily: "Poppins_600SemiBold",
    color: "white",
  },
})
