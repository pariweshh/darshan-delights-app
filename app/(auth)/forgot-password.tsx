// app/(auth)/forgot-password.tsx

import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useState } from "react"
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

import { forgotPassword } from "@/src/api/auth"
import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"

export default function ForgotPasswordScreen() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Validate email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Handle submit
  const handleSubmit = async () => {
    // Reset error
    setError("")

    // Validate
    if (!email.trim()) {
      setError("Email is required")
      return
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address")
      return
    }

    Keyboard.dismiss()
    setIsLoading(true)

    try {
      await forgotPassword(email.toLowerCase())

      Toast.show({
        type: "success",
        text1: "Email Sent",
        text2: "Check your email for the reset code",
      })

      // Navigate to verify reset OTP screen
      router.push({
        pathname: "/(auth)/verify-reset-otp",
        params: { email: email.toLowerCase() },
      })
    } catch (err: any) {
      // Don't reveal if email exists or not
      Toast.show({
        type: "success",
        text1: "Email Sent",
        text2: "If an account exists, you'll receive a reset code",
      })

      router.push({
        pathname: "/(auth)/verify-reset-otp",
        params: { email: email.toLowerCase() },
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={AppColors.text.primary}
            />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="lock-closed-outline"
                size={48}
                color={AppColors.primary[600]}
              />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            No worries! Enter your email address and we'll send you a code to
            reset your password.
          </Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View
              style={[styles.inputWrapper, error ? styles.inputError : null]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={error ? AppColors.error : AppColors.gray[400]}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={AppColors.gray[400]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text)
                  setError("")
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {/* Submit Button */}
          <Button
            title={isLoading ? "Sending..." : "Send Reset Code"}
            onPress={handleSubmit}
            disabled={isLoading}
            loading={isLoading}
            containerStyles="w-full"
          />

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.backToLogin}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Ionicons
              name="arrow-back"
              size={16}
              color={AppColors.primary[600]}
            />
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.gray[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: AppColors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.primary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    paddingHorizontal: 14,
    gap: 10,
  },
  inputError: {
    borderColor: AppColors.error,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.primary,
    paddingVertical: 14,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.error,
    marginTop: 6,
  },
  backToLogin: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 24,
    paddingVertical: 12,
  },
  backToLoginText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.primary[600],
  },
})
