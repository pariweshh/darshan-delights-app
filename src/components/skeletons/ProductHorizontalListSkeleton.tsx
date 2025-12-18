import { ScrollView, StyleSheet, View } from "react-native"

import { useResponsive } from "@/src/hooks/useResponsive"
import ProductCardSkeleton from "./ProductCardSkeleton"

interface ProductHorizontalListSkeletonProps {
  count?: number
}

const ProductHorizontalListSkeleton: React.FC<
  ProductHorizontalListSkeletonProps
> = ({ count }) => {
  const { config, isTablet, isLandscape } = useResponsive()

  const itemCount = count || (isTablet ? (isLandscape ? 5 : 4) : 3)
  const itemWidth = isTablet ? 180 : 150

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEnabled={false}
      contentContainerStyle={styles.container}
    >
      {Array.from({ length: itemCount }).map((_, index) => (
        <View
          key={`product-horizontal-skeleton-${index}`}
          style={{ width: itemWidth, marginRight: config.gap }}
        >
          <ProductCardSkeleton />
        </View>
      ))}
    </ScrollView>
  )
}

export default ProductHorizontalListSkeleton

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
})
