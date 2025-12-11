import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import React, { useCallback } from "react"
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import Toast from "react-native-toast-message"

import { getUserProductReview } from "@/src/api/reviews"
import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"
import { CartItem, Order } from "@/src/types"
import { Review } from "@/src/types/review"
import OrderDeliveryProgress from "./OrderDeliveryProgress"

const { height: SCREEN_HEIGHT } = Dimensions.get("window")
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.85

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

// Delivery statuses that allow reviews
const REVIEWABLE_STATUSES = ["delivered", "picked up"]

const OrderDetailsModal: React.FC<Props> = ({
  visible,
  order,
  onClose,
  onWriteReview,
  reviewedProductIds,
}) => {
  const router = useRouter()
  const { token } = useAuthStore()

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
        // No existing review
        existingReview = null
      }

      // Close this modal first, then trigger review modal in parent
      onClose()

      // Small delay to allow modal to close
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

  // Get shipping details
  const shippingAddress =
    order.shipping_details?.address || order.shipping_details

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[AppColors.primary[50], "#FFFFFF"]}
            style={styles.gradientHeader}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>
                  Order #{order.id || order.order_number}
                </Text>
                <Text style={styles.headerDate}>
                  {formatDate(order.createdAt)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={AppColors.text.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Delivery Progress */}
            <View style={styles.progressSection}>
              <OrderDeliveryProgress
                status={order.delivery_status}
                isPickup={order.localPickup}
              />
            </View>
          </LinearGradient>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Review Prompt for Delivered Orders */}
            {isReviewable && (
              <View style={styles.reviewPromptCard}>
                <View style={styles.reviewPromptIcon}>
                  <Ionicons name="star" size={20} color={AppColors.star} />
                </View>
                <View style={styles.reviewPromptContent}>
                  <Text style={styles.reviewPromptTitle}>
                    How was your order?
                  </Text>
                  <Text style={styles.reviewPromptText}>
                    Share your experience by reviewing the products below
                  </Text>
                </View>
              </View>
            )}

            {/* Order Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <View style={styles.card}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(subtotal)}
                  </Text>
                </View>

                {(order.discount_applied || 0) > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Discount</Text>
                    <Text style={[styles.summaryValue, styles.discountText]}>
                      -{formatCurrency(order.discount_applied)}
                    </Text>
                  </View>
                )}

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    {order.localPickup ? "Pickup" : "Delivery"}
                  </Text>
                  <Text style={styles.summaryValue}>
                    {(order.delivery_fee || 0) === 0
                      ? "FREE"
                      : formatCurrency(order.delivery_fee)}
                  </Text>
                </View>

                {(order.tax_amount || 0) > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>GST</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(order.tax_amount)}
                    </Text>
                  </View>
                )}

                <View style={styles.divider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(order.total_order_amount)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Delivery/Pickup Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {order.localPickup ? "Pickup Details" : "Delivery Address"}
              </Text>
              <View style={styles.card}>
                <View style={styles.infoRow}>
                  <Ionicons
                    name={
                      order.localPickup
                        ? "storefront-outline"
                        : "location-outline"
                    }
                    size={20}
                    color={AppColors.primary[600]}
                  />
                  <View style={styles.infoContent}>
                    {order.localPickup ? (
                      <>
                        <Text style={styles.infoTitle}>Store Pickup</Text>
                        <Text style={styles.infoText}>
                          8 Lethbridge Road, Austral, NSW 2179
                        </Text>
                      </>
                    ) : shippingAddress ? (
                      <>
                        <Text style={styles.infoTitle}>
                          {order.shipping_details?.name || order.name}
                        </Text>
                        <Text style={styles.infoText}>
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
                      <Text style={styles.infoText}>Address not available</Text>
                    )}
                  </View>
                </View>

                {order.phone && (
                  <View style={[styles.infoRow, styles.infoRowLast]}>
                    <Ionicons
                      name="call-outline"
                      size={20}
                      color={AppColors.primary[600]}
                    />
                    <Text style={styles.infoText}>{order.phone}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Products */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Items ({orderProducts.length})
              </Text>
              <View style={styles.card}>
                {orderProducts.map((item, index) => {
                  const isReviewed = reviewedProductIds.has(
                    Number(item.product_id)
                  )

                  return (
                    <React.Fragment key={`${item.product_id}-${index}`}>
                      {index > 0 && <View style={styles.productDivider} />}
                      <View style={styles.productItem}>
                        <TouchableOpacity
                          onPress={() => handleViewProduct(item)}
                          activeOpacity={0.7}
                        >
                          <Image
                            source={{ uri: item.cover }}
                            style={styles.productImage}
                            resizeMode="contain"
                          />
                        </TouchableOpacity>

                        <View style={styles.productInfo}>
                          <TouchableOpacity
                            onPress={() => handleViewProduct(item)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.productName} numberOfLines={2}>
                              {item.name}
                            </Text>
                          </TouchableOpacity>
                          <Text style={styles.productPrice}>
                            {formatCurrency(item.unit_price)} × {item.quantity}
                          </Text>
                          <Text style={styles.productSubtotal}>
                            {formatCurrency(item.amount)}
                          </Text>

                          {/* Review Button */}
                          {isReviewable && (
                            <TouchableOpacity
                              style={[
                                styles.reviewButton,
                                isReviewed && styles.reviewButtonReviewed,
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
                                size={14}
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
                                ]}
                              >
                                {isReviewed ? "Reviewed" : "Write Review"}
                              </Text>
                            </TouchableOpacity>
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
              <TouchableOpacity
                style={styles.receiptButton}
                onPress={handleViewReceipt}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="receipt-outline"
                  size={20}
                  color={AppColors.primary[600]}
                />
                <Text style={styles.receiptButtonText}>View Receipt</Text>
              </TouchableOpacity>
            )}

            {/* Payment Method */}
            <View style={styles.paymentInfo}>
              <Ionicons
                name="card-outline"
                size={16}
                color={AppColors.text.tertiary}
              />
              <Text style={styles.paymentText}>
                Paid with {order.payment_method || "Card"}
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.closeFooterButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeFooterButtonText}>Close</Text>
            </TouchableOpacity>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: MODAL_HEIGHT,
    overflow: "hidden",
  },
  gradientHeader: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    paddingBottom: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: AppColors.text.primary,
  },
  headerDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  progressSection: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 12,
  },
  scrollView: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
  },
  // Review Prompt
  reviewPromptCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF9C3",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  reviewPromptIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 14,
    color: "#92400E",
  },
  reviewPromptText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#A16207",
    marginTop: 2,
  },
  // Sections
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: AppColors.text.primary,
    marginBottom: 10,
  },
  card: {
    backgroundColor: AppColors.gray[50],
    borderRadius: 16,
    padding: 16,
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
  discountText: {
    color: AppColors.success,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.gray[200],
    marginVertical: 10,
  },
  totalLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.text.primary,
  },
  totalValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: AppColors.primary[600],
  },
  // Info
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  infoRowLast: {
    marginBottom: 0,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.text.primary,
    marginBottom: 2,
  },
  infoText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    lineHeight: 19,
  },
  // Products
  productItem: {
    flexDirection: "row",
    paddingVertical: 8,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "white",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.primary,
    marginBottom: 4,
    textTransform: "capitalize",
  },
  productPrice: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.secondary,
  },
  productSubtotal: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: AppColors.text.primary,
    marginTop: 2,
  },
  productDivider: {
    height: 1,
    backgroundColor: AppColors.gray[200],
    marginVertical: 8,
  },
  // Review Button
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: AppColors.primary[50],
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 8,
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
    fontSize: 12,
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
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginBottom: 16,
  },
  receiptButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.primary[600],
  },
  // Payment
  paymentInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 8,
  },
  paymentText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.tertiary,
  },
  // Footer
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
  },
  closeFooterButton: {
    backgroundColor: AppColors.primary[500],
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  closeFooterButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "white",
  },
})
