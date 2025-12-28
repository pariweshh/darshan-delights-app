import AppColors from "@/src/constants/Colors"
import { ConnectionStatus, useNetworkStore } from "@/src/store/networkStore"
import { Ionicons } from "@expo/vector-icons"
import React, { useEffect, useRef } from "react"
import { Animated, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import DebouncedTouchable from "../ui/DebouncedTouchable"

interface BannerConfig {
  icon: keyof typeof Ionicons.glyphMap
  message: string
  backgroundColor: string
  showRetry: boolean
}

const BANNER_CONFIGS: Record<
  Exclude<ConnectionStatus, "connected" | "checking">,
  BannerConfig
> = {
  offline: {
    icon: "cloud-offline",
    message: "No Internet Connection",
    backgroundColor: AppColors.error,
    showRetry: true,
  },
  server_unavailable: {
    icon: "server-outline",
    message: "Server Unavailable",
    backgroundColor: "#F59E0B", // Amber/Warning color
    showRetry: true,
  },
}

export default function ConnectionStatusBanner() {
  const insets = useSafeAreaInsets()
  const connectionStatus = useNetworkStore((state) => state.connectionStatus)
  const isLoading = useNetworkStore((state) => state.isLoading)
  const checkFullConnectivity = useNetworkStore(
    (state) => state.checkFullConnectivity
  )

  const slideAnim = useRef(new Animated.Value(-100)).current
  const isRetrying = useRef(false)

  const shouldShow =
    !isLoading &&
    (connectionStatus === "offline" ||
      connectionStatus === "server_unavailable")

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: shouldShow ? 0 : -100,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start()
  }, [shouldShow, slideAnim])

  const handleRetry = async () => {
    if (isRetrying.current) return
    isRetrying.current = true

    await checkFullConnectivity()

    // Reset after a short delay
    setTimeout(() => {
      isRetrying.current = false
    }, 2000)
  }

  if (
    isLoading ||
    connectionStatus === "connected" ||
    connectionStatus === "checking"
  ) {
    return null
  }

  const config = BANNER_CONFIGS[connectionStatus]

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          paddingTop: insets.top + 8,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.messageContainer}>
          <Ionicons name={config.icon} size={20} color="#fff" />
          <Text style={styles.text}>{config.message}</Text>
        </View>

        {config.showRetry && (
          <DebouncedTouchable
            onPress={handleRetry}
            style={styles.retryButton}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.retryText}>Retry</Text>
          </DebouncedTouchable>
        )}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  text: {
    color: "#fff",
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  retryText: {
    color: "#fff",
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },
})
