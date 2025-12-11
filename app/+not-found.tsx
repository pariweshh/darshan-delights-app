import { Ionicons } from "@expo/vector-icons"
import { Link, Stack } from "expo-router"
import { Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!", headerShown: false }} />
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          {/* Icon */}
          <View className="bg-primary-100 rounded-full p-6 mb-6">
            <Ionicons
              name="alert-circle-outline"
              size={64}
              color={AppColors.primary[500]}
            />
          </View>

          {/* Title */}
          <Text
            style={{ fontFamily: "Poppins_700Bold" }}
            className="text-2xl text-gray-900 text-center"
          >
            Page Not Found
          </Text>

          {/* Description */}
          <Text
            style={{ fontFamily: "Poppins_400Regular" }}
            className="text-gray-500 text-center mt-3 mb-8"
          >
            Sorry, the page you're looking for doesn't exist or has been moved.
          </Text>

          {/* Back to Home Button */}
          <Link href="/(tabs)/home" asChild>
            <Button
              title="Go to Home"
              icon={<Ionicons name="home-outline" size={20} color="white" />}
              containerStyles="w-full"
            />
          </Link>

          {/* Go Back Link */}
          <Link href="../" asChild>
            <Button
              title="Go Back"
              variant="ghost"
              containerStyles="w-full mt-4"
              textStyle={{ color: AppColors.primary[500] }}
            />
          </Link>
        </View>
      </SafeAreaView>
    </>
  )
}
