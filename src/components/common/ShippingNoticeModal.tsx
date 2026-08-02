import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import React, { useEffect, useState } from "react"
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"

const STORAGE_KEY = "@shipping_notice_modal_seen"

export default function ShippingNoticeModal() {
  const [modalVisible, setModalVisible] = useState(false)
  const { config, isTablet } = useResponsive()

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!value) {
          timer = setTimeout(() => {
            setModalVisible(true)
          }, 600)
        }
      })
      .catch((err) => {
        console.error("Error reading shipping modal storage:", err)
      })

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setModalVisible(false)
    AsyncStorage.setItem(STORAGE_KEY, "true").catch((err) => {
      console.error("Error setting shipping modal storage:", err)
    })
  }

  if (!modalVisible) return null

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable
          style={[
            styles.modalContainer,
            {
              width: isTablet ? 480 : "88%",
              maxHeight: "85%",
              borderRadius: config.cardBorderRadius + 8,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Top-Right Close Button */}
          <Pressable
            style={styles.closeIconButton}
            onPress={handleClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={22} color={AppColors.text.tertiary} />
          </Pressable>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={[
              styles.scrollContent,
              { padding: isTablet ? 24 : 20 },
            ]}
          >
            {/* Header Icon */}
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={32} color="#D97706" />
            </View>

            {/* Title */}
            <Text style={[styles.title, { fontSize: isTablet ? 22 : 19 }]}>
              Important Shipping Notice
            </Text>

            {/* Description */}
            <Text style={[styles.description, { fontSize: config.bodyFontSize }]}>
              Please note that our shipping services are temporarily paused.
            </Text>

            {/* Highlighted Banner */}
            <View style={styles.highlightCard}>
              <Ionicons name="bus" size={22} color="#B45309" />
              <Text
                style={[
                  styles.highlightText,
                  { fontSize: config.bodyFontSize - 1 },
                ]}
              >
                No orders will ship until{" "}
                <Text style={styles.dateText}>5th August</Text>.
              </Text>
            </View>

            {/* Additional Reassurance */}
            <Text style={[styles.subText, { fontSize: config.smallFontSize }]}>
              You can still place orders today to reserve stock! All orders will be dispatched sequentially starting 5th August. We apologize for any inconvenience.
            </Text>

            {/* Primary Dismiss Button */}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleClose}
            >
              <Text style={styles.buttonText}>I Understand</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: AppColors.background.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    position: "relative",
    overflow: "hidden",
  },
  closeIconButton: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 14,
    borderWidth: 4,
    borderColor: "#FDE68A",
  },
  title: {
    fontFamily: "Poppins_700Bold",
    color: AppColors.text.primary,
    textAlign: "center",
    marginBottom: 6,
  },
  description: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    textAlign: "center",
    marginBottom: 14,
  },
  highlightCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    width: "100%",
  },
  highlightText: {
    fontFamily: "Poppins_500Medium",
    color: "#78350F",
    flex: 1,
  },
  dateText: {
    fontFamily: "Poppins_700Bold",
    color: "#B45309",
    textDecorationLine: "underline",
  },
  subText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  button: {
    width: "100%",
    backgroundColor: AppColors.primary[600],
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
    fontSize: 15,
  },
})
