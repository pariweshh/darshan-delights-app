import { Link, useRouter } from "expo-router"
import { useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"

export default function LoginScreen() {
  const router = useRouter()
  const { login, isLoading, error, clearError } = useAuthStore()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter your email and password")
      return
    }

    clearError()
    const result = await login(email.trim(), password)

    if (result?.user) {
      router.replace("/(tabs)/home")
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-10">
            {/* Header */}
            <View className="mb-10">
              <Text
                style={{ fontFamily: "Poppins_700Bold" }}
                className="text-3xl text-gray-900"
              >
                Welcome Back
              </Text>
              <Text
                style={{ fontFamily: "Poppins_400Regular" }}
                className="text-gray-500 mt-2"
              >
                Sign in to continue shopping
              </Text>
            </View>

            {/* Error Message */}
            {error && (
              <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <Text
                  style={{ fontFamily: "Poppins_400Regular" }}
                  className="text-red-600 text-center"
                >
                  {error}
                </Text>
              </View>
            )}

            {/* Form */}
            <View className="space-y-5">
              {/* Email Input */}
              <View>
                <Text
                  style={{ fontFamily: "Poppins_500Medium" }}
                  className="text-gray-700 mb-2"
                >
                  Email
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-4 text-base"
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  style={{ fontFamily: "Poppins_400Regular" }}
                />
              </View>

              {/* Password Input */}
              <View className="mt-4">
                <Text
                  style={{ fontFamily: "Poppins_500Medium" }}
                  className="text-gray-700 mb-2"
                >
                  Password
                </Text>
                <View className="relative">
                  <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-4 text-base pr-12"
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    style={{ fontFamily: "Poppins_400Regular" }}
                  />
                  <TouchableOpacity
                    className="absolute right-4 top-4"
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text className="text-primary-500">
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                className="self-end mt-2"
                onPress={() => router.push("/(auth)/forgot-password")}
              >
                <Text
                  style={{
                    fontFamily: "Poppins_500Medium",
                    color: AppColors.primary[500],
                  }}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={isLoading}
                containerStyles="w-full mt-6"
              />

              {/* Sign Up Link */}
              <View className="flex-row justify-center mt-6">
                <Text
                  style={{ fontFamily: "Poppins_400Regular" }}
                  className="text-gray-600"
                >
                  Don't have an account?{" "}
                </Text>
                <Link href="/(auth)/signup" asChild>
                  <TouchableOpacity>
                    <Text
                      style={{
                        fontFamily: "Poppins_600SemiBold",
                        color: AppColors.primary[500],
                      }}
                    >
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>

              {/* Browse as Guest */}
              <TouchableOpacity
                className="mt-4"
                onPress={() => router.replace("/(tabs)/home")}
              >
                <Text
                  style={{
                    fontFamily: "Poppins_500Medium",
                    color: AppColors.gray[500],
                  }}
                  className="text-center underline"
                >
                  Browse as Guest
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
