import { AntDesign, Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import Toast from "react-native-toast-message"

import { getProductById } from "@/src/api/products"
import AppColors from "@/src/constants/Colors"
import { useCartStore } from "@/src/store/cartStore"
import { CartItem } from "@/src/types"

interface CartItemCardProps {
  item: CartItem
  token: string
  userId: number | string
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item, token, userId }) => {
  const router = useRouter()
  const { updateQuantity, removeItem } = useCartStore()

  const [loading, setLoading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [maxStock, setMaxStock] = useState<number | null>(null)

  const isAtMaxStock = maxStock !== null && item.quantity >= maxStock
  const totalPrice = (item.unit_price * item.quantity).toFixed(2)

  const handlePress = () => {
    router.push(`/product/${item.product_id}`)
  }

  const handleUpdateQuantity = async (
    newQuantity: number,
    newWeight?: number
  ) => {
    if (!token || !item.basket_item_id) return

    const data = {
      product_id: item.product_id,
      user_id: userId,
      quantity: newQuantity,
      amount: newQuantity * Number(item.unit_price),
      name: item.name,
      cover: item.cover,
      unit_price: item.unit_price,
      slug: item.slug,
      weight: newWeight ?? item.weight,
    }

    const res = await updateQuantity(item.basket_item_id, data, token)

    if (!res?.basket_item_id) {
      Toast.show({
        type: "error",
        text1: "Update failed",
        text2: "Unable to update quantity. Please try again.",
        visibilityTime: 2000,
      })
    }
  }

  const handleIncreaseQuantity = async () => {
    if (loading) return

    setLoading(true)
    try {
      const product = await getProductById(item.product_id)
      setMaxStock(product.stock)

      if (item.quantity >= product.stock) {
        Toast.show({
          type: "info",
          text1: "Maximum stock reached",
          text2: "No more stock available for this product",
          visibilityTime: 2000,
        })
        return
      }

      const newQuantity = item.quantity + 1
      const newWeight = product.weight_in_grams * newQuantity
      await handleUpdateQuantity(newQuantity, newWeight)
    } catch (error) {
      console.error("Error increasing quantity:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update quantity",
        visibilityTime: 2000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDecreaseQuantity = async () => {
    if (loading) return

    setLoading(true)
    try {
      if (item.quantity > 1) {
        const product = await getProductById(item.product_id)
        const newQuantity = item.quantity - 1
        const newWeight = product.weight_in_grams * newQuantity
        await handleUpdateQuantity(newQuantity, newWeight)
      } else {
        // Remove item if quantity is 1
        await handleRemoveItem()
      }
    } catch (error) {
      console.error("Error decreasing quantity:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveItem = async () => {
    if (!userId) return
    Alert.alert(
      "Remove Item",
      `Are you sure you want to remove "${item.name}" from your cart?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setRemoving(true)
            try {
              const res = await removeItem(
                item.basket_item_id ?? null,
                userId,
                token
              )

              if (res?.product_id) {
                Toast.show({
                  type: "success",
                  text1: "Item removed",
                  text2: `${item.name} has been removed from your cart`,
                  visibilityTime: 2000,
                })
              }
            } catch (error) {
              console.error("Error removing item:", error)
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to remove item",
                visibilityTime: 2000,
              })
            } finally {
              setRemoving(false)
            }
          },
        },
      ]
    )
  }

  if (removing) {
    return (
      <View style={[styles.container, styles.removingContainer]}>
        <ActivityIndicator size="small" color={AppColors.primary[500]} />
        <Text style={styles.removingText}>Removing...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Product Image */}
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.cover }}
          style={styles.image}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Product Details */}
      <View style={styles.details}>
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
        </TouchableOpacity>

        {item.brand && <Text style={styles.brand}>{item.brand}</Text>}

        <Text style={styles.price}>${totalPrice}</Text>

        {/* Quantity Controls */}
        <View style={styles.actionsRow}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={handleDecreaseQuantity}
              disabled={loading}
              activeOpacity={0.7}
            >
              {item.quantity === 1 ? (
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={AppColors.error}
                />
              ) : (
                <AntDesign
                  name="minus"
                  size={16}
                  color={AppColors.text.primary}
                />
              )}
            </TouchableOpacity>

            <View style={styles.quantityDisplay}>
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={AppColors.primary[500]}
                />
              ) : (
                <Text style={styles.quantity}>{item.quantity}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.quantityButton,
                isAtMaxStock && styles.quantityButtonDisabled,
              ]}
              onPress={handleIncreaseQuantity}
              disabled={loading || isAtMaxStock}
              activeOpacity={0.7}
            >
              <AntDesign
                name="plus"
                size={16}
                color={
                  isAtMaxStock ? AppColors.gray[400] : AppColors.text.primary
                }
              />
            </TouchableOpacity>
          </View>

          {/* Remove Button */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemoveItem}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={AppColors.gray[500]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default CartItemCard

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: AppColors.background.primary,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: AppColors.gray[100],
  },
  removingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.6,
    gap: 8,
  },
  removingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  imageContainer: {
    width: 90,
    height: 90,
    backgroundColor: AppColors.gray[50],
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 14,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  details: {
    flex: 1,
    justifyContent: "space-between",
  },
  name: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: AppColors.text.primary,
    textTransform: "capitalize",
    lineHeight: 20,
    marginBottom: 2,
  },
  brand: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.tertiary,
    textTransform: "capitalize",
    marginBottom: 4,
  },
  price: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: AppColors.primary[600],
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.secondary,
    borderRadius: 10,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: AppColors.background.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonDisabled: {
    backgroundColor: AppColors.gray[100],
  },
  quantityDisplay: {
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  quantity: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.text.primary,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
})
