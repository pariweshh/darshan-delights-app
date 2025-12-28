import { getUserOrders } from "@/src/api/orders"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"
import { CartItem, Order } from "@/src/types"
import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useMemo, useState } from "react"
import { FlatList, StyleSheet, Text, View } from "react-native"
import DebouncedTouchable from "../ui/DebouncedTouchable"
const PurchasedBeforeList = () => {
  const router = useRouter()
  const { config, isTablet } = useResponsive()
  const { user, token } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])

  // Extract unique products from all orders
  const products = useMemo(() => {
    if (!orders.length) return []

    const allProducts = orders.flatMap((order) => order?.orders?.products || [])

    // Remove duplicates based on product_id
    const uniqueProducts = allProducts.filter(
      (product, index, self) =>
        index === self.findIndex((p) => p.product_id === product.product_id)
    )

    return uniqueProducts
  }, [orders])

  const fetchOrders = useCallback(async () => {
    if (!user?.id || !token) return

    setLoading(true)
    try {
      const data = await getUserOrders(token)
      setOrders(data?.orders || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, token])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleProductPress = (item: CartItem) => {
    router.push({
      pathname: "/product/[id]",
      params: { id: item.product_id.toString() },
    })
  }

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`
  }

  const cardWidth = isTablet ? 160 : 140
  const imageHeight = isTablet ? 140 : 120

  const renderProduct = useCallback(
    ({ item }: { item: CartItem }) => (
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
            contentFit="contain"
          />
        </View>
        <View style={[styles.productInfo, { padding: isTablet ? 12 : 10 }]}>
          <Text
            style={[styles.productName, { fontSize: config.smallFontSize }]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          {/* <View style={styles.priceContainer}>
            <Text style={[styles.price, { fontSize: config.bodyFontSize }]}>
              {formatPrice(item.unit_price)}
            </Text>
          </View> */}
        </View>
      </DebouncedTouchable>
    ),
    [router]
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header]}>
        <View style={styles.headerLeft}>
          <Ionicons
            name="time-outline"
            size={config.iconSize}
            color={AppColors.primary[600]}
          />
          <Text
            style={[styles.headerTitle, { fontSize: config.titleFontSize }]}
          >
            Purchased Before
          </Text>
        </View>
      </View>

      {/* Product list */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.product_id.toString()}
        renderItem={renderProduct}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 10 }}
        ItemSeparatorComponent={() => <View style={{ width: config.gap }} />}
      />
    </View>
  )
}
export default PurchasedBeforeList
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
  productCard: {
    backgroundColor: AppColors.background.primary,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: AppColors.gray[100],
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
