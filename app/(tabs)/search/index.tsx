import { useCallback, useEffect, useState } from "react"
import { FlatList, Keyboard, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

import AppColors from "@/src/constants/Colors"
import { useDebounce } from "@/src/hooks/useDebounce"
import { useRecentSearches } from "@/src/hooks/useRecentSearches"
import { useProductsStore } from "@/src/store/productStore"
import { IsIPAD } from "@/src/themes/app.constants"
import { Product } from "@/src/types"

import EmptyState from "@/src/components/common/EmptyState"
import Loader from "@/src/components/common/Loader"
import ProductCard from "@/src/components/product/ProductCard"
import RecentSearches from "@/src/components/search/RecentSearches"
import SearchHeader from "@/src/components/search/SearchHeader"
import SearchSuggestions from "@/src/components/search/SearchSuggestions"

const MIN_SEARCH_LENGTH = 2

export default function SearchScreen() {
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
    ({ item }: { item: Product }) => (
      <View style={styles.productContainer}>
        <ProductCard product={item} customStyle={{ width: "100%" }} />
      </View>
    ),
    []
  )

  // Render initial state (no search yet)
  const renderInitialState = () => (
    <View style={styles.initialStateContainer}>
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
    </View>
  )

  // Show results or initial state
  const showResults = hasSearched && searchQuery.length >= MIN_SEARCH_LENGTH
  const showNoResults =
    showResults && filteredProducts?.length === 0 && !loading
  const showInitialState = !showResults

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
        <Loader text="Searching..." />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
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
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          numColumns={IsIPAD ? 3 : 2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsText}>
                {filteredProducts?.length || 0} results for "{searchQuery}"
              </Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 100 }} />}
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
  },
  listContent: {
    paddingHorizontal: 16,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  productContainer: {
    width: IsIPAD ? "32%" : "48%",
    marginBottom: 16,
  },
  resultsHeader: {
    paddingVertical: 12,
  },
  resultsText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
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
    fontSize: 16,
    color: AppColors.error,
    textAlign: "center",
  },
})
