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

import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"
import { useFavoritesStore } from "@/src/store/favoritesStore"
import { IsIPAD } from "@/src/themes/app.constants"
import { Product } from "@/src/types"

import EmptyState from "@/src/components/common/EmptyState"
import Loader from "@/src/components/common/Loader"
import Wrapper from "@/src/components/common/Wrapper"
import ProductCard from "@/src/components/product/ProductCard"
import Button from "@/src/components/ui/Button"

export default function FavoritesScreenTab() {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  const { token, user } = useAuthStore()
  const { favoriteList, isLoading, fetchFavorites, resetFavorites } =
    useFavoritesStore()

  const favorites = favoriteList?.products || []
  const favoriteCount = favorites.length

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
    ({ item }: { item: Product }) => (
      <View style={styles.productContainer}>
        <ProductCard product={item} customStyle={styles.productCard} />
      </View>
    ),
    []
  )

  // Render header
  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.itemCount}>
        {favoriteCount} {favoriteCount === 1 ? "item" : "items"}
      </Text>
      {favoriteCount > 0 && (
        <TouchableOpacity
          onPress={handleClearAll}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  // Guest user - show login prompt
  if (!token || !user) {
    return (
      <Wrapper style={styles.container} edges={[]}>
        <View style={styles.guestContainer}>
          <View style={styles.guestIconContainer}>
            <Ionicons
              name="heart-outline"
              size={64}
              color={AppColors.gray[300]}
            />
          </View>
          <Text style={styles.guestTitle}>Save your favorites</Text>
          <Text style={styles.guestSubtitle}>
            Sign in to save products you love and access them anytime
          </Text>
          <Button
            title="Sign In"
            onPress={navigateToLogin}
            containerStyles="mt-6 px-12"
          />
          <TouchableOpacity
            style={styles.browseButton}
            onPress={navigateToShop}
            activeOpacity={0.7}
          >
            <Text style={styles.browseText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </Wrapper>
    )
  }

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
    <Wrapper style={styles.container} edges={[]}>
      {/* Favorites List */}
      <FlatList
        data={favorites}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        numColumns={IsIPAD ? 3 : 2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={<View style={{ height: 100 }} />}
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
    backgroundColor: AppColors.background.primary,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: AppColors.text.primary,
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
  // Guest styles
  guestContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  guestIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.gray[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  guestTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 22,
    color: AppColors.text.primary,
    marginBottom: 8,
  },
  guestSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  browseButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  browseText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: AppColors.primary[500],
  },
})
