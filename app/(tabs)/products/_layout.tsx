import AppColors from "@/src/constants/Colors"
import { Stack } from "expo-router"

export default function ProductsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: AppColors.background.primary,
        },
        headerTitleStyle: {
          fontFamily: "Poppins_600SemiBold",
          fontSize: 20,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Products",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="purchased-before"
        options={{
          title: "Purchased",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  )
}
