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
import Toast from "react-native-toast-message"

export default function SignupScreen() {
  const router = useRouter()
  const { signup, isLoading, error, clearError } = useAuthStore()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSignup = async () => {
    if (!firstName.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match")
      return
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters")
      return
    }

    clearError()

    try {
      const username = email.split("@")[0] // Generate username from email
      const result = await signup(
        username,
        email.trim(),
        password,
        firstName.trim(),
        lastName.trim()
      )

      if (result?.success) {
        // Alert.alert(
        //   "Success",
        //   "Account created successfully! Please check your email to confirm your account.",
        //   [
        //     {
        //       text: "OK",
        //       onPress: () => router.replace("/(auth)/login"),
        //     },
        //   ]
        // )
        router.push({
          pathname: "/(auth)/verify-email",
          params: { email },
        })
      }
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Registration failed"
      Toast.show({
        type: "error",
        text1: "Registration Failed",
        text2: message,
      })
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
            <View className="mb-8">
              <Text
                style={{ fontFamily: "Poppins_700Bold" }}
                className="text-3xl text-gray-900"
              >
                Create Account
              </Text>
              <Text
                style={{ fontFamily: "Poppins_400Regular" }}
                className="text-gray-500 mt-2"
              >
                Sign up to start shopping
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
            <View className="space-y-4">
              {/* Name Row */}
              <View className="flex-row space-x-3">
                <View className="flex-1">
                  <Text
                    style={{ fontFamily: "Poppins_500Medium" }}
                    className="text-gray-700 mb-2"
                  >
                    First Name *
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-4 text-base"
                    placeholder="First name"
                    placeholderTextColor="#9CA3AF"
                    value={firstName}
                    onChangeText={setFirstName}
                    style={{ fontFamily: "Poppins_400Regular" }}
                  />
                </View>
                <View className="flex-1 ml-3">
                  <Text
                    style={{ fontFamily: "Poppins_500Medium" }}
                    className="text-gray-700 mb-2"
                  >
                    Last Name
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-4 text-base"
                    placeholder="Last name"
                    placeholderTextColor="#9CA3AF"
                    value={lastName}
                    onChangeText={setLastName}
                    style={{ fontFamily: "Poppins_400Regular" }}
                  />
                </View>
              </View>

              {/* Email Input */}
              <View className="mt-4">
                <Text
                  style={{ fontFamily: "Poppins_500Medium" }}
                  className="text-gray-700 mb-2"
                >
                  Email *
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
                  Password *
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-4 text-base"
                  placeholder="Create a password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  style={{ fontFamily: "Poppins_400Regular" }}
                />
              </View>

              {/* Confirm Password Input */}
              <View className="mt-4">
                <Text
                  style={{ fontFamily: "Poppins_500Medium" }}
                  className="text-gray-700 mb-2"
                >
                  Confirm Password *
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-4 text-base"
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={{ fontFamily: "Poppins_400Regular" }}
                />
              </View>

              {/* Show Password Toggle */}
              <TouchableOpacity
                className="flex-row items-center mt-2"
                onPress={() => setShowPassword(!showPassword)}
              >
                <View
                  className={`w-5 h-5 border rounded mr-2 ${
                    showPassword
                      ? "bg-primary-500 border-primary-500"
                      : "border-gray-300"
                  }`}
                />
                <Text
                  style={{ fontFamily: "Poppins_400Regular" }}
                  className="text-gray-600"
                >
                  Show passwords
                </Text>
              </TouchableOpacity>

              {/* Signup Button */}
              <Button
                title="Create Account"
                onPress={handleSignup}
                loading={isLoading}
                containerStyles="w-full mt-6"
              />

              {/* Login Link */}
              <View className="flex-row justify-center mt-6">
                <Text
                  style={{ fontFamily: "Poppins_400Regular" }}
                  className="text-gray-600"
                >
                  Already have an account?{" "}
                </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text
                      style={{
                        fontFamily: "Poppins_600SemiBold",
                        color: AppColors.primary[500],
                      }}
                    >
                      Sign In
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
