import { AntDesign, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import AppColors from "@/src/constants/Colors"
import { useCartStore } from "@/src/store/cartStore"
import { useProductsStore } from "@/src/store/productStore"
import { IsIPAD } from "@/src/themes/app.constants"
import { Brand, Product } from "@/src/types"

import EmptyState from "@/src/components/common/EmptyState"
import Loader from "@/src/components/common/Loader"
import ProductCard from "@/src/components/product/ProductCard"
import ActiveFilters from "@/src/components/shop/ActiveFilters"
import CategoryChips from "@/src/components/shop/CategoryChips"
import FilterModal from "@/src/components/shop/FilterModal"

const ITEMS_PER_PAGE = 12

export default function ShopScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const { category: categoryParam } = useLocalSearchParams<{
    category?: string
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

  const isFilterActive =
    selectedCategory !== null ||
    activeSortOption !== null ||
    selectedBrands.length > 0

  // Set header options
  useEffect(() => {
    navigation.setOptions({
      headerShown: false, // We'll handle our own header
    })
  }, [navigation])

  // Fetch categories and brands on mount
  useEffect(() => {
    if (!categories || categories.length === 0) fetchCategories()
    if (!brands || brands.length === 0) fetchBrands()
  }, [])

  // Handle category param from URL
  useEffect(() => {
    if (categoryParam && categoryParam !== selectedCategory) {
      setCategory(categoryParam)
    }
  }, [categoryParam])

  // Build API params
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

  // Load initial products
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

  // Load more products
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

  // Reload when filters change
  useEffect(() => {
    if (categories && brands) {
      loadInitialProducts()
    }
  }, [selectedCategory, activeSortOption, selectedBrands, categories, brands])

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
    <View style={styles.topHeader}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleGoBack}
        activeOpacity={0.7}
      >
        <Ionicons
          name="chevron-back"
          size={24}
          color={AppColors.text.primary}
        />
      </TouchableOpacity>

      <Text style={styles.headerTitle} numberOfLines={1}>
        {selectedCategory
          ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)
          : "Shop"}
      </Text>

      <TouchableOpacity
        style={styles.headerCartButton}
        onPress={() => router.push("/(tabs)/cart")}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="cart-outline"
          size={22}
          color={AppColors.primary[700]}
        />
        {cart?.length > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>
              {cart.length > 99 ? "99+" : cart.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  )

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Row */}
      <View style={styles.searchRow}>
        <TouchableOpacity
          style={styles.searchContainer}
          onPress={() => router.push("/(tabs)/search")}
          activeOpacity={0.7}
        >
          <View style={styles.searchInput}>
            <Ionicons
              name="search-outline"
              size={18}
              color={AppColors.gray[400]}
            />
            <Text style={styles.searchPlaceholder}>Search products...</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            isFilterActive && styles.filterButtonActive,
          ]}
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.7}
        >
          <AntDesign
            name="filter"
            size={20}
            color={
              isFilterActive ? AppColors.primary[500] : AppColors.text.primary
            }
          />
        </TouchableOpacity>
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
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
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
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    )
  }

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productContainer}>
      <ProductCard product={item} customStyle={{ width: "100%" }} />
    </View>
  )

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      {/* Custom Top Header */}
      {renderTopHeader()}

      {/* Filters Header */}
      {renderHeader()}

      {/* Content */}
      {isInitialLoading ? (
        <Loader fullScreen />
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
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          numColumns={IsIPAD ? 3 : 2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          removeClippedSubviews={true}
          initialNumToRender={ITEMS_PER_PAGE}
          maxToRenderPerBatch={ITEMS_PER_PAGE}
          windowSize={4}
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
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AppColors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerTitle: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: AppColors.text.primary,
    textAlign: "center",
    marginHorizontal: 8,
  },
  headerCartButton: {
    backgroundColor: AppColors.primary[50],
    borderRadius: 10,
    width: 40,
    height: 40,
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
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
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
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.secondary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    gap: 8,
  },
  searchPlaceholder: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.gray[400],
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 10,
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
    paddingHorizontal: 20,
    marginTop: 8,
  },
  resultsText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  productContainer: {
    width: IsIPAD ? "32%" : "48%",
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
    fontSize: 14,
    color: AppColors.primary[500],
  },
})
