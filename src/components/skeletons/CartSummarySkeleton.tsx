import { StyleSheet, View } from "react-native"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { SkeletonBase } from "./SkeletonBase"

const CartSummarySkeleton: React.FC = () => {
  const { config, isTablet } = useResponsive()

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
      {/* Free shipping banner skeleton */}
      <SkeletonBase
        width="100%"
        height={isTablet ? 52 : 48}
        borderRadius={config.cardBorderRadius}
        style={{ marginBottom: isTablet ? 20 : 16 }}
      />

      {/* Summary card */}
      <View
        style={[
          styles.summaryCard,
          {
            padding: isTablet ? 20 : 16,
            borderRadius: config.cardBorderRadius + 4,
          },
        ]}
      >
        {/* Subtotal row */}
        <View style={styles.row}>
          <SkeletonBase width={100} height={isTablet ? 16 : 14} />
          <SkeletonBase width={60} height={isTablet ? 16 : 14} />
        </View>

        {/* Shipping row */}
        <View style={[styles.row, { marginTop: isTablet ? 12 : 10 }]}>
          <SkeletonBase width={70} height={isTablet ? 16 : 14} />
          <SkeletonBase width={80} height={isTablet ? 16 : 14} />
        </View>

        {/* Divider */}
        <View
          style={[styles.divider, { marginVertical: isTablet ? 16 : 12 }]}
        />

        {/* Total row */}
        <View style={styles.row}>
          <SkeletonBase width={90} height={isTablet ? 18 : 16} />
          <SkeletonBase width={80} height={isTablet ? 24 : 20} />
        </View>

        {/* Tax note */}
        <View style={{ alignItems: "flex-end", marginTop: isTablet ? 10 : 8 }}>
          <SkeletonBase width={120} height={isTablet ? 12 : 10} />
        </View>
      </View>
    </View>
  )
}

export default CartSummarySkeleton

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
    backgroundColor: AppColors.background.primary,
  },
  summaryCard: {
    backgroundColor: AppColors.background.secondary,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.gray[300],
  },
})
