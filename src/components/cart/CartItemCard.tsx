import { AntDesign, Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useState } from "react"
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native"
import Toast from "react-native-toast-message"

import { getProductById } from "@/src/api/products"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useCartStore } from "@/src/store/cartStore"
import { CartItem } from "@/src/types"
import { Image } from "expo-image"
import DebouncedTouchable from "../ui/DebouncedTouchable"

interface CartItemCardProps {
  item: CartItem
  token: string
  userId: number | string
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item, token, userId }) => {
  const router = useRouter()
  const { config, isTablet } = useResponsive()
  const { updateQuantity, removeItem } = useCartStore()

  const [loading, setLoading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [maxStock, setMaxStock] = useState<number | null>(null)

  const isAtMaxStock = maxStock !== null && item.quantity >= maxStock
  const totalPrice = (item.unit_price * item.quantity).toFixed(2)

  const imageSize = isTablet ? 100 : 90
  const quantityButtonSize = isTablet ? 36 : 32
  const removeButtonSize = isTablet ? 40 : 36

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
      <View
        style={[
          styles.container,
          styles.removingContainer,
          {
            padding: isTablet ? 18 : 16,
            borderRadius: config.cardBorderRadius + 4,
          },
        ]}
      >
        <ActivityIndicator size="small" color={AppColors.primary[500]} />
        <Text style={[styles.removingText, { fontSize: config.bodyFontSize }]}>
          Removing...
        </Text>
      </View>
    )
  }

  return (
    <View
      style={[
        styles.container,
        {
          padding: isTablet ? 18 : 16,
          borderRadius: config.cardBorderRadius + 4,
          marginBottom: config.gap,
        },
      ]}
    >
      {/* Product Image */}
      <DebouncedTouchable
        style={[
          styles.imageContainer,
          {
            width: imageSize,
            height: imageSize,
            borderRadius: config.cardBorderRadius,
            marginRight: isTablet ? 16 : 14,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.cover }}
          style={styles.image}
          contentFit="contain"
        />
      </DebouncedTouchable>

      {/* Product Details */}
      <View style={styles.details}>
        <DebouncedTouchable onPress={handlePress} activeOpacity={0.8}>
          <Text
            style={[
              styles.name,
              {
                fontSize: config.bodyFontSize,
                lineHeight: config.bodyFontSize * 1.35,
              },
            ]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
        </DebouncedTouchable>

        {item.brand && (
          <Text style={[styles.brand, { fontSize: config.smallFontSize }]}>
            {item.brand}
          </Text>
        )}

        <Text style={[styles.price, { fontSize: isTablet ? 20 : 18 }]}>
          ${totalPrice}
        </Text>

        {/* Quantity Controls */}
        <View style={styles.actionsRow}>
          <View
            style={[
              styles.quantityContainer,
              {
                padding: isTablet ? 5 : 4,
                borderRadius: isTablet ? 12 : 10,
              },
            ]}
          >
            <DebouncedTouchable
              style={[
                styles.quantityButton,
                {
                  width: quantityButtonSize,
                  height: quantityButtonSize,
                  borderRadius: isTablet ? 10 : 8,
                },
              ]}
              onPress={handleDecreaseQuantity}
              disabled={loading}
              activeOpacity={0.7}
            >
              {item.quantity === 1 ? (
                <Ionicons
                  name="trash-outline"
                  size={config.iconSizeSmall}
                  color={AppColors.error}
                />
              ) : (
                <AntDesign
                  name="minus"
                  size={config.iconSizeSmall}
                  color={AppColors.text.primary}
                />
              )}
            </DebouncedTouchable>

            <View
              style={[styles.quantityDisplay, { minWidth: isTablet ? 48 : 40 }]}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={AppColors.primary[500]}
                />
              ) : (
                <Text
                  style={[
                    styles.quantity,
                    { fontSize: config.subtitleFontSize },
                  ]}
                >
                  {item.quantity}
                </Text>
              )}
            </View>

            <DebouncedTouchable
              style={[
                styles.quantityButton,
                {
                  width: quantityButtonSize,
                  height: quantityButtonSize,
                  borderRadius: isTablet ? 10 : 8,
                },
                isAtMaxStock && styles.quantityButtonDisabled,
              ]}
              onPress={handleIncreaseQuantity}
              disabled={loading || isAtMaxStock}
              activeOpacity={0.7}
            >
              <AntDesign
                name="plus"
                size={config.iconSizeSmall}
                color={
                  isAtMaxStock ? AppColors.gray[400] : AppColors.text.primary
                }
              />
            </DebouncedTouchable>
          </View>

          {/* Remove Button */}
          <DebouncedTouchable
            style={[
              styles.removeButton,
              {
                width: removeButtonSize,
                height: removeButtonSize,
                borderRadius: removeButtonSize / 2,
              },
            ]}
            onPress={handleRemoveItem}
            activeOpacity={0.7}
          >
            <Ionicons
              name="close"
              size={config.iconSize}
              color={AppColors.gray[500]}
            />
          </DebouncedTouchable>
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
    color: AppColors.text.secondary,
  },
  imageContainer: {
    backgroundColor: AppColors.gray[50],
    overflow: "hidden",
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
    color: AppColors.text.primary,
    textTransform: "capitalize",
    marginBottom: 2,
  },
  brand: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
    textTransform: "capitalize",
    marginBottom: 4,
  },
  price: {
    fontFamily: "Poppins_700Bold",
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
  },
  quantityButton: {
    backgroundColor: AppColors.background.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonDisabled: {
    backgroundColor: AppColors.gray[100],
  },
  quantityDisplay: {
    alignItems: "center",
    justifyContent: "center",
  },
  quantity: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  removeButton: {
    backgroundColor: AppColors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
})
