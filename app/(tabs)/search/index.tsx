import { useCallback, useEffect, useState } from "react"
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
  const { filteredProducts, loading, error, searchProductsRealTime } =
    useProductsStore()

  // Calculate grid columns based on device and orientation
  const numColumns = isTablet ? (isLandscape ? 4 : 3) : 2

  // Calculate item width for consistent grid
  const gap = config.gap
  const horizontalPadding = config.horizontalPadding
  const totalGaps = gap * (numColumns - 1)
  const containerWidth = width - horizontalPadding * 2
  const itemWidth = (containerWidth - totalGaps) / numColumns

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
  const handleSearchChange = (text: string) => {
    setSearchQuery(text)
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    setHasSearched(false)
    searchProductsRealTime("")
  }

  const handleSearch = () => {
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

    // Add to recent searches
    addRecentSearch(searchQuery.trim())
    searchProductsRealTime(searchQuery.trim())
    setHasSearched(true)
  }

  const handleRecentSearchSelect = (query: string) => {
    setSearchQuery(query)
    searchProductsRealTime(query)
    setHasSearched(true)
    Keyboard.dismiss()
  }

  const handleSuggestionSelect = (query: string) => {
    setSearchQuery(query)
    addRecentSearch(query)
    searchProductsRealTime(query)
    setHasSearched(true)
    Keyboard.dismiss()
  }

  const handleClearRecentSearches = () => {
    clearRecentSearches()
    Toast.show({
      type: "success",
      text1: "Search history cleared",
      visibilityTime: 1500,
    })
  }

  // Render product item
  const renderProduct = useCallback(
    ({ item, index }: { item: Product; index: number }) => {
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
    },
    [numColumns, itemWidth, gap]
  )

  // Render initial state (no search yet)
  const renderInitialState = () => (
    <ScrollView
      style={styles.initialStateContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Recent Searches */}
      <RecentSearches
        searches={recentSearches}
        onSearchSelect={handleRecentSearchSelect}
        onRemoveSearch={removeRecentSearch}
        onClearAll={handleClearRecentSearches}
      />

      {/* Popular Searches */}
      <SearchSuggestions onSuggestionSelect={handleSuggestionSelect} />

      {/* Empty State Image */}
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

  // Render loading skeleton
  const renderSkeleton = () => (
    <View
      style={[
        styles.skeletonContainer,
        { paddingHorizontal: config.horizontalPadding },
      ]}
    >
      {/* Results skeleton */}
      <View
        style={[styles.resultsHeader, { paddingVertical: isTablet ? 14 : 12 }]}
      >
        <SkeletonBase width={150} height={config.bodyFontSize + 2} />
      </View>

      <ProductGridSkeleton count={isTablet ? (isLandscape ? 8 : 6) : 6} />
    </View>
  )

  // Show results or initial state
  const showResults = hasSearched && searchQuery.length >= MIN_SEARCH_LENGTH
  const showNoResults =
    showResults && filteredProducts?.length === 0 && !loading
  const showInitialState = !showResults

  // Create a key for FlatList to force re-render when columns change
  const flatListKey = `search-results-${numColumns}`

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Search Header */}
      <SearchHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onClear={handleClearSearch}
        onSubmit={handleSearch}
      />

      {/* Content */}
      {loading ? (
        renderSkeleton()
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text
            style={[styles.errorText, { fontSize: config.subtitleFontSize }]}
          >
            {error}
          </Text>
        </View>
      ) : showNoResults ? (
        <EmptyState
          type="search"
          message="No products found"
          subMessage={`We couldn't find anything for "${searchQuery}"`}
          actionLabel="Clear Search"
          onAction={handleClearSearch}
        />
      ) : showInitialState ? (
        renderInitialState()
      ) : (
        <FlatList
          key={flatListKey}
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          numColumns={numColumns}
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: config.horizontalPadding },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={
            <View
              style={[
                styles.resultsHeader,
                { paddingVertical: isTablet ? 14 : 12 },
              ]}
            >
              <Text
                style={[styles.resultsText, { fontSize: config.bodyFontSize }]}
              >
                {filteredProducts?.length || 0} results for "{searchQuery}"
              </Text>
            </View>
          }
          ListFooterComponent={
            <View style={{ height: isTablet ? 120 : 100 }} />
          }
        />
      )}
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
