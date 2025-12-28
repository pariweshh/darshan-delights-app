import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { memo, useCallback, useMemo, useState } from "react"
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import Toast from "react-native-toast-message"

import EmptyState from "@/src/components/common/EmptyState"
import Wrapper from "@/src/components/common/Wrapper"
import ProductCard from "@/src/components/product/ProductCard"
import { ProductGridSkeleton, SkeletonBase } from "@/src/components/skeletons"
import Button from "@/src/components/ui/Button"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"
import { useFavoritesStore } from "@/src/store/favoritesStore"
import { Product } from "@/src/types"

interface ProductItemProps {
  item: Product
  index: number
  numColumns: number
  gap: number
  itemWidth: number
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
      prevProps.item.stock === nextProps.item.stock &&
      prevProps.item.sale_price === nextProps.item.sale_price &&
      prevProps.index === nextProps.index &&
      prevProps.numColumns === nextProps.numColumns &&
      prevProps.itemWidth === nextProps.itemWidth
    )
  }
)

interface ListHeaderProps {
  favoriteCount: number
  paddingVertical: number
  paddingHorizontal: number
  fontSize: number
  onClearAll: () => void
}

const ListHeader = memo(
  ({
    favoriteCount,
    paddingVertical,
    paddingHorizontal,
    fontSize,
    onClearAll,
  }: ListHeaderProps) => (
    <View style={[styles.listHeader, { paddingVertical, paddingHorizontal }]}>
      <Text style={[styles.itemCount, { fontSize }]}>
        {favoriteCount} {favoriteCount === 1 ? "item" : "items"}
      </Text>
      {favoriteCount > 0 && (
        <DebouncedTouchable
          onPress={onClearAll}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.clearAllText, { fontSize }]}>Clear All</Text>
        </DebouncedTouchable>
      )}
    </View>
  )
)

// ==========================================
// Memoized Guest State Component
// ==========================================

interface GuestStateProps {
  isTablet: boolean
  horizontalPadding: number
  fontSize: number
  onLogin: () => void
  onBrowse: () => void
}

const GuestState = memo(
  ({
    isTablet,
    horizontalPadding,
    fontSize,
    onLogin,
    onBrowse,
  }: GuestStateProps) => (
    <View
      style={[
        styles.guestContainer,
        {
          padding: horizontalPadding + 8,
          maxWidth: isTablet ? 450 : undefined,
          alignSelf: isTablet ? "center" : undefined,
        },
      ]}
    >
      <View
        style={[
          styles.guestIconContainer,
          {
            width: isTablet ? 140 : 120,
            height: isTablet ? 140 : 120,
            borderRadius: isTablet ? 70 : 60,
            marginBottom: isTablet ? 28 : 24,
          },
        ]}
      >
        <Ionicons
          name="heart-outline"
          size={isTablet ? 72 : 64}
          color={AppColors.gray[300]}
        />
      </View>
      <Text
        style={[
          styles.guestTitle,
          { fontSize: isTablet ? 24 : 22, marginBottom: isTablet ? 10 : 8 },
        ]}
      >
        Save your favorites
      </Text>
      <Text
        style={[
          styles.guestSubtitle,
          {
            fontSize,
            lineHeight: fontSize * 1.5,
            paddingHorizontal: isTablet ? 24 : 20,
          },
        ]}
      >
        Sign in to save products you love and access them anytime
      </Text>
      <Button title="Sign In" onPress={onLogin} containerStyles="mt-6 px-12" />
      <DebouncedTouchable
        style={[styles.browseButton, { paddingVertical: isTablet ? 14 : 12 }]}
        onPress={onBrowse}
        activeOpacity={0.7}
      >
        <Text style={[styles.browseText, { fontSize }]}>Browse Products</Text>
      </DebouncedTouchable>
    </View>
  )
)

interface SkeletonStateProps {
  horizontalPadding: number
  paddingVertical: number
  paddingHorizontalHeader: number
  fontSize: number
  contentMaxWidth: number | undefined
  skeletonCount: number
}

const SkeletonState = memo(
  ({
    horizontalPadding,
    paddingVertical,
    paddingHorizontalHeader,
    fontSize,
    contentMaxWidth,
    skeletonCount,
  }: SkeletonStateProps) => (
    <View
      style={[
        styles.skeletonContainer,
        {
          paddingHorizontal: horizontalPadding,
          maxWidth: contentMaxWidth,
          alignSelf: contentMaxWidth ? "center" : undefined,
          width: contentMaxWidth ? "100%" : undefined,
        },
      ]}
    >
      <View
        style={[
          styles.listHeader,
          { paddingVertical, paddingHorizontal: paddingHorizontalHeader },
        ]}
      >
        <SkeletonBase width={80} height={fontSize + 2} />
      </View>
      <ProductGridSkeleton count={skeletonCount} />
    </View>
  )
)

export default function FavoritesScreenTab() {
  const router = useRouter()
  const { config, isTablet, isLandscape, width } = useResponsive()
  const [refreshing, setRefreshing] = useState(false)

  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const favoriteList = useFavoritesStore((state) => state.favoriteList)
  const isLoading = useFavoritesStore((state) => state.isLoading)
  const fetchFavorites = useFavoritesStore((state) => state.fetchFavorites)
  const resetFavorites = useFavoritesStore((state) => state.resetFavorites)

  const favorites = useMemo(
    () => favoriteList?.products || [],
    [favoriteList?.products]
  )
  const favoriteCount = favorites.length

  // Calculate grid columns based on device and orientation
  const numColumns = isTablet ? (isLandscape ? 4 : 3) : 2

  const gridConfig = useMemo(() => {
    const numColumns = isTablet ? (isLandscape ? 4 : 3) : 2
    const gap = config.gap
    const horizontalPadding = config.horizontalPadding
    const totalGaps = gap * (numColumns - 1)
    const containerWidth = width - horizontalPadding * 2
    const itemWidth = (containerWidth - totalGaps) / numColumns
    const contentMaxWidth = isTablet && !isLandscape ? 600 : undefined

    return {
      numColumns,
      gap,
      horizontalPadding,
      itemWidth,
      contentMaxWidth,
    }
  }, [isTablet, isLandscape, width, config.gap, config.horizontalPadding])

  const skeletonCount = useMemo(
    () => (isTablet ? (isLandscape ? 8 : 6) : 6),
    [isTablet, isLandscape]
  )

  const flatListKey = useMemo(
    () => `favorites-${gridConfig.numColumns}`,
    [gridConfig.numColumns]
  )

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    if (!token) return

    setRefreshing(true)
    try {
      await fetchFavorites(token)
    } catch (error) {
      console.error("Error refreshing favorites:", error)
    } finally {
      setRefreshing(false)
    }
  }, [token, fetchFavorites])

  // Clear all favorites with confirmation
  const handleClearAll = useCallback(() => {
    Alert.alert(
      "Clear Favorites",
      "Are you sure you want to remove all items from your favorites?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            resetFavorites()
            Toast.show({
              type: "success",
              text1: "Favorites cleared",
              text2: "All items have been removed from your favorites",
              visibilityTime: 2000,
            })
          },
        },
      ]
    )
  }, [resetFavorites])

  const navigateToShop = useCallback(() => {
    router.push("/shop")
  }, [router])

  const navigateToLogin = useCallback(() => {
    router.push("/(auth)/login")
  }, [router])

  // Memoize renderItem
  const renderProduct = useCallback(
    ({ item, index }: { item: Product; index: number }) => (
      <ProductItem
        item={item}
        index={index}
        numColumns={gridConfig.numColumns}
        gap={gridConfig.gap}
        itemWidth={gridConfig.itemWidth}
      />
    ),
    [gridConfig.numColumns, gridConfig.gap, gridConfig.itemWidth]
  )

  const keyExtractor = useCallback((item: Product) => item.id.toString(), [])

  // Memoize ListHeaderComponent
  const ListHeaderComponent = useMemo(
    () => (
      <ListHeader
        favoriteCount={favoriteCount}
        paddingVertical={isTablet ? 14 : 12}
        paddingHorizontal={isTablet ? 6 : 4}
        fontSize={config.bodyFontSize}
        onClearAll={handleClearAll}
      />
    ),
    [favoriteCount, isTablet, config.bodyFontSize, handleClearAll]
  )

  // Guest user - show login prompt
  if (!token || !user) {
    return (
      <Wrapper style={styles.container} edges={[]}>
        <GuestState
          isTablet={isTablet}
          horizontalPadding={config.horizontalPadding}
          fontSize={config.bodyFontSize}
          onLogin={navigateToLogin}
          onBrowse={navigateToShop}
        />
      </Wrapper>
    )
  }

  // Loading state
  if (isLoading && favoriteCount === 0) {
    return (
      <Wrapper style={styles.container} edges={[]}>
        <SkeletonState
          horizontalPadding={config.horizontalPadding}
          paddingVertical={isTablet ? 14 : 12}
          paddingHorizontalHeader={isTablet ? 6 : 4}
          fontSize={config.bodyFontSize}
          contentMaxWidth={gridConfig.contentMaxWidth}
          skeletonCount={skeletonCount}
        />
      </Wrapper>
    )
  }

  // Empty state
  if (favoriteCount === 0) {
    return (
      <Wrapper style={styles.container} edges={[]}>
        <EmptyState
          type="favorites"
          message="No favorites yet"
          subMessage="Tap the heart icon on products you love to save them here"
          actionLabel="Browse Products"
          onAction={navigateToShop}
        />
      </Wrapper>
    )
  }

  return (
    <Wrapper style={styles.container} edges={[]}>
      <FlatList
        key={flatListKey}
        data={favorites}
        renderItem={renderProduct}
        keyExtractor={keyExtractor}
        numColumns={gridConfig.numColumns}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingHorizontal: gridConfig.horizontalPadding,
            paddingBottom: isTablet ? 120 : 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeaderComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={AppColors.primary[500]}
            colors={[AppColors.primary[500]]}
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={5}
        updateCellsBatchingPeriod={50}
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
  listContent: {},
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemCount: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.secondary,
  },
  clearAllText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.error,
    textDecorationLine: "underline",
  },
  skeletonContainer: {
    flex: 1,
  },
  // Guest styles
  guestContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  guestIconContainer: {
    backgroundColor: AppColors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  guestTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  guestSubtitle: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    textAlign: "center",
  },
  browseButton: {
    marginTop: 16,
  },
  browseText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[500],
  },
})
