import AppColors from "@/src/constants/Colors"
import {
  amountToFreeShipping,
  qualifiesForFreeShipping,
  SHIPPING_CONFIG,
} from "@/src/constants/shipping"
import { useResponsive } from "@/src/hooks/useResponsive"
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
  const { config, isTablet } = useResponsive()

  const totalAfterDiscount = subtotal - discountAmount
  const hasFreeShipping = qualifiesForFreeShipping(subtotal)
  const remainingForFreeShipping = amountToFreeShipping(subtotal)
  const showFreeShippingProgress = subtotal > 0 && !hasFreeShipping

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: config.horizontalPadding + 4,
          paddingVertical: isTablet ? 20 : 16,
        },
      ]}
    >
      {/* Free Shipping Progress */}
      {showFreeShippingProgress && (
        <View
          style={[
            styles.freeShippingBanner,
            {
              padding: isTablet ? 14 : 12,
              borderRadius: config.cardBorderRadius,
              marginBottom: isTablet ? 20 : 16,
            },
          ]}
        >
          <View
            style={[styles.freeShippingContent, { gap: isTablet ? 10 : 8 }]}
          >
            <Ionicons
              name="car-outline"
              size={config.iconSize}
              color={AppColors.primary[600]}
            />
            <Text
              style={[
                styles.freeShippingText,
                { fontSize: config.bodyFontSize - 1 },
              ]}
            >
              Add ${remainingForFreeShipping.toFixed(2)} more for free standard
              shipping!
            </Text>
          </View>
        </View>
      )}

      {/* Free Shipping Unlocked */}
      {hasFreeShipping && (
        <View
          style={[
            styles.freeShippingUnlockedBanner,
            {
              padding: isTablet ? 14 : 12,
              borderRadius: config.cardBorderRadius,
              marginBottom: isTablet ? 20 : 16,
              gap: isTablet ? 10 : 8,
            },
          ]}
        >
          <Ionicons
            name="checkmark-circle"
            size={config.iconSize}
            color="#16A34A"
          />
          <View style={styles.freeShippingUnlockedTextContainer}>
            <Text
              style={[
                styles.freeShippingUnlockedText,
                { fontSize: config.bodyFontSize - 1 },
              ]}
            >
              🎉 Free standard shipping unlocked!
            </Text>
            <Text
              style={[
                styles.freeShippingUnlockedSubtext,
                { fontSize: config.smallFontSize },
              ]}
            >
              Express available for ${SHIPPING_CONFIG.EXPRESS_SHIPPING_COST}
            </Text>
          </View>
        </View>
      )}

      {/* Summary Card */}
      <View
        style={[
          styles.summaryCard,
          {
            padding: isTablet ? 20 : 16,
            borderRadius: config.cardBorderRadius + 4,
          },
        ]}
      >
        {/* Subtotal */}
        <View style={[styles.row, { marginBottom: isTablet ? 12 : 10 }]}>
          <Text style={[styles.label, { fontSize: config.bodyFontSize }]}>
            Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
          </Text>
          <Text style={[styles.value, { fontSize: config.bodyFontSize }]}>
            ${subtotal.toFixed(2)}
          </Text>
        </View>

        {discountAmount > 0 && couponCode && (
          <View style={[styles.row, { marginBottom: isTablet ? 12 : 10 }]}>
            <View style={styles.discountRow}>
              <Ionicons
                name="pricetag"
                size={config.iconSizeSmall}
                color="#16A34A"
              />
              <Text
                style={[
                  styles.label,
                  styles.discountLabel,
                  { fontSize: config.bodyFontSize },
                ]}
              >
                Discount ({couponCode})
              </Text>
            </View>
            <Text
              style={[
                styles.value,
                styles.discountValue,
                { fontSize: config.bodyFontSize },
              ]}
            >
              -${discountAmount.toFixed(2)}
            </Text>
          </View>
        )}

        {/* Shipping */}
        <View style={[styles.row, { marginBottom: isTablet ? 12 : 10 }]}>
          <Text style={[styles.label, { fontSize: config.bodyFontSize }]}>
            Shipping
          </Text>
          <Text style={[styles.value, { fontSize: config.bodyFontSize }]}>
            {hasFreeShipping ? "FREE" : "Calculated at checkout"}
          </Text>
        </View>

        {/* Divider */}
        <View
          style={[styles.divider, { marginVertical: isTablet ? 16 : 12 }]}
        />

        {/* Total */}
        <View style={styles.row}>
          <Text style={[styles.totalLabel, { fontSize: isTablet ? 18 : 16 }]}>
            Estimated Total
          </Text>
          <Text style={[styles.totalValue, { fontSize: isTablet ? 24 : 20 }]}>
            ${totalAfterDiscount.toFixed(2)}
          </Text>
        </View>

        {/* Tax Note */}
        <Text
          style={[
            styles.taxNote,
            {
              fontSize: config.smallFontSize - 1,
              marginTop: isTablet ? 10 : 8,
            },
          ]}
        >
          Includes GST where applicable
        </Text>
      </View>
    </View>
  )
}

export default CartSummary

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
    backgroundColor: AppColors.background.primary,
  },
  freeShippingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.primary[50],
    borderWidth: 1,
    borderColor: AppColors.primary[100],
  },
  freeShippingContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  freeShippingText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[700],
    flex: 1,
  },
  freeShippingUnlockedBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  freeShippingUnlockedTextContainer: {
    flex: 1,
  },
  freeShippingUnlockedText: {
    fontFamily: "Poppins_600SemiBold",
    color: "#166534",
  },
  freeShippingUnlockedSubtext: {
    fontFamily: "Poppins_400Regular",
    color: "#15803D",
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: AppColors.background.secondary,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  value: {
    fontFamily: "Poppins_500Medium",
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
  },
  totalLabel: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  totalValue: {
    fontFamily: "Poppins_700Bold",
    color: AppColors.primary[600],
  },
  taxNote: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
    textAlign: "right",
  },
})
