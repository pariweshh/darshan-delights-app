import { memo, useCallback, useEffect, useMemo, useState } from "react"
import {
  FlatList,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

import EmptyState from "@/src/components/common/EmptyState"
import ProductCard from "@/src/components/product/ProductCard"
import RecentSearches from "@/src/components/search/RecentSearches"
import SearchHeader from "@/src/components/search/SearchHeader"
import SearchSuggestions from "@/src/components/search/SearchSuggestions"
import { ProductGridSkeleton, SkeletonBase } from "@/src/components/skeletons"
import AppColors from "@/src/constants/Colors"
import { useDebounce } from "@/src/hooks/useDebounce"
import { useRecentSearches } from "@/src/hooks/useRecentSearches"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useProductsStore } from "@/src/store/productStore"
import { Product } from "@/src/types"

const MIN_SEARCH_LENGTH = 2

interface ProductItemProps {
  item: Product
  index: number
  numColumns: number
  gap: number
  itemWidth: number
}

interface InitialStateProps {
  recentSearches: string[]
  onSearchSelect: (query: string) => void
  onRemoveSearch: (query: string) => void
  onClearAll: () => void
  onSuggestionSelect: (query: string) => void
}

interface SkeletonStateProps {
  horizontalPadding: number
  bodyFontSize: number
  paddingVertical: number
  skeletonCount: number
}

interface ResultsHeaderProps {
  count: number
  searchQuery: string
  fontSize: number
  paddingVertical: number
}

const ProductItem = memo(
  ({ item, index, numColumns, gap, itemWidth }: ProductItemProps) => {
    const isLastInRow = (index + 1) % numColumns === 0
    const marginRight = isLastInRow ? 0 : gap

    return (
      <View style={{ width: itemWidth, marginRight, marginBottom: gap }}>
        <ProductCard product={item} customStyle={{ width: "100%" }} />
      </View>
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.index === nextProps.index &&
      prevProps.numColumns === nextProps.numColumns &&
      prevProps.itemWidth === nextProps.itemWidth
    )
  }
)

const InitialState = memo(
  ({
    recentSearches,
    onSearchSelect,
    onRemoveSearch,
    onClearAll,
    onSuggestionSelect,
  }: InitialStateProps) => (
    <ScrollView
      style={styles.initialStateContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <RecentSearches
        searches={recentSearches}
        onSearchSelect={onSearchSelect}
        onRemoveSearch={onRemoveSearch}
        onClearAll={onClearAll}
      />

      <SearchSuggestions onSuggestionSelect={onSuggestionSelect} />

      {recentSearches.length === 0 && (
        <View style={styles.emptyImageContainer}>
          <EmptyState
            type="initialSearch"
            message="Find your favorites"
            subMessage="Search for products by name, category, or brand"
          />
        </View>
      )}
    </ScrollView>
  )
)

const SkeletonState = memo(
  ({
    horizontalPadding,
    bodyFontSize,
    paddingVertical,
    skeletonCount,
  }: SkeletonStateProps) => (
    <View
      style={[
        styles.skeletonContainer,
        { paddingHorizontal: horizontalPadding },
      ]}
    >
      <View style={[styles.resultsHeader, { paddingVertical }]}>
        <SkeletonBase width={150} height={bodyFontSize + 2} />
      </View>
      <ProductGridSkeleton count={skeletonCount} />
    </View>
  )
)

const ResultsHeader = memo(
  ({ count, searchQuery, fontSize, paddingVertical }: ResultsHeaderProps) => (
    <View style={[styles.resultsHeader, { paddingVertical }]}>
      <Text style={[styles.resultsText, { fontSize }]}>
        {count} results for "{searchQuery}"
      </Text>
    </View>
  )
)

interface ErrorStateProps {
  error: string
  fontSize: number
}

const ErrorState = memo(({ error, fontSize }: ErrorStateProps) => (
  <View style={styles.errorContainer}>
    <Text style={[styles.errorText, { fontSize }]}>{error}</Text>
  </View>
))

export default function SearchScreen() {
  const { config, isTablet, isLandscape, width } = useResponsive()
  const [searchQuery, setSearchQuery] = useState("")
  const [hasSearched, setHasSearched] = useState(false)

  // Debounce search query (300ms delay)
  const debouncedQuery = useDebounce(searchQuery, 300)

  // Recent searches hook
  const {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  } = useRecentSearches()

  // Product store
  const filteredProducts = useProductsStore((state) => state.filteredProducts)
  const loading = useProductsStore((state) => state.loading)
  const error = useProductsStore((state) => state.error)
  const searchProductsRealTime = useProductsStore(
    (state) => state.searchProductsRealTime
  )

  // Calculate grid columns based on device and orientation
  const numColumns = useMemo(
    () => (isTablet ? (isLandscape ? 4 : 3) : 2),
    [isTablet, isLandscape]
  )
  // Calculate item width for consistent grid
  const gridDimensions = useMemo(() => {
    const gap = config.gap
    const horizontalPadding = config.horizontalPadding
    const totalGaps = gap * (numColumns - 1)
    const containerWidth = width - horizontalPadding * 2
    const itemWidth = (containerWidth - totalGaps) / numColumns

    return { gap, horizontalPadding, itemWidth }
  }, [config.gap, config.horizontalPadding, numColumns, width])

  const skeletonCount = useMemo(
    () => (isTablet ? (isLandscape ? 8 : 6) : 6),
    [isTablet, isLandscape]
  )

  const showResults = useMemo(
    () => hasSearched && searchQuery.length >= MIN_SEARCH_LENGTH,
    [hasSearched, searchQuery.length]
  )

  const showNoResults = useMemo(
    () => showResults && filteredProducts?.length === 0 && !loading,
    [showResults, filteredProducts?.length, loading]
  )

  const showInitialState = !showResults

  const flatListKey = useMemo(
    () => `search-results-${numColumns}`,
    [numColumns]
  )

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= MIN_SEARCH_LENGTH) {
      searchProductsRealTime(debouncedQuery)
      setHasSearched(true)
    } else if (debouncedQuery.length === 0) {
      searchProductsRealTime("")
      setHasSearched(false)
    }
  }, [debouncedQuery, searchProductsRealTime])

  // Handlers
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchQuery("")
    setHasSearched(false)
    searchProductsRealTime("")
  }, [searchProductsRealTime])

  const handleSearch = useCallback(() => {
    Keyboard.dismiss()

    if (!searchQuery.trim()) {
      Toast.show({
        type: "info",
        text1: "Enter a search term",
        text2: "Please type something to search",
        visibilityTime: 2000,
      })
      return
    }

    if (searchQuery.trim().length < MIN_SEARCH_LENGTH) {
      Toast.show({
        type: "info",
        text1: "Search too short",
        text2: `Please enter at least ${MIN_SEARCH_LENGTH} characters`,
        visibilityTime: 2000,
      })
      return
    }

    addRecentSearch(searchQuery.trim())
    searchProductsRealTime(searchQuery.trim())
    setHasSearched(true)
  }, [searchQuery, addRecentSearch, searchProductsRealTime])

  const handleRecentSearchSelect = useCallback(
    (query: string) => {
      setSearchQuery(query)
      searchProductsRealTime(query)
      setHasSearched(true)
      Keyboard.dismiss()
    },
    [searchProductsRealTime]
  )

  const handleSuggestionSelect = useCallback(
    (query: string) => {
      setSearchQuery(query)
      addRecentSearch(query)
      searchProductsRealTime(query)
      setHasSearched(true)
      Keyboard.dismiss()
    },
    [addRecentSearch, searchProductsRealTime]
  )

  const handleClearRecentSearches = useCallback(() => {
    clearRecentSearches()
    Toast.show({
      type: "success",
      text1: "Search history cleared",
      visibilityTime: 1500,
    })
  }, [clearRecentSearches])

  // Render product item
  const renderProduct = useCallback(
    ({ item, index }: { item: Product; index: number }) => (
      <ProductItem
        item={item}
        index={index}
        numColumns={numColumns}
        gap={gridDimensions.gap}
        itemWidth={gridDimensions.itemWidth}
      />
    ),
    [numColumns, gridDimensions.gap, gridDimensions.itemWidth]
  )

  const keyExtractor = useCallback((item: Product) => item.id.toString(), [])

  const ListHeaderComponent = useMemo(
    () => (
      <ResultsHeader
        count={filteredProducts?.length || 0}
        searchQuery={searchQuery}
        fontSize={config.bodyFontSize}
        paddingVertical={isTablet ? 14 : 12}
      />
    ),
    [filteredProducts?.length, searchQuery, config.bodyFontSize, isTablet]
  )

  const ListFooterComponent = useMemo(
    () => <View style={{ height: isTablet ? 120 : 100 }} />,
    [isTablet]
  )

  // Render content based on state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <SearchHeader
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onClear={handleClearSearch}
          onSubmit={handleSearch}
        />
        <SkeletonState
          horizontalPadding={config.horizontalPadding}
          bodyFontSize={config.bodyFontSize}
          paddingVertical={isTablet ? 14 : 12}
          skeletonCount={skeletonCount}
        />
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <SearchHeader
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onClear={handleClearSearch}
          onSubmit={handleSearch}
        />
        <ErrorState error={error} fontSize={config.subtitleFontSize} />
      </SafeAreaView>
    )
  }

  if (showNoResults) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <SearchHeader
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onClear={handleClearSearch}
          onSubmit={handleSearch}
        />
        <EmptyState
          type="search"
          message="No products found"
          subMessage={`We couldn't find anything for "${searchQuery}"`}
          actionLabel="Clear Search"
          onAction={handleClearSearch}
        />
      </SafeAreaView>
    )
  }

  if (showInitialState) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <SearchHeader
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onClear={handleClearSearch}
          onSubmit={handleSearch}
        />
        <InitialState
          recentSearches={recentSearches}
          onSearchSelect={handleRecentSearchSelect}
          onRemoveSearch={removeRecentSearch}
          onClearAll={handleClearRecentSearches}
          onSuggestionSelect={handleSuggestionSelect}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Search Header */}
      <SearchHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onClear={handleClearSearch}
        onSubmit={handleSearch}
      />

      <FlatList
        key={flatListKey}
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: gridDimensions.horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={5}
        updateCellsBatchingPeriod={50}
        getItemLayout={undefined}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.primary,
  },
  initialStateContainer: {
    flex: 1,
  },
  emptyImageContainer: {
    flex: 1,
    justifyContent: "center",
    minHeight: 300,
  },
  listContent: {
    paddingTop: 4,
  },
  resultsHeader: {},
  resultsText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.error,
    textAlign: "center",
  },
  skeletonContainer: {
    flex: 1,
  },
})
