import ProductCard from "@/src/components/product/ProductCard"
import AppColors from "@/src/constants/Colors"
import { Product } from "@/src/types"
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native"

interface ProductHorizontalListProps {
  products: Product[]
  loading?: boolean
}

const ProductHorizontalList: React.FC<ProductHorizontalListProps> = ({
  products,
  loading,
}) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={AppColors.primary[500]} />
      </View>
    )
  }

  if (!products || products.length === 0) {
    return null
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id.toString()}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <ProductCard
          product={item}
          customStyle={{ width: 160, marginRight: 12 }}
        />
      )}
    />
  )
}

export default ProductHorizontalList

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
