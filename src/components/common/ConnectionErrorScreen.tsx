// src/components/common/ConnectionErrorScreen.tsx

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { ConnectionStatus } from "@/src/store/networkStore"
import { Ionicons } from "@expo/vector-icons"
import React, { useState } from "react"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import DebouncedTouchable from "../ui/DebouncedTouchable"

interface ConnectionErrorScreenProps {
  status: Exclude<ConnectionStatus, "connected" | "checking">
  onRetry: () => Promise<void>
  title?: string
  message?: string
}

interface ErrorConfig {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  message: string
  iconColor: string
  iconBgColor: string
}

const ERROR_CONFIGS: Record<
  Exclude<ConnectionStatus, "connected" | "checking">,
  ErrorConfig
> = {
  offline: {
    icon: "cloud-offline",
    title: "No Internet Connection",
    message: "Please check your Wi-Fi or mobile data connection and try again.",
    iconColor: AppColors.error,
    iconBgColor: "#FEE2E2",
  },
  server_unavailable: {
    icon: "server-outline",
    title: "Server Unavailable",
    message:
      "We're having trouble connecting to our servers. Please try again in a moment.",
    iconColor: "#F59E0B",
    iconBgColor: "#FEF3C7",
  },
}

export default function ConnectionErrorScreen({
  status,
  onRetry,
  title,
  message,
}: ConnectionErrorScreenProps) {
  const insets = useSafeAreaInsets()
  const { config, isTablet } = useResponsive()
  const [isRetrying, setIsRetrying] = useState(false)

  const errorConfig = ERROR_CONFIGS[status]

  const handleRetry = async () => {
    if (isRetrying) return
    setIsRetrying(true)

    try {
      await onRetry()
    } finally {
      // Keep loading for a bit to show feedback
      setTimeout(() => setIsRetrying(false), 500)
    }
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: errorConfig.iconBgColor,
              width: isTablet ? 140 : 120,
              height: isTablet ? 140 : 120,
              borderRadius: isTablet ? 70 : 60,
            },
          ]}
        >
          <Ionicons
            name={errorConfig.icon}
            size={isTablet ? 64 : 56}
            color={errorConfig.iconColor}
          />
        </View>

        {/* Title */}
        <Text style={[styles.title, { fontSize: isTablet ? 24 : 20 }]}>
          {title || errorConfig.title}
        </Text>

        {/* Message */}
        <Text style={[styles.message, { fontSize: config.bodyFontSize }]}>
          {message || errorConfig.message}
        </Text>

        {/* Retry Button */}
        <DebouncedTouchable
          style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]}
          onPress={handleRetry}
          disabled={isRetrying}
          activeOpacity={0.8}
        >
          {isRetrying ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </>
          )}
        </DebouncedTouchable>

        {/* Help Text */}
        <Text style={[styles.helpText, { fontSize: config.smallFontSize }]}>
          {status === "offline"
            ? "Make sure you're connected to the internet"
            : "Our team has been notified and is working on it"}
        </Text>
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
    paddingHorizontal: 24,
  },
  content: {
    alignItems: "center",
    maxWidth: 340,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.primary[500],
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    minWidth: 160,
  },
  retryButtonDisabled: {
    opacity: 0.7,
  },
  retryButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  helpText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
    textAlign: "center",
    marginTop: 24,
  },
})
