import ProductCard from "@/src/components/product/ProductCard"
import AppColors from "@/src/constants/Colors"
import { IsIPAD } from "@/src/themes/app.constants"
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
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    )
  }

  return (
    <View style={styles.grid}>
      {products.map((product) => (
        <View key={product.id} style={styles.productContainer}>
          <ProductCard
            product={product}
            saleCard={saleCard}
            customStyle={styles.productCard}
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
    justifyContent: "space-between",
  },
  productContainer: {
    width: IsIPAD ? "32%" : "48%",
  },
  productCard: {
    width: "100%",
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
    fontSize: 14,
    color: AppColors.text.tertiary,
  },
})
