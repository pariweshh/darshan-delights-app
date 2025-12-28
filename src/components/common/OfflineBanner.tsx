import AppColors from "@/src/constants/Colors"
import { useNetworkStore } from "@/src/store/networkStore"
import { Ionicons } from "@expo/vector-icons"
import React, { useEffect, useRef } from "react"
import { Animated, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

interface OfflineBannerProps {
  belowHeader?: boolean
}

export default function OfflineBanner({
  belowHeader = false,
}: OfflineBannerProps) {
  const isConnected = useNetworkStore((state) => state.isConnected)
  const isInternetReachable = useNetworkStore(
    (state) => state.isInternetReachable
  )
  const isLoading = useNetworkStore((state) => state.isLoading)

  const insets = useSafeAreaInsets()
  const slideAnim = useRef(new Animated.Value(-60)).current

  const isOffline =
    !isLoading && (!isConnected || isInternetReachable === false)

  console.log({ isOffline, isConnected, isInternetReachable })

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOffline ? 0 : -60,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [isOffline, slideAnim])

  if (isLoading) return null

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          top: belowHeader ? 0 : insets.top,
          paddingTop: belowHeader ? 0 : undefined,
        },
      ]}
      pointerEvents={isOffline ? "auto" : "none"}
    >
      <View style={styles.content}>
        <Ionicons name="cloud-offline" size={18} color="#fff" />
        <Text style={styles.text}>No Internet Connection</Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: AppColors.error,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  text: {
    color: "#fff",
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
  },
})
