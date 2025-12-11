import { useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native"

import EmptyState from "@/src/components/common/EmptyState"
import AppColors from "@/src/constants/Colors"
import { useProductsStore } from "@/src/store/productStore"
import { IsIPAD } from "@/src/themes/app.constants"
import { Product, ProductParams } from "@/src/types"
import BigProductCard from "./BigProductCard"
import ProductCard from "./ProductCard"

interface ScrollProductListProps {
  productParam: Partial<ProductParams>
}

const ITEMS_PER_PAGE = 10

const ScrollProductList: React.FC<ScrollProductListProps> = ({
  productParam,
}) => {
  const { fetchProducts } = useProductsStore()

  const [products, setProducts] = useState<Product[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMoreData, setHasMoreData] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(false)
  const [totalProducts, setTotalProducts] = useState(0)

  const resetPaginationState = useCallback(() => {
    setProducts([])
    setCurrentPage(1)
    setHasMoreData(true)
    setIsLoadingMore(false)
    setTotalProducts(0)
  }, [])

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

  const handleEndReached = useCallback(() => {
    if (hasMoreData && !isLoadingMore) {
      loadMoreProducts()
    }
  }, [hasMoreData, isLoadingMore, loadMoreProducts])

  const renderFooter = useCallback(() => {
    if (!isLoadingMore || isInitialLoading) return null

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={AppColors.primary[500]} />
        <Text style={styles.footerText}>Loading more products...</Text>
      </View>
    )
  }, [isLoadingMore, isInitialLoading])

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <View
        style={[
          styles.itemContainer,
          IsIPAD ? styles.itemContainerIPad : styles.itemContainerPhone,
        ]}
      >
        {IsIPAD ? (
          <ProductCard product={item} customStyle={styles.ipadCard} />
        ) : (
          <BigProductCard product={item} />
        )}
      </View>
    ),
    []
  )

  const renderEmpty = useCallback(() => {
    if (isInitialLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary[500]} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      )
    }
    return <EmptyState message="No Products Found!" icon="cube-outline" />
  }, [isInitialLoading])

  const keyExtractor = useCallback((item: Product) => item.id.toString(), [])

  // Load initial products on focus
  useFocusEffect(
    useCallback(() => {
      const loadInitialProducts = async () => {
        try {
          setIsInitialLoading(true)

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
        } finally {
          setIsInitialLoading(false)
        }
      }

      resetPaginationState()
      loadInitialProducts()
    }, [fetchProducts, resetPaginationState, productParam])
  )

  return (
    <View style={styles.container}>
      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {totalProducts > 0
            ? `${totalProducts} results`
            : `${products.length} results`}
        </Text>
      </View>

      {/* Products List */}
      <FlatList
        data={products}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={IsIPAD ? 3 : 1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={IsIPAD ? styles.columnWrapper : undefined}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
        removeClippedSubviews={true}
        initialNumToRender={ITEMS_PER_PAGE}
        maxToRenderPerBatch={ITEMS_PER_PAGE}
        windowSize={4}
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
    marginVertical: 8,
  },
  resultsText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: IsIPAD ? 250 : 210,
    paddingHorizontal: IsIPAD ? 12 : 0,
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: "flex-start",
  },
  itemContainer: {
    marginBottom: 12,
  },
  itemContainerIPad: {
    flex: 1,
    maxWidth: "33.33%",
    paddingHorizontal: 4,
  },
  itemContainerPhone: {
    width: "100%",
  },
  ipadCard: {
    width: "96%",
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.primary[500],
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: AppColors.primary[500],
    marginTop: 16,
  },
})
