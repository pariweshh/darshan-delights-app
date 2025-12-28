import { FontAwesome, Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { memo, useCallback, useState } from "react"
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native"
import Toast from "react-native-toast-message"

import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"
import { useCartStore } from "@/src/store/cartStore"
import { useFavoritesStore } from "@/src/store/favoritesStore"
import { Product } from "@/src/types"
import DebouncedTouchable from "../ui/DebouncedTouchable"

interface ProductCardProps {
  product: Product
  compact?: boolean
  customStyle?: StyleProp<ViewStyle>
  saleCard?: boolean
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  compact = false,
  customStyle,
  saleCard = false,
}) => {
  const router = useRouter()
  const { config, isTablet } = useResponsive()
  const [loading, setLoading] = useState(false)

  const addItem = useCartStore((state) => state.addItem)
  const error = useCartStore((state) => state.error)
  const getItemQuantityInCart = useCartStore(
    (state) => state.getItemQuantityInCart
  )

  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)

  const favoriteProducts = useFavoritesStore(
    (state) => state.favoriteList?.products
  )
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite)

  const isFav = favoriteProducts?.some((p) => p.id === product.id) ?? false
  const currentQuantityInCart = getItemQuantityInCart?.(product.id) || 0
  const isOutOfStock = product?.stock === 0
  const isMaxQuantityInCart = currentQuantityInCart >= (product?.stock || 0)
  const canAddToCart = !isOutOfStock && !isMaxQuantityInCart

  const discountPercentage = product?.sale_price
    ? Math.round(((product.rrp - product.sale_price) / product.rrp) * 100)
    : 0

  const handleAddToCart = useCallback(async () => {
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
    const price = product?.sale_price || product?.rrp
    const data = {
      product_id: product?.id,
      user_id: parseInt(user?.id?.toString() ?? "0"),
      quantity: 1,
      amount: price,
      name: product?.name,
      cover: product?.cover?.url,
      slug: product?.slug,
      unit_price: price,
      publishedAt: new Date(),
      brand: product?.brand?.name,
      weight: product?.weight_in_grams,
    }

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
  }, [token, canAddToCart, isOutOfStock, product, user?.id, addItem, error])

  const handleToggleFavorite = useCallback(() => {
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
  }, [token, toggleFavorite, product.id])

  const handleProductRoute = useCallback(() => {
    router.push(`/product/${product?.id}`)
  }, [router, product?.id])

  const getButtonText = useCallback(() => {
    if (loading) return "Adding..."
    if (isOutOfStock) return "Out of stock"
    if (isMaxQuantityInCart) return "Max in cart"
    return "Add to cart"
  }, [loading, isOutOfStock, isMaxQuantityInCart])

  // Responsive sizes
  const imageHeight = config.imageHeight
  const favButtonSize = isTablet ? 36 : 32
  const favIconSize = isTablet ? 18 : 16

  return (
    <DebouncedTouchable
      onPress={handleProductRoute}
      style={[
        styles.card,
        compact && styles.compactCard,
        { borderRadius: config.cardBorderRadius },
        customStyle,
      ]}
      activeOpacity={0.8}
    >
      {/* Sale Badge */}
      {saleCard && (
        <View style={styles.saleBadgeContainer}>
          <View style={styles.saleBadge}>
            <Text
              style={[
                styles.saleBadgeText,
                { fontSize: config.smallFontSize - 2 },
              ]}
            >
              SALE
            </Text>
          </View>
        </View>
      )}

      {/* Discount Badge */}
      {discountPercentage > 0 && !saleCard && (
        <View style={styles.discountBadge}>
          <Text
            style={[
              styles.discountText,
              { fontSize: config.smallFontSize - 2 },
            ]}
          >
            -{discountPercentage}%
          </Text>
        </View>
      )}

      {/* Image Container */}
      <View style={[styles.imageContainer, { height: imageHeight }]}>
        <Image
          source={{ uri: product?.cover?.url }}
          style={styles.image}
          contentFit="contain"
          transition={200}
          cachePolicy={"memory-disk"}
          recyclingKey={`product-${product?.id}`}
        />

        {/* Favorite Button */}
        <DebouncedTouchable
          onPress={handleToggleFavorite}
          style={[
            styles.favoriteButton,
            isFav && styles.activeFavoriteButton,
            {
              width: favButtonSize,
              height: favButtonSize,
              borderRadius: favButtonSize / 2,
            },
          ]}
          activeOpacity={0.7}
        >
          <FontAwesome
            name={isFav ? "heart" : "heart-o"}
            size={favIconSize}
            color={isFav ? "white" : AppColors.gray[600]}
          />
        </DebouncedTouchable>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text
              style={[
                styles.outOfStockText,
                { fontSize: config.smallFontSize },
              ]}
            >
              Out of Stock
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={[styles.content, { padding: isTablet ? 14 : 12 }]}>
        {/* Category */}
        {product?.categories?.[0]?.name && (
          <Text
            style={[styles.category, { fontSize: config.smallFontSize - 1 }]}
            numberOfLines={1}
          >
            {product.categories[0].name}
          </Text>
        )}

        {/* Title */}
        <Text
          style={[styles.title, { fontSize: config.bodyFontSize }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {product?.name}
        </Text>

        {/* Price */}
        <View style={styles.priceContainer}>
          {product?.sale_price ? (
            <>
              <Text
                style={[
                  styles.salePrice,
                  { fontSize: config.subtitleFontSize + 2 },
                ]}
              >
                ${product.sale_price.toFixed(2)}
              </Text>
              <Text
                style={[
                  styles.originalPrice,
                  { fontSize: config.smallFontSize },
                ]}
              >
                ${product.rrp.toFixed(2)}
              </Text>
            </>
          ) : (
            <Text
              style={[styles.price, { fontSize: config.subtitleFontSize + 2 }]}
            >
              ${product?.rrp?.toFixed(2)}
            </Text>
          )}
        </View>

        {/* Add to Cart Button (non-compact only) */}
        {!compact && (
          <Button
            title={getButtonText()}
            size="small"
            variant={canAddToCart ? "primary" : "outline"}
            onPress={handleAddToCart}
            disabled={loading || !canAddToCart}
            loading={loading}
            containerStyles="mt-2"
            icon={
              canAddToCart ? (
                <Ionicons
                  name="cart-outline"
                  size={config.iconSizeSmall}
                  color="white"
                />
              ) : undefined
            }
          />
        )}
      </View>
    </DebouncedTouchable>
  )
}

export default memo(ProductCard)

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.background.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppColors.gray[100],
  },
  compactCard: {
    width: 160,
    marginRight: 12,
  },
  saleBadgeContainer: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 10,
  },
  saleBadge: {
    backgroundColor: AppColors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  saleBadgeText: {
    fontFamily: "Poppins_700Bold",
    color: "white",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: AppColors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  discountText: {
    fontFamily: "Poppins_600SemiBold",
    color: "white",
  },
  imageContainer: {
    position: "relative",
    backgroundColor: AppColors.gray[50],
    padding: 8,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeFavoriteButton: {
    backgroundColor: AppColors.error,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  outOfStockText: {
    fontFamily: "Poppins_600SemiBold",
    color: "white",
    backgroundColor: AppColors.error,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  content: {},
  category: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
    textTransform: "capitalize",
    marginBottom: 2,
  },
  title: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
    textTransform: "capitalize",
    marginBottom: 6,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  price: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.primary[600],
  },
  salePrice: {
    fontFamily: "Poppins_700Bold",
    color: AppColors.error,
  },
  originalPrice: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
    textDecorationLine: "line-through",
  },
})
