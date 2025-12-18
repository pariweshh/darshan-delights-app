import { StyleSheet, View } from "react-native"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { SkeletonBase } from "./SkeletonBase"

const CartItemSkeleton: React.FC = () => {
  const { config, isTablet } = useResponsive()

  const imageSize = isTablet ? 100 : 90
  const cardPadding = isTablet ? 18 : 16

  return (
    <View
      style={[
        styles.container,
        {
          padding: cardPadding,
          borderRadius: config.cardBorderRadius + 4,
          marginBottom: config.gap,
        },
      ]}
    >
      {/* Image skeleton */}
      <SkeletonBase
        width={imageSize}
        height={imageSize}
        borderRadius={config.cardBorderRadius}
      />

      {/* Content skeleton */}
      <View style={[styles.content, { marginLeft: isTablet ? 16 : 14 }]}>
        {/* Product name - two lines */}
        <SkeletonBase width="85%" height={isTablet ? 16 : 14} />
        <View style={{ height: 4 }} />
        <SkeletonBase width="60%" height={isTablet ? 16 : 14} />

        {/* Brand */}
        <View style={{ marginTop: 8 }}>
          <SkeletonBase width="35%" height={isTablet ? 12 : 10} />
        </View>

        {/* Price */}
        <View style={{ marginTop: 10 }}>
          <SkeletonBase width="30%" height={isTablet ? 20 : 18} />
        </View>

        {/* Quantity controls */}
        <View style={styles.actionsRow}>
          <SkeletonBase
            width={isTablet ? 120 : 108}
            height={isTablet ? 42 : 38}
            borderRadius={isTablet ? 12 : 10}
          />
          <SkeletonBase
            width={isTablet ? 40 : 36}
            height={isTablet ? 40 : 36}
            borderRadius={(isTablet ? 40 : 36) / 2}
          />
        </View>
      </View>
    </View>
  )
}

export default CartItemSkeleton

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: AppColors.background.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: AppColors.gray[100],
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
})
