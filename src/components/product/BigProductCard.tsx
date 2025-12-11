import { FontAwesome } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useState } from "react"
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import Toast from "react-native-toast-message"

import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"
import { useCartStore } from "@/src/store/cartStore"
import { useFavoritesStore } from "@/src/store/favoritesStore"
import {
  SCREEN_WIDTH,
  windowHeight,
  windowWidth,
} from "@/src/themes/app.constants"
import { Product } from "@/src/types"

interface BigProductCardProps {
  product: Product
  linkStyle?: StyleProp<ViewStyle>
  customStyle?: StyleProp<ViewStyle>
}

const BigProductCard: React.FC<BigProductCardProps> = ({
  product,
  linkStyle,
  customStyle,
}) => {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const { addItem, error, getItemQuantityInCart } = useCartStore()
  const { toggleFavorite, isFavorite } = useFavoritesStore()
  const [loading, setLoading] = useState(false)

  const isFav = isFavorite(product.id)
  const currentQuantityInCart = getItemQuantityInCart?.(product.id) || 0
  const isOutOfStock = product?.stock === 0
  const isMaxQuantityInCart = currentQuantityInCart >= (product?.stock || 0)
  const canAddToCart = !isOutOfStock && !isMaxQuantityInCart

  const savings = product?.sale_price
    ? (Number(product.rrp) - Number(product.sale_price)).toFixed(2)
    : null

  const displayPrice = product?.sale_price || product?.rrp

  const createItemData = (prod: Product) => {
    const price = prod?.sale_price || prod?.rrp
    return {
      product_id: prod?.id,
      user_id: parseInt(user?.id?.toString() ?? "0"),
      quantity: 1,
      amount: price,
      name: prod?.name,
      cover: prod?.cover?.url,
      slug: prod?.slug,
      unit_price: price,
      publishedAt: new Date(),
      brand: prod?.brand?.name,
      weight: prod?.weight_in_grams,
    }
  }

  const handleAddToCart = async () => {
    if (!token) {
      Toast.show({
        type: "error",
        text1: "Please login",
        text2: "You must be logged in to add items to your cart",
        visibilityTime: 2000,
      })
      return
    }

    if (!canAddToCart) {
      Toast.show({
        type: "error",
        text1: "Cannot add to cart",
        text2: isOutOfStock
          ? "This product is out of stock"
          : "Maximum available quantity already in cart",
        visibilityTime: 2000,
      })
      return
    }

    setLoading(true)
    const data = createItemData(product)

    try {
      const result = await addItem(data as any, token)

      if (result?.basket_item_id) {
        Toast.show({
          type: "success",
          text1: "Added to cart!",
          text2: `${product?.name} has been added to your cart`,
          visibilityTime: 2000,
        })
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to add to cart",
          text2: error || "Please try again",
          visibilityTime: 2000,
        })
      }
    } catch (err) {
      console.error("Error adding to cart:", err)
      Toast.show({
        type: "error",
        text1: "Failed to add to cart",
        text2: "Please try again",
        visibilityTime: 2000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFavorite = () => {
    if (!token) {
      Toast.show({
        type: "info",
        text1: "Login required",
        text2: "Please login to add favorites",
        visibilityTime: 2000,
      })
      return
    }
    toggleFavorite({ product_id: product.id }, token)
  }

  const handlePress = () => {
    router.push(`/product/${product?.id}`)
  }

  const getButtonText = () => {
    if (loading) return "Adding..."
    if (isOutOfStock) return "Out of Stock"
    if (isMaxQuantityInCart) return "Max in Cart"
    return "Add to Cart"
  }

  return (
    <View style={[styles.wrapper, linkStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        style={styles.container}
        activeOpacity={0.8}
      >
        <View style={[styles.content, customStyle]}>
          {/* Image Section */}
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: product?.cover?.url }}
                style={styles.image}
                resizeMode="contain"
              />

              {/* Out of Stock Overlay */}
              {isOutOfStock && (
                <View style={styles.outOfStockOverlay}>
                  <Text style={styles.outOfStockText}>Out of Stock</Text>
                </View>
              )}
            </View>

            {/* Favorite Button */}
            <TouchableOpacity
              style={[
                styles.favoriteButton,
                isFav && styles.favoriteButtonActive,
              ]}
              onPress={handleToggleFavorite}
              activeOpacity={0.7}
            >
              <FontAwesome
                name={isFav ? "heart" : "heart-o"}
                size={18}
                color={isFav ? "white" : AppColors.gray[500]}
              />
            </TouchableOpacity>
          </View>

          {/* Details Section */}
          <View style={styles.detailsSection}>
            <View style={styles.infoContainer}>
              {/* Product Name */}
              <Text style={styles.productName} numberOfLines={2}>
                {product?.name}
              </Text>

              {/* Price Section */}
              <View style={styles.priceRow}>
                <Text style={styles.currencySymbol}>$</Text>
                <Text style={styles.price}>{displayPrice}</Text>

                {savings && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>Save ${savings}</Text>
                  </View>
                )}
              </View>

              {/* Original Price */}
              {product?.sale_price && (
                <Text style={styles.originalPrice}>was ${product.rrp}</Text>
              )}
            </View>

            {/* Add to Cart Button */}
            <Button
              title={getButtonText()}
              onPress={handleAddToCart}
              loading={loading}
              disabled={loading || !canAddToCart}
              containerStyles="rounded-full"
              icon={
                canAddToCart ? (
                  <FontAwesome name="cart-plus" size={18} color="white" />
                ) : undefined
              }
            />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  )
}

export default BigProductCard

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  container: {
    backgroundColor: "white",
    borderRadius: 20,
    paddingVertical: windowHeight(10),
    paddingHorizontal: windowWidth(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  content: {
    flexDirection: "row",
    height: (SCREEN_WIDTH - 40) * 0.5,
    gap: 16,
  },
  imageSection: {
    flex: 1,
    position: "relative",
  },
  imageContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: AppColors.gray[50],
  },
  image: {
    width: "100%",
    height: "100%",
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  outOfStockText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "white",
    backgroundColor: AppColors.error,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  favoriteButtonActive: {
    backgroundColor: AppColors.error,
  },
  detailsSection: {
    flex: 2,
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  infoContainer: {
    gap: 6,
  },
  productName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.primary,
    textTransform: "capitalize",
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 2,
    marginTop: 4,
  },
  currencySymbol: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: AppColors.text.primary,
    marginTop: 4,
  },
  price: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: AppColors.text.primary,
    marginRight: 8,
  },
  savingsBadge: {
    backgroundColor: "#86efac",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },
  savingsText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#166534",
  },
  originalPrice: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.tertiary,
  },
})
