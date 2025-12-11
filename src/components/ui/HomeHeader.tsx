import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect } from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"
import { useCartStore } from "@/src/store/cartStore"
import { useFavoritesStore } from "@/src/store/favoritesStore"
import { useNotificationStore } from "@/src/store/notificationStore"
import Logo from "../common/Logo"

const HomeHeader = () => {
  const router = useRouter()
  const { cart, fetchCart } = useCartStore()
  const { token } = useAuthStore()
  const { favoriteList, fetchFavorites } = useFavoritesStore()
  const { unreadCount } = useNotificationStore()

  useEffect(() => {
    if (token) {
      fetchFavorites(token)
      fetchCart(token)
    }
  }, [token, fetchFavorites, fetchCart])

  const cartCount = cart?.length || 0
  const favCount = favoriteList?.products?.length || 0

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View style={styles.header}>
        <Logo />

        <View style={styles.iconContainer}>
          {/* Search Button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/(tabs)/search")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color={AppColors.primary[700]}
            />
          </TouchableOpacity>

          {token && (
            <>
              {/* Favorites Button */}
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push("/favorites")}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="heart-outline"
                  size={20}
                  color={AppColors.primary[700]}
                />
                {favCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {favCount > 99 ? "99+" : favCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Notifications Button */}
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push("/notifications")}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={20}
                  color={AppColors.primary[700]}
                />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Cart Button */}
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push("/(tabs)/cart")}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="cart-outline"
                  size={20}
                  color={AppColors.primary[700]}
                />
                {cartCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {cartCount > 99 ? "99+" : cartCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}

export default HomeHeader

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.primary[400],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    backgroundColor: AppColors.primary[50],
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: AppColors.primary[500],
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: AppColors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    color: "white",
    fontFamily: "Poppins_600SemiBold",
  },
})
