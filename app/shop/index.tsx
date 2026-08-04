import { AntDesign, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native"

import { useCart } from "@/src/hooks/queries/useCart"
import { useBrands, useCategories, useInfiniteProducts } from "@/src/hooks/queries/useProducts"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"
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
ProductItem.displayName = "ProductItem"

export default function ShopScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const { config, isTablet, isLandscape, width } = useResponsive()
  const { category: categoryParam, brand: brandParam } = useLocalSearchParams<{
    category?: string
    brand?: string
  }>()

  const { token } = useAuthStore()
  const { selectedCategory, setCategory } = useProductsStore()
  const { data: cartItems = [] } = useCart({ token, enabled: !!token })
  const { data: categories = [], isLoading: categoriesLoading } = useCategories()
  const { data: brands = [], isLoading: brandsLoading } = useBrands()

  // Filter state
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [activeSortOption, setActiveSortOption] = useState<string | null>(null)
  const [selectedBrands, setSelectedBrands] = useState<Brand[]>([])

  // Track if initial URL params have been applied
  const [paramsApplied, setParamsApplied] = useState(false)

  const isFilterActive =
    selectedCategory !== null ||
    activeSortOption !== null ||
    selectedBrands.length > 0

  // Calculate grid layout
  const numColumns = config.productGridColumns
  const gap = config.gap
  const horizontalPadding = config.horizontalPadding
  const totalGap = gap * (numColumns - 1)
  const availableWidth = width - horizontalPadding * 2
  const itemWidth = (availableWidth - totalGap) / numColumns

  useEffect(() => {
    navigation.setOptions({ headerShown: false })
  }, [navigation])

  // Apply URL params once brands have loaded — runs only once
  useEffect(() => {
    if (brandsLoading || paramsApplied) return

    if (categoryParam && categoryParam !== selectedCategory) {
      setCategory(categoryParam)
    }

    if (brandParam) {
      const matchedBrand = brands.find(
        (b) => b.name.toLowerCase() === brandParam.toLowerCase()
      )
      if (matchedBrand) {
        setSelectedBrands([matchedBrand])
      }
    }

    setParamsApplied(true)
  }, [brands, brandsLoading, brandParam, categoryParam, paramsApplied, selectedCategory, setCategory])

  // Filter params drive the query key — changing them auto-resets pagination
  const filterParams = useMemo(() => ({
    limit: ITEMS_PER_PAGE,
    sort: activeSortOption || 'createdAt:desc',
    ...(selectedCategory ? { category: selectedCategory } : {}),
    ...(selectedBrands.length > 0
      ? { selectedBrands: selectedBrands.map((b) => b.id).join(',') }
      : {}),
  }), [activeSortOption, selectedCategory, selectedBrands])

  const {
    data: productsData,
    isLoading: isInitialLoading,
    isFetchingNextPage: isLoadingMore,
    hasNextPage: hasMoreData,
    fetchNextPage,
  } = useInfiniteProducts(filterParams)

  const products = productsData?.pages.flatMap((p) => p.products) ?? []
  const totalProducts = productsData?.pages[0]?.total ?? 0

  // Handlers
  const handleCategoryChange = (category: string | null) => {
    setCategory(category)
  }

  const handleBrandToggle = (brand: Brand) => {
    setSelectedBrands((prev) => {
      const isSelected = prev.some((b) => b.id === brand.id)
      return isSelected ? prev.filter((b) => b.id !== brand.id) : [...prev, brand]
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
      fetchNextPage()
    }
  }

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.push("/(tabs)/products")
    }
  }

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
        {cartItems.length > 0 && (
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
              {cartItems.length > 99 ? "99+" : cartItems.length}
            </Text>
          </View>
        )}
      </DebouncedTouchable>
    </View>
  )

  const renderHeader = () => (
    <View style={styles.header}>
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

      <CategoryChips
        categories={categories || []}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategoryChange}
      />

      <ActiveFilters
        selectedBrands={selectedBrands}
        activeSortOption={activeSortOption}
      />

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

  const renderFooter = useCallback(() => (
    <View style={styles.loadingFooter}>
      {isLoadingMore && (
        <>
          <ActivityIndicator size="small" color={AppColors.primary[500]} />
          <Text style={[styles.loadingText, { fontSize: config.bodyFontSize }]}>
            Loading more...
          </Text>
        </>
      )}
    </View>
  ), [isLoadingMore, config.bodyFontSize])

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

  const flatListKey = `grid-${numColumns}`

  return (
    <Wrapper style={styles.container} edges={["top", "bottom"]}>
      {renderTopHeader()}
      {renderHeader()}

      {isInitialLoading ? (
        <View
          style={{
            paddingHorizontal: config.horizontalPadding,
            paddingTop: 16,
          }}
        >
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
          removeClippedSubviews={true}
          initialNumToRender={ITEMS_PER_PAGE}
          maxToRenderPerBatch={8}
          windowSize={5}
          updateCellsBatchingPeriod={50}
        />
      )}

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
    height: 100,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[500],
  },
})
