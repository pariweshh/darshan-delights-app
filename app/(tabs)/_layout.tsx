import { Ionicons } from "@expo/vector-icons"
import { Tabs } from "expo-router"
import { Platform, Text, useWindowDimensions, View } from "react-native"

import AppColors from "@/src/constants/Colors"
import { useCartStore } from "@/src/store/cartStore"
import { useNotificationStore } from "@/src/store/notificationStore"

type DeviceType = "phone" | "tablet"

const getDeviceType = (width: number, height: number): DeviceType => {
  // Use the smaller dimension to determine device type (works for both orientations)
  const smallerDimension = Math.min(width, height)
  return smallerDimension >= 600 ? "tablet" : "phone"
}

interface TabBarConfig {
  height: number
  paddingBottom: number
  paddingTop: number
  iconSize: number
  fontSize: number
  badgeSize: number
  badgeFontSize: number
}

const getTabBarConfig = (
  deviceType: DeviceType,
  isLandscape: boolean
): TabBarConfig => {
  if (deviceType === "tablet") {
    return {
      height: Platform.OS === "ios" ? 90 : 85,
      paddingBottom: Platform.OS === "ios" ? 20 : 12,
      paddingTop: 12,
      iconSize: 28,
      fontSize: 13,
      badgeSize: 22,
      badgeFontSize: 11,
    }
  }

  // Phone - slightly smaller in landscape to save vertical space
  if (isLandscape) {
    return {
      height: Platform.OS === "ios" ? 70 : 65,
      paddingBottom: Platform.OS === "ios" ? 10 : 8,
      paddingTop: 8,
      iconSize: 22,
      fontSize: 10,
      badgeSize: 18,
      badgeFontSize: 9,
    }
  }

  // Phone portrait (default)
  return {
    height: Platform.OS === "ios" ? 85 : 80,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    paddingTop: 10,
    iconSize: 24,
    fontSize: 11,
    badgeSize: 20,
    badgeFontSize: 9,
  }
}

// ==========================================
// Tab Bar Icon Components
// ==========================================

interface TabIconProps {
  name: keyof typeof Ionicons.glyphMap
  focusedName: keyof typeof Ionicons.glyphMap
  color: string
  focused: boolean
  size: number
}

const TabIcon = ({ name, focusedName, color, focused, size }: TabIconProps) => (
  <Ionicons name={focused ? focusedName : name} size={size} color={color} />
)

interface CartIconProps {
  color: string
  focused: boolean
  size: number
  itemCount: number
  badgeSize: number
  badgeFontSize: number
}

const CartIcon = ({
  color,
  focused,
  size,
  itemCount,
  badgeSize,
  badgeFontSize,
}: CartIconProps) => (
  <View>
    <Ionicons
      name={focused ? "cart" : "cart-outline"}
      size={size}
      color={color}
    />
    {itemCount > 0 && (
      <View
        style={{
          backgroundColor: AppColors.primary[500],
          position: "absolute",
          top: -4,
          right: -8,
          borderRadius: badgeSize / 2,
          width: badgeSize,
          height: badgeSize,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: AppColors.gray[400],
        }}
      >
        <Text
          style={{
            fontSize: badgeFontSize,
            color: "white",
            fontFamily: "Poppins_500Medium",
          }}
        >
          {itemCount > 99 ? "99+" : itemCount}
        </Text>
      </View>
    )}
  </View>
)

export default function TabLayout() {
  const { width, height } = useWindowDimensions()
  const itemCount = useCartStore((state) => state.getItemCount())
  const { unreadCount } = useNotificationStore()

  // Calculate responsive values
  const isLandscape = width > height
  const deviceType = getDeviceType(width, height)
  const config = getTabBarConfig(deviceType, isLandscape)

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.primary[500],
        tabBarInactiveTintColor: AppColors.gray[400],
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: AppColors.gray[200],
          paddingBottom: config.paddingBottom,
          paddingTop: config.paddingTop,
          height: config.height,
        },
        tabBarLabelStyle: {
          fontFamily: "Poppins_500Medium",
          fontSize: config.fontSize,
        },
        headerShown: false,
        tabBarItemStyle: {
          paddingVertical: deviceType === "tablet" ? 4 : 2,
        },
      }}
    >
      {/* Visible tabs */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="home-outline"
              focusedName="home"
              color={color}
              focused={focused}
              size={config.iconSize}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="grid-outline"
              focusedName="grid"
              color={color}
              focused={focused}
              size={config.iconSize}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, focused }) => (
            <CartIcon
              color={color}
              focused={focused}
              size={config.iconSize}
              itemCount={itemCount}
              badgeSize={config.badgeSize}
              badgeFontSize={config.badgeFontSize}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="menu-outline"
              focusedName="menu"
              color={color}
              focused={focused}
              size={config.iconSize}
            />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: AppColors.primary[500],
            fontSize: config.badgeFontSize,
            minWidth: config.badgeSize,
            height: config.badgeSize,
            borderRadius: config.badgeSize / 2,
            lineHeight: config.badgeSize - 2,
          },
        }}
      />

      {/* Hidden Tabs - Still accessible via navigation but not shown in tab bar */}
      <Tabs.Screen
        name="search"
        options={{
          href: null, // This hides it from the tab bar
        }}
      />
    </Tabs>
  )
}
