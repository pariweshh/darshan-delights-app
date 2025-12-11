import AppColors from "@/src/constants/Colors"
import { Stack } from "expo-router"

export default function MoreLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: AppColors.background.primary,
        },
        headerTitleStyle: {
          fontFamily: "Poppins_600SemiBold",
          fontSize: 20,
          color: AppColors.text.primary,
        },
        headerTintColor: AppColors.primary[500],
        headerShadowVisible: false,
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "More",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: "My Profile",
        }}
      />
      <Stack.Screen
        name="security"
        options={{
          title: "Security",
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: "Notifications",
        }}
      />
      <Stack.Screen
        name="notification-preferences"
        options={{
          title: "Notifications",
        }}
      />
      <Stack.Screen
        name="orders"
        options={{
          title: "My Orders",
        }}
      />
      <Stack.Screen
        name="favorites"
        options={{
          title: "My Favorites",
        }}
      />
      <Stack.Screen
        name="reviews"
        options={{
          title: "My Reviews",
        }}
      />
      <Stack.Screen
        name="addresses"
        options={{
          title: "My Addresses",
        }}
      />
      <Stack.Screen
        name="address/add"
        options={{
          title: "Add Address",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="address/edit/[id]"
        options={{
          title: "Edit Address",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="help"
        options={{
          title: "Help & Contact",
        }}
      />
      <Stack.Screen
        name="help/contact"
        options={{
          title: "Contact Us",
        }}
      />
      <Stack.Screen
        name="help/faqs"
        options={{
          title: "FAQs",
        }}
      />
      <Stack.Screen
        name="help/feedback"
        options={{
          title: "Send Feedback",
        }}
      />
      <Stack.Screen
        name="help/refund-request"
        options={{
          title: "Request Refund",
        }}
      />
    </Stack>
  )
}
