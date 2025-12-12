import { Ionicons } from "@expo/vector-icons"
import Constants from "expo-constants"
import { useRouter } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { useMemo } from "react"
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import Toast from "react-native-toast-message"

import Wrapper from "@/src/components/common/Wrapper"
import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"
import { useNotificationStore } from "@/src/store/notificationStore"
import { shareApp } from "@/src/utils/share"

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  onPress: () => void
  showChevron?: boolean
  showArrow?: boolean
  iconColor?: string
  labelColor?: string
  badge?: number
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  onPress,
  showChevron = true,
  showArrow = false,
  iconColor = AppColors.text.primary,
  labelColor = AppColors.text.primary,
  badge,
}) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.menuItemLeft}>
      <View style={styles.menuIconContainer}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={[styles.menuItemLabel, { color: labelColor }]}>{label}</Text>
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </View>
    {showChevron && (
      <Ionicons name="chevron-forward" size={20} color={AppColors.gray[400]} />
    )}

    {showArrow && (
      <Ionicons
        name="arrow-forward"
        size={20}
        color={AppColors.gray[400]}
        className="-rotate-45"
      />
    )}
  </TouchableOpacity>
)

const MenuSection: React.FC<{ title?: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <View style={styles.menuSection}>
    {title && <Text style={styles.sectionTitle}>{title}</Text>}
    <View style={styles.menuCard}>{children}</View>
  </View>
)

export default function MoreScreen() {
  const router = useRouter()
  const { user, token, logout, isLoading } = useAuthStore()
  const { unreadCount } = useNotificationStore()

  const appVersion = Constants.expoConfig?.version || "1.0.0"

  // Memoize user data
  const initials = useMemo(() => {
    if (!user?.fName || !user?.lName) return "?"
    return `${user.fName.charAt(0)}${user.lName.charAt(0)}`.toUpperCase()
  }, [user?.fName, user?.lName])

  const displayName = useMemo(() => {
    if (!user?.fName || !user?.lName) return "User"
    return `${user.fName} ${user.lName}`
  }, [user?.fName, user?.lName])

  // Navigation handlers
  const handleGoToProfile = () => {
    if (!token || !user) return
    router.push("/(tabs)/more/profile")
  }

  const handleGoToOrders = () => {
    if (!token || !user) {
      Toast.show({
        type: "info",
        text1: "Login Required",
        text2: "Please login to view your orders",
        visibilityTime: 2000,
      })
      return
    }
    router.push("/(tabs)/more/orders")
  }

  const handleGoToNotifications = () => {
    if (!token || !user) {
      Toast.show({
        type: "info",
        text1: "Login Required",
        text2: "Please login to view notifications",
        visibilityTime: 2000,
      })
      return
    }
    router.push("/(tabs)/more/notifications")
  }

  const handleGoToAddresses = () => {
    if (!token || !user) {
      Toast.show({
        type: "info",
        text1: "Login Required",
        text2: "Please login to manage addresses",
        visibilityTime: 2000,
      })
      return
    }
    router.push("/(tabs)/more/addresses")
  }

  const handleGoToFavorites = () => {
    router.push("/(tabs)/more/favorites")
  }
  const handleGoToReviews = () => {
    router.push("/(tabs)/more/reviews")
  }

  const handleGoToHelp = () => {
    router.push("/(tabs)/more/help")
  }

  const handleLogin = () => {
    router.push("/(auth)/login")
  }

  // Logout handler
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout()
            Toast.show({
              type: "success",
              text1: "Logged out",
              text2: "You have been successfully logged out",
              visibilityTime: 2000,
            })
          } catch (error) {
            console.error("Logout error:", error)
            Toast.show({
              type: "error",
              text1: "Logout failed",
              text2: "Please try again",
              visibilityTime: 2000,
            })
          }
        },
      },
    ])
  }

  // Share app handler
  const handleShareApp = async () => {
    const result = await shareApp()

    if (result.success) {
      Toast.show({
        type: "success",
        text1: "Thanks for sharing!",
        text2: "We appreciate you spreading the word 🙏",
        visibilityTime: 2000,
      })
    }
  }

  // Web browser handlers
  const handleOpenPrivacyPolicy = async () => {
    try {
      await WebBrowser.openBrowserAsync(
        "https://darshandelights.com.au/policies/privacy-policy"
      )
    } catch (error) {
      console.error("Error opening privacy policy:", error)
      Alert.alert("Error", "Unable to open privacy policy")
    }
  }

  const handleOpenTermsOfService = async () => {
    try {
      await WebBrowser.openBrowserAsync(
        "https://darshandelights.com.au/policies/terms-of-service"
      )
    } catch (error) {
      console.error("Error opening terms of service:", error)
      Alert.alert("Error", "Unable to open terms of service")
    }
  }
  const handleOpenProductRecalls = async () => {
    try {
      await WebBrowser.openBrowserAsync(
        "https://darshandelights.com.au/product-recalls"
      )
    } catch (error) {
      console.error("Error opening terms of service:", error)
      Alert.alert("Error", "Unable to open terms of service")
    }
  }

  return (
    <Wrapper style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        {token && user ? (
          <TouchableOpacity
            style={styles.profileCard}
            onPress={handleGoToProfile}
            activeOpacity={0.8}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <Text style={styles.profileLink}>View Profile</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={AppColors.gray[400]}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.guestCard}>
            <View style={styles.guestIconContainer}>
              <Ionicons
                name="person-outline"
                size={32}
                color={AppColors.gray[400]}
              />
            </View>
            <View style={styles.guestInfo}>
              <Text style={styles.guestTitle}>Welcome to Darshan Delights</Text>
              <Text style={styles.guestSubtitle}>
                Sign in to access your orders, favorites, and more
              </Text>
            </View>
            <Button
              title="Sign In"
              onPress={handleLogin}
              size="small"
              containerStyles="mt-3"
            />
          </View>
        )}

        {/* Account Section */}
        <MenuSection title="My Account">
          <MenuItem
            icon="receipt-outline"
            label="My Orders"
            onPress={handleGoToOrders}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="heart-outline"
            label="My Favorites"
            onPress={handleGoToFavorites}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="chatbubble-outline"
            label="My Reviews"
            onPress={handleGoToReviews}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            onPress={handleGoToNotifications}
            badge={unreadCount}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="location-outline"
            label="Saved Addresses"
            onPress={handleGoToAddresses}
          />
        </MenuSection>

        {/* Support Section */}
        <MenuSection title="Support">
          <MenuItem
            icon="help-circle-outline"
            label="Help & Contact"
            onPress={handleGoToHelp}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="document-text-outline"
            label="Privacy Policy"
            onPress={handleOpenPrivacyPolicy}
            showChevron={false}
            showArrow={true}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="shield-checkmark-outline"
            label="Terms of Service"
            onPress={handleOpenTermsOfService}
            showChevron={false}
            showArrow={true}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            label="Product Recalls"
            onPress={handleOpenProductRecalls}
            showChevron={false}
            showArrow={true}
          />
        </MenuSection>

        {/* Share Section */}
        <MenuSection>
          <MenuItem
            icon="share-social-outline"
            label="Share App"
            onPress={handleShareApp}
            showChevron={false}
          />
        </MenuSection>

        {/* Logout Section */}
        {token && user && (
          <MenuSection>
            <MenuItem
              icon="log-out-outline"
              label={isLoading ? "Logging out..." : "Logout"}
              onPress={handleLogout}
              showChevron={false}
              iconColor={AppColors.error}
              labelColor={AppColors.error}
            />
          </MenuSection>
        )}

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Darshan Delights</Text>
          <Text style={styles.versionNumber}>Version {appVersion}</Text>
        </View>
      </ScrollView>
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
    backgroundColor: AppColors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: AppColors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Profile Card
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: AppColors.primary[500],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "white",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    color: AppColors.text.primary,
  },
  profileEmail: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    marginTop: 2,
  },
  profileLink: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.primary[500],
    marginTop: 4,
  },
  // Guest Card
  guestCard: {
    backgroundColor: AppColors.background.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  guestIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: AppColors.gray[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  guestInfo: {
    alignItems: "center",
  },
  guestTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    color: AppColors.text.primary,
    textAlign: "center",
  },
  guestSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  // Menu Section
  menuSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.text.secondary,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: AppColors.background.primary,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: AppColors.gray[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuItemLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: AppColors.text.primary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: AppColors.gray[100],
    marginLeft: 64,
  },
  badge: {
    backgroundColor: AppColors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  badgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "white",
  },
  // Version
  versionContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  versionText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  versionNumber: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.tertiary,
    marginTop: 2,
  },
})
