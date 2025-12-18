import { useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"

import EmptyState from "@/src/components/common/EmptyState"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useProductsStore } from "@/src/store/productStore"
import { Product, ProductParams } from "@/src/types"
import { ProductGridSkeleton, SkeletonBase } from "../skeletons"
import ProductCardSkeleton from "../skeletons/ProductCardSkeleton"
import BigProductCard from "./BigProductCard"
import ProductCard from "./ProductCard"

interface ScrollProductListProps {
  productParam: Partial<ProductParams>
}

const ITEMS_PER_PAGE = 10

const ScrollProductList: React.FC<ScrollProductListProps> = ({
  productParam,
}) => {
  const { config, isTablet, isLandscape, width } = useResponsive()
  const { fetchProducts } = useProductsStore()

  const [products, setProducts] = useState<Product[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMoreData, setHasMoreData] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [totalProducts, setTotalProducts] = useState(0)

  // Calculate grid columns based on device and orientation
  const numColumns = isTablet ? (isLandscape ? 4 : 3) : 1

  // Calculate fixed item width for consistent card sizes
  const gap = config.gap
  const totalGaps = gap * (numColumns - 1)
  const containerWidth = width - config.horizontalPadding * 2
  const itemWidth = (containerWidth - totalGaps) / numColumns

  const resetPaginationState = useCallback(() => {
    setProducts([])
    setCurrentPage(1)
    setHasMoreData(true)
    setIsLoadingMore(false)
    setTotalProducts(0)
  }, [])

  const loadInitialProducts = useCallback(async () => {
    try {
      const data = await fetchProducts({
        ...productParam,
        limit: ITEMS_PER_PAGE,
        start: 0,
        sort: "id:asc",
      })

      if (data?.products) {
        setProducts(data.products)
        setTotalProducts(data.total)
        setCurrentPage(1)
        setHasMoreData(
          data.products.length === ITEMS_PER_PAGE &&
            data.products.length < data.total
        )
      }
    } catch (error) {
      console.error("Error loading initial products:", error)
    }
  }, [fetchProducts, productParam])

  const loadMoreProducts = useCallback(async () => {
    if (isLoadingMore || !hasMoreData) return

    setIsLoadingMore(true)

    try {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
      const data = await fetchProducts({
        ...productParam,
        limit: ITEMS_PER_PAGE,
        start: startIndex,
        sort: "id:asc",
      })

      if (data?.products && data.products.length > 0) {
        setProducts((prevProds) => {
          const existingIds = new Set(prevProds.map((p) => p.id))
          const newProducts = data.products.filter(
            (p) => !existingIds.has(p.id)
          )
          return [...prevProds, ...newProducts]
        })

        setCurrentPage((prevPage) => prevPage + 1)

        const currentTotal =
          products.length +
          data.products.filter(
            (p) => !products.some((existing) => existing.id === p.id)
          ).length

        setHasMoreData(currentTotal < data.total)
      } else {
        setHasMoreData(false)
      }
    } catch (error) {
      console.error("Error loading more products:", error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [
    isLoadingMore,
    hasMoreData,
    currentPage,
    fetchProducts,
    productParam,
    products,
  ])

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    resetPaginationState()

    try {
      await loadInitialProducts()
    } finally {
      setIsRefreshing(false)
    }
  }, [resetPaginationState, loadInitialProducts])

  const handleEndReached = useCallback(() => {
    if (hasMoreData && !isLoadingMore && !isRefreshing && !isInitialLoading) {
      loadMoreProducts()
    }
  }, [
    hasMoreData,
    isLoadingMore,
    isRefreshing,
    isInitialLoading,
    loadMoreProducts,
  ])

  const renderFooter = useCallback(() => {
    if (!isLoadingMore || isInitialLoading) return null

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={AppColors.primary[500]} />
        <Text style={[styles.footerText, { fontSize: config.bodyFontSize }]}>
          Loading more products...
        </Text>
      </View>
    )
  }, [isLoadingMore, isInitialLoading, config.bodyFontSize])

  const renderItem = useCallback(
    ({ item, index }: { item: Product; index: number }) => {
      if (isTablet) {
        // Calculate margin for grid layout
        const isLastInRow = (index + 1) % numColumns === 0
        const marginRight = isLastInRow ? 0 : gap

        return (
          <View
            style={{
              width: itemWidth,
              marginRight,
              marginBottom: gap,
            }}
          >
            <ProductCard product={item} customStyle={{ width: "100%" }} />
          </View>
        )
      }

      // Full-width card for phones
      return (
        <View style={[styles.phoneItem, { marginBottom: config.gap }]}>
          <BigProductCard product={item} />
        </View>
      )
    },
    [isTablet, numColumns, itemWidth, gap, config.gap]
  )

  const keyExtractor = useCallback((item: Product) => item.id.toString(), [])

  // Load initial products on focus
  useFocusEffect(
    useCallback(() => {
      const initLoad = async () => {
        setIsInitialLoading(true)
        resetPaginationState()
        await loadInitialProducts()
        setIsInitialLoading(false)
      }

      initLoad()
    }, [resetPaginationState, loadInitialProducts])
  )

  // Create a key for FlatList to force re-render when columns change
  const flatListKey = `scroll-product-list-${numColumns}`

  // Render skeleton loading grid
  const renderSkeleton = () => {
    if (isTablet) {
      return <ProductGridSkeleton count={isLandscape ? 8 : 6} />
    }

    // Phone skeleton - full width cards
    return (
      <View>
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={`skeleton-${index}`} style={{ marginBottom: config.gap }}>
            <ProductCardSkeleton variant="large" />
          </View>
        ))}
      </View>
    )
  }

  // Show skeleton while loading
  if (isInitialLoading) {
    return (
      <View style={styles.container}>
        {/* Results Count Skeleton */}
        <View
          style={[styles.resultsHeader, { marginBottom: isTablet ? 16 : 8 }]}
        >
          <SkeletonBase width={80} height={config.bodyFontSize + 2} />
        </View>

        {/* Skeleton Grid */}
        {renderSkeleton()}
      </View>
    )
  }

  // Show empty state if no products
  if (!isInitialLoading && products.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState message="No Products Found!" icon="cube-outline" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Results Count */}
      <View style={[styles.resultsHeader, { marginBottom: isTablet ? 12 : 8 }]}>
        <Text style={[styles.resultsText, { fontSize: config.bodyFontSize }]}>
          {totalProducts > 0
            ? `${totalProducts} results`
            : `${products.length} results`}
        </Text>
      </View>

      {/* Products List */}
      <FlatList
        key={flatListKey}
        data={products}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: isTablet ? (isLandscape ? 180 : 220) : 200,
          },
        ]}
        ListFooterComponent={renderFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        removeClippedSubviews={true}
        initialNumToRender={ITEMS_PER_PAGE}
        maxToRenderPerBatch={ITEMS_PER_PAGE}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={AppColors.primary[500]}
            colors={[AppColors.primary[500]]}
            progressBackgroundColor={AppColors.background.primary}
          />
        }
      />
    </View>
  )
}

export default ScrollProductList

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultsText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.secondary,
  },
  resultsTextSkeleton: {
    backgroundColor: AppColors.gray[200],
    borderRadius: 4,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 4,
  },
  phoneItem: {
    width: "100%",
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  footerText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.primary[500],
  },
  skeletonContainer: {
    paddingTop: 4,
  },
  skeletonRow: {
    flexDirection: "row",
  },
})
