import { StyleSheet, View } from "react-native"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { SkeletonBase } from "./SkeletonBase"

interface ProductCardSkeletonProps {
  variant?: "default" | "large"
}

const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({
  variant = "default",
}) => {
  const { config, isTablet } = useResponsive()

  const isLarge = variant === "large"

  // Dimensions based on variant and device
  const imageHeight = isLarge ? 160 : isTablet ? 140 : 120
  const cardPadding = isTablet ? 14 : 12
  const titleHeight = isTablet ? 16 : 14
  const priceHeight = isTablet ? 20 : 18
  const brandHeight = isTablet ? 12 : 10

  if (isLarge) {
    // Large variant - horizontal card for phones
    return (
      <View
        style={[
          styles.largeContainer,
          {
            padding: cardPadding,
            borderRadius: config.cardBorderRadius,
          },
        ]}
      >
        {/* Image skeleton */}
        <SkeletonBase
          width={120}
          height={imageHeight}
          borderRadius={config.cardBorderRadius - 2}
        />

        {/* Content skeleton */}
        <View style={styles.largeContent}>
          {/* Brand */}
          <SkeletonBase width="40%" height={brandHeight} />

          {/* Title - two lines */}
          <View style={{ marginTop: 10 }}>
            <SkeletonBase width="90%" height={titleHeight} />
            <View style={{ height: 6 }} />
            <SkeletonBase width="65%" height={titleHeight} />
          </View>

          {/* Price */}
          <View style={{ marginTop: 14 }}>
            <SkeletonBase width="35%" height={priceHeight} />
          </View>
        </View>
      </View>
    )
  }

  // Default variant - vertical card for grid
  return (
    <View
      style={[
        styles.container,
        {
          padding: cardPadding,
          borderRadius: config.cardBorderRadius,
        },
      ]}
    >
      {/* Image skeleton */}
      <SkeletonBase
        width="100%"
        height={imageHeight}
        borderRadius={config.cardBorderRadius - 2}
      />

      {/* Brand skeleton */}
      <View style={{ marginTop: isTablet ? 12 : 10 }}>
        <SkeletonBase width="40%" height={brandHeight} />
      </View>

      {/* Title skeleton - two lines */}
      <View style={{ marginTop: 8 }}>
        <SkeletonBase width="85%" height={titleHeight} />
        <View style={{ height: 4 }} />
        <SkeletonBase width="55%" height={titleHeight} />
      </View>

      {/* Price skeleton */}
      <View style={{ marginTop: 10 }}>
        <SkeletonBase width="45%" height={priceHeight} />
      </View>
    </View>
  )
}

export default ProductCardSkeleton

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: AppColors.gray[100],
  },
  largeContainer: {
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
  largeContent: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
})
