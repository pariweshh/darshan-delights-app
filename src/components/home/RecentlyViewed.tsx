import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import React from "react"
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"

import AppColors from "@/src/constants/Colors"
import { useRecentlyViewedStore } from "@/src/store/recentlyViewedStore"
import { RecentlyViewedProduct } from "@/src/types/recentlyViewed"

interface RecentlyViewedProps {
  excludeProductId?: number
  maxDisplay?: number
  showHeader?: boolean
}

const MAX_DISPLAY = 10

const RecentlyViewed: React.FC<RecentlyViewedProps> = ({
  excludeProductId,
  maxDisplay = MAX_DISPLAY,
  showHeader = true,
}) => {
  const router = useRouter()
  const { products, clearAll } = useRecentlyViewedStore()

  // Filter out the excluded product
  const displayProducts = products
    .filter((p) => p.id !== excludeProductId)
    .slice(0, maxDisplay)

  // Don't render if no products
  if (products.length === 0) {
    return null
  }

  const handleProductPress = (product: RecentlyViewedProduct) => {
    router.push({
      pathname: "/product/[id]",
      params: { id: product.id.toString() },
    })
  }

  //   const handleSeeAll = () => {
  //     router.push("/(tabs)/more/recently-viewed")
  //   }

  const handleClear = () => {
    clearAll()
  }

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`
  }

  const renderProduct = ({ item }: { item: RecentlyViewedProduct }) => {
    const hasDiscount = item.sale_price && item.sale_price < item.rrp

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.cover }}
            style={styles.productImage}
            resizeMode="contain"
          />
          {hasDiscount && (
            <View style={styles.saleBadge}>
              <Text style={styles.saleBadgeText}>Sale</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.priceContainer}>
            {hasDiscount ? (
              <>
                <Text style={styles.salePrice}>
                  {formatPrice(item.sale_price!)}
                </Text>
                <Text style={styles.originalPrice}>
                  {formatPrice(item.rrp)}
                </Text>
              </>
            ) : (
              <Text style={styles.price}>{formatPrice(item.rrp)}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingHorizontal: excludeProductId ? 16 : 0 },
        ]}
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name="time-outline"
            size={20}
            color={AppColors.primary[600]}
          />
          <Text style={styles.headerTitle}>Recently Viewed</Text>
        </View>
        {!excludeProductId && (
          <TouchableOpacity onPress={clearAll} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Products List */}
      <FlatList
        data={displayProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduct}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: excludeProductId ? 16 : 0 }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  )
}

export default RecentlyViewed

const styles = StyleSheet.create({
  container: {
    marginVertical: 0,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingRight: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: AppColors.text.primary,
  },
  seeAllText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.primary[600],
  },
  // List
  listContent: {
    // paddingHorizontal : 0,
  },
  separator: {
    width: 12,
  },
  // Product Card
  productCard: {
    width: 140,
    backgroundColor: AppColors.background.primary,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: "100%",
    height: 120,
    backgroundColor: AppColors.gray[50],
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  productImage: {
    width: "80%",
    height: "80%",
  },
  saleBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: AppColors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saleBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    color: "white",
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: AppColors.text.primary,
    textTransform: "capitalize",
    height: 34,
    lineHeight: 17,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  price: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.primary[600],
  },
  salePrice: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.error,
  },
  originalPrice: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: AppColors.text.tertiary,
    textDecorationLine: "line-through",
  },
})
