import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import React, { useEffect, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const STORAGE_KEY = "@shipping_notice_banner_dismissed"

export default function ShippingNoticeBanner() {
  const [visible, setVisible] = useState(true)
  const { config, isTablet } = useResponsive()

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === "true") {
        setVisible(false)
      }
    })
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    AsyncStorage.setItem(STORAGE_KEY, "true").catch((err) => {
      console.error("Error setting shipping banner storage:", err)
    })
  }

  if (!visible) return null

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: config.horizontalPadding,
          paddingVertical: isTablet ? 12 : 10,
        },
      ]}
    >
      <View style={styles.leftContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="bus-outline" size={18} color="#92400E" />
        </View>
        <Text style={[styles.text, { fontSize: config.smallFontSize }]}>
          <Text style={styles.boldText}>Shipping Notice: </Text>
          No orders will ship until <Text style={styles.highlightText}>5th August</Text>. We apologize for the inconvenience!
        </Text>
      </View>
      <Pressable
        onPress={handleDismiss}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.closeButton}
      >
        <Ionicons name="close" size={18} color="#92400E" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FEF3C7", // Amber-100
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A", // Amber-200
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  leftContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    color: "#78350F",
    lineHeight: 18,
  },
  boldText: {
    fontFamily: "Poppins_600SemiBold",
    color: "#92400E",
  },
  highlightText: {
    fontFamily: "Poppins_700Bold",
    color: "#B45309",
    textDecorationLine: "underline",
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: "rgba(217, 119, 6, 0.15)",
  },
})
