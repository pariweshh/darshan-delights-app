// app/(tabs)/more/index.tsx

import { Ionicons } from "@expo/vector-icons"
import Constants from "expo-constants"
import { useRouter } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { useMemo } from "react"
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native"
import Toast from "react-native-toast-message"

import Wrapper from "@/src/components/common/Wrapper"
import Button from "@/src/components/ui/Button"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
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
  isTablet?: boolean
  config?: any
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
  isTablet = false,
  config,
}) => {
  const iconContainerSize = isTablet ? 42 : 36
  const iconSize = isTablet ? 24 : 22
  const chevronSize = isTablet ? 22 : 20
  const fontSize = config?.bodyFontSize || 15
  const badgeSize = isTablet ? 22 : 20

  return (
    <DebouncedTouchable
      style={[
        styles.menuItem,
        {
          paddingVertical: isTablet ? 16 : 14,
          paddingHorizontal: isTablet ? 18 : 16,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View
          style={[
            styles.menuIconContainer,
            {
              width: iconContainerSize,
              height: iconContainerSize,
              borderRadius: isTablet ? 12 : 10,
              marginRight: isTablet ? 14 : 12,
            },
          ]}
        >
          <Ionicons name={icon} size={iconSize} color={iconColor} />
        </View>
        <Text style={[styles.menuItemLabel, { color: labelColor, fontSize }]}>
          {label}
        </Text>
        {badge !== undefined && badge > 0 && (
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
            <Text style={[styles.badgeText, { fontSize: isTablet ? 12 : 11 }]}>
              {badge}
            </Text>
          </View>
        )}
      </View>
      {showChevron && (
        <Ionicons
          name="chevron-forward"
          size={chevronSize}
          color={AppColors.gray[400]}
        />
      )}
      {showArrow && (
        <Ionicons
          name="open-outline"
          size={chevronSize}
          color={AppColors.gray[400]}
        />
      )}
    </DebouncedTouchable>
  )
}

interface MenuSectionProps {
  title?: string
  children: React.ReactNode
  isTablet?: boolean
  config?: any
}

const MenuSection: React.FC<MenuSectionProps> = ({
  title,
  children,
  isTablet = false,
  config,
}) => (
  <View style={[styles.menuSection, { marginBottom: isTablet ? 24 : 20 }]}>
    {title && (
      <Text
        style={[
          styles.sectionTitle,
          {
            fontSize: isTablet ? 15 : 14,
            marginBottom: isTablet ? 10 : 8,
            marginLeft: isTablet ? 6 : 4,
          },
        ]}
      >
        {title}
      </Text>
    )}
    <View
      style={[
        styles.menuCard,
        { borderRadius: config?.cardBorderRadius + 4 || 16 },
      ]}
    >
      {children}
    </View>
  </View>
)

export default function MoreScreen() {
  const router = useRouter()
  const { config, isTablet, isLandscape } = useResponsive()
  const { user, token, logout, isLoading } = useAuthStore()
  const { unreadCount } = useNotificationStore()

  const appVersion = Constants.expoConfig?.version || "1.0.0"

  // For tablet landscape, use two-column layout
  const useColumnsLayout = isTablet && isLandscape

  // Content max width for tablet portrait
  const contentMaxWidth = isTablet && !isLandscape ? 600 : undefined

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
      console.error("Error opening product recalls:", error)
      Alert.alert("Error", "Unable to open product recalls")
    }
  }

  // Responsive sizes
  const avatarSize = isTablet ? 70 : 60
  const avatarFontSize = isTablet ? 24 : 20
  const guestIconContainerSize = isTablet ? 80 : 70
  const guestIconSize = isTablet ? 36 : 32

  // Render Profile Card
  const renderProfileCard = () => {
    if (token && user) {
      return (
        <DebouncedTouchable
          style={[
            styles.profileCard,
            {
              padding: isTablet ? 20 : 16,
              borderRadius: config.cardBorderRadius + 4,
              marginBottom: isTablet ? 28 : 24,
            },
          ]}
          onPress={handleGoToProfile}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.avatar,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                marginRight: isTablet ? 16 : 14,
              },
            ]}
          >
            <Text style={[styles.avatarText, { fontSize: avatarFontSize }]}>
              {initials}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text
              style={[styles.profileName, { fontSize: isTablet ? 19 : 17 }]}
            >
              {displayName}
            </Text>
            <Text
              style={[
                styles.profileEmail,
                { fontSize: config.bodyFontSize - 1 },
              ]}
            >
              {user?.email}
            </Text>
            <Text
              style={[
                styles.profileLink,
                {
                  fontSize: config.bodyFontSize - 1,
                  marginTop: isTablet ? 6 : 4,
                },
              ]}
            >
              View Profile
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={isTablet ? 26 : 24}
            color={AppColors.gray[400]}
          />
        </DebouncedTouchable>
      )
    }

    return (
      <View
        style={[
          styles.guestCard,
          {
            padding: isTablet ? 24 : 20,
            borderRadius: config.cardBorderRadius + 4,
            marginBottom: isTablet ? 28 : 24,
          },
        ]}
      >
        <View
          style={[
            styles.guestIconContainer,
            {
              width: guestIconContainerSize,
              height: guestIconContainerSize,
              borderRadius: guestIconContainerSize / 2,
              marginBottom: isTablet ? 16 : 12,
            },
          ]}
        >
          <Ionicons
            name="person-outline"
            size={guestIconSize}
            color={AppColors.gray[400]}
          />
        </View>
        <View style={styles.guestInfo}>
          <Text style={[styles.guestTitle, { fontSize: isTablet ? 19 : 17 }]}>
            Welcome to Darshan Delights
          </Text>
          <Text
            style={[
              styles.guestSubtitle,
              {
                fontSize: config.bodyFontSize - 1,
                marginTop: isTablet ? 6 : 4,
                lineHeight: isTablet ? 22 : 18,
              },
            ]}
          >
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
    )
  }

  // Render Account Section
  const renderAccountSection = () => (
    <MenuSection title="My Account" isTablet={isTablet} config={config}>
      <MenuItem
        icon="receipt-outline"
        label="My Orders"
        onPress={handleGoToOrders}
        isTablet={isTablet}
        config={config}
      />
      <View style={[styles.menuDivider, { marginLeft: isTablet ? 70 : 64 }]} />
      <MenuItem
        icon="heart-outline"
        label="My Favorites"
        onPress={handleGoToFavorites}
        isTablet={isTablet}
        config={config}
      />
      <View style={[styles.menuDivider, { marginLeft: isTablet ? 70 : 64 }]} />
      <MenuItem
        icon="chatbubble-outline"
        label="My Reviews"
        onPress={handleGoToReviews}
        isTablet={isTablet}
        config={config}
      />
      <View style={[styles.menuDivider, { marginLeft: isTablet ? 70 : 64 }]} />
      <MenuItem
        icon="notifications-outline"
        label="Notifications"
        onPress={handleGoToNotifications}
        badge={unreadCount}
        isTablet={isTablet}
        config={config}
      />
      <View style={[styles.menuDivider, { marginLeft: isTablet ? 70 : 64 }]} />
      <MenuItem
        icon="location-outline"
        label="Saved Addresses"
        onPress={handleGoToAddresses}
        isTablet={isTablet}
        config={config}
      />
    </MenuSection>
  )

  // Render Support Section
  const renderSupportSection = () => (
    <MenuSection title="Support" isTablet={isTablet} config={config}>
      <MenuItem
        icon="help-circle-outline"
        label="Help & Contact"
        onPress={handleGoToHelp}
        isTablet={isTablet}
        config={config}
      />
      <View style={[styles.menuDivider, { marginLeft: isTablet ? 70 : 64 }]} />
      <MenuItem
        icon="document-text-outline"
        label="Privacy Policy"
        onPress={handleOpenPrivacyPolicy}
        showChevron={false}
        showArrow={true}
        isTablet={isTablet}
        config={config}
      />
      <View style={[styles.menuDivider, { marginLeft: isTablet ? 70 : 64 }]} />
      <MenuItem
        icon="shield-checkmark-outline"
        label="Terms of Service"
        onPress={handleOpenTermsOfService}
        showChevron={false}
        showArrow={true}
        isTablet={isTablet}
        config={config}
      />
      <View style={[styles.menuDivider, { marginLeft: isTablet ? 70 : 64 }]} />
      <MenuItem
        icon="warning-outline"
        label="Product Recalls"
        onPress={handleOpenProductRecalls}
        showChevron={false}
        showArrow={true}
        isTablet={isTablet}
        config={config}
      />
    </MenuSection>
  )

  // Render Other Sections
  const renderOtherSections = () => (
    <>
      {/* Share Section */}
      <MenuSection isTablet={isTablet} config={config}>
        <MenuItem
          icon="share-social-outline"
          label="Share App"
          onPress={handleShareApp}
          showChevron={false}
          isTablet={isTablet}
          config={config}
        />
      </MenuSection>

      {/* Logout Section */}
      {token && user && (
        <MenuSection isTablet={isTablet} config={config}>
          <MenuItem
            icon="log-out-outline"
            label={isLoading ? "Logging out..." : "Logout"}
            onPress={handleLogout}
            showChevron={false}
            iconColor={AppColors.error}
            labelColor={AppColors.error}
            isTablet={isTablet}
            config={config}
          />
        </MenuSection>
      )}
    </>
  )

  // Render Version Info
  const renderVersionInfo = () => (
    <View
      style={[styles.versionContainer, { paddingVertical: isTablet ? 24 : 20 }]}
    >
      <Text style={[styles.versionText, { fontSize: config.bodyFontSize }]}>
        Darshan Delights
      </Text>
      <Text
        style={[
          styles.versionNumber,
          { fontSize: config.smallFontSize, marginTop: isTablet ? 4 : 2 },
        ]}
      >
        Version {appVersion}
      </Text>
    </View>
  )

  return (
    <Wrapper style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            padding: config.horizontalPadding,
            paddingBottom: isTablet ? 60 : 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {useColumnsLayout ? (
          // Tablet Landscape: Two-column layout
          <>
            {/* Profile Card - Full Width */}
            <View style={{ maxWidth: 700, alignSelf: "center", width: "100%" }}>
              {renderProfileCard()}
            </View>

            {/* Two Columns */}
            <View style={styles.columnsContainer}>
              {/* Left Column */}
              <View style={styles.column}>
                {renderAccountSection()}
                {renderOtherSections()}
              </View>

              {/* Right Column */}
              <View style={styles.column}>{renderSupportSection()}</View>
            </View>

            {renderVersionInfo()}
          </>
        ) : (
          // Phone & Tablet Portrait: Single column
          <View
            style={{
              maxWidth: contentMaxWidth,
              alignSelf: contentMaxWidth ? "center" : undefined,
              width: contentMaxWidth ? "100%" : undefined,
            }}
          >
            {renderProfileCard()}
            {renderAccountSection()}
            {renderSupportSection()}
            {renderOtherSections()}
            {renderVersionInfo()}
          </View>
        )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {},
  // Columns Layout (Tablet Landscape)
  columnsContainer: {
    flexDirection: "row",
    gap: 20,
  },
  column: {
    flex: 1,
  },
  // Profile Card
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    backgroundColor: AppColors.primary[500],
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Poppins_700Bold",
    color: "white",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  profileEmail: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    marginTop: 2,
  },
  profileLink: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[500],
  },
  // Guest Card
  guestCard: {
    backgroundColor: AppColors.background.primary,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  guestIconContainer: {
    backgroundColor: AppColors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  guestInfo: {
    alignItems: "center",
  },
  guestTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
    textAlign: "center",
  },
  guestSubtitle: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    textAlign: "center",
  },
  // Menu Section
  menuSection: {},
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: AppColors.background.primary,
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
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIconContainer: {
    backgroundColor: AppColors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemLabel: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: AppColors.gray[100],
  },
  badge: {
    backgroundColor: AppColors.error,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  badgeText: {
    fontFamily: "Poppins_600SemiBold",
    color: "white",
  },
  // Version
  versionContainer: {
    alignItems: "center",
  },
  versionText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.secondary,
  },
  versionNumber: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
  },
})
