import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import React from "react"
import { FlatList, Image, StyleSheet, Text, View } from "react-native"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useRecentlyViewedStore } from "@/src/store/recentlyViewedStore"
import { RecentlyViewedProduct } from "@/src/types/recentlyViewed"
import DebouncedTouchable from "../ui/DebouncedTouchable"

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
  const { config, isTablet } = useResponsive()
  const { products, clearAll } = useRecentlyViewedStore()

  const displayProducts = products
    .filter((p) => p.id !== excludeProductId)
    .slice(0, maxDisplay)

  if (products.length === 0) {
    return null
  }

  const handleProductPress = (product: RecentlyViewedProduct) => {
    router.push({
      pathname: "/product/[id]",
      params: { id: product.id.toString() },
    })
  }

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`
  }

  const cardWidth = isTablet ? 160 : 140
  const imageHeight = isTablet ? 140 : 120

  const renderProduct = ({ item }: { item: RecentlyViewedProduct }) => {
    const hasDiscount = item.sale_price && item.sale_price < item.rrp

    return (
      <DebouncedTouchable
        style={[
          styles.productCard,
          { width: cardWidth, borderRadius: config.cardBorderRadius },
        ]}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.imageContainer,
            { height: imageHeight, borderRadius: config.cardBorderRadius },
          ]}
        >
          <Image
            source={{ uri: item.cover }}
            style={styles.productImage}
            resizeMode="contain"
          />
          {hasDiscount && (
            <View style={styles.saleBadge}>
              <Text
                style={[
                  styles.saleBadgeText,
                  { fontSize: config.smallFontSize - 2 },
                ]}
              >
                Sale
              </Text>
            </View>
          )}
        </View>
        <View style={[styles.productInfo, { padding: isTablet ? 12 : 10 }]}>
          <Text
            style={[styles.productName, { fontSize: config.smallFontSize }]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <View style={styles.priceContainer}>
            {hasDiscount ? (
              <>
                <Text
                  style={[styles.salePrice, { fontSize: config.bodyFontSize }]}
                >
                  {formatPrice(item.sale_price!)}
                </Text>
                <Text
                  style={[
                    styles.originalPrice,
                    { fontSize: config.smallFontSize - 1 },
                  ]}
                >
                  {formatPrice(item.rrp)}
                </Text>
              </>
            ) : (
              <Text style={[styles.price, { fontSize: config.bodyFontSize }]}>
                {formatPrice(item.rrp)}
              </Text>
            )}
          </View>
        </View>
      </DebouncedTouchable>
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
            size={config.iconSize}
            color={AppColors.primary[600]}
          />
          <Text
            style={[styles.headerTitle, { fontSize: config.titleFontSize }]}
          >
            Recently Viewed
          </Text>
        </View>
        {!excludeProductId && (
          <DebouncedTouchable onPress={clearAll} activeOpacity={0.7}>
            <Text
              style={[styles.seeAllText, { fontSize: config.subtitleFontSize }]}
            >
              Clear All
            </Text>
          </DebouncedTouchable>
        )}
      </View>

      {/* Products List */}
      <FlatList
        data={displayProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduct}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: excludeProductId ? 16 : 0,
          paddingBottom: 10,
        }}
        ItemSeparatorComponent={() => <View style={{ width: config.gap }} />}
      />
    </View>
  )
}

export default RecentlyViewed

const styles = StyleSheet.create({
  container: {
    marginVertical: 0,
  },
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
    color: AppColors.text.primary,
  },
  seeAllText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[600],
  },
  productCard: {
    backgroundColor: AppColors.background.primary,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: "100%",
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
    color: "white",
  },
  productInfo: {},
  productName: {
    fontFamily: "Poppins_500Medium",
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
    color: AppColors.primary[600],
  },
  salePrice: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.error,
  },
  originalPrice: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
    textDecorationLine: "line-through",
  },
})
