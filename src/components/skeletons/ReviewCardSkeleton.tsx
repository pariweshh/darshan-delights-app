import { StyleSheet, View } from "react-native"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { SkeletonBase } from "./SkeletonBase"

const ReviewCardSkeleton: React.FC = () => {
  const { config, isTablet } = useResponsive()

  const productImageSize = isTablet ? 56 : 50
  const cardPadding = isTablet ? 18 : 16

  return (
    <View
      style={[
        styles.container,
        {
          padding: cardPadding,
          borderRadius: config.cardBorderRadius,
          marginBottom: isTablet ? 14 : 12,
        },
      ]}
    >
      {/* Product Info Row */}
      <View style={[styles.productRow, { paddingBottom: isTablet ? 14 : 12 }]}>
        <SkeletonBase
          width={productImageSize}
          height={productImageSize}
          borderRadius={isTablet ? 10 : 8}
        />
        <View
          style={[styles.productDetails, { marginLeft: isTablet ? 14 : 12 }]}
        >
          <SkeletonBase width="80%" height={isTablet ? 16 : 14} />
          <View style={{ height: 6 }} />
          <SkeletonBase width="40%" height={isTablet ? 12 : 10} />
        </View>
        <SkeletonBase width={20} height={20} borderRadius={10} />
      </View>

      {/* Rating Row */}
      <View style={[styles.ratingRow, { marginBottom: isTablet ? 10 : 8 }]}>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((_, index) => (
            <SkeletonBase
              key={`star-${index}`}
              width={isTablet ? 16 : 14}
              height={isTablet ? 16 : 14}
              borderRadius={2}
              style={{ marginRight: 4 }}
            />
          ))}
        </View>
        <SkeletonBase
          width={isTablet ? 100 : 90}
          height={isTablet ? 18 : 16}
          borderRadius={9}
        />
      </View>

      {/* Title */}
      <SkeletonBase
        width="60%"
        height={isTablet ? 16 : 14}
        style={{ marginBottom: isTablet ? 8 : 6 }}
      />

      {/* Message - multiple lines */}
      <SkeletonBase
        width="100%"
        height={isTablet ? 14 : 13}
        style={{ marginBottom: 4 }}
      />
      <SkeletonBase
        width="90%"
        height={isTablet ? 14 : 13}
        style={{ marginBottom: 4 }}
      />
      <SkeletonBase width="70%" height={isTablet ? 14 : 13} />

      {/* Actions Row */}
      <View
        style={[
          styles.actionsRow,
          { marginTop: isTablet ? 14 : 12, paddingTop: isTablet ? 14 : 12 },
        ]}
      >
        <SkeletonBase width={60} height={isTablet ? 20 : 18} borderRadius={4} />
        <SkeletonBase width={60} height={isTablet ? 20 : 18} borderRadius={4} />
      </View>
    </View>
  )
}

export default ReviewCardSkeleton

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  productDetails: {
    flex: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  starsRow: {
    flexDirection: "row",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
  },
})
