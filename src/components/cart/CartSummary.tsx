import AppColors from "@/src/constants/Colors"
import {
  amountToFreeShipping,
  qualifiesForFreeShipping,
  SHIPPING_CONFIG,
} from "@/src/constants/shipping"
import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, Text, View } from "react-native"

interface CartSummaryProps {
  subtotal: number
  shippingCost?: number
  discountAmount?: number
  itemCount: number
  couponCode?: string
}

const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  shippingCost = 0,
  discountAmount = 0,
  itemCount,
  couponCode,
}) => {
  const totalAfterDiscount = subtotal - discountAmount
  const hasFreeShipping = qualifiesForFreeShipping(subtotal)
  const remainingForFreeShipping = amountToFreeShipping(subtotal)
  const showFreeShippingProgress = subtotal > 0 && !hasFreeShipping

  return (
    <View style={styles.container}>
      {/* Free Shipping Progress */}
      {showFreeShippingProgress && (
        <View style={styles.freeShippingBanner}>
          <View style={styles.freeShippingContent}>
            <Ionicons
              name="car-outline"
              size={18}
              color={AppColors.primary[600]}
            />
            <Text style={styles.freeShippingText}>
              Add ${remainingForFreeShipping.toFixed(2)} more for free standard
              shipping!
            </Text>
            {/* <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View> */}
          </View>
        </View>
      )}

      {/* Free Shipping Unlocked */}
      {hasFreeShipping && (
        <View style={styles.freeShippingUnlockedBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
          <View style={styles.freeShippingUnlockedTextContainer}>
            <Text style={styles.freeShippingUnlockedText}>
              🎉 Free standard shipping unlocked!
            </Text>
            <Text style={styles.freeShippingUnlockedSubtext}>
              Express available for ${SHIPPING_CONFIG.EXPRESS_SHIPPING_COST}
            </Text>
          </View>
        </View>
      )}

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        {/* Subtotal */}
        <View style={styles.row}>
          <Text style={styles.label}>
            Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
          </Text>
          <Text style={styles.value}>${subtotal.toFixed(2)}</Text>
        </View>

        {discountAmount > 0 && couponCode && (
          <View style={styles.row}>
            <View>
              <Ionicons name="pricetag" size={14} color="#16A34A" />
              <Text style={styles.discountLabel}>Discount ({couponCode})</Text>
            </View>
            <Text style={styles.discountValue}>
              -${discountAmount.toFixed(2)}
            </Text>
          </View>
        )}

        {/* Shipping */}
        <View style={styles.row}>
          <Text style={styles.label}>Shipping</Text>
          <Text style={styles.value}>
            {hasFreeShipping ? "FREE" : "Calculated at checkout"}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Total */}
        <View style={styles.row}>
          <Text style={styles.totalLabel}>Estimated Total</Text>
          <Text style={styles.totalValue}>
            ${totalAfterDiscount.toFixed(2)}
          </Text>
        </View>

        {/* Tax Note */}
        <Text style={styles.taxNote}>Includes GST where applicable</Text>
      </View>
    </View>
  )
}

export default CartSummary

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
    backgroundColor: AppColors.background.primary,
  },
  freeShippingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.primary[50],
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: AppColors.primary[100],
  },
  freeShippingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  freeShippingText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.primary[700],
    flex: 1,
  },
  freeShippingUnlockedBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  freeShippingUnlockedTextContainer: {
    flex: 1,
  },
  freeShippingUnlockedText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#166534",
  },
  freeShippingUnlockedSubtext: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#15803D",
    marginTop: 2,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: AppColors.primary[100],
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: AppColors.primary[500],
    borderRadius: 3,
  },
  summaryCard: {
    backgroundColor: AppColors.background.secondary,
    borderRadius: 16,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  value: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.primary,
  },
  discountLabel: {
    color: AppColors.success,
  },
  discountValue: {
    color: AppColors.success,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.gray[300],
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
  taxNote: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: AppColors.text.tertiary,
    textAlign: "right",
    marginTop: 8,
  },
})
