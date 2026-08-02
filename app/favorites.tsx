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

import AppColors from "@/src/constants/Colors"
import { useFavorites, useToggleFavorite } from "@/src/hooks/queries/useFavorites"
import { useAuthStore } from "@/src/store/authStore"
import { IsIPAD } from "@/src/themes/app.constants"
import { Product } from "@/src/types"

import EmptyState from "@/src/components/common/EmptyState"
import Loader from "@/src/components/common/Loader"
import Wrapper from "@/src/components/common/Wrapper"
import ProductCard from "@/src/components/product/ProductCard"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"

interface ProductItemProps {
  item: Product
}

const ProductItem = memo(
  ({ item }: ProductItemProps) => (
    <View style={styles.productContainer}>
      <ProductCard product={item} customStyle={styles.productCard} />
    </View>
  ),
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.stock === nextProps.item.stock &&
      prevProps.item.sale_price === nextProps.item.sale_price
    )
  }
)

interface ListHeaderProps {
  favoriteCount: number
  onClearAll: () => void
}

const ListHeader = memo(({ favoriteCount, onClearAll }: ListHeaderProps) => (
  <View style={styles.listHeader}>
    <Text style={styles.itemCount}>
      {favoriteCount} {favoriteCount === 1 ? "item" : "items"}
    </Text>
    {favoriteCount > 0 && (
      <DebouncedTouchable
        onPress={onClearAll}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.clearAllText}>Clear All</Text>
      </DebouncedTouchable>
    )}
  </View>
))

export default function FavoritesScreen() {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  const token = useAuthStore((state) => state.token)

  const {
    data: favoritesData,
    isLoading,
    refetch,
  } = useFavorites({ token, enabled: !!token })

  const toggleFavoriteMutation = useToggleFavorite()
  const { mutateAsync: toggleMutateAsync } = toggleFavoriteMutation

  const favorites = favoritesData?.products ?? []
  const favoriteCount = favorites.length
  const numColumns = IsIPAD ? 3 : 2

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    if (!token) return
    setRefreshing(true)
    try {
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }, [token, refetch])

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
          onPress: async () => {
            if (!token) return
            try {
              for (const product of favorites) {
                await toggleMutateAsync({ productId: product.id, token })
              }
              Toast.show({
                type: "success",
                text1: "Favorites cleared",
                text2: "All items have been removed from your favorites",
                visibilityTime: 2000,
              })
            } catch {
              await refetch()
              Toast.show({
                type: "error",
                text1: "Partial failure",
                text2: "Some items may not have been removed. Pull to refresh.",
                visibilityTime: 3000,
              })
            }
          },
        },
      ]
    )
  }, [token, favorites, toggleMutateAsync, refetch])

  const navigateToShop = useCallback(() => {
    router.push("/shop")
  }, [router])

  // Memoize renderItem
  const renderProduct = useCallback(
    ({ item }: { item: Product }) => <ProductItem item={item} />,
    []
  )

  const keyExtractor = useCallback((item: Product) => item.id.toString(), [])

  // Memoize ListHeaderComponent
  const ListHeaderComponent = useMemo(
    () => (
      <ListHeader favoriteCount={favoriteCount} onClearAll={handleClearAll} />
    ),
    [favoriteCount, handleClearAll]
  )

  // Memoize ListFooterComponent
  const ListFooterComponent = useMemo(
    () => <View style={{ height: 100 }} />,
    []
  )

  // Loading state
  if (isLoading && favoriteCount === 0) {
    return (
      <Wrapper style={styles.container} edges={[]}>
        <Loader text="Loading favorites..." />
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
    <>
      <Wrapper style={styles.container} edges={[]}>
        {/* Favorites List */}
        <FlatList
          key={`favorites-${numColumns}`}
          data={favorites}
          renderItem={renderProduct}
          keyExtractor={keyExtractor}
          numColumns={numColumns}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={ListFooterComponent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={AppColors.primary[500]}
              colors={[AppColors.primary[500]]}
            />
          }
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          initialNumToRender={10}
          windowSize={5}
          updateCellsBatchingPeriod={50}
        />
      </Wrapper>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.secondary,
    borderTopWidth: 0.5,
    borderTopColor: AppColors.gray[200],
  },
  listContent: {
    paddingHorizontal: 16,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  itemCount: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  clearAllText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.error,
    textDecorationLine: "underline",
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  productContainer: {
    width: IsIPAD ? "32%" : "48%",
  },
  productCard: {
    width: "100%",
  },
})
