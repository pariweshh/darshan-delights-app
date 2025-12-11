import AppColors from "@/src/constants/Colors"
import { Stack } from "expo-router"

export default function ProductLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: AppColors.background.primary,
        },
      }}
    >
      <Stack.Screen name="index" />

      <Stack.Screen
        name="reviews"
        options={{
          headerShown: true,
          title: "Reviews",
          headerBackTitle: "Back",
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
        }}
      />

      <Stack.Screen
        name="nutrition"
        options={{
          headerShown: true,
          title: "Nutrition Info",
          headerBackTitle: "Back",
          headerTintColor: AppColors.primary[500],
          headerTitleStyle: {
            fontFamily: "Poppins_600SemiBold",
            fontSize: 16,
            color: AppColors.text.primary,
          },
          headerStyle: {
            backgroundColor: AppColors.background.primary,
          },
          headerShadowVisible: false,
        }}
      />
    </Stack>
  )
}
