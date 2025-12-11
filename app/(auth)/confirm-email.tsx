import { verifyToken } from "@/src/api/auth"
import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"
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
  const { token } = useLocalSearchParams<{ token: string }>()
  const { setSession } = useAuthStore()

  const [status, setStatus] = useState<ConfirmationStatus>("loading")
  const [errorMessage, setErrorMessage] = useState("")

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

          // Auto-navigate after delay
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
      <View style={styles.content}>
        {/* Loading State */}
        {status === "loading" && (
          <>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={AppColors.primary[500]} />
            </View>
            <Text style={styles.loadingTitle}>Confirming your email...</Text>
            <Text style={styles.loadingSubtitle}>
              Please wait while we verify your account
            </Text>
          </>
        )}

        {/* Success State */}
        {status === "success" && (
          <>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color="#22C55E" />
            </View>
            <Text style={styles.successTitle}>Email Confirmed!</Text>
            <Text style={styles.successSubtitle}>
              Your account has been verified successfully.{"\n"}
              Redirecting you to the app...
            </Text>
            <ActivityIndicator
              size="small"
              color={AppColors.primary[500]}
              style={styles.redirectLoader}
            />
          </>
        )}

        {/* Already Confirmed State */}
        {status === "already_confirmed" && (
          <>
            <View style={styles.infoIconContainer}>
              <Ionicons
                name="information-circle"
                size={80}
                color={AppColors.primary[500]}
              />
            </View>
            <Text style={styles.infoTitle}>Already Verified</Text>
            <Text style={styles.infoSubtitle}>
              Your email has already been confirmed.{"\n"}
              You can log in to your account.
            </Text>
            <Button
              title="Go to Login"
              onPress={handleGoToLogin}
              containerStyles="w-full mt-8"
            />
          </>
        )}

        {/* Error State */}
        {status === "error" && (
          <>
            <View style={styles.errorIconContainer}>
              <Ionicons name="close-circle" size={80} color={AppColors.error} />
            </View>
            <Text style={styles.errorTitle}>Confirmation Failed</Text>
            <Text style={styles.errorSubtitle}>{errorMessage}</Text>
            <View style={styles.errorActions}>
              <Button
                title="Go to Login"
                onPress={handleGoToLogin}
                containerStyles="w-full"
              />
              <Button
                title="Go to Home"
                onPress={handleGoToHome}
                variant="outline"
                containerStyles="w-full mt-3"
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
    paddingHorizontal: 24,
  },
  // Loading
  loadingContainer: {
    marginBottom: 24,
  },
  loadingTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: AppColors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.secondary,
    textAlign: "center",
  },
  // Success
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: AppColors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  successSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  redirectLoader: {
    marginTop: 24,
  },
  // Info (Already Confirmed)
  infoIconContainer: {
    marginBottom: 24,
  },
  infoTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: AppColors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  infoSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  // Error
  errorIconContainer: {
    marginBottom: 24,
  },
  errorTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: AppColors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  errorSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  errorActions: {
    width: "100%",
    marginTop: 32,
  },
})
