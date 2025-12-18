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
import {
  CategoryChipSkeleton,
  ProductGridSkeleton,
  ProductHorizontalListSkeleton,
  SkeletonBase,
} from "@/src/components/skeletons"
import HomeHeader from "@/src/components/ui/HomeHeader"
import { useResponsive } from "@/src/hooks/useResponsive"
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
  const { config, isTablet, isLandscape } = useResponsive()
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

  // Calculate items to show based on device
  const horizontalProductCount = isTablet ? (isLandscape ? 10 : 8) : 8
  const gridProductCount = isTablet ? (isLandscape ? 6 : 6) : 4

  // Check if initial loading
  const isInitialLoading =
    categoriesLoading &&
    newArrivalsLoading &&
    popularLoading &&
    saleLoading &&
    !categories.length &&
    !newProducts.length

  if (isInitialLoading) {
    return (
      <Wrapper style={styles.wrapper}>
        <HomeHeader />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: config.horizontalPadding,
              paddingTop: config.horizontalPadding,
            },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        >
          {/* Welcome skeleton */}
          <View style={{ marginBottom: config.gap, paddingHorizontal: 4 }}>
            <SkeletonBase width={200} height={config.titleFontSize + 4} />
          </View>

          {/* Categories Section Skeleton */}
          <View style={{ marginBottom: config.sectionSpacing }}>
            <View style={styles.sectionHeaderSkeleton}>
              <SkeletonBase width={100} height={config.subtitleFontSize + 2} />
              <SkeletonBase width={60} height={config.bodyFontSize} />
            </View>
            <CategoryChipSkeleton count={6} />
          </View>

          {/* Banner Skeleton */}
          <SkeletonBase
            width="100%"
            height={isTablet ? 160 : 140}
            borderRadius={config.cardBorderRadius + 4}
            style={{ marginBottom: config.sectionSpacing }}
          />

          {/* New Arrivals Skeleton */}
          <View style={{ marginBottom: config.sectionSpacing }}>
            <View style={styles.sectionHeaderSkeleton}>
              <SkeletonBase width={140} height={config.subtitleFontSize + 2} />
              <SkeletonBase width={60} height={config.bodyFontSize} />
            </View>
            <ProductHorizontalListSkeleton />
          </View>

          {/* Brand Banner Skeleton */}
          <SkeletonBase
            width="100%"
            height={isTablet ? 180 : 160}
            borderRadius={config.cardBorderRadius + 4}
            style={{ marginBottom: config.sectionSpacing }}
          />

          {/* Popular Products Skeleton */}
          <View style={{ marginBottom: config.sectionSpacing }}>
            <View style={styles.sectionHeaderSkeleton}>
              <SkeletonBase width={160} height={config.subtitleFontSize + 2} />
              <SkeletonBase width={60} height={config.bodyFontSize} />
            </View>
            <ProductHorizontalListSkeleton />
          </View>

          {/* Weekly Sale Skeleton */}
          <View style={{ marginBottom: config.sectionSpacing }}>
            <View style={styles.sectionHeaderSkeleton}>
              <SkeletonBase width={140} height={config.subtitleFontSize + 2} />
              <SkeletonBase width={60} height={config.bodyFontSize} />
            </View>
            <ProductGridSkeleton count={isTablet ? 6 : 4} />
          </View>
        </ScrollView>
      </Wrapper>
    )
  }

  // Error state
  if (error && !categories.length && !newProducts.length) {
    return (
      <View style={styles.wrapper}>
        <HomeHeader />
        <View style={styles.errorContainer}>
          <Ionicons
            name="cloud-offline-outline"
            size={config.iconSizeLarge * 2}
            color={AppColors.gray[400]}
          />
          <Text style={[styles.errorTitle, { fontSize: config.titleFontSize }]}>
            Oops! Something went wrong
          </Text>
          <Text style={[styles.errorTitle, { fontSize: config.titleFontSize }]}>
            Oops! Something went wrong
          </Text>
          <Text
            style={[styles.retryText, { fontSize: config.bodyFontSize }]}
            onPress={onRefresh}
          >
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
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: config.horizontalPadding,
            paddingTop: config.horizontalPadding,
          },
        ]}
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
          <View style={{ marginBottom: config.gap }}>
            <SignInPrompt />
          </View>
        )}

        {/* Welcome Message (for logged in users) */}
        {token && user && (
          <View style={{ marginBottom: config.gap, paddingHorizontal: 4 }}>
            <Text
              style={[styles.welcomeText, { fontSize: config.titleFontSize }]}
            >
              Welcome, {user.fName || user.username}! 👋
            </Text>
          </View>
        )}

        {/* Categories Section */}
        <View style={{ marginBottom: config.sectionSpacing }}>
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
        <View style={{ marginBottom: config.sectionSpacing }}>
          <SectionHeader
            title="✨ Newest Arrivals"
            onViewAll={navigateToAllProducts}
          />
          <ProductHorizontalList
            products={newProducts.slice(0, horizontalProductCount)}
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
        <View style={{ marginBottom: config.sectionSpacing }}>
          <SectionHeader
            title="⚡️ Popular Products"
            onViewAll={navigateToPopularProducts}
          />
          <ProductHorizontalList
            products={popularProducts.slice(0, horizontalProductCount)}
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
          <View style={{ marginBottom: config.sectionSpacing }}>
            <SectionHeader
              title="🔥 Weekly Specials"
              onViewAll={navigateToWeeklySale}
            />
            <ProductGrid
              products={onSaleProducts.slice(0, gridProductCount)}
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
        <View style={{ height: config.sectionSpacing }} />
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
  scrollContent: {},
  welcomeText: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    textAlign: "center",
    marginBottom: 16,
  },
  retryText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[500],
    textDecorationLine: "underline",
  },
  sectionHeaderSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
})
