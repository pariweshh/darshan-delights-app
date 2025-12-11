import AppColors from "@/src/constants/Colors"
import { Stack } from "expo-router"

export default function CartLayout() {
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
        headerBackTitle: "Cart",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Cart",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="select-shipping"
        options={{
          title: "Shipping Details",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="payment"
        options={{
          title: "Payment",
          headerShown: true,
        }}
      />
    </Stack>
  )
}
