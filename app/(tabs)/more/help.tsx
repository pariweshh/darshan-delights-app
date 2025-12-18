import { Ionicons } from "@expo/vector-icons"
import Constants from "expo-constants"
import { useRouter } from "expo-router"
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"

import Wrapper from "@/src/components/common/Wrapper"
import AppColors from "@/src/constants/Colors"

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  subtitle?: string
  onPress: () => void
  showBorder?: boolean
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showBorder = true,
}) => (
  <TouchableOpacity
    style={[styles.menuItem, showBorder && styles.menuItemBorder]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.menuItemLeft}>
      <View style={styles.menuItemIcon}>
        <Ionicons name={icon} size={20} color={AppColors.primary[600]} />
      </View>
      <View style={styles.menuItemText}>
        <Text style={styles.menuItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    <Ionicons name="chevron-forward" size={20} color={AppColors.gray[400]} />
  </TouchableOpacity>
)

export default function HelpScreen() {
  const router = useRouter()
  const appVersion = Constants.expoConfig?.version || "1.0.0"

  return (
    <Wrapper style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Help */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How can we help?</Text>
          <View style={styles.card}>
            <MenuItem
              icon="call-outline"
              title="Contact Us"
              subtitle="Get in touch with our support team"
              onPress={() => router.push("/(tabs)/more/help/contact")}
            />
            <MenuItem
              icon="help-circle-outline"
              title="Frequently Asked Questions"
              subtitle="Find answers to common questions"
              onPress={() => router.push("/(tabs)/more/help/faqs")}
            />
            <MenuItem
              icon="chatbubble-outline"
              title="Send Feedback"
              subtitle="Help us improve the app"
              onPress={() => router.push("/(tabs)/more/help/feedback")}
              showBorder={false}
            />
            <MenuItem
              icon="cash-outline"
              title="Request Refund"
              subtitle="Submit a refund request for your order"
              onPress={() => router.push("/(tabs)/more/help/refund-request")}
              showBorder={false}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push("/(tabs)/more/orders")}
              activeOpacity={0.7}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons
                  name="cube-outline"
                  size={24}
                  color={AppColors.primary[600]}
                />
              </View>
              <Text style={styles.quickActionText}>Track Order</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push("/(tabs)/more/addresses")}
              activeOpacity={0.7}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons
                  name="location-outline"
                  size={24}
                  color={AppColors.primary[600]}
                />
              </View>
              <Text style={styles.quickActionText}>Addresses</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push("/(tabs)/more/profile")}
              activeOpacity={0.7}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons
                  name="person-outline"
                  size={24}
                  color={AppColors.primary[600]}
                />
              </View>
              <Text style={styles.quickActionText}>Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Store Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visit Us</Text>
          <View style={styles.card}>
            <View style={styles.storeInfo}>
              <View style={styles.storeHeader}>
                <Ionicons
                  name="storefront-outline"
                  size={24}
                  color={AppColors.primary[600]}
                />
                <Text style={styles.storeName}>Darshan Delights</Text>
              </View>
              <View style={styles.storeDetails}>
                <View style={styles.storeRow}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={AppColors.gray[500]}
                  />
                  <Text style={styles.storeText}>
                    8 Lethbridge Road, Austral, NSW 2179
                  </Text>
                </View>
                <View style={styles.storeRow}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={AppColors.gray[500]}
                  />
                  <Text style={styles.storeText}>
                    Mon-Fri: 5PM-8PM | Sat-Sun: 9AM-5PM
                  </Text>
                </View>
                <View style={styles.storeRow}>
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color={AppColors.gray[500]}
                  />
                  <Text style={styles.storeText}>+61 452 550 534</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfoContainer}>
          <Text style={styles.appVersion}>Darshan Delights</Text>
          <Text style={styles.appVersionNumber}>Version {appVersion}</Text>
          <Text style={styles.copyright}>
            © {new Date().getFullYear()} All rights reserved
          </Text>
        </View>
      </ScrollView>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.secondary,
    borderTopWidth: 0.5,
    borderTopColor: AppColors.gray[200],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.text.primary,
    marginBottom: 12,
  },
  // Card
  card: {
    backgroundColor: AppColors.background.primary,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  // Menu Item
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: AppColors.text.primary,
  },
  menuItemSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.secondary,
    marginTop: 2,
  },
  // Quick Actions
  quickActionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: AppColors.background.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickActionText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: AppColors.text.primary,
    textAlign: "center",
  },
  // Store Info
  storeInfo: {
    padding: 16,
  },
  storeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  storeName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.text.primary,
  },
  storeDetails: {
    gap: 10,
  },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  storeText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    flex: 1,
  },
  // App Info
  appInfoContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  appVersion: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.text.primary,
  },
  appVersionNumber: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.secondary,
    marginTop: 2,
  },
  copyright: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: AppColors.text.tertiary,
    marginTop: 4,
  },
})
