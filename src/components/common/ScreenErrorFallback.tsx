import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StyleSheet, Text, View } from "react-native"

import AppColors from "@/src/constants/Colors"
import DebouncedTouchable from "../ui/DebouncedTouchable"

interface ScreenErrorFallbackProps {
  title?: string
  message?: string
  onRetry?: () => void
  showHomeButton?: boolean
}

export default function ScreenErrorFallback({
  title = "Something went wrong",
  message = "We couldn't load this screen. Please try again.",
  onRetry,
  showHomeButton = true,
}: ScreenErrorFallbackProps) {
  const router = useRouter()

  const handleGoHome = () => {
    router.replace("/(tabs)/home")
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons
          name="cloud-offline-outline"
          size={48}
          color={AppColors.gray[400]}
        />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      <View style={styles.buttonContainer}>
        {onRetry && (
          <DebouncedTouchable
            style={styles.retryButton}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={18} color="white" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </DebouncedTouchable>
        )}

        {showHomeButton && (
          <DebouncedTouchable
            style={styles.homeButton}
            onPress={handleGoHome}
            activeOpacity={0.8}
          >
            <Ionicons
              name="home-outline"
              size={18}
              color={AppColors.primary[600]}
            />
            <Text style={styles.homeButtonText}>Go Home</Text>
          </DebouncedTouchable>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: AppColors.background.primary,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.gray[100],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: AppColors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.primary[500],
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 6,
  },
  retryButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "white",
  },
  homeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.primary[50],
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.primary[200],
    gap: 6,
  },
  homeButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.primary[600],
  },
})
