import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import React from "react"
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { MAINTENANCE_CONFIG } from "@/src/config/constants"
import AppColors from "@/src/constants/Colors"

export default function MaintenanceScreen() {
  const handleContactSupport = () => {
    const email = MAINTENANCE_CONFIG.SUPPORT_EMAIL
    const subject = encodeURIComponent("Darshan Delights Support Inquiry")
    Linking.openURL(`mailto:${email}?subject=${subject}`)
  }

  return (
    <LinearGradient
      colors={["#fdba74", "#f87171", "#fb923c"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* Header Icon */}
            <View style={styles.iconWrapper}>
              <View style={styles.iconCircle}>
                <Ionicons name="settings-outline" size={38} color="#EA580C" />
              </View>
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.title}>We&apos;ll Be Right Back!</Text>
            <Text style={styles.subtitle}>
              We&apos;re currently performing scheduled maintenance to improve
              your shopping experience at Darshan Delights.
            </Text>

            {/* Status & Expected Return Box */}
            <View style={styles.statusBox}>
              <View style={styles.statusCol}>
                <Text style={styles.statusLabel}>STATUS</Text>
                <Text style={styles.statusValue}>🔧 Scheduled Maintenance</Text>
              </View>
              <View style={styles.statusDivider} />
              <View style={styles.statusCol}>
                <Text style={styles.statusLabel}>EXPECTED RETURN</Text>
                <Text style={styles.statusValue}>
                  {MAINTENANCE_CONFIG.EXPECTED_RETURN}
                </Text>
              </View>
            </View>

            {/* What's Happening */}
            <View style={styles.whatsHappeningBox}>
              <Text style={styles.whatsHappeningTitle}>What&apos;s happening?</Text>
              <View style={styles.bulletItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#10B981"
                  style={styles.bulletIcon}
                />
                <Text style={styles.bulletText}>
                  Upgrading our servers for better performance
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#10B981"
                  style={styles.bulletIcon}
                />
                <Text style={styles.bulletText}>
                  Enhancing security features
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#10B981"
                  style={styles.bulletIcon}
                />
                <Text style={styles.bulletText}>
                  Adding new features you&apos;ll love
                </Text>
              </View>
            </View>

            {/* Contact Support CTA */}
            <Pressable
              onPress={handleContactSupport}
              style={({ pressed }) => [
                styles.supportButton,
                pressed && styles.supportButtonPressed,
              ]}
            >
              <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </Pressable>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Thank you for your patience. We appreciate your business!
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  iconWrapper: {
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontFamily: "Poppins_700Bold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  statusBox: {
    backgroundColor: "#F5F3FF",
    borderColor: "#DDD6FE",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statusCol: {
    marginBottom: 8,
  },
  statusDivider: {
    height: 1,
    backgroundColor: "#EDE9FE",
    marginVertical: 6,
  },
  statusLabel: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: "#6B7280",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
  },
  whatsHappeningBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  whatsHappeningTitle: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#111827",
    marginBottom: 10,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bulletIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    lineHeight: 18,
  },
  supportButton: {
    backgroundColor: "#EA580C",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  supportButtonPressed: {
    backgroundColor: "#C2410C",
    transform: [{ scale: 0.98 }],
  },
  supportButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  footer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  footerText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
  },
})
