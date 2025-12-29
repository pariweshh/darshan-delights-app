import { Link, useRouter } from "expo-router"
import { useCallback, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { resendConfirmation } from "@/src/api/auth"
import Button from "@/src/components/ui/Button"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"
import { Ionicons } from "@expo/vector-icons"
import Toast from "react-native-toast-message"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const UNCONFIRMED_EMAIL_ERRORS = [
  "your account email is not confirmed",
  "email is not confirmed",
  "please confirm your email",
  "account not confirmed",
  "email not verified",
  "please verify your email",
]

export default function LoginScreen() {
  const router = useRouter()
  const { config, isTablet, isLandscape, width } = useResponsive()
  const { login, isLoading, error, clearError } = useAuthStore()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [showResendOption, setShowResendOption] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  // Check if error is related to unconfirmed email
  const isUnconfirmedEmailError = useCallback(
    (errorMessage: string | null): boolean => {
      if (!errorMessage) return false
      const lowerError = errorMessage.toLowerCase()
      return UNCONFIRMED_EMAIL_ERRORS.some((msg) => lowerError.includes(msg))
    },
    []
  )

  const handleLogin = async () => {
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    // Reset states
    setShowResendOption(false)
    setResendSuccess(false)

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert("Error", "Please enter your email and password")
      return
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address")
      return
    }

    clearError()
    const result = await login(trimmedEmail, trimmedPassword)

    if (result?.user) {
      router.replace("/(tabs)/home")
    } else {
      setTimeout(() => {
        const currentError = useAuthStore.getState().error
        if (isUnconfirmedEmailError(currentError)) {
          setShowResendOption(true)
        }
      }, 100)
    }
  }

  const handleResendConfirmation = async () => {
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      Alert.alert("Error", "Please enter your email")
      return
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address")
      return
    }

    setIsResending(true)

    try {
      const result = await resendConfirmation(trimmedEmail)

      if (result.ok) {
        setResendSuccess(true)
        setShowResendOption(false)

        Toast.show({
          type: "success",
          text1: "Confirmation Email Sent",
          text2: "Please check your inbox and spam folder",
          visibilityTime: 4000,
        })

        router.push({
          pathname: "/(auth)/verify-email",
          params: { email: trimmedEmail },
        })
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.message ||
        "Failed to send confirmation email"

      // check if email is already confirmed
      if (errorMessage.toLowerCase().includes("already confirmed")) {
        Toast.show({
          type: "info",
          text1: "Email Already Confirmed",
          text2: "Please login to continue",
          visibilityTime: 3000,
        })
        setShowResendOption(false)
        clearError()
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: errorMessage,
          visibilityTime: 3000,
        })
      }
    } finally {
      setIsResending(false)
    }
  }

  // For tablet, constrain form width
  const formMaxWidth = isTablet ? (isLandscape ? 450 : 400) : undefined
  const contentPadding = isTablet ? 32 : 24

  const isEmailNotConfirmed = isUnconfirmedEmailError(error)

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: contentPadding,
              paddingTop: isTablet ? 60 : 40,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Centered form container for tablets */}
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
            {/* Header */}
            <View style={[styles.header, { marginBottom: isTablet ? 48 : 40 }]}>
              <Text style={[styles.title, { fontSize: isTablet ? 36 : 30 }]}>
                Welcome Back
              </Text>
              <Text
                style={[styles.subtitle, { fontSize: config.subtitleFontSize }]}
              >
                Sign in to continue shopping
              </Text>
            </View>

            {/* Error Message */}
            {error && (
              <View
                style={[
                  styles.errorContainer,
                  isEmailNotConfirmed && styles.warningContainer,
                  {
                    padding: isTablet ? 18 : 16,
                    borderRadius: config.cardBorderRadius,
                    marginBottom: isTablet ? 28 : 24,
                  },
                ]}
              >
                <View style={styles.errorContent}>
                  {isEmailNotConfirmed && (
                    <Ionicons
                      name="mail-unread-outline"
                      size={isTablet ? 24 : 20}
                      color={AppColors.warning}
                      style={styles.errorIcon}
                    />
                  )}
                  <Text
                    style={[
                      styles.errorText,
                      isEmailNotConfirmed && styles.warningText,
                      { fontSize: config.bodyFontSize },
                    ]}
                  >
                    {error}
                  </Text>
                </View>

                {/* Resend Confirmation Button */}
                {(isEmailNotConfirmed || showResendOption) && (
                  <DebouncedTouchable
                    style={[
                      styles.resendButton,
                      { marginTop: isTablet ? 14 : 12 },
                    ]}
                    onPress={handleResendConfirmation}
                    disabled={isResending}
                    activeOpacity={0.7}
                  >
                    {isResending ? (
                      <View style={styles.resendingContainer}>
                        <ActivityIndicator
                          size="small"
                          color={AppColors.primary[500]}
                        />
                        <Text
                          style={[
                            styles.resendButtonText,
                            { fontSize: config.bodyFontSize, marginLeft: 8 },
                          ]}
                        >
                          Sending...
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.resendingContainer}>
                        <Ionicons
                          name="send-outline"
                          size={isTablet ? 18 : 16}
                          color={AppColors.primary[500]}
                        />
                        <Text
                          style={[
                            styles.resendButtonText,
                            { fontSize: config.bodyFontSize, marginLeft: 6 },
                          ]}
                        >
                          Resend Confirmation Email
                        </Text>
                      </View>
                    )}
                  </DebouncedTouchable>
                )}
              </View>
            )}

            {/* Success Message */}
            {resendSuccess && (
              <View
                style={[
                  styles.successContainer,
                  {
                    padding: isTablet ? 18 : 16,
                    borderRadius: config.cardBorderRadius,
                    marginBottom: isTablet ? 28 : 24,
                  },
                ]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={isTablet ? 24 : 20}
                  color={AppColors.success}
                  style={styles.errorIcon}
                />
                <Text
                  style={[
                    styles.successText,
                    { fontSize: config.bodyFontSize },
                  ]}
                >
                  Confirmation email sent! Please check your inbox.
                </Text>
              </View>
            )}

            {/* Form */}
            <View style={[styles.form, { gap: isTablet ? 24 : 20 }]}>
              {/* Email Input */}
              <View>
                <Text
                  style={[
                    styles.label,
                    {
                      fontSize: config.bodyFontSize,
                      marginBottom: isTablet ? 10 : 8,
                    },
                  ]}
                >
                  Email
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      paddingHorizontal: isTablet ? 18 : 16,
                      paddingVertical: isTablet ? 18 : 16,
                      borderRadius: config.cardBorderRadius,
                      fontSize: config.bodyFontSize,
                    },
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor={AppColors.gray[400]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text)
                    // Reset resend states when email changes
                    if (showResendOption || resendSuccess) {
                      setShowResendOption(false)
                      setResendSuccess(false)
                    }
                  }}
                />
              </View>

              {/* Password Input */}
              <View>
                <Text
                  style={[
                    styles.label,
                    {
                      fontSize: config.bodyFontSize,
                      marginBottom: isTablet ? 10 : 8,
                    },
                  ]}
                >
                  Password
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      {
                        paddingHorizontal: isTablet ? 18 : 16,
                        paddingVertical: isTablet ? 18 : 16,
                        borderRadius: config.cardBorderRadius,
                        fontSize: config.bodyFontSize,
                      },
                    ]}
                    placeholder="Enter your password"
                    placeholderTextColor={AppColors.gray[400]}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <DebouncedTouchable
                    style={[
                      styles.showPasswordButton,
                      { top: isTablet ? 18 : 16, right: isTablet ? 18 : 16 },
                    ]}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text
                      style={[
                        styles.showPasswordText,
                        { fontSize: config.bodyFontSize },
                      ]}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </DebouncedTouchable>
                </View>
              </View>

              {/* Forgot Password */}
              <DebouncedTouchable
                style={styles.forgotPassword}
                onPress={() => router.push("/(auth)/forgot-password")}
              >
                <Text
                  style={[
                    styles.forgotPasswordText,
                    { fontSize: config.bodyFontSize },
                  ]}
                >
                  Forgot Password?
                </Text>
              </DebouncedTouchable>

              {/* Login Button */}
              <View style={{ marginTop: isTablet ? 12 : 8 }}>
                <Button
                  title="Sign In"
                  onPress={handleLogin}
                  loading={isLoading}
                />
              </View>

              {/* Sign Up Link */}
              <View
                style={[
                  styles.linkContainer,
                  { marginTop: isTablet ? 28 : 24 },
                ]}
              >
                <Text
                  style={[styles.linkText, { fontSize: config.bodyFontSize }]}
                >
                  Don't have an account?{" "}
                </Text>
                <Link href="/(auth)/signup" asChild>
                  <Text
                    style={[{ fontSize: config.bodyFontSize }]}
                    className="text-orange-600 font-bold"
                  >
                    Sign Up
                  </Text>
                </Link>
              </View>

              {/* Browse as Guest */}
              <DebouncedTouchable
                style={[styles.guestButton, { marginTop: isTablet ? 20 : 16 }]}
                onPress={() => router.replace("/(tabs)/home")}
              >
                <Text
                  style={[styles.guestText, { fontSize: config.bodyFontSize }]}
                >
                  Browse as Guest
                </Text>
              </DebouncedTouchable>
            </View>
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
  },
  formContainer: {},
  header: {},
  title: {
    fontFamily: "Poppins_700Bold",
    color: AppColors.text.primary,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  warningContainer: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FCD34D",
  },
  errorContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  errorIcon: {
    marginRight: 10,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.error,
    // textAlign: "center",
    flex: 1,
  },
  warningText: {
    color: "#B45309", // amber-700
  },
  successContainer: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#86EFAC",
    flexDirection: "row",
    alignItems: "center",
  },
  successText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.success,
    flex: 1,
  },
  resendButton: {
    backgroundColor: AppColors.primary[50],
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  resendingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  resendButtonText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[500],
  },
  form: {},
  label: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: AppColors.gray[300],
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
    backgroundColor: AppColors.background.primary,
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 70,
  },
  showPasswordButton: {
    position: "absolute",
  },
  showPasswordText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[500],
  },
  forgotPassword: {
    alignSelf: "flex-end",
  },
  forgotPasswordText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[500],
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  linkText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  linkHighlight: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.primary[500],
  },
  guestButton: {
    alignItems: "center",
  },
  guestText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.gray[500],
    textDecorationLine: "underline",
  },
})
