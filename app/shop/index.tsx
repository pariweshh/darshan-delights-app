import { AntDesign, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { memo, useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useCartStore } from "@/src/store/cartStore"
import { useProductsStore } from "@/src/store/productStore"
import { Brand, Product } from "@/src/types"

import EmptyState from "@/src/components/common/EmptyState"
import Wrapper from "@/src/components/common/Wrapper"
import ProductCard from "@/src/components/product/ProductCard"
import ActiveFilters from "@/src/components/shop/ActiveFilters"
import CategoryChips from "@/src/components/shop/CategoryChips"
import FilterModal from "@/src/components/shop/FilterModal"
import { ProductGridSkeleton, SkeletonBase } from "@/src/components/skeletons"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"

const ITEMS_PER_PAGE = 12

// Memoize the product item component
const ProductItem = memo(
  ({
    item,
    index,
    numColumns,
    gap,
    itemWidth,
  }: {
    item: Product
    index: number
    numColumns: number
    gap: number
    itemWidth: number
  }) => {
    const isLastInRow = (index + 1) % numColumns === 0
    const marginRight = isLastInRow ? 0 : gap

    return (
      <View style={{ width: itemWidth, marginRight, marginBottom: gap }}>
        <ProductCard product={item} customStyle={{ width: "100%" }} />
      </View>
    )
  }
)

export default function ShopScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const { config, isTablet, isLandscape, width } = useResponsive()
  const { category: categoryParam, brand: brandParam } = useLocalSearchParams<{
    category?: string
    brand?: string
  }>()

  const { cart } = useCartStore()

  const {
    fetchProducts,
    categories,
    fetchCategories,
    brands,
    fetchBrands,
    selectedCategory,
    setCategory,
  } = useProductsStore()

  // Local state
  const [products, setProducts] = useState<Product[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreData, setHasMoreData] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [totalProducts, setTotalProducts] = useState(0)

  // Filter state
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [activeSortOption, setActiveSortOption] = useState<string | null>(null)
  const [selectedBrands, setSelectedBrands] = useState<Brand[]>([])

  // Track if initial params have been applied
  const [paramsApplied, setParamsApplied] = useState(false)

  const isFilterActive =
    selectedCategory !== null ||
    activeSortOption !== null ||
    selectedBrands.length > 0

  // Calculate number of columns based on device and orientation
  const numColumns = config.productGridColumns

  // Calculate item width for the grid
  const gap = config.gap
  const horizontalPadding = config.horizontalPadding
  const totalGap = gap * (numColumns - 1)
  const availableWidth = width - horizontalPadding * 2
  const itemWidth = (availableWidth - totalGap) / numColumns

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    })
  }, [navigation])

  useEffect(() => {
    if (!categories || categories.length === 0) fetchCategories()
    if (!brands || brands.length === 0) fetchBrands()
  }, [])

  useEffect(() => {
    // Wait for brands to load before applying params
    if (!brands || brands.length === 0) return

    // Only apply params once
    if (paramsApplied) return

    // Apply category param
    if (categoryParam && categoryParam !== selectedCategory) {
      setCategory(categoryParam)
    }

    // Apply brand param
    if (brandParam) {
      const matchedBrand = brands.find(
        (b) => b.name.toLowerCase() === brandParam.toLowerCase()
      )
      if (matchedBrand) {
        setSelectedBrands([matchedBrand])
      }
    }

    // Mark params as applied
    setParamsApplied(true)
  }, [brands, brandParam, categoryParam])

  const buildApiParams = useCallback(() => {
    const params: any = {
      limit: ITEMS_PER_PAGE,
      sort: activeSortOption || "createdAt:desc",
    }

    if (selectedCategory) {
      params.category = selectedCategory
    }

    if (selectedBrands.length > 0) {
      params.selectedBrands = selectedBrands.map((b) => b.id).join(",")
    }

    return params
  }, [selectedCategory, selectedBrands, activeSortOption])

  const loadInitialProducts = useCallback(async () => {
    setIsInitialLoading(true)
    setProducts([])
    setCurrentPage(1)
    setHasMoreData(true)

    try {
      const params = { ...buildApiParams(), start: 0 }
      const data = await fetchProducts(params)

      if (data?.products) {
        setProducts(data.products)
        setTotalProducts(data.total)
        setHasMoreData(
          data.products.length === ITEMS_PER_PAGE &&
            data.products.length < data.total
        )
      }
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setIsInitialLoading(false)
    }
  }, [buildApiParams, fetchProducts])

  const loadMoreProducts = useCallback(async () => {
    if (isLoadingMore || !hasMoreData || isInitialLoading) return

    setIsLoadingMore(true)

    try {
      const startIndex = currentPage * ITEMS_PER_PAGE
      const params = { ...buildApiParams(), start: startIndex }
      const data = await fetchProducts(params)

      if (data?.products && data.products.length > 0) {
        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id))
          const newProducts = data.products.filter(
            (p) => !existingIds.has(p.id)
          )
          return [...prev, ...newProducts]
        })

        setCurrentPage((prev) => prev + 1)
        setHasMoreData(products.length + data.products.length < data.total)
      } else {
        setHasMoreData(false)
      }
    } catch (error) {
      console.error("Error loading more:", error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [
    isLoadingMore,
    hasMoreData,
    isInitialLoading,
    currentPage,
    buildApiParams,
    fetchProducts,
    products.length,
  ])

  useEffect(() => {
    // Don't load until we have categories and brands data
    if (!categories || categories.length === 0) return
    if (!brands || brands.length === 0) return

    // Don't load until URL params have been applied
    if (!paramsApplied) return

    loadInitialProducts()
  }, [
    selectedCategory,
    activeSortOption,
    selectedBrands,
    categories,
    brands,
    paramsApplied,
    loadInitialProducts,
  ])

  // Handlers
  const handleCategoryChange = (category: string | null) => {
    setCategory(category)
  }

  const handleBrandToggle = (brand: Brand) => {
    setSelectedBrands((prev) => {
      const isSelected = prev.some((b) => b.id === brand.id)
      if (isSelected) {
        return prev.filter((b) => b.id !== brand.id)
      }
      return [...prev, brand]
    })
  }

  const handleSortChange = (sort: string) => {
    setActiveSortOption(sort || null)
  }

  const handleResetFilters = () => {
    setActiveSortOption(null)
    setSelectedBrands([])
    setCategory(null)
    setShowFilterModal(false)
  }

  const handleEndReached = () => {
    if (hasMoreData && !isLoadingMore && !isInitialLoading) {
      loadMoreProducts()
    }
  }

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.push("/(tabs)/products")
    }
  }

  // Render functions
  const renderTopHeader = () => (
    <View
      style={[
        styles.topHeader,
        { paddingHorizontal: config.horizontalPadding },
      ]}
    >
      <DebouncedTouchable
        style={[
          styles.backButton,
          {
            width: isTablet ? 48 : 40,
            height: isTablet ? 48 : 40,
            borderRadius: isTablet ? 24 : 20,
          },
        ]}
        onPress={handleGoBack}
        activeOpacity={0.7}
      >
        <Ionicons
          name="chevron-back"
          size={config.iconSizeLarge}
          color={AppColors.text.primary}
        />
      </DebouncedTouchable>

      <Text
        style={[styles.headerTitle, { fontSize: config.titleFontSize }]}
        numberOfLines={1}
      >
        {selectedCategory
          ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)
          : "Shop"}
      </Text>

      <DebouncedTouchable
        style={[
          styles.headerCartButton,
          {
            width: isTablet ? 48 : 40,
            height: isTablet ? 48 : 40,
            borderRadius: isTablet ? 12 : 10,
          },
        ]}
        onPress={() => router.push("/(tabs)/cart")}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="cart-outline"
          size={config.iconSize + 2}
          color={AppColors.primary[700]}
        />
        {cart?.length > 0 && (
          <View
            style={[
              styles.cartBadge,
              {
                minWidth: config.badgeSize,
                height: config.badgeSize,
                borderRadius: config.badgeSize / 2,
              },
            ]}
          >
            <Text
              style={[styles.cartBadgeText, { fontSize: isTablet ? 11 : 10 }]}
            >
              {cart.length > 99 ? "99+" : cart.length}
            </Text>
          </View>
        )}
      </DebouncedTouchable>
    </View>
  )

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Row */}
      <View
        style={[
          styles.searchRow,
          {
            paddingHorizontal: config.horizontalPadding + 4,
            gap: config.gapSmall,
          },
        ]}
      >
        <DebouncedTouchable
          style={styles.searchContainer}
          onPress={() => router.push("/(tabs)/search")}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.searchInput,
              {
                paddingVertical: isTablet ? 14 : 12,
                paddingHorizontal: isTablet ? 16 : 14,
                borderRadius: isTablet ? 12 : 10,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={config.iconSizeSmall + 2}
              color={AppColors.gray[400]}
            />
            <Text
              style={[
                styles.searchPlaceholder,
                { fontSize: config.bodyFontSize },
              ]}
            >
              Search products...
            </Text>
          </View>
        </DebouncedTouchable>

        <DebouncedTouchable
          style={[
            styles.filterButton,
            isFilterActive && styles.filterButtonActive,
            {
              width: isTablet ? 52 : 46,
              height: isTablet ? 52 : 46,
              borderRadius: isTablet ? 12 : 10,
            },
          ]}
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.7}
        >
          <AntDesign
            name="filter"
            size={config.iconSize}
            color={
              isFilterActive ? AppColors.primary[500] : AppColors.text.primary
            }
          />
        </DebouncedTouchable>
      </View>

      {/* Category Chips */}
      <CategoryChips
        categories={categories || []}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategoryChange}
      />

      {/* Active Filters */}
      <ActiveFilters
        selectedBrands={selectedBrands}
        activeSortOption={activeSortOption}
      />

      {/* Results Count */}
      <View
        style={[
          styles.resultsRow,
          { paddingHorizontal: config.horizontalPadding + 4 },
        ]}
      >
        <Text style={[styles.resultsText, { fontSize: config.bodyFontSize }]}>
          {totalProducts > 0
            ? `${totalProducts} results`
            : `${products.length} results`}
        </Text>
      </View>
    </View>
  )

  const renderFooter = () => {
    if (!isLoadingMore) return <View style={{ height: 100 }} />

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={AppColors.primary[500]} />
        <Text style={[styles.loadingText, { fontSize: config.bodyFontSize }]}>
          Loading more...
        </Text>
      </View>
    )
  }

  const renderProduct = useCallback(
    ({ item, index }: { item: Product; index: number }) => (
      <ProductItem
        item={item}
        index={index}
        numColumns={numColumns}
        gap={gap}
        itemWidth={itemWidth}
      />
    ),
    [numColumns, gap, itemWidth]
  )

  const keyExtractor = useCallback((item: Product) => item.id.toString(), [])

  // Create a key for FlatList to force re-render when columns change
  const flatListKey = `grid-${numColumns}`

  return (
    <Wrapper style={styles.container} edges={["top", "bottom"]}>
      {/* Custom Top Header */}
      {renderTopHeader()}

      {/* Filters Header */}
      {renderHeader()}

      {/* Content */}
      {isInitialLoading ? (
        <View
          style={{
            paddingHorizontal: config.horizontalPadding,
            paddingTop: 16,
          }}
        >
          {/* Results count skeleton */}
          <View style={{ marginBottom: 12 }}>
            <SkeletonBase width={80} height={config.bodyFontSize + 2} />
          </View>
          <ProductGridSkeleton count={isTablet ? (isLandscape ? 8 : 6) : 6} />
        </View>
      ) : products.length === 0 ? (
        <EmptyState
          type="search"
          message="No products found"
          subMessage="Try adjusting your filters or search criteria"
          actionLabel="Reset Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <FlatList
          key={flatListKey}
          data={products}
          renderItem={renderProduct}
          keyExtractor={keyExtractor}
          numColumns={numColumns}
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: config.horizontalPadding },
          ]}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          // Performance optimizations
          removeClippedSubviews={true}
          initialNumToRender={ITEMS_PER_PAGE}
          maxToRenderPerBatch={8}
          windowSize={5}
          updateCellsBatchingPeriod={50}
          getItemLayout={undefined}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        brands={brands || []}
        selectedBrands={selectedBrands}
        activeSortOption={activeSortOption}
        onBrandToggle={handleBrandToggle}
        onSortChange={handleSortChange}
        onReset={handleResetFilters}
        productCount={products.length}
      />
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.primary,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    backgroundColor: AppColors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
    marginBottom: 16,
  },
  backButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
    textAlign: "center",
    marginHorizontal: 8,
  },
  headerCartButton: {
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: AppColors.primary[200],
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: AppColors.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    color: "white",
  },
  header: {
    backgroundColor: AppColors.background.primary,
    borderBottomWidth: 0.5,
    borderBottomColor: AppColors.gray[200],
    paddingBottom: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.secondary,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    gap: 8,
  },
  searchPlaceholder: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.gray[400],
  },
  filterButton: {
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.background.primary,
  },
  filterButtonActive: {
    borderColor: AppColors.primary[500],
    backgroundColor: AppColors.primary[50],
  },
  resultsRow: {
    marginTop: 8,
  },
  resultsText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.secondary,
  },
  listContent: {
    paddingTop: 16,
  },
  loadingFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[500],
  },
})
