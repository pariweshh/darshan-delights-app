import ProductCard from "@/src/components/product/ProductCard"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { Product } from "@/src/types"
import { memo, useCallback } from "react"
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native"

interface ProductGridProps {
  products: Product[]
  loading?: boolean
  saleCard?: boolean
  emptyMessage?: string
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading,
  saleCard = false,
  emptyMessage = "No products found",
}) => {
  const { config, width } = useResponsive()

  const columns = config.productGridColumns
  const gap = config.gap
  const totalGap = gap * (columns - 1)
  const availableWidth = width - config.horizontalPadding * 2
  const itemWidth = (availableWidth - totalGap) / columns

  // Memoize renderItem
  const renderItem = useCallback(
    ({ item, index }: { item: Product; index: number }) => {
      const isLastInRow = (index + 1) % columns === 0
      const marginRight = isLastInRow ? 0 : gap

      return (
        <View style={{ width: itemWidth, marginRight, marginBottom: gap }}>
          <ProductCard
            product={item}
            saleCard={saleCard}
            customStyle={{ width: "100%" }}
          />
        </View>
      )
    },
    [columns, gap, itemWidth, saleCard]
  )

  // Memoize keyExtractor
  const keyExtractor = useCallback((item: Product) => item.id.toString(), [])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={AppColors.primary[500]} />
      </View>
    )
  }

  if (!products || products.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { fontSize: config.bodyFontSize }]}>
          {emptyMessage}
        </Text>
      </View>
    )
  }

  return (
    // <View style={[styles.grid, { gap }]}>
    //   {products.map((product) => (
    //     <View key={product.id} style={{ width: itemWidth }}>
    //       <ProductCard
    //         product={product}
    //         saleCard={saleCard}
    //         customStyle={{ width: "100%" }}
    //       />
    //     </View>
    //   ))}
    // </View>
    <FlatList
      data={products}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      numColumns={columns}
      key={`grid-${columns}`}
      scrollEnabled={false} // Since this is usually inside a ScrollView
      showsVerticalScrollIndicator={false}
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={6}
      initialNumToRender={6}
      windowSize={3}
    />
  )
}

export default memo(ProductGrid)

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
  },
})
