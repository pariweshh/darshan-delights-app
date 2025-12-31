import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import React, { memo, useCallback, useEffect, useMemo, useState } from "react"
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"

import { getProducts } from "@/src/api/products"
import ConnectionErrorScreen from "@/src/components/common/ConnectionErrorScreen"
import Wrapper from "@/src/components/common/Wrapper"
import AppExclusiveBanner from "@/src/components/home/banners/AppExclusiveBanner"
import BrandPromoBanner from "@/src/components/home/banners/BrandPromoBanner"
import CategoryList from "@/src/components/home/CategoryList"
import ProductGrid from "@/src/components/home/ProductGrid"
import ProductHorizontalList from "@/src/components/home/ProductHorizontalList"
import PurchasedBeforeList from "@/src/components/home/PurchasedBeforeList"
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
import AppColors from "@/src/constants/Colors"
import { useNetwork } from "@/src/hooks/useNetworkStatus"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"
import { useProductsStore } from "@/src/store/productStore"
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

// ==========================================
// Memoized Sub-Components
// ==========================================

// Welcome Section
const WelcomeSection = memo(
  ({
    user,
    token,
    titleFontSize,
  }: {
    user: any
    token: string | null
    titleFontSize: number
  }) => {
    if (!token || !user?.id) {
      return <SignInPrompt />
    }

    return (
      <View style={{ paddingHorizontal: 4 }}>
        <Text style={[styles.welcomeText, { fontSize: titleFontSize }]}>
          Welcome, {user.fName || user.username}! 👋
        </Text>
      </View>
    )
  }
)

// Loading Skeleton
const HomeSkeleton = memo(
  ({ config, isTablet }: { config: any; isTablet: boolean }) => (
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
  )
)

// Error State
const ErrorState = memo(
  ({
    error,
    config,
    onRetry,
  }: {
    error: string
    config: any
    onRetry: () => void
  }) => (
    <View style={styles.errorContainer}>
      <Ionicons
        name="alert-circle-outline"
        size={config.iconSizeLarge * 2}
        color={AppColors.gray[400]}
      />
      <Text style={[styles.errorTitle, { fontSize: config.titleFontSize }]}>
        Oops! Something went wrong
      </Text>
      <Text style={[styles.errorText, { fontSize: config.bodyFontSize }]}>
        {error}
      </Text>
      <Text
        style={[styles.retryText, { fontSize: config.bodyFontSize }]}
        onPress={onRetry}
      >
        Tap to retry
      </Text>
    </View>
  )
)

// ==========================================
// Main Component
// ==========================================

export default function HomeScreen() {
  const router = useRouter()
  const { config, isTablet, isLandscape } = useResponsive()
  const [refreshing, setRefreshing] = useState(false)

  // Use individual selectors for better performance
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)

  const { connectionStatus, checkFullConnectivity } = useNetwork()

  // Spotlight category state
  const [spotlightCategory, setSpotlightCategory] =
    useState<SpotlightCategory | null>(null)

  // Use individual selectors from products store
  const categories = useProductsStore((state) => state.categories)
  const newProducts = useProductsStore((state) => state.newProducts)
  const onSaleProducts = useProductsStore((state) => state.onSaleProducts)
  const popularProducts = useProductsStore((state) => state.popularProducts)
  const newArrivalsLoading = useProductsStore(
    (state) => state.newArrivalsLoading
  )
  const popularLoading = useProductsStore((state) => state.popularLoading)
  const saleLoading = useProductsStore((state) => state.saleLoading)
  const categoriesLoading = useProductsStore((state) => state.categoriesLoading)
  const error = useProductsStore((state) => state.error)
  const fetchNewArrivals = useProductsStore((state) => state.fetchNewArrivals)
  const fetchCategories = useProductsStore((state) => state.fetchCategories)
  const fetchOnSaleProducts = useProductsStore(
    (state) => state.fetchOnSaleProducts
  )
  const fetchPopularProducts = useProductsStore(
    (state) => state.fetchPopularProducts
  )
  const setCategory = useProductsStore((state) => state.setCategory)
  const clearError = useProductsStore((state) => state.clearError)

  // Memoize computed values
  const horizontalProductCount = useMemo(
    () => (isTablet ? (isLandscape ? 10 : 8) : 8),
    [isTablet, isLandscape]
  )

  const gridProductCount = useMemo(
    () => (isTablet ? (isLandscape ? 8 : 6) : 4),
    [isTablet, isLandscape]
  )

  const hasNoData = useMemo(
    () => !categories.length && !newProducts.length,
    [categories.length, newProducts.length]
  )

  const isInitialLoading = useMemo(
    () =>
      categoriesLoading &&
      newArrivalsLoading &&
      popularLoading &&
      saleLoading &&
      hasNoData,
    [
      categoriesLoading,
      newArrivalsLoading,
      popularLoading,
      saleLoading,
      hasNoData,
    ]
  )

  // Memoize sliced arrays to prevent re-renders
  const displayedNewProducts = useMemo(
    () => newProducts.slice(0, horizontalProductCount),
    [newProducts, horizontalProductCount]
  )

  const displayedPopularProducts = useMemo(
    () => popularProducts.slice(0, horizontalProductCount),
    [popularProducts, horizontalProductCount]
  )

  const displayedSaleProducts = useMemo(
    () => onSaleProducts.slice(0, gridProductCount),
    [onSaleProducts, gridProductCount]
  )

  // Select random category and fetch product count
  const selectRandomSpotlightCategory = useCallback(
    async (categoryList: Category[]) => {
      if (!categoryList || categoryList.length === 0) return

      try {
        const randomIndex = Math.floor(Math.random() * categoryList.length)
        const selectedCategory = categoryList[randomIndex]
        const colorIndex = Math.floor(Math.random() * SPOTLIGHT_COLORS.length)
        const selectedColors = SPOTLIGHT_COLORS[colorIndex]

        const response = await getProducts({
          category: selectedCategory.name,
        })

        setSpotlightCategory({
          category: selectedCategory,
          productCount: response?.total || 0,
          colors: selectedColors,
        })
      } catch (err) {
        console.error("Error fetching spotlight category:", err)
        // Fallback
        if (categoryList.length > 0) {
          const randomIndex = Math.floor(Math.random() * categoryList.length)
          const colorIndex = Math.floor(Math.random() * SPOTLIGHT_COLORS.length)
          setSpotlightCategory({
            category: categoryList[randomIndex],
            productCount: 0,
            colors: SPOTLIGHT_COLORS[colorIndex],
          })
        }
      }
    },
    []
  )

  const loadInitialData = useCallback(async () => {
    await Promise.all([
      fetchCategories(),
      fetchNewArrivals(),
      fetchPopularProducts(),
      fetchOnSaleProducts(),
    ])
  }, [
    fetchCategories,
    fetchNewArrivals,
    fetchPopularProducts,
    fetchOnSaleProducts,
  ])

  // Initial data fetch
  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Select spotlight category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !spotlightCategory) {
      selectRandomSpotlightCategory(categories)
    }
  }, [categories, spotlightCategory, selectRandomSpotlightCategory])

  // Memoize handlers
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    clearError()
    setSpotlightCategory(null)
    await loadInitialData()

    if (categories.length > 0) {
      await selectRandomSpotlightCategory(categories)
    }
    setRefreshing(false)
  }, [categories, selectRandomSpotlightCategory, clearError, loadInitialData])

  const navigateToCategory = useCallback(
    (category: string | null) => {
      setCategory(category)
      router.push({
        pathname: "/shop",
        params: category ? { category } : {},
      })
    },
    [router, setCategory]
  )

  const navigateToPopularProducts = useCallback(() => {
    router.push("/(tabs)/home/popular-prods")
  }, [router])

  const navigateToWeeklySale = useCallback(() => {
    router.push("/(tabs)/home/weekly-sale")
  }, [router])

  const navigateToAllProducts = useCallback(() => {
    setCategory(null)
    router.push({
      pathname: "/(tabs)/products",
      params: {},
    })
  }, [router, setCategory])

  const handleSpotlightPress = useCallback(() => {
    if (spotlightCategory) {
      navigateToCategory(spotlightCategory.category.name)
    }
  }, [spotlightCategory, navigateToCategory])

  const handleRetry = useCallback(async () => {
    const status = await checkFullConnectivity()
    if (status === "connected") {
      await loadInitialData()
    }
  }, [checkFullConnectivity, loadInitialData])

  // ==========================================
  // Render Logic
  // ==========================================

  // Connection error states
  if (hasNoData && connectionStatus === "offline") {
    return (
      <Wrapper style={styles.wrapper}>
        <ConnectionErrorScreen status="offline" onRetry={handleRetry} />
      </Wrapper>
    )
  }

  if (hasNoData && connectionStatus === "server_unavailable") {
    return (
      <Wrapper style={styles.wrapper}>
        <ConnectionErrorScreen
          status="server_unavailable"
          onRetry={handleRetry}
        />
      </Wrapper>
    )
  }

  // Loading state
  if (isInitialLoading) {
    return (
      <Wrapper style={styles.wrapper}>
        <HomeHeader />
        <HomeSkeleton config={config} isTablet={isTablet} />
      </Wrapper>
    )
  }

  // Error state
  if (error && hasNoData) {
    return (
      <Wrapper style={styles.wrapper}>
        <HomeHeader />
        <ErrorState error={error} config={config} onRetry={onRefresh} />
      </Wrapper>
    )
  }

  // Main content
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
        {/* Welcome / Sign In Section */}
        <View style={{ marginBottom: config.gap }}>
          <WelcomeSection
            user={user}
            token={token}
            titleFontSize={config.titleFontSize}
          />
        </View>

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
            products={displayedNewProducts}
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
            products={displayedPopularProducts}
            loading={popularLoading}
          />
        </View>

        {/* Dynamic Category Spotlight Banner */}
        {/* {spotlightCategory && spotlightCategory.productCount > 0 && (
          <CategorySpotlightBanner
            categoryName={spotlightCategory.category.name}
            itemCount={spotlightCategory.productCount}
            backgroundColor={spotlightCategory.colors.backgroundColor}
            textColor={spotlightCategory.colors.textColor}
            imageUrl={spotlightCategory.category.cover?.url}
            onPress={handleSpotlightPress}
          />
        )} */}

        <PurchasedBeforeList />

        {/* Weekly Sale Section */}
        {onSaleProducts.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <SectionHeader
              title="🔥 Weekly Specials"
              onViewAll={navigateToWeeklySale}
            />
            <ProductGrid
              products={displayedSaleProducts}
              loading={saleLoading}
              saleCard={true}
            />
          </View>
        )}

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
