# Reviews & Notifications React Query Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace manual offset-pagination state machines (useState + direct API calls) in all reviews and notifications screens with `useInfiniteQuery`, and slim the `notificationStore` Zustand store to only hold cross-screen unread count state.

**Architecture:** Add two new hook files (`useReviews.ts`, `useNotifications.ts`) following the same pattern established by `useInfiniteProducts`. Each screen swaps its `fetchData(pageNum)` callback + 4-5 `useState` vars for a single `useInfiniteQuery` call. Sort/filter changes to query keys auto-reset pagination. The `notificationStore` is stripped from 15 actions to 4, retaining only the unread badge count (which must persist across screens and survive before the first API fetch).

**Tech Stack:** @tanstack/react-query v5 `useInfiniteQuery`, `useMutation`, `keepPreviousData`, existing API functions (`src/api/reviews.ts`, `src/api/notifications.ts`), Zustand, TypeScript

---

## Background: API pagination formats

**Reviews API** (`src/api/reviews.ts`): page-based, **0-indexed**.
```ts
getProductReviews(productId, page=0, pageSize=10, sortBy) → ProductReviewsResponse
// ProductReviewsResponse: { data: Review[], stats: ReviewStats, meta: { pagination: { page, pageSize, total, pageCount } } }

getUserReviews(token, page=0, pageSize=10) → { data: Review[], meta: any }
// meta.pagination has same shape: { page, pageSize, total, pageCount }
```

`getNextPageParam` for 0-indexed reviews:
```ts
getNextPageParam: (lastPage) => {
  if (lastPage.data.length < pageSize) return undefined
  const { page, pageCount } = lastPage.meta.pagination
  return page + 1 < pageCount ? page + 1 : undefined
}
```

**Notifications API** (`src/api/notifications.ts`): page-based, **1-indexed**.
```ts
getNotifications(token, page=1, pageSize=20) → NotificationResponse
// NotificationResponse: { data: Notification[], meta: { pagination: { page, pageSize, total, pageCount }, unreadCount: number } }
```

`getNextPageParam` for 1-indexed notifications:
```ts
getNextPageParam: (lastPage) => {
  if (lastPage.data.length < PAGE_SIZE) return undefined
  const { page, pageCount } = lastPage.meta.pagination
  return page < pageCount ? page + 1 : undefined
}
```

---

## File Structure

**New files:**
- `src/hooks/queries/useReviews.ts` — `REVIEWS_KEYS`, `useInfiniteProductReviews`, `useInfiniteUserReviews`, `useUserReviewStatus`, `useDeleteReview`
- `src/hooks/queries/useNotifications.ts` — `NOTIFICATIONS_KEYS`, `useInfiniteNotifications`, `useMarkNotificationRead`, `useMarkAllNotificationsRead`, `useDeleteNotification`

**Modified files:**
- `src/types/index.ts` — `selectedBrands?: any` → `selectedBrands?: string`
- `src/components/reviews/ProductReviews.tsx` — swap to `useInfiniteProductReviews` + `useUserReviewStatus`
- `app/product/[id]/reviews.tsx` — same swap, standalone screen with pull-to-refresh
- `app/(tabs)/more/reviews.tsx` — swap to `useInfiniteUserReviews`
- `app/(tabs)/more/notifications.tsx` — swap to `useInfiniteNotifications`, drop store data access
- `app/notifications.tsx` — same swap as above
- `src/store/notificationStore.ts` — slim to unread count only (done last, after both screens migrated)

---

## Task 1: Fix `selectedBrands` type

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Read the file around line 91**

```bash
sed -n '85,100p' /Users/pariwesh/projects/DARSHAN_DELIGHTS/darshan_delights_mobile/src/types/index.ts
```

Confirm you see `selectedBrands?: any` in the `ProductParams` interface.

- [ ] **Step 2: Fix the type**

In `src/types/index.ts`, change the `selectedBrands` field from `any` to `string`:

```ts
// Before
selectedBrands?: any

// After
selectedBrands?: string
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/pariwesh/projects/DARSHAN_DELIGHTS/darshan_delights_mobile && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "fix: type selectedBrands as string instead of any in ProductParams"
```

---

## Task 2: Add `useReviews.ts` hook file

**Files:**
- Create: `src/hooks/queries/useReviews.ts`

- [ ] **Step 1: Create the file**

Create `src/hooks/queries/useReviews.ts` with this exact content:

```ts
import {
  canUserReviewProduct,
  deleteReview,
  getProductReviews,
  getUserProductReview,
  getUserReviews,
} from '@/src/api/reviews'
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const REVIEWS_KEYS = {
  all: ['reviews'] as const,
  productLists: () => [...REVIEWS_KEYS.all, 'product'] as const,
  productInfinite: (productId: number, sortBy: string) =>
    [...REVIEWS_KEYS.productLists(), productId, 'infinite', sortBy] as const,
  userLists: () => [...REVIEWS_KEYS.all, 'user'] as const,
  userInfinite: (token: string | null) =>
    [...REVIEWS_KEYS.userLists(), 'infinite', token] as const,
  userProductReview: (productId: number, token: string | null) =>
    [...REVIEWS_KEYS.all, 'userProduct', productId, token] as const,
  canReview: (productId: number, token: string | null) =>
    [...REVIEWS_KEYS.all, 'canReview', productId, token] as const,
}

export function useInfiniteProductReviews({
  productId,
  sortBy,
  pageSize = 10,
}: {
  productId: number
  sortBy: 'newest' | 'oldest' | 'highest' | 'lowest'
  pageSize?: number
}) {
  return useInfiniteQuery({
    queryKey: REVIEWS_KEYS.productInfinite(productId, sortBy),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      getProductReviews(productId, pageParam, pageSize, sortBy),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.length < pageSize) return undefined
      const { page, pageCount } = lastPage.meta.pagination
      return page + 1 < pageCount ? page + 1 : undefined
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  })
}

export function useInfiniteUserReviews({
  token,
  pageSize = 10,
}: {
  token: string | null
  pageSize?: number
}) {
  return useInfiniteQuery({
    queryKey: REVIEWS_KEYS.userInfinite(token),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      getUserReviews(token!, pageParam, pageSize),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.length < pageSize) return undefined
      const { page, pageCount } = lastPage.meta.pagination
      return page + 1 < pageCount ? page + 1 : undefined
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  })
}

export function useUserReviewStatus(productId: number, token: string | null) {
  const { data: userReview, isSuccess: userReviewLoaded } = useQuery({
    queryKey: REVIEWS_KEYS.userProductReview(productId, token),
    queryFn: () => getUserProductReview(productId, token!),
    enabled: !!token && !!productId,
    staleTime: 1000 * 60 * 5,
  })

  const { data: reviewStatus } = useQuery({
    queryKey: REVIEWS_KEYS.canReview(productId, token),
    queryFn: () => canUserReviewProduct(productId, token!),
    enabled: !!token && !!productId && userReviewLoaded && !userReview,
    staleTime: 1000 * 60 * 5,
  })

  return {
    userReview: userReview ?? null,
    canReview: reviewStatus?.canReview ?? false,
    reviewOrderId: reviewStatus?.orderId,
  }
}

export function useDeleteReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, token }: { reviewId: number; token: string }) =>
      deleteReview(reviewId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REVIEWS_KEYS.productLists() })
      queryClient.invalidateQueries({ queryKey: REVIEWS_KEYS.userLists() })
    },
  })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/pariwesh/projects/DARSHAN_DELIGHTS/darshan_delights_mobile && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors referencing `useReviews.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/queries/useReviews.ts
git commit -m "feat: add useReviews hooks for infinite product and user review queries"
```

---

## Task 3: Migrate `ProductReviews` component

**Files:**
- Modify: `src/components/reviews/ProductReviews.tsx`

### Context

Current broken pattern (lines 47–98):
- 5 pagination `useState` vars: `reviews`, `isLoading`, `isLoadingMore`, `page`, `hasMore`
- `fetchReviews(pageNum, sort)` function with manual state branching
- Bug in current code: `if (pageNum === 1)` should be `if (pageNum === 0)` — sort changes call `fetchReviews(0, sort)` which hits the `else` branch and **appends** instead of resetting the list

What to replace it with:
```ts
const [sortBy, setSortBy] = useState<SortOption>('newest')
const [showSortPicker, setShowSortPicker] = useState(false)
// pagination state gone — useInfiniteProductReviews owns it

const {
  data: reviewsData,
  isLoading,
  isFetchingNextPage: isLoadingMore,
  hasNextPage: hasMore,
  fetchNextPage,
  refetch,
} = useInfiniteProductReviews({ productId, sortBy })

const reviews = reviewsData?.pages.flatMap((p) => p.data) ?? []
const stats = reviewsData?.pages[0]?.stats ?? null
```

- [ ] **Step 1: Read the current file**

```bash
cat -n src/components/reviews/ProductReviews.tsx
```

- [ ] **Step 2: Write the migrated file**

Replace `src/components/reviews/ProductReviews.tsx` with:

```tsx
import { Ionicons } from "@expo/vector-icons"
import React, { useCallback, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native"
import Toast from "react-native-toast-message"

import { deleteReview } from "@/src/api/reviews"
import AppColors from "@/src/constants/Colors"
import {
  REVIEWS_KEYS,
  useDeleteReview,
  useInfiniteProductReviews,
  useUserReviewStatus,
} from "@/src/hooks/queries/useReviews"
import { useAuthStore } from "@/src/store/authStore"
import EmptyState from "../common/EmptyState"
import DebouncedTouchable from "../ui/DebouncedTouchable"
import RatingSummary from "./RatingSummary"
import ReviewCard from "./ReviewCard"
import WriteReviewModal from "./WriteReviewModal"
import { useQueryClient } from "@tanstack/react-query"

interface ProductReviewsProps {
  productId: number
  productName: string
}

type SortOption = "newest" | "oldest" | "highest" | "lowest"

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
]

const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  productName,
}) => {
  const { token } = useAuthStore()
  const queryClient = useQueryClient()

  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [showSortPicker, setShowSortPicker] = useState(false)
  const [showWriteReview, setShowWriteReview] = useState(false)

  const {
    data: reviewsData,
    isLoading,
    isFetchingNextPage: isLoadingMore,
    hasNextPage: hasMore,
    fetchNextPage,
  } = useInfiniteProductReviews({ productId, sortBy })

  const reviews = reviewsData?.pages.flatMap((p) => p.data) ?? []
  const stats = reviewsData?.pages[0]?.stats ?? null

  const { userReview, canReview, reviewOrderId } = useUserReviewStatus(productId, token)

  const { mutate: deleteMutate } = useDeleteReview()

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort)
    setShowSortPicker(false)
  }

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      fetchNextPage()
    }
  }

  const handleReviewSuccess = () => {
    queryClient.invalidateQueries({ queryKey: REVIEWS_KEYS.productInfinite(productId, sortBy) })
    queryClient.invalidateQueries({ queryKey: REVIEWS_KEYS.userProductReview(productId, token) })
    queryClient.invalidateQueries({ queryKey: REVIEWS_KEYS.canReview(productId, token) })
  }

  const handleDeleteReview = async () => {
    if (!userReview || !token) return

    deleteMutate(
      { reviewId: userReview.id, token },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: REVIEWS_KEYS.userProductReview(productId, token) })
          queryClient.invalidateQueries({ queryKey: REVIEWS_KEYS.canReview(productId, token) })
          Toast.show({
            type: "success",
            text1: "Deleted",
            text2: "Your review has been deleted",
            visibilityTime: 2000,
          })
        },
        onError: () => {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to delete review",
            visibilityTime: 2000,
          })
        },
      }
    )
  }

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {stats && stats.totalReviews > 0 && <RatingSummary stats={stats} />}

      {token && (canReview || userReview) && (
        <DebouncedTouchable
          style={styles.writeReviewButton}
          onPress={() => setShowWriteReview(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={userReview ? "pencil" : "create-outline"}
            size={20}
            color={AppColors.primary[600]}
          />
          <Text style={styles.writeReviewText}>
            {userReview ? "Edit Your Review" : "Write a Review"}
          </Text>
        </DebouncedTouchable>
      )}

      {userReview && (
        <View style={styles.userReviewSection}>
          <Text style={styles.userReviewTitle}>Your Review</Text>
          <ReviewCard
            review={userReview}
            onEdit={() => setShowWriteReview(true)}
            onDelete={handleDeleteReview}
          />
        </View>
      )}

      {reviews.length > 0 && (
        <View style={styles.sortRow}>
          <Text style={styles.reviewCount}>
            {stats?.totalReviews || 0} Reviews
          </Text>
          <DebouncedTouchable
            style={styles.sortButton}
            onPress={() => setShowSortPicker(!showSortPicker)}
            activeOpacity={0.7}
          >
            <Text style={styles.sortLabel}>
              {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={AppColors.text.secondary}
            />
          </DebouncedTouchable>
        </View>
      )}

      {showSortPicker && (
        <View style={styles.sortPicker}>
          {SORT_OPTIONS.map((option) => (
            <DebouncedTouchable
              key={option.value}
              style={[
                styles.sortOption,
                sortBy === option.value && styles.sortOptionActive,
              ]}
              onPress={() => handleSortChange(option.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  sortBy === option.value && styles.sortOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
              {sortBy === option.value && (
                <Ionicons name="checkmark" size={16} color={AppColors.primary[600]} />
              )}
            </DebouncedTouchable>
          ))}
        </View>
      )}
    </View>
  )

  const renderItem = ({ item }: { item: any }) => {
    if (userReview && item.id === userReview.id) return null
    return <ReviewCard review={item} showActions={false} />
  }

  const renderEmpty = () => {
    if (isLoading) return null
    return (
      <EmptyState
        icon="chatbubble-outline"
        message="No Reviews Yet"
        subMessage="Be the first to review this product!"
      />
    )
  }

  const renderFooter = () => {
    if (!isLoadingMore) return null
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={AppColors.primary[500]} />
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary[500]} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      <WriteReviewModal
        visible={showWriteReview}
        onClose={() => setShowWriteReview(false)}
        onSuccess={handleReviewSuccess}
        productId={productId}
        productName={productName}
        existingReview={userReview}
        orderId={reviewOrderId}
      />
    </View>
  )
}

export default ProductReviews

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { padding: 40, alignItems: "center" },
  listContent: { flexGrow: 1 },
  headerContainer: { padding: 16 },
  writeReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: AppColors.primary[50],
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    borderWidth: 1,
    borderColor: AppColors.primary[200],
  },
  writeReviewText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.primary[600],
  },
  userReviewSection: { marginTop: 16 },
  userReviewTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.text.primary,
    marginBottom: 8,
  },
  sortRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
  reviewCount: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.text.primary,
  },
  sortButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  sortLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.text.secondary,
  },
  sortPicker: {
    backgroundColor: AppColors.background.primary,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    overflow: "hidden",
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  sortOptionActive: { backgroundColor: AppColors.primary[50] },
  sortOptionText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.primary,
  },
  sortOptionTextActive: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[600],
  },
  loadingFooter: { paddingVertical: 16, alignItems: "center" },
})
```

**What was removed vs old file:**
- Removed: `reviews`, `isLoading`, `isLoadingMore`, `page`, `hasMore` useState
- Removed: `fetchReviews` callback (and its bug where sort changes appended instead of reset)
- Removed: `checkUserReviewStatus` + its own useState (`userReview`, `canReview`, `reviewOrderId`, `showWriteReview` remain)
- Removed: `useEffect` that called both fetch functions
- Added: `useInfiniteProductReviews`, `useUserReviewStatus`, `useDeleteReview`
- Added: `useQueryClient` for cache invalidation on review write/delete
- Fixed bug: sort change now just calls `setSortBy` — React Query key change auto-resets pagination

Note: `WriteReviewModal`'s `onSuccess` prop type may be `(review: Review) => void`. Passing a `() => void` is valid TypeScript (fewer params is assignable). If TypeScript errors, add `(_review?: any) =>` signature.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/pariwesh/projects/DARSHAN_DELIGHTS/darshan_delights_mobile && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors referencing `ProductReviews.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/components/reviews/ProductReviews.tsx
git commit -m "refactor: migrate ProductReviews component to useInfiniteProductReviews"
```

---

## Task 4: Migrate `app/product/[id]/reviews.tsx`

**Files:**
- Modify: `app/product/[id]/reviews.tsx`

### Context

This is the standalone full-page reviews screen for a product. Almost identical logic to `ProductReviews.tsx` but with pull-to-refresh, a back button, and a full `Wrapper` layout.

Current state:
- 5 pagination state vars: `reviews`, `reviewStats`, `isLoading`, `isRefreshing`, `isLoadingMore`, `page`, `hasMore`
- `fetchReviews(pageNum, sort, refresh)` with manual branching
- Same `if (pageNum === 1 || refresh)` bug as `ProductReviews.tsx`
- User review state: `userReview`, `canReview`, `reviewOrderId`, `showWriteReviewModal` (keep all)

- [ ] **Step 1: Read the current file**

```bash
cat -n app/product/\[id\]/reviews.tsx
```

- [ ] **Step 2: Write the migrated file**

Replace `app/product/[id]/reviews.tsx` with:

```tsx
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import React, { useCallback, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import Toast from "react-native-toast-message"

import AppColors from "@/src/constants/Colors"
import {
  REVIEWS_KEYS,
  useDeleteReview,
  useInfiniteProductReviews,
  useUserReviewStatus,
} from "@/src/hooks/queries/useReviews"
import { useAuthStore } from "@/src/store/authStore"

import EmptyState from "@/src/components/common/EmptyState"
import Wrapper from "@/src/components/common/Wrapper"
import RatingSummary from "@/src/components/reviews/RatingSummary"
import ReviewCard from "@/src/components/reviews/ReviewCard"
import WriteReviewModal from "@/src/components/reviews/WriteReviewModal"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import { useQueryClient } from "@tanstack/react-query"

type SortOption = "newest" | "oldest" | "highest" | "lowest"

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
]

const PAGE_SIZE = 10

export default function ProductReviewsScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>()
  const { token } = useAuthStore()
  const queryClient = useQueryClient()

  const productId = Number(id)

  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [showSortPicker, setShowSortPicker] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showWriteReviewModal, setShowWriteReviewModal] = useState(false)

  const {
    data: reviewsData,
    isLoading,
    isFetchingNextPage: isLoadingMore,
    hasNextPage: hasMore,
    fetchNextPage,
    refetch,
  } = useInfiniteProductReviews({ productId, sortBy, pageSize: PAGE_SIZE })

  const reviews = reviewsData?.pages.flatMap((p) => p.data) ?? []
  const reviewStats = reviewsData?.pages[0]?.stats ?? null

  const { userReview, canReview, reviewOrderId } = useUserReviewStatus(productId, token)

  const { mutate: deleteMutate } = useDeleteReview()

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }, [refetch])

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore && !isRefreshing && !isLoading) {
      fetchNextPage()
    }
  }

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort)
    setShowSortPicker(false)
  }

  const handleReviewSuccess = () => {
    queryClient.invalidateQueries({ queryKey: REVIEWS_KEYS.productInfinite(productId, sortBy) })
    queryClient.invalidateQueries({ queryKey: REVIEWS_KEYS.userProductReview(productId, token) })
    queryClient.invalidateQueries({ queryKey: REVIEWS_KEYS.canReview(productId, token) })
  }

  const handleDeleteReview = async () => {
    if (!userReview || !token) return

    deleteMutate(
      { reviewId: userReview.id, token },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: REVIEWS_KEYS.userProductReview(productId, token) })
          queryClient.invalidateQueries({ queryKey: REVIEWS_KEYS.canReview(productId, token) })
          Toast.show({ type: "success", text1: "Deleted", text2: "Your review has been deleted", visibilityTime: 2000 })
        },
        onError: () => {
          Toast.show({ type: "error", text1: "Error", text2: "Failed to delete review", visibilityTime: 2000 })
        },
      }
    )
  }

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {reviewStats && reviewStats.totalReviews > 0 && (
        <RatingSummary stats={reviewStats} />
      )}

      {token && (canReview || userReview) && (
        <DebouncedTouchable
          style={styles.writeReviewButton}
          onPress={() => setShowWriteReviewModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={userReview ? "pencil" : "create-outline"}
            size={20}
            color={AppColors.primary[600]}
          />
          <Text style={styles.writeReviewText}>
            {userReview ? "Edit Your Review" : "Write a Review"}
          </Text>
        </DebouncedTouchable>
      )}

      {userReview && (
        <View style={styles.userReviewSection}>
          <Text style={styles.userReviewTitle}>Your Review</Text>
          <ReviewCard
            review={userReview}
            onEdit={() => setShowWriteReviewModal(true)}
            onDelete={handleDeleteReview}
          />
        </View>
      )}

      {reviews.length > 0 && (
        <View style={styles.sortRow}>
          <Text style={styles.reviewCountText}>
            {reviewStats?.totalReviews || 0} Reviews
          </Text>
          <DebouncedTouchable
            style={styles.sortButton}
            onPress={() => setShowSortPicker(!showSortPicker)}
            activeOpacity={0.7}
          >
            <Text style={styles.sortLabel}>
              {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
            </Text>
            <Ionicons
              name={showSortPicker ? "chevron-up" : "chevron-down"}
              size={16}
              color={AppColors.text.secondary}
            />
          </DebouncedTouchable>
        </View>
      )}

      {showSortPicker && (
        <View style={styles.sortPicker}>
          {SORT_OPTIONS.map((option) => (
            <DebouncedTouchable
              key={option.value}
              style={[
                styles.sortOption,
                sortBy === option.value && styles.sortOptionActive,
              ]}
              onPress={() => handleSortChange(option.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  sortBy === option.value && styles.sortOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
              {sortBy === option.value && (
                <Ionicons name="checkmark" size={16} color={AppColors.primary[600]} />
              )}
            </DebouncedTouchable>
          ))}
        </View>
      )}
    </View>
  )

  const renderItem = ({ item }: { item: any }) => {
    if (userReview && item.id === userReview.id) return null
    return <ReviewCard review={item} showActions={false} />
  }

  const renderEmpty = () => {
    if (isLoading) return null
    return (
      <EmptyState
        icon="chatbubble-outline"
        message="No Reviews Yet"
        subMessage="Be the first to review this product!"
      />
    )
  }

  const renderFooter = () => {
    if (!isLoadingMore) return null
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={AppColors.primary[500]} />
      </View>
    )
  }

  return (
    <Wrapper style={styles.container} edges={[]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary[500]} />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={
            reviews.length === 0 ? styles.emptyContainer : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[AppColors.primary[500]]}
              tintColor={AppColors.primary[500]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
        />
      )}

      <WriteReviewModal
        visible={showWriteReviewModal}
        onClose={() => setShowWriteReviewModal(false)}
        onSuccess={handleReviewSuccess}
        productId={productId}
        productName={name || "Product"}
        existingReview={userReview}
        orderId={reviewOrderId}
      />
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.secondary,
    borderTopWidth: 0.5,
    borderTopColor: AppColors.gray[200],
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
    marginTop: 12,
  },
  emptyContainer: { flexGrow: 1 },
  listContent: { paddingBottom: 16 },
  headerContainer: {
    padding: 16,
    backgroundColor: AppColors.background.secondary,
  },
  writeReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: AppColors.primary[50],
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    borderWidth: 1,
    borderColor: AppColors.primary[200],
  },
  writeReviewText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.primary[600],
  },
  userReviewSection: { marginTop: 16 },
  userReviewTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.text.primary,
    marginBottom: 8,
  },
  sortRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
  reviewCountText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.text.primary,
  },
  sortButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  sortLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.text.secondary,
  },
  sortPicker: {
    backgroundColor: AppColors.background.primary,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    overflow: "hidden",
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  sortOptionActive: { backgroundColor: AppColors.primary[50] },
  sortOptionText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.primary,
  },
  sortOptionTextActive: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[600],
  },
  loadingFooter: { paddingVertical: 16, alignItems: "center" },
})
```

**What was removed vs old file:**
- Removed: `reviews`, `reviewStats`, `isLoading`, `isRefreshing`, `isLoadingMore`, `page`, `hasMore`, `userReview`, `canReview`, `reviewOrderId` useState
- Removed: `fetchReviews` callback, `checkUserReviewStatus` callback, `useEffect` for initial fetch
- Added: `useInfiniteProductReviews`, `useUserReviewStatus`, `useDeleteReview`, `useQueryClient`
- `handleRefresh` now uses `refetch()` in try/finally
- `backButton` style removed (no longer used — back button is in the navigator header)

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/pariwesh/projects/DARSHAN_DELIGHTS/darshan_delights_mobile && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors referencing `app/product/[id]/reviews.tsx`.

- [ ] **Step 4: Commit**

```bash
git add "app/product/[id]/reviews.tsx"
git commit -m "refactor: migrate ProductReviewsScreen to useInfiniteProductReviews"
```

---

## Task 5: Migrate `app/(tabs)/more/reviews.tsx`

**Files:**
- Modify: `app/(tabs)/more/reviews.tsx`

### Context

This is the "My Reviews" screen showing the current user's own reviews. Uses `getUserReviews` API.

Current state: 5 pagination useState vars (`reviews`, `isLoading`, `isRefreshing`, `isLoadingMore`, `page`, `hasMore`), `fetchReviews(pageNum, refresh)` callback.

After migration: `useInfiniteUserReviews({ token })` replaces all pagination state. The derived list is `reviewsData?.pages.flatMap((p) => p.data) ?? []`.

The delete handler currently calls `setReviews((prev) => prev.filter(...))` optimistically then makes the API call. After migration, `useDeleteReview` mutation fires the API call — its `onSuccess` invalidates `REVIEWS_KEYS.userLists()` which triggers a refetch.

- [ ] **Step 1: Read the current file**

```bash
cat -n "app/(tabs)/more/reviews.tsx"
```

- [ ] **Step 2: Replace the data-fetching section**

The file is long due to the `ReviewItem`, `ListHeader`, `ListFooter`, and `SkeletonState` memo components at the top — **keep those unchanged**.

Only replace the `MyReviewsScreen` function body. Specifically:

**Remove these lines from the function body:**
```ts
const [reviews, setReviews] = useState<Review[]>([])
const [isLoading, setIsLoading] = useState(true)
const [isRefreshing, setIsRefreshing] = useState(false)
const [isLoadingMore, setIsLoadingMore] = useState(false)
const [page, setPage] = useState(0)
const [hasMore, setHasMore] = useState(true)
```

**Remove the `fetchReviews` useCallback and its `useEffect`.**

**Replace the data-fetching import section at the top of the file:**

Change:
```ts
import { deleteReview, getUserReviews } from "@/src/api/reviews"
```
To:
```ts
import { deleteReview } from "@/src/api/reviews"
import { useDeleteReview, useInfiniteUserReviews } from "@/src/hooks/queries/useReviews"
import { useQueryClient } from "@tanstack/react-query"
```

**Add after the `token` line inside `MyReviewsScreen`:**

```ts
const queryClient = useQueryClient()

const {
  data: reviewsData,
  isLoading,
  isFetchingNextPage: isLoadingMore,
  hasNextPage: hasMore,
  fetchNextPage,
  refetch,
} = useInfiniteUserReviews({ token })

const reviews = reviewsData?.pages.flatMap((p) => p.data) ?? []

const { mutate: deleteMutate } = useDeleteReview()
```

**Replace `handleRefresh`:**
```ts
const handleRefresh = useCallback(async () => {
  setIsRefreshing(true)
  try {
    await refetch()
  } finally {
    setIsRefreshing(false)
  }
}, [refetch])
```

Note: Keep `const [isRefreshing, setIsRefreshing] = useState(false)` — it's still needed for the RefreshControl UI state.

**Replace `handleLoadMore`:**
```ts
const handleLoadMore = useCallback(() => {
  if (!isLoadingMore && hasMore && !isLoading) {
    fetchNextPage()
  }
}, [isLoadingMore, hasMore, isLoading, fetchNextPage])
```

**Replace `handleDeleteReview`:**
```ts
const handleDeleteReview = useCallback(
  (review: Review) => {
    Alert.alert(
      "Delete Review",
      `Are you sure you want to delete your review for "${review.product?.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (!token) return
            deleteMutate(
              { reviewId: review.id, token },
              {
                onSuccess: () => {
                  Toast.show({
                    type: "success",
                    text1: "Deleted",
                    text2: "Your review has been deleted",
                    visibilityTime: 2000,
                  })
                },
                onError: () => {
                  Toast.show({
                    type: "error",
                    text1: "Error",
                    text2: "Failed to delete review",
                    visibilityTime: 2000,
                  })
                },
              }
            )
          },
        },
      ]
    )
  },
  [token, deleteMutate]
)
```

The rest of the render (layout config, renderItem, FlatList, etc.) stays unchanged.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/pariwesh/projects/DARSHAN_DELIGHTS/darshan_delights_mobile && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors referencing `reviews.tsx`.

- [ ] **Step 4: Commit**

```bash
git add "app/(tabs)/more/reviews.tsx"
git commit -m "refactor: migrate MyReviewsScreen to useInfiniteUserReviews"
```

---

## Task 6: Add `useNotifications.ts` hook file

**Files:**
- Create: `src/hooks/queries/useNotifications.ts`

### Context

Notifications API uses **1-indexed pages** (page 1 = first page). `NotificationResponse.meta.unreadCount` is the server-side unread count — only available from the API response, so it must be synced into the Zustand `notificationStore` after each fetch.

Optimistic updates for `useMarkNotificationRead` and `useDeleteNotification` update the React Query cache immediately so the UI updates without waiting for API confirmation.

- [ ] **Step 1: Create the file**

Create `src/hooks/queries/useNotifications.ts` with:

```ts
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/src/api/notifications'
import { NotificationResponse } from '@/src/types/notifications'
import {
  InfiniteData,
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

export const NOTIFICATIONS_KEYS = {
  all: ['notifications'] as const,
  lists: () => [...NOTIFICATIONS_KEYS.all, 'list'] as const,
  infinite: (token: string | null) =>
    [...NOTIFICATIONS_KEYS.lists(), token, 'infinite'] as const,
}

const PAGE_SIZE = 20

export function useInfiniteNotifications({
  token,
}: {
  token: string | null
}) {
  return useInfiniteQuery({
    queryKey: NOTIFICATIONS_KEYS.infinite(token),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      getNotifications(token!, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.length < PAGE_SIZE) return undefined
      const { page, pageCount } = lastPage.meta.pagination
      return page < pageCount ? page + 1 : undefined
    },
    enabled: !!token,
    staleTime: 1000 * 30,
    placeholderData: keepPreviousData,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      notificationId,
      token,
    }: {
      notificationId: number
      token: string
    }) => markNotificationAsRead(notificationId, token),
    onMutate: ({ notificationId }) => {
      queryClient.setQueriesData<InfiniteData<NotificationResponse>>(
        { queryKey: NOTIFICATIONS_KEYS.lists() },
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((n) =>
                n.id === notificationId
                  ? { ...n, isRead: true, readAt: new Date().toISOString() }
                  : n
              ),
            })),
          }
        }
      )
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ token }: { token: string }) =>
      markAllNotificationsAsRead(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEYS.lists() })
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      notificationId,
      token,
    }: {
      notificationId: number
      token: string
    }) => deleteNotification(notificationId, token),
    onMutate: ({ notificationId }) => {
      queryClient.setQueriesData<InfiniteData<NotificationResponse>>(
        { queryKey: NOTIFICATIONS_KEYS.lists() },
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.filter((n) => n.id !== notificationId),
            })),
          }
        }
      )
    },
  })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/pariwesh/projects/DARSHAN_DELIGHTS/darshan_delights_mobile && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors referencing `useNotifications.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/queries/useNotifications.ts
git commit -m "feat: add useNotifications hooks for infinite query and notification mutations"
```

---

## Task 7: Migrate `app/(tabs)/more/notifications.tsx`

**Files:**
- Modify: `app/(tabs)/more/notifications.tsx`

### Context

This screen currently reads the full notification list from `notificationStore` (Zustand) and calls `fetchNotifications(pageNum)` manually. It reads ~14 store selectors.

After migration:
- `notifications` list and pagination → from `useInfiniteNotifications`
- `unreadCount` → still from `notificationStore` (tab badge needs it cross-screen)
- `isLoading`, `hasMore`, `page` → from React Query
- `isLoadingMore` useState → replaced by `isFetchingNextPage`
- `markAsRead`, `removeNotification` store actions → replaced by React Query cache mutations
- `setLoading`, `setNotifications`, `addNotifications`, `setHasMore`, `setPage`, `incrementPage` → no longer called from this screen (store still has them until Task 9)

**New `unreadCount` sync:** When React Query fetches the first page, sync `meta.unreadCount` into the store via a `useEffect`.

- [ ] **Step 1: Read the current file**

```bash
cat -n "app/(tabs)/more/notifications.tsx"
```

- [ ] **Step 2: Update imports at the top**

Replace the imports section (keep all component/icon imports, replace store + API imports):

```ts
// Remove:
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/src/api/notifications"

// Add:
import {
  useDeleteNotification,
  useInfiniteNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/src/hooks/queries/useNotifications"
```

Also add `useEffect` to the React import if not already present, and add `useQueryClient` import from `@tanstack/react-query`:
```ts
import { useQueryClient } from "@tanstack/react-query"
```

- [ ] **Step 3: Replace the screen function body**

Replace the `NotificationsScreenTab` function body with:

```ts
export default function NotificationsScreenTab() {
  const router = useRouter()
  const pathname = usePathname()
  const { config, isTablet, isLandscape, width } = useResponsive()

  const token = useAuthStore((state) => state.token)

  // Only unreadCount and its setters come from Zustand (needed for tab badge)
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount)
  const decrementUnreadCount = useNotificationStore((state) => state.decrementUnreadCount)
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead)

  const [isRefreshing, setIsRefreshing] = useState(false)

  const {
    data: notificationsData,
    isLoading,
    isFetchingNextPage: isLoadingMore,
    hasNextPage: hasMore,
    fetchNextPage,
    refetch,
  } = useInfiniteNotifications({ token })

  const notifications = notificationsData?.pages.flatMap((p) => p.data) ?? []

  // Sync unread count from first page into Zustand (for tab badge)
  useEffect(() => {
    const firstPageUnread = notificationsData?.pages[0]?.meta.unreadCount
    if (firstPageUnread !== undefined) {
      setUnreadCount(firstPageUnread)
    }
  }, [notificationsData?.pages[0]?.meta.unreadCount, setUnreadCount])

  useEffect(() => {
    Notifications.setBadgeCountAsync(0)
  }, [])

  const { mutate: markReadMutate } = useMarkNotificationRead()
  const { mutate: markAllReadMutate } = useMarkAllNotificationsRead()
  const { mutate: deleteNotifMutate } = useDeleteNotification()

  // Layout configuration (unchanged)
  const layoutConfig = useMemo(() => {
    const useColumnsLayout = isTablet && isLandscape
    const numColumns = useColumnsLayout ? 2 : 1
    const contentMaxWidth = isTablet && !isLandscape ? 600 : undefined
    const gap = config.gap
    const containerPadding = config.horizontalPadding
    const itemWidth = useColumnsLayout
      ? (width - containerPadding * 2 - gap) / 2
      : undefined
    return { useColumnsLayout, numColumns, contentMaxWidth, gap, containerPadding, itemWidth }
  }, [isTablet, isLandscape, width, config.gap, config.horizontalPadding])

  const skeletonCount = useMemo(() => (isTablet ? 6 : 5), [isTablet])
  const flatListKey = useMemo(() => `notifications-${layoutConfig.numColumns}`, [layoutConfig.numColumns])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }, [refetch])

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading) {
      fetchNextPage()
    }
  }, [isLoadingMore, hasMore, isLoading, fetchNextPage])

  const handleNotificationPress = useCallback(
    async (notification: Notification) => {
      if (!notification.isRead && token) {
        markReadMutate(
          { notificationId: notification.id, token },
          {
            onSuccess: async () => {
              await Notifications.setBadgeCountAsync(Math.max(0, unreadCount - 1))
              decrementUnreadCount()
            },
          }
        )
      }

      if (notification.actionUrl && pathname !== "/more/notifications") {
        router.push(notification.actionUrl as any)
      } else if (notification.order) {
        router.push(`/(tabs)/more/orders?orderId=${notification.order.id}`)
      }
    },
    [token, unreadCount, pathname, router, markReadMutate, decrementUnreadCount]
  )

  const handleDeleteNotification = useCallback(
    (notification: Notification) => {
      Alert.alert(
        "Delete Notification",
        "Are you sure you want to delete this notification?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              if (!token) return
              deleteNotifMutate(
                { notificationId: notification.id, token },
                {
                  onSuccess: async () => {
                    if (!notification.isRead) {
                      decrementUnreadCount()
                      await Notifications.setBadgeCountAsync(Math.max(0, unreadCount - 1))
                    }
                    Toast.show({ type: "success", text1: "Deleted", text2: "Notification removed", visibilityTime: 1500 })
                  },
                  onError: () => {
                    Toast.show({ type: "error", text1: "Error", text2: "Failed to delete notification", visibilityTime: 2000 })
                  },
                }
              )
            },
          },
        ]
      )
    },
    [token, unreadCount, decrementUnreadCount, deleteNotifMutate]
  )

  const handleMarkAllAsRead = useCallback(async () => {
    if (!token || unreadCount === 0) return
    markAllReadMutate(
      { token },
      {
        onSuccess: async () => {
          await Notifications.setBadgeCountAsync(0)
          markAllAsRead()
          Toast.show({ type: "success", text1: "Done", text2: "All notifications marked as read", visibilityTime: 1500 })
        },
        onError: () => {
          Toast.show({ type: "error", text1: "Error", text2: "Failed to mark all as read", visibilityTime: 2000 })
        },
      }
    )
  }, [token, unreadCount, markAllAsRead, markAllReadMutate])

  // renderItem, keyExtractor, ListHeaderComponent, ListFooterComponent, ListEmptyComponent unchanged
  const renderItem = useCallback(
    ({ item, index }: { item: Notification; index: number }) => (
      <NotificationItem
        item={item}
        index={index}
        useColumnsLayout={layoutConfig.useColumnsLayout}
        numColumns={layoutConfig.numColumns}
        itemWidth={layoutConfig.itemWidth}
        gap={layoutConfig.gap}
        borderRadius={config.cardBorderRadius}
        onPress={handleNotificationPress}
        onDelete={handleDeleteNotification}
      />
    ),
    [layoutConfig, config.cardBorderRadius, handleNotificationPress, handleDeleteNotification]
  )

  const keyExtractor = useCallback((item: Notification) => item.id.toString(), [])

  const ListHeaderComponent = useMemo(
    () => (
      <ListHeader
        unreadCount={unreadCount}
        hasNotifications={notifications.length > 0}
        useColumnsLayout={layoutConfig.useColumnsLayout}
        horizontalPadding={config.horizontalPadding}
        paddingVertical={isTablet ? 14 : 12}
        fontSize={config.bodyFontSize}
        onMarkAllRead={handleMarkAllAsRead}
      />
    ),
    [unreadCount, notifications.length, layoutConfig.useColumnsLayout, config, isTablet, handleMarkAllAsRead]
  )

  const ListFooterComponent = useMemo(
    () => (
      <ListFooter
        isLoadingMore={isLoadingMore}
        fontSize={config.bodyFontSize}
        bottomHeight={isTablet ? 60 : 40}
      />
    ),
    [isLoadingMore, config.bodyFontSize, isTablet]
  )

  const ListEmptyComponent = useMemo(() => {
    if (isLoading) return null
    return (
      <EmptyState
        icon="notifications-outline"
        message="No Notifications"
        subMessage="You're all caught up! We'll notify you when there's something new."
      />
    )
  }, [isLoading])

  if (isLoading && notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <SkeletonState
          useColumnsLayout={layoutConfig.useColumnsLayout}
          numColumns={layoutConfig.numColumns}
          itemWidth={layoutConfig.itemWidth}
          gap={layoutConfig.gap}
          horizontalPadding={config.horizontalPadding}
          paddingVertical={isTablet ? 14 : 12}
          fontSize={config.bodyFontSize}
          borderRadius={config.cardBorderRadius}
          contentMaxWidth={layoutConfig.contentMaxWidth}
          skeletonCount={skeletonCount}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <FlatList
        key={flatListKey}
        data={notifications}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={layoutConfig.numColumns}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={[
          notifications.length === 0 ? styles.emptyContainer : styles.listContent,
          layoutConfig.useColumnsLayout && { padding: config.horizontalPadding },
          !layoutConfig.useColumnsLayout && notifications.length > 0 && {
            maxWidth: layoutConfig.contentMaxWidth,
            alignSelf: layoutConfig.contentMaxWidth ? "center" : undefined,
            width: layoutConfig.contentMaxWidth ? "100%" : undefined,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[AppColors.primary[500]]}
            tintColor={AppColors.primary[500]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={5}
        updateCellsBatchingPeriod={50}
      />
    </SafeAreaView>
  )
}
```

**What was removed vs old file:**
- Removed: ~14 store selectors (`notifications`, `isLoading`, `hasMore`, `page`, `setNotifications`, `addNotifications`, `setUnreadCount`, `setHasMore`, `setPage`, `incrementPage`, `setLoading`, `markAsRead`, `removeNotification`)
- Removed: `isLoadingMore` useState, `fetchNotifications` useCallback, `useEffect` for initial fetch
- Kept: `unreadCount`, `setUnreadCount`, `decrementUnreadCount`, `markAllAsRead` from store
- Added: `useInfiniteNotifications`, `useMarkNotificationRead`, `useMarkAllNotificationsRead`, `useDeleteNotification`
- Added: `useEffect` to sync `meta.unreadCount` from first page into Zustand

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/pariwesh/projects/DARSHAN_DELIGHTS/darshan_delights_mobile && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/more/notifications.tsx"
git commit -m "refactor: migrate NotificationsScreenTab to useInfiniteNotifications"
```

---

## Task 8: Migrate `app/notifications.tsx`

**Files:**
- Modify: `app/notifications.tsx`

### Context

`app/notifications.tsx` is a second notifications screen (standalone route, not in tabs). It follows the exact same Zustand-backed manual pagination pattern as the tab screen. Apply the same migration.

- [ ] **Step 1: Read the current file**

```bash
cat -n app/notifications.tsx
```

- [ ] **Step 2: Update imports**

Replace the notification-related imports:
```ts
// Remove:
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/src/api/notifications"

// Add:
import {
  useDeleteNotification,
  useInfiniteNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/src/hooks/queries/useNotifications"
```

- [ ] **Step 3: Replace the screen function body**

Following the exact same pattern as Task 7, replace the function body to:

1. Replace all store data selectors with only `unreadCount`, `setUnreadCount`, `decrementUnreadCount`, `markAllAsRead` from Zustand
2. Add `useInfiniteNotifications({ token })` and destructure `data: notificationsData`, `isLoading`, `isFetchingNextPage: isLoadingMore`, `hasNextPage: hasMore`, `fetchNextPage`, `refetch`
3. Derive `const notifications = notificationsData?.pages.flatMap((p) => p.data) ?? []`
4. Add `useEffect` to sync `notificationsData?.pages[0]?.meta.unreadCount` into `setUnreadCount`
5. Replace `handleRefresh` to use `refetch()` in try/finally
6. Replace `handleLoadMore` to use `fetchNextPage()`
7. Replace `handleNotificationPress` to use `markReadMutate` with `decrementUnreadCount()` in `onSuccess`
8. Replace `handleDeleteNotification` to use `deleteNotifMutate` with `decrementUnreadCount()` in `onSuccess` if unread
9. Replace `handleMarkAllAsRead` to use `markAllReadMutate` with `markAllAsRead()` in `onSuccess`
10. Remove all other store action calls (`setLoading`, `setNotifications`, `addNotifications`, `setHasMore`, `setPage`, `incrementPage`)

The rendering code (FlatList, `ListFooter`, `ListHeader` components) stays unchanged.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/pariwesh/projects/DARSHAN_DELIGHTS/darshan_delights_mobile && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors referencing `app/notifications.tsx`.

- [ ] **Step 5: Commit**

```bash
git add app/notifications.tsx
git commit -m "refactor: migrate NotificationsScreen to useInfiniteNotifications"
```

---

## Task 9: Slim `notificationStore.ts`

**Files:**
- Modify: `src/store/notificationStore.ts`

### Context

Both notifications screens now use React Query for the list. The store is only used for `unreadCount` (read by the tab badge in `app/(tabs)/_layout.tsx`) and three actions: `setUnreadCount`, `decrementUnreadCount`, `markAllAsRead`, `reset`.

**Before making any changes, verify no file still references the removed actions:**

```bash
grep -rn "setNotifications\|addNotifications\|setLoading\|setHasMore\|setPage\|incrementPage\|markAsRead\|removeNotification" \
  /Users/pariwesh/projects/DARSHAN_DELIGHTS/darshan_delights_mobile/app \
  /Users/pariwesh/projects/DARSHAN_DELIGHTS/darshan_delights_mobile/src \
  --include="*.tsx" --include="*.ts" | grep -v "notificationStore.ts" | grep -v "node_modules"
```

Expected: **no output**. If any file still references these, fix that file before proceeding.

- [ ] **Step 1: Replace the store file**

Replace `src/store/notificationStore.ts` with:

```ts
import { create } from "zustand"

interface NotificationState {
  unreadCount: number
  setUnreadCount: (count: number) => void
  decrementUnreadCount: () => void
  markAllAsRead: () => void
  reset: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,

  setUnreadCount: (count) => set({ unreadCount: count }),

  decrementUnreadCount: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

  markAllAsRead: () => set({ unreadCount: 0 }),

  reset: () => set({ unreadCount: 0 }),
}))
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/pariwesh/projects/DARSHAN_DELIGHTS/darshan_delights_mobile && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors. If there are errors about missing properties on `useNotificationStore`, check which file still references them and fix it.

- [ ] **Step 3: Commit**

```bash
git add src/store/notificationStore.ts
git commit -m "refactor: slim notificationStore to unread count only, data moved to React Query"
```

---

## Self-Review

**Spec coverage:**
- ✅ `selectedBrands?: any` → `string` (Task 1)
- ✅ `useInfiniteProductReviews` with sort-keyed auto-reset (Task 2)
- ✅ `useInfiniteUserReviews` for my reviews (Task 2)
- ✅ `useUserReviewStatus` combining user review + can-review queries (Task 2)
- ✅ `useDeleteReview` mutation with invalidation (Task 2)
- ✅ `ProductReviews` component migrated, sort-change bug fixed (Task 3)
- ✅ `ProductReviewsScreen` migrated with pull-to-refresh (Task 4)
- ✅ `MyReviewsScreen` migrated (Task 5)
- ✅ `useInfiniteNotifications` with 1-indexed pages (Task 6)
- ✅ Optimistic cache updates for mark-read and delete notifications (Task 6)
- ✅ `NotificationsScreenTab` migrated, store slimmed to unread count only (Tasks 7, 9)
- ✅ `NotificationsScreen` (standalone) migrated (Task 8)
- ✅ Tab badge still reads `unreadCount` from Zustand (unchanged in `_layout.tsx`)

**Placeholder scan:** None found — all code blocks are complete.

**Type consistency:**
- `REVIEWS_KEYS.productInfinite(productId, sortBy)` used in Tasks 3 and 4 — matches Task 2 definition ✅
- `REVIEWS_KEYS.userProductReview(productId, token)` — matches Task 2 definition ✅
- `REVIEWS_KEYS.canReview(productId, token)` — matches Task 2 definition ✅
- `NOTIFICATIONS_KEYS.lists()` in mutations — matches Task 6 definition ✅
- `useInfiniteNotifications({ token })` — matches Task 6 signature ✅
