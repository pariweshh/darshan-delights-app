import { Ionicons } from "@expo/vector-icons"
import Constants from "expo-constants"
import { useRouter } from "expo-router"
import { ScrollView, StyleSheet, Text, View } from "react-native"

import Wrapper from "@/src/components/common/Wrapper"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  subtitle?: string
  onPress: () => void
  showBorder?: boolean
  isTablet: boolean
  config: ReturnType<typeof useResponsive>["config"]
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showBorder = true,
  isTablet,
  config,
}) => {
  const iconContainerSize = isTablet ? 44 : 40
  const iconSize = isTablet ? 22 : 20

  return (
    <DebouncedTouchable
      style={[
        styles.menuItem,
        { padding: isTablet ? 18 : 16 },
        showBorder && styles.menuItemBorder,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuItemLeft, { gap: isTablet ? 14 : 12 }]}>
        <View
          style={[
            styles.menuItemIcon,
            {
              width: iconContainerSize,
              height: iconContainerSize,
              borderRadius: isTablet ? 12 : 10,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={iconSize}
            color={AppColors.primary[600]}
          />
        </View>
        <View style={styles.menuItemText}>
          <Text
            style={[styles.menuItemTitle, { fontSize: config.bodyFontSize }]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.menuItemSubtitle,
                { fontSize: config.smallFontSize, marginTop: isTablet ? 4 : 2 },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={isTablet ? 22 : 20}
        color={AppColors.gray[400]}
      />
    </DebouncedTouchable>
  )
}

export default function HelpScreen() {
  const router = useRouter()
  const { config, isTablet, isLandscape } = useResponsive()
  const appVersion = Constants.expoConfig?.version || "1.0.0"

  // Layout configuration
  const contentMaxWidth = isTablet ? (isLandscape ? 700 : 600) : undefined
  const useColumnsLayout = isTablet && isLandscape

  // Quick action sizes
  const quickActionIconContainerSize = isTablet ? 56 : 48
  const quickActionIconSize = isTablet ? 28 : 24

  return (
    <Wrapper style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            padding: config.horizontalPadding,
            paddingBottom: isTablet ? 60 : 40,
            maxWidth: contentMaxWidth,
            alignSelf: contentMaxWidth ? "center" : undefined,
            width: contentMaxWidth ? "100%" : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Help */}
        <View style={[styles.section, { marginBottom: isTablet ? 28 : 24 }]}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: isTablet ? 17 : 16,
                marginBottom: isTablet ? 14 : 12,
              },
            ]}
          >
            How can we help?
          </Text>
          <View
            style={[styles.card, { borderRadius: config.cardBorderRadius + 4 }]}
          >
            <MenuItem
              icon="call-outline"
              title="Contact Us"
              subtitle="Get in touch with our support team"
              onPress={() => router.push("/(tabs)/more/help/contact")}
              isTablet={isTablet}
              config={config}
            />
            <MenuItem
              icon="help-circle-outline"
              title="Frequently Asked Questions"
              subtitle="Find answers to common questions"
              onPress={() => router.push("/(tabs)/more/help/faqs")}
              isTablet={isTablet}
              config={config}
            />
            <MenuItem
              icon="chatbubble-outline"
              title="Send Feedback"
              subtitle="Help us improve the app"
              onPress={() => router.push("/(tabs)/more/help/feedback")}
              isTablet={isTablet}
              config={config}
            />
            <MenuItem
              icon="cash-outline"
              title="Request Refund"
              subtitle="Submit a refund request for your order"
              onPress={() => router.push("/(tabs)/more/help/refund-request")}
              showBorder={false}
              isTablet={isTablet}
              config={config}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { marginBottom: isTablet ? 28 : 24 }]}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: isTablet ? 17 : 16,
                marginBottom: isTablet ? 14 : 12,
              },
            ]}
          >
            Quick Actions
          </Text>
          <View
            style={[styles.quickActionsContainer, { gap: isTablet ? 14 : 12 }]}
          >
            <DebouncedTouchable
              style={[
                styles.quickActionCard,
                {
                  padding: isTablet ? 18 : 16,
                  borderRadius: config.cardBorderRadius + 4,
                },
              ]}
              onPress={() => router.push("/(tabs)/more/orders")}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  {
                    width: quickActionIconContainerSize,
                    height: quickActionIconContainerSize,
                    borderRadius: isTablet ? 14 : 12,
                    marginBottom: isTablet ? 10 : 8,
                  },
                ]}
              >
                <Ionicons
                  name="cube-outline"
                  size={quickActionIconSize}
                  color={AppColors.primary[600]}
                />
              </View>
              <Text
                style={[
                  styles.quickActionText,
                  { fontSize: config.smallFontSize },
                ]}
              >
                Track Order
              </Text>
            </DebouncedTouchable>

            <DebouncedTouchable
              style={[
                styles.quickActionCard,
                {
                  padding: isTablet ? 18 : 16,
                  borderRadius: config.cardBorderRadius + 4,
                },
              ]}
              onPress={() => router.push("/(tabs)/more/addresses")}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  {
                    width: quickActionIconContainerSize,
                    height: quickActionIconContainerSize,
                    borderRadius: isTablet ? 14 : 12,
                    marginBottom: isTablet ? 10 : 8,
                  },
                ]}
              >
                <Ionicons
                  name="location-outline"
                  size={quickActionIconSize}
                  color={AppColors.primary[600]}
                />
              </View>
              <Text
                style={[
                  styles.quickActionText,
                  { fontSize: config.smallFontSize },
                ]}
              >
                Addresses
              </Text>
            </DebouncedTouchable>

            <DebouncedTouchable
              style={[
                styles.quickActionCard,
                {
                  padding: isTablet ? 18 : 16,
                  borderRadius: config.cardBorderRadius + 4,
                },
              ]}
              onPress={() => router.push("/(tabs)/more/profile")}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  {
                    width: quickActionIconContainerSize,
                    height: quickActionIconContainerSize,
                    borderRadius: isTablet ? 14 : 12,
                    marginBottom: isTablet ? 10 : 8,
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={quickActionIconSize}
                  color={AppColors.primary[600]}
                />
              </View>
              <Text
                style={[
                  styles.quickActionText,
                  { fontSize: config.smallFontSize },
                ]}
              >
                Account
              </Text>
            </DebouncedTouchable>
          </View>
        </View>

        {/* Store Info */}
        <View style={[styles.section, { marginBottom: isTablet ? 28 : 24 }]}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: isTablet ? 17 : 16,
                marginBottom: isTablet ? 14 : 12,
              },
            ]}
          >
            Visit Us
          </Text>
          <View
            style={[styles.card, { borderRadius: config.cardBorderRadius + 4 }]}
          >
            <View style={[styles.storeInfo, { padding: isTablet ? 18 : 16 }]}>
              <View
                style={[
                  styles.storeHeader,
                  { marginBottom: isTablet ? 18 : 16, gap: isTablet ? 12 : 10 },
                ]}
              >
                <Ionicons
                  name="storefront-outline"
                  size={isTablet ? 28 : 24}
                  color={AppColors.primary[600]}
                />
                <Text
                  style={[styles.storeName, { fontSize: isTablet ? 18 : 16 }]}
                >
                  Darshan Delights
                </Text>
              </View>
              <View style={[styles.storeDetails, { gap: isTablet ? 12 : 10 }]}>
                <View style={[styles.storeRow, { gap: isTablet ? 12 : 10 }]}>
                  <Ionicons
                    name="location-outline"
                    size={isTablet ? 20 : 18}
                    color={AppColors.gray[500]}
                  />
                  <Text
                    style={[
                      styles.storeText,
                      { fontSize: config.bodyFontSize - 1 },
                    ]}
                  >
                    8 Lethbridge Road, Austral, NSW 2179
                  </Text>
                </View>
                <View style={[styles.storeRow, { gap: isTablet ? 12 : 10 }]}>
                  <Ionicons
                    name="time-outline"
                    size={isTablet ? 20 : 18}
                    color={AppColors.gray[500]}
                  />
                  <Text
                    style={[
                      styles.storeText,
                      { fontSize: config.bodyFontSize - 1 },
                    ]}
                  >
                    Mon-Fri: 5PM-8PM | Sat-Sun: 9AM-5PM
                  </Text>
                </View>
                <View style={[styles.storeRow, { gap: isTablet ? 12 : 10 }]}>
                  <Ionicons
                    name="call-outline"
                    size={isTablet ? 20 : 18}
                    color={AppColors.gray[500]}
                  />
                  <Text
                    style={[
                      styles.storeText,
                      { fontSize: config.bodyFontSize - 1 },
                    ]}
                  >
                    +61 452 550 534
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* App Info */}
        <View
          style={[
            styles.appInfoContainer,
            { paddingVertical: isTablet ? 24 : 20 },
          ]}
        >
          <Text style={[styles.appVersion, { fontSize: config.bodyFontSize }]}>
            Darshan Delights
          </Text>
          <Text
            style={[
              styles.appVersionNumber,
              { fontSize: config.smallFontSize, marginTop: isTablet ? 4 : 2 },
            ]}
          >
            Version {appVersion}
          </Text>
          <Text
            style={[
              styles.copyright,
              {
                fontSize: config.smallFontSize - 1,
                marginTop: isTablet ? 6 : 4,
              },
            ]}
          >
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
  scrollContent: {},
  // Section
  section: {},
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  // Card
  card: {
    backgroundColor: AppColors.background.primary,
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
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
  },
  menuItemSubtitle: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  // Quick Actions
  quickActionsContainer: {
    flexDirection: "row",
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: AppColors.background.primary,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
    textAlign: "center",
  },
  // Store Info
  storeInfo: {},
  storeHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  storeName: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  storeDetails: {},
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  storeText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    flex: 1,
  },
  // App Info
  appInfoContainer: {
    alignItems: "center",
  },
  appVersion: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  appVersionNumber: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  copyright: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
  },
})
