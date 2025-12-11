import { Stack } from "expo-router"

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="popular-prods"
        options={{
          headerShown: true,
          title: "Popular Products",
          headerBackTitle: "Home",
        }}
      />
      <Stack.Screen
        name="weekly-sale"
        options={{
          headerShown: true,
          title: "Weekly Specials",
          headerBackTitle: "Home",
        }}
      />
    </Stack>
  )
}
