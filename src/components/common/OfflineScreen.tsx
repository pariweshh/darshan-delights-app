import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"
import { useNetworkStore } from "@/src/store/networkStore"
import { Ionicons } from "@expo/vector-icons"
import React from "react"
import { StyleSheet, Text, View } from "react-native"

interface OfflineScreenProps {
  onRetry?: () => void
  message?: string
}

export default function OfflineScreen({
  onRetry,
  message = "Please check your internet connection and try again.",
}: OfflineScreenProps) {
  const checkConnection = useNetworkStore((state) => state.checkConnection)

  const handleRetry = async () => {
    const connected = await checkConnection()
    if (connected && onRetry) {
      onRetry()
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="cloud-offline"
            size={64}
            color={AppColors.gray[400]}
          />
        </View>
        <Text style={styles.title}>No Internet Connection</Text>
        <Text style={styles.message}>{message}</Text>
        <Button
          title="Try Again"
          onPress={handleRetry}
          variant="primary"
          containerStyles="mt-6"
          icon={<Ionicons name="refresh" size={20} color="#fff" />}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    maxWidth: 300,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.gray[100],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: AppColors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
})
