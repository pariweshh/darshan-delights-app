# Infinite Query Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace manual offset-based pagination (local `useState` + direct `getProducts` API calls) in `ShopScreen` and `ScrollProductList` with `useInfiniteQuery` from React Query.

**Architecture:** Add a `useInfiniteProducts` hook to the existing `useProducts.ts` hook file. Both screens swap their manual state machine (`products`, `currentPage`, `hasMoreData`, `isLoadingMore`, `isInitialLoading`) for the hook's data, and call `fetchNextPage()` / `refetch()` instead of their own `loadInitialProducts` / `loadMoreProducts` functions. Changing filter params changes the query key, which automatically resets pagination — no manual reset logic needed.

**Tech Stack:** @tanstack/react-query v5 `useInfiniteQuery`, existing `getProducts` API function, Expo Router, TypeScript

---

## File Structure

**Modified:**
- `src/hooks/queries/useProducts.ts` — add `useInfiniteProducts` hook
- `app/shop/index.tsx` — swap manual pagination for `useInfiniteProducts`
- `src/components/product/ScrollProductList.tsx` — swap manual pagination for `useInfiniteProducts`

**Unchanged:** `src/api/products.ts`, `src/types/index.ts`, all other files.

---

## Background: current `getProducts` API response shape

```ts
// src/api/products.ts returns:
{ products: Product[], total: number }

// ProductParams (src/types/index.ts):
interface ProductParams {
  start?: number   // offset
  limit?: number
  sort?: string
  category?: string
  selectedBrands?: any
  query?: string
  // ...other optional fields
}
```

---

## Task 1: Add `useInfiniteProducts` hook

**Files:**
- Modify: `src/hooks/queries/useProducts.ts`

- [ ] **Step 1: Read the current file**

```bash
cat src/hooks/queries/useProducts.ts
```

Confirm it exports `PRODUCTS_KEYS`, `useProducts`, `useProductById`, `useProductBySlug`, `useCategories`, `useBrands`, `useProductsInvalidate`. These must remain unchanged.

- [ ] **Step 2: Add the hook**

Append the following export to the bottom of `src/hooks/queries/useProducts.ts`:

```ts
export function useInfiniteProducts(params: Omit<ProductParams, 'start'>) {
  return useInfiniteQuery({
    queryKey: [...PRODUCTS_KEYS.lists(), 'infinite', params] as const,
    queryFn: ({ pageParam }: { pageParam: number }) =>
      getProducts({ ...params, start: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.flatMap((p) => p.products).length
      return fetched < lastPage.total ? fetched : undefined
    },
    staleTime: 1000 * 30,
  })
}
```

Also add `useInfiniteQuery` to the existing import from `@tanstack/react-query` at the top of the file. The current import is:
```ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
```
Change it to:
```ts
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/pariwesh/projects/DARSHAN_DELIGHTS/darshan_delights_mobile && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors referencing `useProducts.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/queries/useProducts.ts
git commit -m "feat: add useInfiniteProducts hook for cursor-based product pagination"
```

---

## Task 2: Migrate `ScrollProductList` to `useInfiniteProducts`

**Files:**
- Modify: `src/components/product/ScrollProductList.tsx`

### Context

Current broken pattern in this file (lines 33–79, 58–203):
- 7 `useState` variables manage pagination: `products`, `currentPage`, `hasMoreData`, `isLoadingMore`, `isInitialLoading`, `isRefreshing`, `totalProducts`
- `loadInitialProducts` calls `getProducts({ ...productParam, limit, start: 0 })`
- `loadMoreProducts` calls `getProducts({ ...productParam, limit, start: (currentPage-1)*ITEMS_PER_PAGE })`
- `useFocusEffect` calls `loadInitialProducts` on every focus

### What to replace it with

```ts
const {
  data: productsData,
  isLoading: isInitialLoading,
  isFetchingNextPage: isLoadingMore,
  hasNextPage: hasMoreData,
  fetchNextPage,
  refetch,
} = useInfiniteProducts({ ...productParam, limit: ITEMS_PER_PAGE, sort: 'id:asc' })

const products = productsData?.pages.flatMap((p) => p.products) ?? []
const totalProducts = productsData?.pages[0]?.total ?? 0
```

- [ ] **Step 1: Read the file**

```bash
cat src/components/product/ScrollProductList.tsx
```

- [ ] **Step 2: Write the migrated file**

Replace the entire file content with:

```tsx
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

  const {
    data: productsData,
    isLoading: isInitialLoading,
    isFetchingNextPage: isLoadingMore,
    hasNextPage: hasMoreData,
    fetchNextPage,
    refetch,
  } = useInfiniteProducts({ ...productParam, limit: ITEMS_PER_PAGE, sort: 'id:asc' })

  const products = productsData?.pages.flatMap((p) => p.products) ?? []
  const totalProducts = productsData?.pages[0]?.total ?? 0

  // Calculate grid columns based on device and orientation
  const numColumns = isTablet ? (isLandscape ? 4 : 3) : 1

  // Calculate fixed item width for consistent card sizes
  const gap = config.gap
  const totalGaps = gap * (numColumns - 1)
  const containerWidth = width - config.horizontalPadding * 2
  const itemWidth = (containerWidth - totalGaps) / numColumns

  // Pull to refresh handler
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

  // Refetch on focus — same behaviour as before
  useFocusEffect(
    useCallback(() => {
      refetch()
    }, [refetch])
  )

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
```

**What was removed vs old file:**
- Removed: `getProducts` direct import
- Removed: `products`, `currentPage`, `hasMoreData`, `isLoadingMore`, `isInitialLoading`, `totalProducts` state variables
- Removed: `resetPaginationState`, `loadInitialProducts`, `loadMoreProducts` functions
- Removed: dead `styles.resultsTextSkeleton`, `styles.skeletonContainer`, `styles.skeletonRow` style entries
- Added: `useInfiniteProducts` hook call
- Simplified: `useFocusEffect` now just calls `refetch()`
- Simplified: `handleRefresh` now uses `try/finally` around `refetch()`

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/pariwesh/projects/DARSHAN_DELIGHTS/darshan_delights_mobile && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors referencing `ScrollProductList.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/components/product/ScrollProductList.tsx
git commit -m "refactor: migrate ScrollProductList to useInfiniteProducts"
```

---

## Task 3: Migrate `ShopScreen` to `useInfiniteProducts`

**Files:**
- Modify: `app/shop/index.tsx`

### Context

Current broken pattern (lines 74–214):
- 6 `useState` variables: `products`, `currentPage`, `hasMoreData`, `isLoadingMore`, `isInitialLoading`, `totalProducts`
- `buildApiParams()` computes filter params from `selectedCategory`, `selectedBrands`, `activeSortOption`
- `loadInitialProducts()` calls `getProducts` at offset 0, resets state
- `loadMoreProducts()` calls `getProducts` at `currentPage * ITEMS_PER_PAGE`
- `useEffect` watching filter state calls `loadInitialProducts()`

### Key insight

Changing the React Query query key automatically resets the infinite query and fetches from page 0. So a `useMemo` that computes filter params serves as the query key — no manual reset logic needed.

- [ ] **Step 1: Read the current file**

```bash
cat app/shop/index.tsx
```

- [ ] **Step 2: Write the migrated file**

Replace the entire file content with:

```tsx
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

  // Apply URL params once brands have loaded
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

  // Filter params — changing this object changes the query key which auto-resets pagination
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
    refetch,
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
          getItemLayout={undefined}
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
```

**What was removed vs old file:**
- Removed: `getProducts` direct API import
- Removed: `products`, `currentPage`, `hasMoreData`, `isLoadingMore`, `isInitialLoading`, `totalProducts` state variables
- Removed: `paramsApplied` state → still kept (needed for URL params one-shot application)
- Removed: `buildApiParams` function
- Removed: `loadInitialProducts`, `loadMoreProducts` functions
- Removed: `useEffect` watching filter state to reload products
- Added: `useMemo` computing `filterParams` (serves as query key)
- Added: `useInfiniteProducts(filterParams)` hook call
- Pull-to-refresh: removed — shop screen didn't have pull-to-refresh in the original; `RefreshControl` was not present

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/pariwesh/projects/DARSHAN_DELIGHTS/darshan_delights_mobile && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors referencing `shop/index.tsx`.

- [ ] **Step 4: Commit**

```bash
git add app/shop/index.tsx
git commit -m "refactor: migrate ShopScreen to useInfiniteProducts with automatic filter-keyed pagination reset"
```
