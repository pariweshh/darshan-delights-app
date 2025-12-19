import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect } from "react"
import { StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"
import { useCartStore } from "@/src/store/cartStore"
import { useFavoritesStore } from "@/src/store/favoritesStore"
import { useNotificationStore } from "@/src/store/notificationStore"
import Logo from "../common/Logo"
import DebouncedTouchable from "./DebouncedTouchable"

const HomeHeader = () => {
  const router = useRouter()
  const { config, isTablet } = useResponsive()
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

  const iconButtonSize = isTablet ? 48 : 40
  const iconSize = isTablet ? 24 : 20
  const badgeSize = isTablet ? 20 : 18

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View
        style={[styles.header, { paddingHorizontal: config.horizontalPadding }]}
      >
        <Logo />

        <View style={[styles.iconContainer, { gap: isTablet ? 12 : 8 }]}>
          {/* Search Button */}
          <DebouncedTouchable
            style={[
              styles.iconButton,
              { width: iconButtonSize, height: iconButtonSize },
            ]}
            onPress={() => router.push("/(tabs)/search")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="search-outline"
              size={iconSize}
              color={AppColors.primary[700]}
            />
          </DebouncedTouchable>

          {token && (
            <>
              {/* Favorites Button */}
              <DebouncedTouchable
                style={[
                  styles.iconButton,
                  { width: iconButtonSize, height: iconButtonSize },
                ]}
                onPress={() => router.push("/favorites")}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="heart-outline"
                  size={iconSize}
                  color={AppColors.primary[700]}
                />
                {favCount > 0 && (
                  <View
                    style={[
                      styles.badge,
                      {
                        minWidth: badgeSize,
                        height: badgeSize,
                        borderRadius: badgeSize / 2,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { fontSize: isTablet ? 11 : 10 },
                      ]}
                    >
                      {favCount > 99 ? "99+" : favCount}
                    </Text>
                  </View>
                )}
              </DebouncedTouchable>

              {/* Notifications Button */}
              <DebouncedTouchable
                style={[
                  styles.iconButton,
                  { width: iconButtonSize, height: iconButtonSize },
                ]}
                onPress={() => router.push("/notifications")}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={iconSize}
                  color={AppColors.primary[700]}
                />
                {unreadCount > 0 && (
                  <View
                    style={[
                      styles.badge,
                      {
                        minWidth: badgeSize,
                        height: badgeSize,
                        borderRadius: badgeSize / 2,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { fontSize: isTablet ? 11 : 10 },
                      ]}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                )}
              </DebouncedTouchable>

              {/* Cart Button */}
              <DebouncedTouchable
                style={[
                  styles.iconButton,
                  { width: iconButtonSize, height: iconButtonSize },
                ]}
                onPress={() => router.push("/(tabs)/cart")}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="cart-outline"
                  size={iconSize}
                  color={AppColors.primary[700]}
                />
                {cartCount > 0 && (
                  <View
                    style={[
                      styles.badge,
                      {
                        minWidth: badgeSize,
                        height: badgeSize,
                        borderRadius: badgeSize / 2,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { fontSize: isTablet ? 11 : 10 },
                      ]}
                    >
                      {cartCount > 99 ? "99+" : cartCount}
                    </Text>
                  </View>
                )}
              </DebouncedTouchable>
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
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    backgroundColor: AppColors.primary[50],
    borderRadius: 8,
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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "white",
    fontFamily: "Poppins_600SemiBold",
  },
})
