// app/(auth)/confirm-email.tsx

import { verifyToken } from "@/src/api/auth"
import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

type ConfirmationStatus = "loading" | "success" | "error" | "already_confirmed"

export default function ConfirmEmailScreen() {
  const router = useRouter()
  const { config, isTablet, isLandscape } = useResponsive()
  const { token } = useLocalSearchParams<{ token: string }>()
  const { setSession } = useAuthStore()

  const [status, setStatus] = useState<ConfirmationStatus>("loading")
  const [errorMessage, setErrorMessage] = useState("")

  const formMaxWidth = isTablet ? (isLandscape ? 450 : 400) : undefined
  const iconSize = isTablet ? 96 : 80

  useEffect(() => {
    const confirmEmail = async () => {
      if (!token) {
        setStatus("error")
        setErrorMessage("Invalid confirmation link")
        return
      }

      try {
        const response = await verifyToken(token)

        if (response.jwt && response.user) {
          await setSession(response.jwt, response.user)
          setStatus("success")

          Toast.show({
            type: "success",
            text1: "Email Verified! 🎉",
            text2: "Welcome to Darshan Delights",
          })

          setTimeout(() => {
            router.replace("/(tabs)/home")
          }, 2000)
        }
      } catch (err: any) {
        const message =
          err.response?.data?.error?.message || "Confirmation failed"

        if (message.toLowerCase().includes("already confirmed")) {
          setStatus("already_confirmed")
        } else {
          setStatus("error")
          setErrorMessage(message)
        }
      }
    }

    confirmEmail()
  }, [token])

  const handleGoToLogin = () => {
    router.replace("/(auth)/login")
  }

  const handleGoToHome = () => {
    router.replace("/(tabs)/home")
  }

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingHorizontal: config.horizontalPadding + 8,
            maxWidth: formMaxWidth,
            alignSelf: formMaxWidth ? "center" : undefined,
            width: formMaxWidth ? "100%" : undefined,
          },
        ]}
      >
        {/* Loading State */}
        {status === "loading" && (
          <>
            <View
              style={[
                styles.iconContainer,
                { marginBottom: isTablet ? 32 : 24 },
              ]}
            >
              <ActivityIndicator size="large" color={AppColors.primary[500]} />
            </View>
            <Text style={[styles.title, { fontSize: isTablet ? 24 : 20 }]}>
              Confirming your email...
            </Text>
            <Text style={[styles.subtitle, { fontSize: config.bodyFontSize }]}>
              Please wait while we verify your account
            </Text>
          </>
        )}

        {/* Success State */}
        {status === "success" && (
          <>
            <View
              style={[
                styles.iconContainer,
                { marginBottom: isTablet ? 32 : 24 },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={iconSize}
                color="#22C55E"
              />
            </View>
            <Text
              style={[styles.successTitle, { fontSize: isTablet ? 32 : 28 }]}
            >
              Email Confirmed!
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  fontSize: config.bodyFontSize,
                  lineHeight: config.bodyFontSize * 1.5,
                },
              ]}
            >
              Your account has been verified successfully.{"\n"}
              Redirecting you to the app...
            </Text>
            <ActivityIndicator
              size="small"
              color={AppColors.primary[500]}
              style={[styles.redirectLoader, { marginTop: isTablet ? 32 : 24 }]}
            />
          </>
        )}

        {/* Already Confirmed State */}
        {status === "already_confirmed" && (
          <>
            <View
              style={[
                styles.iconContainer,
                { marginBottom: isTablet ? 32 : 24 },
              ]}
            >
              <Ionicons
                name="information-circle"
                size={iconSize}
                color={AppColors.primary[500]}
              />
            </View>
            <Text
              style={[styles.successTitle, { fontSize: isTablet ? 32 : 28 }]}
            >
              Already Verified
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  fontSize: config.bodyFontSize,
                  lineHeight: config.bodyFontSize * 1.5,
                },
              ]}
            >
              Your email has already been confirmed.{"\n"}
              You can log in to your account.
            </Text>
            <View style={{ width: "100%", marginTop: isTablet ? 40 : 32 }}>
              <Button title="Go to Login" onPress={handleGoToLogin} />
            </View>
          </>
        )}

        {/* Error State */}
        {status === "error" && (
          <>
            <View
              style={[
                styles.iconContainer,
                { marginBottom: isTablet ? 32 : 24 },
              ]}
            >
              <Ionicons
                name="close-circle"
                size={iconSize}
                color={AppColors.error}
              />
            </View>
            <Text
              style={[styles.successTitle, { fontSize: isTablet ? 32 : 28 }]}
            >
              Confirmation Failed
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  fontSize: config.bodyFontSize,
                  lineHeight: config.bodyFontSize * 1.5,
                },
              ]}
            >
              {errorMessage}
            </Text>
            <View
              style={[styles.errorActions, { marginTop: isTablet ? 40 : 32 }]}
            >
              <Button title="Go to Login" onPress={handleGoToLogin} />
              <View style={{ height: isTablet ? 16 : 12 }} />
              <Button
                title="Go to Home"
                onPress={handleGoToHome}
                variant="outline"
              />
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.primary,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {},
  title: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  successTitle: {
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
  redirectLoader: {},
  errorActions: {
    width: "100%",
  },
})
