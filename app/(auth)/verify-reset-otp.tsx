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

import { forgotPassword, verifyResetOTP } from "@/src/api/auth"

import OTPInput from "@/src/components/auth/otpInput"
import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"

export default function VerifyResetOTPScreen() {
  const router = useRouter()
  const { email } = useLocalSearchParams<{ email: string }>()

  const [otp, setOtp] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(60) // Start with cooldown
  const [error, setError] = useState(false)

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      )
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Verify OTP
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
      const response = await verifyResetOTP(email, otpCode)

      if (response.ok && response.resetToken) {
        Toast.show({
          type: "success",
          text1: "Code Verified",
          text2: "Now set your new password",
        })

        // Navigate to reset password screen with token
        router.push({
          pathname: "/(auth)/reset-password",
          params: { token: response.resetToken },
        })
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

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0) return

    setIsResending(true)

    try {
      await forgotPassword(email)

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

  // Open email app
  const handleOpenEmail = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("message://")
    } else {
      Linking.openURL("mailto:")
    }
  }

  // Mask email
  const maskEmail = (email: string): string => {
    const [localPart, domain] = email.split("@")
    if (localPart.length <= 2) return email
    return `${localPart[0]}${"*".repeat(localPart.length - 2)}${
      localPart[localPart.length - 1]
    }@${domain}`
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
                name="shield-checkmark-outline"
                size={48}
                color={AppColors.primary[600]}
              />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Enter Reset Code</Text>
          <Text style={styles.subtitle}>We've sent a 6-digit code to</Text>
          <Text style={styles.email}>{maskEmail(email)}</Text>

          {/* OTP Input */}
          <View style={styles.otpSection}>
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
            title={isVerifying ? "Verifying..." : "Verify Code"}
            onPress={() => handleVerify()}
            disabled={isVerifying || otp.length !== 6}
            loading={isVerifying}
            containerStyles="w-full"
          />

          {/* Resend */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            {resendCooldown > 0 ? (
              <Text style={styles.cooldownText}>
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
                  <Text style={styles.resendLink}>Resend Code</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Open Email App */}
          <TouchableOpacity
            style={styles.openEmailButton}
            onPress={handleOpenEmail}
          >
            <Ionicons
              name="open-outline"
              size={18}
              color={AppColors.primary[600]}
            />
            <Text style={styles.openEmailText}>Open Email App</Text>
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
  },
  email: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: AppColors.primary[600],
    textAlign: "center",
    marginBottom: 32,
  },
  otpSection: {
    marginBottom: 32,
  },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  resendText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  resendLink: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.primary[600],
  },
  cooldownText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.gray[400],
  },
  openEmailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: AppColors.primary[50],
    alignSelf: "center",
  },
  openEmailText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.primary[600],
  },
})
