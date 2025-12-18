import ProductCard from "@/src/components/product/ProductCard"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { Product } from "@/src/types"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"

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
    <View style={[styles.grid, { gap }]}>
      {products.map((product) => (
        <View key={product.id} style={{ width: itemWidth }}>
          <ProductCard
            product={product}
            saleCard={saleCard}
            customStyle={{ width: "100%" }}
          />
        </View>
      ))}
    </View>
  )
}

export default ProductGrid

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
