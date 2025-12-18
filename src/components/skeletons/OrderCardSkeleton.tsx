import { StyleSheet, View } from "react-native"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { SkeletonBase } from "./SkeletonBase"

const OrderCardSkeleton: React.FC = () => {
  const { config, isTablet } = useResponsive()

  return (
    <View
      style={[
        styles.container,
        {
          padding: isTablet ? 18 : 16,
          borderRadius: config.cardBorderRadius + 4,
          marginBottom: isTablet ? 16 : 14,
        },
      ]}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <SkeletonBase
            width={isTablet ? 100 : 90}
            height={isTablet ? 18 : 16}
          />
          <View style={{ height: 6 }} />
          <SkeletonBase
            width={isTablet ? 140 : 120}
            height={isTablet ? 14 : 12}
          />
        </View>
        <SkeletonBase
          width={isTablet ? 90 : 80}
          height={isTablet ? 28 : 26}
          borderRadius={isTablet ? 14 : 13}
        />
      </View>

      {/* Divider */}
      <View style={[styles.divider, { marginVertical: isTablet ? 14 : 12 }]} />

      {/* Products Preview */}
      <View style={styles.productsRow}>
        {[1, 2, 3].map((_, index) => (
          <SkeletonBase
            key={`product-${index}`}
            width={isTablet ? 56 : 48}
            height={isTablet ? 56 : 48}
            borderRadius={isTablet ? 10 : 8}
            style={{ marginRight: 8 }}
          />
        ))}
        <SkeletonBase
          width={isTablet ? 36 : 32}
          height={isTablet ? 56 : 48}
          borderRadius={isTablet ? 10 : 8}
        />
      </View>

      {/* Footer Row */}
      <View style={[styles.footerRow, { marginTop: isTablet ? 14 : 12 }]}>
        <View>
          <SkeletonBase width={60} height={isTablet ? 12 : 10} />
          <View style={{ height: 4 }} />
          <SkeletonBase
            width={isTablet ? 80 : 70}
            height={isTablet ? 20 : 18}
          />
        </View>
        <SkeletonBase
          width={isTablet ? 130 : 110}
          height={isTablet ? 44 : 40}
          borderRadius={isTablet ? 12 : 10}
        />
      </View>
    </View>
  )
}

export default OrderCardSkeleton

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {},
  divider: {
    height: 1,
    backgroundColor: AppColors.gray[100],
  },
  productsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
})
