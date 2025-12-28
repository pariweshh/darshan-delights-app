import ProductCard from "@/src/components/product/ProductCard"
import { useResponsive } from "@/src/hooks/useResponsive"
import { Product } from "@/src/types"
import { memo, useCallback } from "react"
import { FlatList, StyleSheet } from "react-native"

interface ProductHorizontalListProps {
  products: Product[]
  loading?: boolean
}

const ProductHorizontalList: React.FC<ProductHorizontalListProps> = ({
  products,
  loading,
}) => {
  const { config, isTablet } = useResponsive()
  const cardWidth = isTablet ? 180 : 160

  // Memoize renderItem
  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        product={item}
        customStyle={{ width: cardWidth, marginRight: config.gap }}
      />
    ),
    [cardWidth, config.gap]
  )

  // Memoize keyExtractor
  const keyExtractor = useCallback((item: Product) => item.id.toString(), [])

  // Memoize getItemLayout for fixed-width items
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: cardWidth + config.gap,
      offset: (cardWidth + config.gap) * index,
      index,
    }),
    [cardWidth, config.gap]
  )

  if (!products || products.length === 0) {
    return null
  }

  return (
    <FlatList
      data={products}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      getItemLayout={getItemLayout}
      removeClippedSubviews={true}
      maxToRenderPerBatch={5}
      initialNumToRender={4}
      windowSize={3}
      updateCellsBatchingPeriod={50}
    />
  )
}

export default memo(ProductHorizontalList)

const styles = StyleSheet.create({
  listContent: {
    paddingRight: 16,
  },
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
})
