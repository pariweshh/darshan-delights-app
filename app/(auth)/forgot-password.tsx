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
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

import { forgotPassword } from "@/src/api/auth"
import Button from "@/src/components/ui/Button"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const { config, isTablet, isLandscape } = useResponsive()

  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const formMaxWidth = isTablet ? (isLandscape ? 450 : 400) : undefined
  const iconCircleSize = isTablet ? 112 : 96
  const iconSize = isTablet ? 56 : 48
  const backButtonSize = isTablet ? 48 : 40

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async () => {
    setError("")

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

      router.push({
        pathname: "/(auth)/verify-reset-otp",
        params: { email: email.toLowerCase() },
      })
    } catch (err: any) {
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
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: config.horizontalPadding + 8,
              paddingTop: isTablet ? 24 : 16,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.formContainer,
              {
                maxWidth: formMaxWidth,
                alignSelf: formMaxWidth ? "center" : undefined,
                width: formMaxWidth ? "100%" : undefined,
              },
            ]}
          >
            {/* Back Button */}
            <DebouncedTouchable
              style={[
                styles.backButton,
                {
                  width: backButtonSize,
                  height: backButtonSize,
                  borderRadius: backButtonSize / 2,
                  marginBottom: isTablet ? 32 : 24,
                },
              ]}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="arrow-back"
                size={config.iconSizeLarge}
                color={AppColors.text.primary}
              />
            </DebouncedTouchable>

            {/* Icon */}
            <View
              style={[
                styles.iconContainer,
                { marginBottom: isTablet ? 32 : 24 },
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  {
                    width: iconCircleSize,
                    height: iconCircleSize,
                    borderRadius: iconCircleSize / 2,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={iconSize}
                  color={AppColors.primary[600]}
                />
              </View>
            </View>

            {/* Title */}
            <Text style={[styles.title, { fontSize: isTablet ? 32 : 28 }]}>
              Forgot Password?
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  fontSize: config.bodyFontSize,
                  lineHeight: config.bodyFontSize * 1.5,
                  marginBottom: isTablet ? 40 : 32,
                },
              ]}
            >
              No worries! Enter your email address and we'll send you a code to
              reset your password.
            </Text>

            {/* Email Input */}
            <View
              style={[
                styles.inputContainer,
                { marginBottom: isTablet ? 28 : 24 },
              ]}
            >
              <Text
                style={[
                  styles.inputLabel,
                  {
                    fontSize: config.bodyFontSize,
                    marginBottom: isTablet ? 10 : 8,
                  },
                ]}
              >
                Email Address
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  error ? styles.inputError : null,
                  {
                    paddingHorizontal: isTablet ? 16 : 14,
                    borderRadius: config.cardBorderRadius,
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={config.iconSize}
                  color={error ? AppColors.error : AppColors.gray[400]}
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      fontSize: config.bodyFontSize,
                      paddingVertical: isTablet ? 16 : 14,
                    },
                  ]}
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
              {error ? (
                <Text
                  style={[styles.errorText, { fontSize: config.smallFontSize }]}
                >
                  {error}
                </Text>
              ) : null}
            </View>

            {/* Submit Button */}
            <Button
              title={isLoading ? "Sending..." : "Send Reset Code"}
              onPress={handleSubmit}
              disabled={isLoading}
              loading={isLoading}
            />

            {/* Back to Login */}
            <DebouncedTouchable
              style={[styles.backToLogin, { marginTop: isTablet ? 28 : 24 }]}
              onPress={() => router.replace("/(auth)/login")}
            >
              <Ionicons
                name="arrow-back"
                size={config.iconSizeSmall}
                color={AppColors.primary[600]}
              />
              <Text
                style={[
                  styles.backToLoginText,
                  { fontSize: config.bodyFontSize },
                ]}
              >
                Back to Login
              </Text>
            </DebouncedTouchable>
          </View>
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
    paddingBottom: 24,
  },
  formContainer: {},
  backButton: {
    backgroundColor: AppColors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
  },
  iconCircle: {
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Poppins_700Bold",
    color: AppColors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    textAlign: "center",
  },
  inputContainer: {},
  inputLabel: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.secondary,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    gap: 10,
  },
  inputError: {
    borderColor: AppColors.error,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.error,
    marginTop: 6,
  },
  backToLogin: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  backToLoginText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[600],
  },
})
