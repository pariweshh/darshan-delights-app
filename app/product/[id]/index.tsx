import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

import { getProductById, getProductBySlug } from "@/src/api/products"
import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"
import { useCartStore } from "@/src/store/cartStore"
import { useFavoritesStore } from "@/src/store/favoritesStore"
import { Product } from "@/src/types"

import {
  canUserReviewProduct,
  deleteReview,
  getProductReviews,
  getUserProductReview,
} from "@/src/api/reviews"
import Loader from "@/src/components/common/Loader"
import Wrapper from "@/src/components/common/Wrapper"
import RecentlyViewed from "@/src/components/home/RecentlyViewed"
import ImageCarousel from "@/src/components/product/ImageCarousel"
import ProductHeader from "@/src/components/product/ProductHeader"
import QuantitySelector from "@/src/components/product/QuantitySelector"
import Rating from "@/src/components/reviews/Rating"
import RatingSummary from "@/src/components/reviews/RatingSummary"
import ReviewCard from "@/src/components/reviews/ReviewCard"
import WriteReviewModal from "@/src/components/reviews/WriteReviewModal"
import Button from "@/src/components/ui/Button"
import { useRecentlyViewed } from "@/src/hooks/useRecentlyViewed"
import { Review, ReviewStats } from "@/src/types/review"
import { shareProduct } from "@/src/utils/share"

const { width: SCREEN_WIDTH } = Dimensions.get("window")
const MAX_DESCRIPTION_LENGTH = 150
const INITIAL_REVIEWS_COUNT = 3

export default function ProductDetailScreen() {
  const router = useRouter()
  const { id, isSlug } = useLocalSearchParams<{ id: string; isSlug?: string }>()

  // State
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [showFullDescription, setShowFullDescription] = useState(false)

  // Reviews State
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [canReview, setCanReview] = useState(false)
  const [reviewOrderId, setReviewOrderId] = useState<number | undefined>()
  const [showWriteReviewModal, setShowWriteReviewModal] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)

  // Stores
  const { token, user } = useAuthStore()
  const { addItem, cart, isLoading: cartLoading } = useCartStore()
  const { toggleFavorite, isFavorite } = useFavoritesStore()
  const { trackProductView } = useRecentlyViewed()

  const isFav = isFavorite(product?.id ?? 0)

  // Calculate stock availability
  const productInCart = cart?.find(
    (item) => item.product_id?.toString() === product?.id?.toString()
  )
  const quantityInCart = productInCart?.quantity || 0
  const availableStock = (product?.stock || 0) - quantityInCart
  const isOutOfStock = availableStock <= 0

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return

      setLoading(true)
      setError(null)

      try {
        let product
        if (isSlug === "true") {
          product = await getProductBySlug(id)
        } else {
          product = await getProductById(+id)
        }
        setProduct(product)
      } catch (err) {
        console.error("Error fetching product:", err)
        setError("Failed to load product. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id, isSlug])

  useEffect(() => {
    if (product) {
      trackProductView(product)
    }
  }, [product, trackProductView])

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    if (!product?.id) return

    setReviewsLoading(true)
    try {
      const response = await getProductReviews(product.id, 1, 10, "newest")
      setReviews(response.data)
      setReviewStats(response.stats)
    } catch (err) {
      console.error("Error fetching reviews:", err)
    } finally {
      setReviewsLoading(false)
    }
  }, [product?.id])

  // Check user review status
  const checkUserReviewStatus = useCallback(async () => {
    if (!token || !product?.id) return

    try {
      // Check if user has already reviewed
      const existingReview = await getUserProductReview(product.id, token)
      setUserReview(existingReview)

      // Check if user can review (has purchased)
      if (!existingReview) {
        const result = await canUserReviewProduct(product.id, token)
        setCanReview(result.canReview)
        setReviewOrderId(result.orderId)
      }
    } catch (err) {
      // User hasn't reviewed - that's fine
      if ((err as any)?.response?.status !== 404) {
        console.error("Error checking review status:", err)
      }
    }
  }, [token, product?.id])

  useEffect(() => {
    if (product) {
      fetchReviews()
      checkUserReviewStatus()
    }
  }, [product, fetchReviews, checkUserReviewStatus])

  // Reset quantity when stock changes
  useEffect(() => {
    if (quantity > availableStock && availableStock > 0) {
      setQuantity(availableStock)
    }
  }, [availableStock, quantity])

  // Handlers
  const handleIncreaseQuantity = () => {
    if (quantity < availableStock) {
      setQuantity((prev) => prev + 1)
    }
  }

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1)
    }
  }

  const handleAddToCart = async () => {
    if (!product) return

    if (!token) {
      Toast.show({
        type: "error",
        text1: "Please login",
        text2: "You must be logged in to add items to your cart",
        visibilityTime: 2000,
      })
      return
    }

    if (isOutOfStock) {
      Toast.show({
        type: "error",
        text1: "Out of stock",
        text2: "This product is currently unavailable",
        visibilityTime: 2000,
      })
      return
    }

    const price = product.sale_price || product.rrp
    const itemData = {
      product_id: product.id,
      user_id: parseInt(user?.id?.toString() ?? "0"),
      quantity,
      amount: price,
      name: product.name,
      cover: product.cover?.url,
      slug: product.slug,
      unit_price: price,
      publishedAt: new Date(),
      brand: product.brand?.name,
      weight: quantity * product.weight_in_grams,
    }

    try {
      const result = await addItem(itemData as any, token)

      if (result?.basket_item_id) {
        Toast.show({
          type: "success",
          text1: "Added to cart!",
          text2: `${product.name} has been added to your cart`,
          visibilityTime: 2000,
        })
        setQuantity(1) // Reset quantity after adding
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to add to cart",
          text2: "Please try again",
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
    }
  }

  const handleToggleFavorite = () => {
    if (!product) return

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

  const handleShare = async () => {
    if (!product) return

    const result = await shareProduct({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      price: product.rrp,
      salePrice: product.sale_price,
    })

    if (result.success) {
      // TODO: Track share analytics

      console.log("Product shared successfully!")
    }
  }

  const navigateToNutrition = () => {
    if (product) {
      router.push({
        pathname: "/product/[id]/nutrition",
        params: { id: product.id.toString() },
      })
    }
  }

  const navigateToAllReviews = () => {
    if (product) {
      router.push({
        pathname: "/product/[id]/reviews",
        params: { id: product.id.toString(), name: product.name },
      })
    }
  }

  // Review handlers
  const handleReviewSuccess = (review: Review) => {
    setUserReview(review)
    setCanReview(false)
    fetchReviews() // Refresh reviews
  }

  const handleEditReview = () => {
    setShowWriteReviewModal(true)
  }

  const handleDeleteReview = async () => {
    if (!userReview || !token || !product?.id) return

    try {
      await deleteReview(userReview.id, token)
      setUserReview(null)

      // Re-check if user can review
      const result = await canUserReviewProduct(product.id, token)
      setCanReview(result.canReview)
      setReviewOrderId(result.orderId)

      fetchReviews()

      Toast.show({
        type: "success",
        text1: "Deleted",
        text2: "Your review has been deleted",
        visibilityTime: 2000,
      })
    } catch (err) {
      console.error("Error deleting review:", err)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete review",
        visibilityTime: 2000,
      })
    }
  }

  const handleWriteReviewPress = () => {
    if (!token) {
      Toast.show({
        type: "info",
        text1: "Login Required",
        text2: "Please login to write a review",
        visibilityTime: 2000,
      })
      return
    }

    if (!canReview && !userReview) {
      Toast.show({
        type: "info",
        text1: "Purchase Required",
        text2: "You can only review products you've purchased",
        visibilityTime: 3000,
      })
      return
    }

    setShowWriteReviewModal(true)
  }

  // Calculate total price
  const totalPrice = product
    ? ((product.sale_price || product.rrp) * quantity).toFixed(2)
    : "0.00"

  // Check if description needs truncation
  const shouldTruncateDescription =
    product?.description && product.description.length > MAX_DESCRIPTION_LENGTH
  const displayDescription =
    shouldTruncateDescription && !showFullDescription
      ? `${product?.description?.slice(0, MAX_DESCRIPTION_LENGTH)}...`
      : product?.description

  // Get reviews to display (limited or all)
  const otherReviews = reviews.filter((r) => r.id !== userReview?.id)

  const displayedReviews = showAllReviews
    ? otherReviews
    : otherReviews.slice(0, INITIAL_REVIEWS_COUNT)

  const hasMoreReviews = otherReviews.length > INITIAL_REVIEWS_COUNT

  const totalReviewsCount = reviewStats?.totalReviews || reviews.length

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loader fullScreen text="Loading product..." />
      </SafeAreaView>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={AppColors.gray[400]}
          />
          <Text style={styles.errorText}>{error || "Product not found"}</Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="primary"
            containerStyles="mt-4"
          />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <Wrapper style={styles.container} edges={["top"]}>
      {/* Header */}
      <ProductHeader
        isFavorite={isFav}
        onToggleFavorite={handleToggleFavorite}
        onShare={handleShare}
      />

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Carousel */}
        <ImageCarousel
          coverImage={product.cover}
          images={product.images || []}
        />

        {/* Product Info */}
        <View style={styles.infoContainer}>
          {/* Category */}
          {product.categories?.[0]?.name && (
            <Text style={styles.category}>{product.categories[0].name}</Text>
          )}

          {/* Title */}
          <Text style={styles.title}>{product.name}</Text>

          {/* Rating Summary (Compact) */}
          {reviewStats && reviewStats.totalReviews > 0 && (
            <TouchableOpacity
              style={styles.ratingRow}
              onPress={navigateToAllReviews}
              activeOpacity={0.7}
            >
              <Rating
                rating={reviewStats.averageRating}
                size="small"
                showValue
              />
              <Text style={styles.reviewCount}>
                ({reviewStats.totalReviews}{" "}
                {reviewStats.totalReviews === 1 ? "review" : "reviews"})
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={AppColors.gray[400]}
              />
            </TouchableOpacity>
          )}

          {/* Price Row */}
          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              {product.sale_price ? (
                <>
                  <Text style={styles.salePrice}>
                    ${product.sale_price.toFixed(2)}
                  </Text>
                  <Text style={styles.originalPrice}>
                    ${product.rrp.toFixed(2)}
                  </Text>
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveText}>
                      Save ${(product.rrp - product.sale_price).toFixed(2)}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={styles.price}>${product.rrp.toFixed(2)}</Text>
              )}
            </View>
          </View>

          {/* Nutrition Link */}
          {product.nutrition && (
            <TouchableOpacity
              style={styles.nutritionLink}
              onPress={navigateToNutrition}
              activeOpacity={0.7}
            >
              <Ionicons
                name="nutrition-outline"
                size={18}
                color={AppColors.primary[500]}
              />
              <Text style={styles.nutritionText}>Nutritional Information</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={AppColors.gray[400]}
              />
            </TouchableOpacity>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{displayDescription}</Text>
          {shouldTruncateDescription && (
            <TouchableOpacity
              onPress={() => setShowFullDescription(!showFullDescription)}
              activeOpacity={0.7}
            >
              <Text style={styles.readMoreText}>
                {showFullDescription ? "Show less" : "Read more"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Quantity Section */}
          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            {isOutOfStock ? (
              <Text style={styles.outOfStockText}>Out of stock</Text>
            ) : (
              <QuantitySelector
                quantity={quantity}
                onIncrease={handleIncreaseQuantity}
                onDecrease={handleDecreaseQuantity}
                maxQuantity={availableStock}
              />
            )}
          </View>

          {/* Stock Warning */}
          {!isOutOfStock && availableStock <= 5 && (
            <Text style={styles.stockWarning}>
              Only {availableStock} left in stock!
            </Text>
          )}

          {/* Cart Info */}
          {quantityInCart > 0 && (
            <Text style={styles.cartInfo}>
              {quantityInCart} already in your cart
            </Text>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Reviews Section */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              {reviewStats && reviewStats.totalReviews > 0 && (
                <TouchableOpacity
                  onPress={navigateToAllReviews}
                  activeOpacity={0.7}
                >
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Rating Summary */}
            {reviewStats && reviewStats.totalReviews > 0 && (
              <RatingSummary stats={reviewStats} />
            )}

            {/* Write Review Button */}
            {token && (canReview || userReview) && (
              <TouchableOpacity
                style={styles.writeReviewButton}
                onPress={handleWriteReviewPress}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={userReview ? "pencil" : "create-outline"}
                  size={20}
                  color={AppColors.primary[600]}
                />
                <Text style={styles.writeReviewText}>
                  {userReview ? "Edit Your Review" : "Write a Review"}
                </Text>
              </TouchableOpacity>
            )}

            {/* User's Review */}
            {userReview && (
              <View style={styles.userReviewContainer}>
                <Text style={styles.userReviewLabel}>Your Review</Text>
                <ReviewCard
                  review={userReview}
                  onEdit={handleEditReview}
                  onDelete={handleDeleteReview}
                />
              </View>
            )}

            {/* Reviews List */}
            {reviewsLoading ? (
              <View style={styles.reviewsLoading}>
                <ActivityIndicator
                  size="small"
                  color={AppColors.primary[500]}
                />
                <Text style={styles.reviewsLoadingText}>
                  Loading reviews...
                </Text>
              </View>
            ) : totalReviewsCount > 0 ? (
              <View style={styles.reviewsList}>
                {displayedReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    showActions={false}
                  />
                ))}

                {/* Show More / View All */}
                {hasMoreReviews && (
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={navigateToAllReviews}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewAllText}>
                      View All {reviewStats?.totalReviews} Reviews
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={AppColors.primary[600]}
                    />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.noReviewsContainer}>
                <Ionicons
                  name="chatbubble-outline"
                  size={40}
                  color={AppColors.gray[300]}
                />
                <Text style={styles.noReviewsText}>No reviews yet</Text>
                <Text style={styles.noReviewsSubtext}>
                  Be the first to review this product!
                </Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>
            Disclaimer: Product details may change from time to time. When
            precise information is important, we recommend reading the label on
            the products you purchase.
          </Text>
        </View>

        <RecentlyViewed excludeProductId={product.id} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>${totalPrice}</Text>
        </View>
        <Button
          title={isOutOfStock ? "Out of Stock" : "Add to Cart"}
          onPress={handleAddToCart}
          loading={cartLoading}
          disabled={isOutOfStock || cartLoading}
          containerStyles="flex-1 ml-4"
          icon={
            !isOutOfStock ? (
              <Ionicons name="cart-outline" size={20} color="white" />
            ) : undefined
          }
        />
      </View>

      {/* Write Review Modal */}
      <WriteReviewModal
        visible={showWriteReviewModal}
        onClose={() => setShowWriteReviewModal(false)}
        onSuccess={handleReviewSuccess}
        productId={product.id}
        productName={product.name}
        existingReview={userReview}
        orderId={reviewOrderId}
      />
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  infoContainer: {
    padding: 20,
    backgroundColor: AppColors.background.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  category: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.primary[500],
    textTransform: "capitalize",
    marginBottom: 4,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: AppColors.text.primary,
    textTransform: "capitalize",
    marginBottom: 12,
    lineHeight: 32,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 4,
  },
  reviewCount: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  price: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: AppColors.primary[600],
  },
  salePrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: AppColors.error,
  },
  originalPrice: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: AppColors.text.tertiary,
    textDecorationLine: "line-through",
  },
  saveBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  saveText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#166534",
  },
  nutritionLink: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.primary,
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  nutritionText: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.gray[200],
    marginVertical: 20,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: AppColors.text.primary,
    marginBottom: 10,
  },
  description: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.secondary,
    lineHeight: 24,
  },
  readMoreText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.primary[500],
    marginTop: 8,
  },
  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  outOfStockText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.error,
  },
  stockWarning: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.warning,
    marginTop: 12,
  },
  cartInfo: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    marginTop: 8,
  },
  reviewsSection: {
    marginBottom: 0,
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seeAllText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.primary[600],
  },
  writeReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: AppColors.primary[50],
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.primary[200],
  },
  writeReviewText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.primary[600],
  },
  userReviewContainer: {
    marginTop: 16,
  },
  userReviewLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.text.primary,
    marginBottom: 8,
  },
  reviewsList: {
    marginTop: 16,
  },
  reviewsLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 8,
  },
  reviewsLoadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  noReviewsContainer: {
    alignItems: "center",
    padding: 32,
  },
  noReviewsText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: AppColors.text.secondary,
    marginTop: 12,
  },
  noReviewsSubtext: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.tertiary,
    marginTop: 4,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 14,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
  },
  viewAllText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.primary[600],
  },
  disclaimer: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.tertiary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    backgroundColor: AppColors.background.primary,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
  totalContainer: {
    alignItems: "flex-start",
  },
  totalLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.secondary,
  },
  totalPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: AppColors.text.primary,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: AppColors.text.secondary,
    textAlign: "center",
    marginTop: 16,
  },
})
