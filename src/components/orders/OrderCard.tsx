import { Ionicons } from "@expo/vector-icons"
import React, { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native"

import AppColors from "@/src/constants/Colors"
import { DeliveryStatus, Order, PaymentStatus } from "@/src/types"
import DebouncedTouchable from "../ui/DebouncedTouchable"

interface Props {
  order: Order
  onCancel: (orderId: number) => Promise<void>
  onViewDetails: (order: Order) => void
}

const OrderCard: React.FC<Props> = ({ order, onCancel, onViewDetails }) => {
  const [isCanceling, setIsCanceling] = useState(false)

  const isPaid = order.payment_status === "paid" || order.status === "paid"
  const isPending = order.payment_status === "pending"
  const isCanceled = order.order_status === "canceled"
  const canCancel =
    !isCanceled &&
    order.delivery_status !== "delivered" &&
    order.delivery_status !== "picked up" &&
    order.delivery_status !== "dispatched"

  const productCount = order.orders?.products?.length || 0
  const firstProductImage = order.orders?.products?.[0]?.cover

  const handleCancel = () => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order? This action cannot be undone.",
      [
        { text: "Keep Order", style: "cancel" },
        {
          text: "Cancel Order",
          style: "destructive",
          onPress: async () => {
            setIsCanceling(true)
            try {
              await onCancel(order.id)
            } finally {
              setIsCanceling(false)
            }
          },
        },
      ]
    )
  }

  const getPaymentStatusColor = (status: PaymentStatus): string => {
    switch (status) {
      case "paid":
        return AppColors.success
      case "pending":
        return AppColors.warning
      case "failed":
        return AppColors.error
      default:
        return AppColors.text.secondary
    }
  }

  const getPaymentStatusBg = (status: PaymentStatus): string => {
    switch (status) {
      case "paid":
        return "#D1FAE5"
      case "pending":
        return "#FEF3C7"
      case "failed":
        return "#FEE2E2"
      default:
        return AppColors.gray[100]
    }
  }

  const getDeliveryStatusColor = (status: DeliveryStatus): string => {
    switch (status) {
      case "delivered":
      case "picked up":
        return AppColors.success
      case "dispatched":
      case "ready for pickup":
        return "#3B82F6"
      case "processing":
        return AppColors.warning
      case "canceled":
        return AppColors.error
      default:
        return AppColors.text.secondary
    }
  }

  const getDeliveryStatusBg = (status: DeliveryStatus): string => {
    switch (status) {
      case "delivered":
      case "picked up":
        return "#D1FAE5"
      case "dispatched":
      case "ready for pickup":
        return "#DBEAFE"
      case "processing":
        return "#FEF3C7"
      case "canceled":
        return "#FEE2E2"
      default:
        return AppColors.gray[100]
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <View style={[styles.container, isCanceled && styles.containerCanceled]}>
      <View style={styles.content}>
        {/* Order Info */}
        <View style={styles.orderInfo}>
          {/* Order ID & Date */}
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>
              Order #{order.order_number || order.id}
            </Text>
            <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
          </View>

          {/* Total */}
          <Text style={styles.orderTotal}>
            ${order?.total_order_amount?.toFixed(2)}
          </Text>

          {/* Items Count */}
          <Text style={styles.itemCount}>
            {productCount} {productCount === 1 ? "item" : "items"}
          </Text>

          {/* Status Badges */}
          <View style={styles.statusContainer}>
            {/* Payment Status */}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getPaymentStatusBg(order.payment_status) },
              ]}
            >
              <Ionicons
                name={isPaid ? "checkmark-circle" : "time"}
                size={12}
                color={getPaymentStatusColor(order.payment_status)}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: getPaymentStatusColor(order.payment_status) },
                ]}
              >
                {isPaid ? "Paid" : isPending ? "Pending" : "Failed"}
              </Text>
            </View>

            {/* Delivery Status */}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getDeliveryStatusBg(order.delivery_status) },
              ]}
            >
              <Ionicons
                name={
                  order.delivery_status === "delivered" ||
                  order.delivery_status === "picked up"
                    ? "checkmark-circle"
                    : order.delivery_status === "canceled"
                    ? "close-circle"
                    : "car"
                }
                size={12}
                color={getDeliveryStatusColor(order.delivery_status)}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: getDeliveryStatusColor(order.delivery_status) },
                ]}
              >
                {order.delivery_status.charAt(0).toUpperCase() +
                  order.delivery_status.slice(1)}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <DebouncedTouchable
              style={[
                styles.viewDetailsButton,
                isCanceled && { backgroundColor: "#fff" },
              ]}
              onPress={() => onViewDetails(order)}
              activeOpacity={0.7}
            >
              <Text style={styles.viewDetailsText}>View Details</Text>
            </DebouncedTouchable>
            {canCancel && !isCanceled && (
              <DebouncedTouchable
                style={[
                  styles.viewDetailsButton,
                  {
                    borderWidth: 1,
                    borderColor: "#dc8a8a",
                    backgroundColor: "#fff",
                  },
                ]}
                disabled={isCanceling}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                {isCanceling ? (
                  <ActivityIndicator size="small" color={AppColors.error} />
                ) : (
                  <Text style={styles.viewDetailsText}>Cancel Order</Text>
                )}
              </DebouncedTouchable>
            )}
          </View>
        </View>

        {/* Product Image */}
        {firstProductImage && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: firstProductImage }}
              style={styles.productImage}
              resizeMode="contain"
            />
            {productCount > 1 && (
              <View style={styles.moreItemsBadge}>
                <Text style={styles.moreItemsText}>+{productCount - 1}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  )
}

export default OrderCard

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },
  containerCanceled: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  cancelButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cancelButtonText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.error,
    textDecorationLine: "underline",
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  orderInfo: {
    flex: 1,
    paddingRight: 12,
  },
  orderHeader: {
    marginBottom: 4,
  },
  orderId: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: AppColors.text.primary,
  },
  orderDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.tertiary,
    marginTop: 2,
  },
  orderTotal: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: AppColors.text.primary,
    marginTop: 8,
  },
  itemCount: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    textTransform: "capitalize",
  },
  actionContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  payNowButton: {
    backgroundColor: AppColors.primary[500],
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  payNowText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "white",
  },
  viewDetailsButton: {
    backgroundColor: AppColors.gray[100],
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  viewDetailsText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.text.primary,
  },
  imageContainer: {
    position: "relative",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: AppColors.gray[50],
  },
  moreItemsBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: AppColors.primary[500],
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  moreItemsText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    color: "white",
  },
})
