import { useRouter } from "expo-router"
import { useCallback, useEffect, useMemo, useState } from "react"
import { FlatList, Image, StyleSheet, Text, View } from "react-native"

import { getUserOrders } from "@/src/api/orders"
import EmptyState from "@/src/components/common/EmptyState"
import Loader from "@/src/components/common/Loader"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"
import { CartItem, Order } from "@/src/types"

export default function PurchasedBeforeScreen() {
  const router = useRouter()
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

  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => (
      <DebouncedTouchable
        onPress={() => router.push(`/product/${item.product_id}`)}
        style={styles.productCard}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.cover }}
          style={styles.productImage}
          resizeMode="contain"
        />
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productPrice}>${item.unit_price?.toFixed(2)}</Text>
      </DebouncedTouchable>
    ),
    [router]
  )

  const keyExtractor = useCallback(
    (item: CartItem) => item.product_id.toString(),
    []
  )

  if (loading) {
    return <Loader fullScreen text="Loading your purchases..." />
  }

  if (products.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          type="orders"
          message="No previous purchases"
          subMessage="Products you've ordered before will appear here for easy reordering"
          actionLabel="Start Shopping"
          onAction={() => router.push("/(tabs)/home")}
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListFooterComponent={() => <View style={{ height: 60 }} />}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.secondary,
  },
  listContent: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  productCard: {
    width: "48%",
    backgroundColor: AppColors.background.primary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  productImage: {
    width: "100%",
    height: 120,
    marginBottom: 8,
  },
  productName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.text.primary,
    textTransform: "capitalize",
    marginBottom: 4,
    lineHeight: 18,
  },
  productPrice: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: AppColors.primary[600],
  },
})
