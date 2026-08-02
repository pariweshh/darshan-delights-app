import { useCallback, useMemo, useState } from "react"
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
import { useInfiniteProducts } from "@/src/hooks/queries/useProducts"
import { useResponsive } from "@/src/hooks/useResponsive"
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
  const [isRefreshing, setIsRefreshing] = useState(false)

  const queryParams = useMemo(
    () => ({ ...productParam, limit: ITEMS_PER_PAGE, sort: 'id:asc' as const }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(productParam)]
  )

  const {
    data: productsData,
    isLoading: isInitialLoading,
    isFetchingNextPage: isLoadingMore,
    hasNextPage: hasMoreData,
    fetchNextPage,
    refetch,
  } = useInfiniteProducts(queryParams)

  const products = productsData?.pages.flatMap((p) => p.products) ?? []
  const totalProducts = productsData?.pages[0]?.total ?? 0

  // Calculate grid columns based on device and orientation
  const numColumns = isTablet ? (isLandscape ? 4 : 3) : 1

  // Calculate fixed item width for consistent card sizes
  const gap = config.gap
  const totalGaps = gap * (numColumns - 1)
  const containerWidth = width - config.horizontalPadding * 2
  const itemWidth = (containerWidth - totalGaps) / numColumns

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }, [refetch])

  const handleEndReached = useCallback(() => {
    if (hasMoreData && !isLoadingMore && !isRefreshing && !isInitialLoading) {
      fetchNextPage()
    }
  }, [hasMoreData, isLoadingMore, isRefreshing, isInitialLoading, fetchNextPage])

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={AppColors.primary[500]} />
        <Text style={[styles.footerText, { fontSize: config.bodyFontSize }]}>
          Loading more products...
        </Text>
      </View>
    )
  }, [isLoadingMore, config.bodyFontSize])

  const renderItem = useCallback(
    ({ item, index }: { item: Product; index: number }) => {
      if (isTablet) {
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

      return (
        <View style={[styles.phoneItem, { marginBottom: config.gap }]}>
          <BigProductCard product={item} />
        </View>
      )
    },
    [isTablet, numColumns, itemWidth, gap, config.gap]
  )

  const keyExtractor = useCallback((item: Product) => item.id.toString(), [])

  const flatListKey = `scroll-product-list-${numColumns}`

  const renderSkeleton = () => {
    if (isTablet) {
      return <ProductGridSkeleton count={isLandscape ? 8 : 6} />
    }

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

  if (isInitialLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.resultsHeader, { marginBottom: isTablet ? 16 : 8 }]}>
          <SkeletonBase width={80} height={config.bodyFontSize + 2} />
        </View>
        {renderSkeleton()}
      </View>
    )
  }

  if (products.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState message="No Products Found!" icon="cube-outline" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={[styles.resultsHeader, { marginBottom: isTablet ? 12 : 8 }]}>
        <Text style={[styles.resultsText, { fontSize: config.bodyFontSize }]}>
          {totalProducts > 0
            ? `${totalProducts} results`
            : `${products.length} results`}
        </Text>
      </View>

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
})
