// app/(auth)/verify-email.tsx

import { Ionicons } from "@expo/vector-icons"
import * as Linking from "expo-linking"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

import { resendConfirmation, verifyOTP } from "@/src/api/auth"
import OTPInput from "@/src/components/auth/otpInput"
import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"

export default function VerifyEmailScreen() {
  const router = useRouter()
  const { config, isTablet, isLandscape } = useResponsive()
  const { email } = useLocalSearchParams<{ email: string }>()
  const { setSession } = useAuthStore()

  const [otp, setOtp] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [error, setError] = useState(false)

  // Form container max width for tablets
  const formMaxWidth = isTablet ? (isLandscape ? 450 : 400) : undefined

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      )
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleVerify = async (code?: string) => {
    const otpCode = code || otp

    if (otpCode.length !== 6) {
      Toast.show({
        type: "error",
        text1: "Invalid Code",
        text2: "Please enter the 6-digit code",
      })
      return
    }

    Keyboard.dismiss()
    setIsVerifying(true)
    setError(false)

    try {
      const response = await verifyOTP(email, otpCode)

      if (response.jwt && response.user) {
        await setSession(response.jwt, response.user)

        Toast.show({
          type: "success",
          text1: "Email Verified! 🎉",
          text2: "Welcome to Darshan Delights",
        })

        router.replace("/(tabs)/home")
      }
    } catch (err: any) {
      const message =
        err.response?.data?.error?.message || "Verification failed"
      setError(true)
      Toast.show({
        type: "error",
        text1: "Verification Failed",
        text2: message,
      })
      setOtp("")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return

    setIsResending(true)

    try {
      await resendConfirmation(email)

      Toast.show({
        type: "success",
        text1: "Code Sent",
        text2: "Check your email for the new code",
      })

      setResendCooldown(60)
      setOtp("")
      setError(false)
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to resend code. Please try again.",
      })
    } finally {
      setIsResending(false)
    }
  }

  const handleOpenEmail = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("message://")
    } else {
      Linking.openURL("mailto:")
    }
  }

  const maskEmail = (email: string): string => {
    const [localPart, domain] = email.split("@")
    if (localPart.length <= 2) return email
    return `${localPart[0]}${"*".repeat(localPart.length - 2)}${
      localPart[localPart.length - 1]
    }@${domain}`
  }

  const iconCircleSize = isTablet ? 112 : 96
  const iconSize = isTablet ? 56 : 48
  const backButtonSize = isTablet ? 48 : 40

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
          {/* Centered container for tablets */}
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
            <TouchableOpacity
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
            </TouchableOpacity>

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
                  name="mail-outline"
                  size={iconSize}
                  color={AppColors.primary[600]}
                />
              </View>
            </View>

            {/* Title */}
            <Text style={[styles.title, { fontSize: isTablet ? 32 : 28 }]}>
              Verify your email
            </Text>
            <Text style={[styles.subtitle, { fontSize: config.bodyFontSize }]}>
              We've sent a 6-digit verification code to
            </Text>
            <Text
              style={[
                styles.email,
                {
                  fontSize: config.bodyFontSize,
                  marginBottom: isTablet ? 40 : 32,
                },
              ]}
            >
              {maskEmail(email)}
            </Text>

            {/* OTP Input */}
            <View
              style={[styles.otpSection, { marginBottom: isTablet ? 40 : 32 }]}
            >
              <OTPInput
                value={otp}
                onChange={setOtp}
                onComplete={handleVerify}
                disabled={isVerifying}
                error={error}
              />
            </View>

            {/* Verify Button */}
            <Button
              title={isVerifying ? "Verifying..." : "Verify Email"}
              onPress={() => handleVerify()}
              disabled={isVerifying || otp.length !== 6}
              loading={isVerifying}
            />

            {/* Resend */}
            <View
              style={[
                styles.resendContainer,
                { marginTop: isTablet ? 28 : 24 },
              ]}
            >
              <Text
                style={[styles.resendText, { fontSize: config.bodyFontSize }]}
              >
                Didn't receive the code?{" "}
              </Text>
              {resendCooldown > 0 ? (
                <Text
                  style={[
                    styles.cooldownText,
                    { fontSize: config.bodyFontSize },
                  ]}
                >
                  Resend in {resendCooldown}s
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResend} disabled={isResending}>
                  {isResending ? (
                    <ActivityIndicator
                      size="small"
                      color={AppColors.primary[600]}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.resendLink,
                        { fontSize: config.bodyFontSize },
                      ]}
                    >
                      Resend Code
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Open Email App */}
            <TouchableOpacity
              style={[
                styles.openEmailButton,
                {
                  marginTop: isTablet ? 28 : 24,
                  paddingVertical: isTablet ? 16 : 14,
                  paddingHorizontal: isTablet ? 28 : 24,
                  borderRadius: config.cardBorderRadius,
                },
              ]}
              onPress={handleOpenEmail}
            >
              <Ionicons
                name="open-outline"
                size={config.iconSize}
                color={AppColors.primary[600]}
              />
              <Text
                style={[
                  styles.openEmailText,
                  { fontSize: config.bodyFontSize },
                ]}
              >
                Open Email App
              </Text>
            </TouchableOpacity>

            {/* Help Text */}
            <View
              style={[
                styles.helpContainer,
                {
                  marginTop: isTablet ? 40 : 32,
                  padding: isTablet ? 16 : 12,
                  borderRadius: isTablet ? 12 : 10,
                },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={config.iconSize}
                color={AppColors.text.tertiary}
              />
              <Text
                style={[
                  styles.helpText,
                  {
                    fontSize: config.bodyFontSize - 1,
                    lineHeight: (config.bodyFontSize - 1) * 1.4,
                  },
                ]}
              >
                Check your spam folder if you don't see the email in your inbox
              </Text>
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
  email: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.primary[600],
    textAlign: "center",
  },
  otpSection: {},
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  resendText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  resendLink: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.primary[600],
  },
  cooldownText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.gray[400],
  },
  openEmailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: AppColors.primary[50],
    alignSelf: "center",
  },
  openEmailText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[600],
  },
  helpContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: AppColors.gray[50],
  },
  helpText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
  },
})
