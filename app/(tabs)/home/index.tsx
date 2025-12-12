import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"

import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"
import { useProductsStore } from "@/src/store/productStore"

// Components
import { getProducts } from "@/src/api/products"
import Loader from "@/src/components/common/Loader"
import Wrapper from "@/src/components/common/Wrapper"
import AppExclusiveBanner from "@/src/components/home/banners/AppExclusiveBanner"
import BrandPromoBanner from "@/src/components/home/banners/BrandPromoBanner"
import CategorySpotlightBanner from "@/src/components/home/banners/CategorySpotlightBanner"
import CategoryList from "@/src/components/home/CategoryList"
import ProductGrid from "@/src/components/home/ProductGrid"
import ProductHorizontalList from "@/src/components/home/ProductHorizontalList"
import RecentlyViewed from "@/src/components/home/RecentlyViewed"
import SectionHeader from "@/src/components/home/SectionHeader"
import SignInPrompt from "@/src/components/home/SignInPrompt"
import HomeHeader from "@/src/components/ui/HomeHeader"
import { Category } from "@/src/types"

// Color palette for category spotlight banners
const SPOTLIGHT_COLORS = [
  { backgroundColor: "#FEF3C7", textColor: "#92400E" }, // Amber
  { backgroundColor: "#DBEAFE", textColor: "#1E40AF" }, // Blue
  { backgroundColor: "#DCFCE7", textColor: "#166534" }, // Green
  { backgroundColor: "#FCE7F3", textColor: "#9D174D" }, // Pink
  { backgroundColor: "#F3E8FF", textColor: "#6B21A8" }, // Purple
  { backgroundColor: "#FFEDD5", textColor: "#C2410C" }, // Orange
  { backgroundColor: "#E0F2FE", textColor: "#0369A1" }, // Sky
  { backgroundColor: "#FEE2E2", textColor: "#B91C1C" }, // Red
] as const

interface SpotlightCategory {
  category: Category
  productCount: number
  colors: (typeof SPOTLIGHT_COLORS)[number]
}

export default function HomeScreen() {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const { user, token } = useAuthStore()

  // Spotlight category state
  const [spotlightCategory, setSpotlightCategory] =
    useState<SpotlightCategory | null>(null)
  const [spotlightLoading, setSpotlightLoading] = useState(false)

  const {
    categories,
    newProducts,
    onSaleProducts,
    popularProducts,
    newArrivalsLoading,
    popularLoading,
    saleLoading,
    categoriesLoading,
    error,
    fetchNewArrivals,
    fetchCategories,
    fetchOnSaleProducts,
    fetchPopularProducts,
    setCategory,
    clearError,
  } = useProductsStore()

  // Select random category and fetch product count
  const selectRandomSpotlightCategory = useCallback(
    async (categoryList: Category[]) => {
      if (!categoryList || categoryList.length === 0) return

      setSpotlightLoading(true)

      try {
        // Select random category
        const randomIndex = Math.floor(Math.random() * categoryList.length)
        const selectedCategory = categoryList[randomIndex]

        // Select random color scheme
        const colorIndex = Math.floor(Math.random() * SPOTLIGHT_COLORS.length)
        const selectedColors = SPOTLIGHT_COLORS[colorIndex]

        // Fetch product count for this category
        const response = await getProducts({
          category: selectedCategory.name,
        })

        const productCount = response?.total || 0

        setSpotlightCategory({
          category: selectedCategory,
          productCount,
          colors: selectedColors,
        })
      } catch (error) {
        console.error("Error fetching spotlight category:", error)
        // Fallback: still show the category without count
        if (categoryList.length > 0) {
          const randomIndex = Math.floor(Math.random() * categoryList.length)
          const colorIndex = Math.floor(Math.random() * SPOTLIGHT_COLORS.length)
          setSpotlightCategory({
            category: categoryList[randomIndex],
            productCount: 0,
            colors: SPOTLIGHT_COLORS[colorIndex],
          })
        }
      } finally {
        setSpotlightLoading(false)
      }
    },
    []
  )

  // Initial data fetch
  useEffect(() => {
    loadInitialData()
  }, [])

  // Select spotlight category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !spotlightCategory) {
      selectRandomSpotlightCategory(categories)
    }
  }, [categories, spotlightCategory, selectRandomSpotlightCategory])

  const loadInitialData = async () => {
    await Promise.all([
      fetchCategories(),
      fetchNewArrivals(),
      fetchPopularProducts(),
      fetchOnSaleProducts(),
    ])
  }

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    clearError()
    // Reset spotlight to get a new random category
    setSpotlightCategory(null)
    await loadInitialData()

    // Select new random category after refresh
    if (categories.length > 0) {
      await selectRandomSpotlightCategory(categories)
    }
    setRefreshing(false)
  }, [categories, selectRandomSpotlightCategory])

  // Navigation handlers
  const navigateToCategory = (category: string | null) => {
    setCategory(category)
    router.push({
      pathname: "/shop",
      params: category ? { category } : {},
    })
  }

  const navigateToPopularProducts = () => {
    router.push("/(tabs)/home/popular-prods")
  }

  const navigateToWeeklySale = () => {
    router.push("/(tabs)/home/weekly-sale")
  }

  const navigateToAllProducts = () => {
    setCategory(null)
    router.push({
      pathname: "/shop",
      params: {},
    })
  }

  // Handle spotlight banner press
  const handleSpotlightPress = () => {
    if (spotlightCategory) {
      navigateToCategory(spotlightCategory.category.name)
    }
  }

  // Check if initial loading
  const isInitialLoading =
    categoriesLoading &&
    newArrivalsLoading &&
    popularLoading &&
    saleLoading &&
    !categories.length &&
    !newProducts.length

  if (isInitialLoading) {
    return <Loader fullScreen text="Loading..." />
  }

  // Error state
  if (error && !categories.length && !newProducts.length) {
    return (
      <View style={styles.wrapper}>
        <HomeHeader />
        <View style={styles.errorContainer}>
          <Ionicons
            name="cloud-offline-outline"
            size={48}
            color={AppColors.gray[400]}
          />
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={onRefresh}>
            Tap to retry
          </Text>
        </View>
      </View>
    )
  }

  return (
    <Wrapper style={styles.wrapper}>
      <HomeHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={AppColors.primary[500]}
            colors={[AppColors.primary[500]]}
          />
        }
      >
        {/* Sign In Prompt (for guests) */}
        {(!token || !user?.id) && (
          <View style={styles.signInSection}>
            <SignInPrompt />
          </View>
        )}

        {/* Welcome Message (for logged in users) */}
        {token && user && (
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>
              Welcome, {user.fName || user.username}! 👋
            </Text>
          </View>
        )}

        {/* Categories Section */}
        <View style={styles.section}>
          <SectionHeader
            title="Categories"
            onViewAll={navigateToAllProducts}
            showViewAll={true}
          />
          <CategoryList
            categories={categories}
            loading={categoriesLoading}
            onCategoryPress={navigateToCategory}
          />
        </View>

        <AppExclusiveBanner />

        {/* New Arrivals Section */}
        <View style={styles.section}>
          <SectionHeader
            title="✨ Newest Arrivals"
            onViewAll={navigateToAllProducts}
          />
          <ProductHorizontalList
            products={newProducts.slice(0, 8)}
            loading={newArrivalsLoading}
          />
        </View>

        <BrandPromoBanner
          brandName="Katoomba"
          tagline="Authentic Indian spices for every kitchen"
          discount="20% off"
          backgroundColor={
            [AppColors.primary[400], AppColors.primary[300]] as const
          }
          accentColor="#fff"
        />

        {/* Popular Products Section */}
        <View style={styles.section}>
          <SectionHeader
            title="⚡️ Popular Products"
            onViewAll={navigateToPopularProducts}
          />
          <ProductHorizontalList
            products={popularProducts.slice(0, 6)}
            loading={popularLoading}
          />
        </View>

        {/* Dynamic Category Spotlight Banner */}
        {spotlightCategory && spotlightCategory.productCount > 0 && (
          <CategorySpotlightBanner
            categoryName={spotlightCategory.category.name}
            itemCount={spotlightCategory.productCount}
            backgroundColor={spotlightCategory.colors.backgroundColor}
            textColor={spotlightCategory.colors.textColor}
            imageUrl={spotlightCategory.category.cover?.url}
            onPress={handleSpotlightPress}
          />
        )}

        {/* Weekly Sale Section */}
        {onSaleProducts.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="🔥 Weekly Specials"
              onViewAll={navigateToWeeklySale}
            />
            <ProductGrid
              products={onSaleProducts.slice(0, 4)}
              loading={saleLoading}
              saleCard={true}
            />
          </View>
        )}

        {/* <SeasonalBanner
          title="Diwali Special"
          subtitle="Celebrate with authentic sweets & snacks"
          emoji="🪔"
          gradientColors={["#7c3aed", "#5b21b6"]}
        />

        <FlashSaleBanner
          discount="UP TO 40% OFF"
          endTime={new Date(Date.now() + 4 * 60 * 60 * 1000)}
        /> */}

        <RecentlyViewed />

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: AppColors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  signInSection: {
    marginBottom: 16,
  },
  welcomeSection: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  welcomeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: AppColors.text.primary,
  },
  section: {
    marginBottom: 24,
  },
  bottomSpacer: {
    height: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: AppColors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
    textAlign: "center",
    marginBottom: 16,
  },
  retryText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.primary[500],
    textDecorationLine: "underline",
  },
})
