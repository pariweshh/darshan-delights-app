import { Ionicons } from "@expo/vector-icons"
import { Tabs } from "expo-router"
import { Platform, Text, View } from "react-native"

import AppColors from "@/src/constants/Colors"
import { useCartStore } from "@/src/store/cartStore"
import { useNotificationStore } from "@/src/store/notificationStore"

export default function TabLayout() {
  const itemCount = useCartStore((state) => state.getItemCount())
  const { unreadCount } = useNotificationStore()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.primary[500],
        tabBarInactiveTintColor: AppColors.gray[400],
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: AppColors.gray[200],
          paddingBottom: Platform.OS === "ios" ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === "ios" ? 85 : 65,
        },
        tabBarLabelStyle: {
          fontFamily: "Poppins_500Medium",
          fontSize: 11,
        },
        headerShown: false,
      }}
    >
      {/* Visible tabs */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Ionicons
                name={focused ? "cart" : "cart-outline"}
                size={24}
                color={color}
              />
              {itemCount > 0 && (
                <View
                  style={{ backgroundColor: AppColors.primary[500] }}
                  className="absolute -top-1 -right-2 rounded-full w-5 h-5 items-center justify-center border border-gray-400"
                >
                  <Text className="text-[9px] text-white">{itemCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "menu" : "menu-outline"}
              size={24}
              color={color}
            />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: AppColors.primary[500],
            fontSize: 10,
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
