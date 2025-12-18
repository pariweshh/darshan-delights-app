// app/(tabs)/more/favorites.tsx

import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useCallback, useState } from "react"
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import Toast from "react-native-toast-message"

import EmptyState from "@/src/components/common/EmptyState"
import Wrapper from "@/src/components/common/Wrapper"
import ProductCard from "@/src/components/product/ProductCard"
import { ProductGridSkeleton, SkeletonBase } from "@/src/components/skeletons"
import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"
import { useFavoritesStore } from "@/src/store/favoritesStore"
import { Product } from "@/src/types"

export default function FavoritesScreenTab() {
  const router = useRouter()
  const { config, isTablet, isLandscape, width } = useResponsive()
  const [refreshing, setRefreshing] = useState(false)

  const { token, user } = useAuthStore()
  const { favoriteList, isLoading, fetchFavorites, resetFavorites } =
    useFavoritesStore()

  const favorites = favoriteList?.products || []
  const favoriteCount = favorites.length

  // Calculate grid columns based on device and orientation
  const numColumns = isTablet ? (isLandscape ? 4 : 3) : 2

  // Calculate item width for consistent grid
  const gap = config.gap
  const horizontalPadding = config.horizontalPadding
  const totalGaps = gap * (numColumns - 1)
  const containerWidth = width - horizontalPadding * 2
  const itemWidth = (containerWidth - totalGaps) / numColumns

  // Content max width for tablet portrait
  const contentMaxWidth = isTablet && !isLandscape ? 600 : undefined

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
  const handleClearAll = () => {
    Alert.alert(
      "Clear Favorites",
      "Are you sure you want to remove all items from your favorites?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
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
  }

  // Navigate to shop
  const navigateToShop = () => {
    router.push("/shop")
  }

  // Navigate to login
  const navigateToLogin = () => {
    router.push("/(auth)/login")
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

  // Render header
  const renderHeader = () => (
    <View
      style={[
        styles.listHeader,
        {
          paddingVertical: isTablet ? 14 : 12,
          paddingHorizontal: isTablet ? 6 : 4,
        },
      ]}
    >
      <Text style={[styles.itemCount, { fontSize: config.bodyFontSize }]}>
        {favoriteCount} {favoriteCount === 1 ? "item" : "items"}
      </Text>
      {favoriteCount > 0 && (
        <TouchableOpacity
          onPress={handleClearAll}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text
            style={[styles.clearAllText, { fontSize: config.bodyFontSize }]}
          >
            Clear All
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )

  // Render skeleton loading
  const renderSkeleton = () => (
    <View
      style={[
        styles.skeletonContainer,
        {
          paddingHorizontal: config.horizontalPadding,
          maxWidth: contentMaxWidth,
          alignSelf: contentMaxWidth ? "center" : undefined,
          width: contentMaxWidth ? "100%" : undefined,
        },
      ]}
    >
      {/* Header skeleton */}
      <View
        style={[
          styles.listHeader,
          {
            paddingVertical: isTablet ? 14 : 12,
            paddingHorizontal: isTablet ? 6 : 4,
          },
        ]}
      >
        <SkeletonBase width={80} height={config.bodyFontSize + 2} />
      </View>

      <ProductGridSkeleton count={isTablet ? (isLandscape ? 8 : 6) : 6} />
    </View>
  )

  // Guest user - show login prompt
  if (!token || !user) {
    return (
      <Wrapper style={styles.container} edges={[]}>
        <View
          style={[
            styles.guestContainer,
            {
              padding: config.horizontalPadding + 8,
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
                fontSize: config.bodyFontSize,
                lineHeight: config.bodyFontSize * 1.5,
                paddingHorizontal: isTablet ? 24 : 20,
              },
            ]}
          >
            Sign in to save products you love and access them anytime
          </Text>
          <Button
            title="Sign In"
            onPress={navigateToLogin}
            containerStyles="mt-6 px-12"
          />
          <TouchableOpacity
            style={[
              styles.browseButton,
              { paddingVertical: isTablet ? 14 : 12 },
            ]}
            onPress={navigateToShop}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.browseText, { fontSize: config.bodyFontSize }]}
            >
              Browse Products
            </Text>
          </TouchableOpacity>
        </View>
      </Wrapper>
    )
  }

  // Loading state with skeleton
  if (isLoading && favoriteCount === 0) {
    return (
      <Wrapper style={styles.container} edges={[]}>
        {renderSkeleton()}
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

  // Create a key for FlatList to force re-render when columns change
  const flatListKey = `favorites-${numColumns}`

  return (
    <Wrapper style={styles.container} edges={[]}>
      <FlatList
        key={flatListKey}
        data={favorites}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingHorizontal: config.horizontalPadding,
            paddingBottom: isTablet ? 120 : 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
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
