import { useResponsive } from "@/src/hooks/useResponsive"
import { Stack } from "expo-router"

export default function HomeLayout() {
  const { isTablet } = useResponsive()
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="popular-prods"
        options={{
          headerShown: isTablet ? false : true,
          title: "Popular Products",
          headerBackTitle: "Home",
        }}
      />
      <Stack.Screen
        name="weekly-sale"
        options={{
          headerShown: isTablet ? false : true,
          title: "Weekly Specials",
          headerBackTitle: "Home",
        }}
      />
    </Stack>
  )
}
