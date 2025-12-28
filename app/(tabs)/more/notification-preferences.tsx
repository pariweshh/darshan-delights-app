import { Ionicons } from "@expo/vector-icons"
import * as Device from "expo-device"
import * as Linking from "expo-linking"
import * as Notifications from "expo-notifications"
import React, { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

import {
  getNotificationPreferences,
  NotificationPreferences,
  updateNotificationPreferences,
} from "@/src/api/pushTokens"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import { usePushNotifications } from "@/src/hooks/usePushNotifications"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"

const DEFAULT_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  orderUpdates: true,
  promotions: true,
  reminders: true,
}

export default function NotificationSettingsScreen() {
  const { config, isTablet, isLandscape } = useResponsive()
  const { token } = useAuthStore()
  const { refreshPreferences, refreshUnreadCount } = usePushNotifications()

  const [isLoading, setIsLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [systemPermission, setSystemPermission] = useState<boolean | null>(null)
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFERENCES)

  const pendingUpdates = useRef<Partial<NotificationPreferences>>({})

  // Layout configuration
  const contentMaxWidth = isTablet ? (isLandscape ? 600 : 550) : undefined

  // Responsive sizes
  const iconContainerSize = isTablet ? 44 : 40
  const iconSize = isTablet ? 22 : 20
  const warningIconContainerSize = isTablet ? 44 : 40

  /**
   * Check system notification permission
   */
  const checkSystemPermission = async () => {
    if (!Device.isDevice) {
      setSystemPermission(false)
      return false
    }

    const { status } = await Notifications.getPermissionsAsync()
    const granted = status === "granted"
    setSystemPermission(granted)
    return granted
  }

  /**
   * Load preferences from backend
   */
  const loadPreferences = async () => {
    if (!token) return

    try {
      const prefs = await getNotificationPreferences(token)
      setPreferences(prefs)
    } catch (error) {
      console.error("Error loading preferences:", error)
    }
  }

  /**
   * Initialize
   */
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      await checkSystemPermission()
      await loadPreferences()
      setIsLoading(false)
    }

    init()
  }, [token])

  /**
   * Request system permission
   */
  const requestSystemPermission = async (): Promise<boolean> => {
    if (!Device.isDevice) {
      Alert.alert(
        "Physical Device Required",
        "Push notifications only work on physical devices, not simulators."
      )
      return false
    }

    const { status } = await Notifications.requestPermissionsAsync()
    const granted = status === "granted"
    setSystemPermission(granted)
    return granted
  }

  /**
   * Save preference to backend
   */
  const savePreference = async (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    if (!token) return

    pendingUpdates.current[key] = value
    setSavingKey(key)

    try {
      const result = await updateNotificationPreferences(
        { [key]: value },
        token
      )
      setPreferences(result.preferences)
      delete pendingUpdates.current[key]
      await refreshPreferences()
      await refreshUnreadCount()

      Toast.show({
        type: "success",
        text1: "Settings Updated",
        text2: "Your notification preferences have been saved",
        visibilityTime: 1500,
      })
    } catch (error) {
      console.error("Error saving preference:", error)
      setPreferences((prev) => ({ ...prev, [key]: !value }))
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update settings. Please try again.",
        visibilityTime: 2000,
      })
    } finally {
      setSavingKey(null)
    }
  }

  /**
   * Handle master toggle
   */
  const handlePushToggle = async (enabled: boolean) => {
    if (enabled && !systemPermission) {
      const granted = await requestSystemPermission()

      if (!granted) {
        Alert.alert(
          "Notifications Disabled",
          "Please enable notifications in your device settings to receive push notifications.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:")
                } else {
                  Linking.openSettings()
                }
              },
            },
          ]
        )
        return
      }
    }

    setPreferences((prev) => ({ ...prev, pushEnabled: enabled }))
    await savePreference("pushEnabled", enabled)
  }

  /**
   * Handle category toggle
   */
  const handleCategoryToggle = async (
    category: keyof Omit<NotificationPreferences, "pushEnabled">,
    enabled: boolean
  ) => {
    if (savingKey === category) return

    setPreferences((prev) => ({ ...prev, [category]: enabled }))
    await savePreference(category, enabled)
  }

  /**
   * Open system settings
   */
  const openSystemSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:")
    } else {
      Linking.openSettings()
    }
  }

  /**
   * Refresh system permission status
   */
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      () => {
        checkSystemPermission()
      }
    )

    return () => subscription.remove()
  }, [])

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary[500]} />
          <Text style={[styles.loadingText, { fontSize: config.bodyFontSize }]}>
            Loading settings...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  const categoriesDisabled = !preferences.pushEnabled || !systemPermission

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            padding: config.horizontalPadding,
            maxWidth: contentMaxWidth,
            alignSelf: contentMaxWidth ? "center" : undefined,
            width: contentMaxWidth ? "100%" : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* System Permission Warning */}
        {systemPermission === false && (
          <DebouncedTouchable
            style={[
              styles.warningCard,
              {
                padding: isTablet ? 16 : 14,
                borderRadius: isTablet ? 14 : 12,
                marginBottom: isTablet ? 24 : 20,
              },
            ]}
            onPress={openSystemSettings}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.warningIconContainer,
                {
                  width: warningIconContainerSize,
                  height: warningIconContainerSize,
                  borderRadius: warningIconContainerSize / 2,
                  marginRight: isTablet ? 14 : 12,
                },
              ]}
            >
              <Ionicons
                name="warning-outline"
                size={isTablet ? 26 : 24}
                color={AppColors.warning}
              />
            </View>
            <View style={styles.warningContent}>
              <Text
                style={[styles.warningTitle, { fontSize: config.bodyFontSize }]}
              >
                Notifications are disabled
              </Text>
              <Text
                style={[
                  styles.warningText,
                  {
                    fontSize: config.smallFontSize,
                    marginTop: isTablet ? 4 : 2,
                  },
                ]}
              >
                Tap here to enable notifications in your device settings
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={isTablet ? 22 : 20}
              color={AppColors.gray[400]}
            />
          </DebouncedTouchable>
        )}

        {/* Master Toggle */}
        <View style={[styles.section, { marginBottom: isTablet ? 28 : 24 }]}>
          <Text
            style={[
              styles.sectionTitle,
              { fontSize: isTablet ? 17 : 16, marginBottom: isTablet ? 6 : 4 },
            ]}
          >
            Push Notifications
          </Text>
          <View style={[styles.card, { borderRadius: isTablet ? 14 : 12 }]}>
            <View style={[styles.settingRow, { padding: isTablet ? 18 : 16 }]}>
              <View
                style={[
                  styles.settingInfo,
                  { marginRight: isTablet ? 14 : 12 },
                ]}
              >
                <View
                  style={[
                    styles.settingIconContainer,
                    {
                      width: iconContainerSize,
                      height: iconContainerSize,
                      borderRadius: isTablet ? 12 : 10,
                      marginRight: isTablet ? 14 : 12,
                    },
                  ]}
                >
                  <Ionicons
                    name="notifications"
                    size={iconSize}
                    color={AppColors.primary[600]}
                  />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text
                    style={[
                      styles.settingLabel,
                      { fontSize: config.bodyFontSize },
                    ]}
                  >
                    Push Notifications
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      {
                        fontSize: config.smallFontSize,
                        marginTop: isTablet ? 4 : 2,
                      },
                    ]}
                  >
                    Receive notifications on your device
                  </Text>
                </View>
              </View>
              <View style={styles.switchContainer}>
                {savingKey === "pushEnabled" && (
                  <ActivityIndicator
                    size="small"
                    color={AppColors.primary[500]}
                    style={[
                      styles.switchLoader,
                      { marginRight: isTablet ? 10 : 8 },
                    ]}
                  />
                )}
                <Switch
                  value={preferences.pushEnabled && systemPermission === true}
                  onValueChange={handlePushToggle}
                  disabled={savingKey === "pushEnabled"}
                  trackColor={{
                    false: AppColors.gray[300],
                    true: AppColors.primary[400],
                  }}
                  thumbColor={
                    preferences.pushEnabled && systemPermission
                      ? AppColors.primary[600]
                      : AppColors.gray[100]
                  }
                  ios_backgroundColor={AppColors.gray[300]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Notification Categories */}
        <View style={[styles.section, { marginBottom: isTablet ? 28 : 24 }]}>
          <Text
            style={[
              styles.sectionTitle,
              { fontSize: isTablet ? 17 : 16, marginBottom: isTablet ? 6 : 4 },
            ]}
          >
            Notification Types
          </Text>
          <Text
            style={[
              styles.sectionSubtitle,
              {
                fontSize: config.bodyFontSize - 1,
                marginBottom: isTablet ? 14 : 12,
              },
            ]}
          >
            Choose which notifications you'd like to receive
          </Text>

          <View
            style={[
              styles.card,
              { borderRadius: isTablet ? 14 : 12 },
              categoriesDisabled && styles.cardDisabled,
            ]}
          >
            {/* Order Updates */}
            <View style={[styles.settingRow, { padding: isTablet ? 18 : 16 }]}>
              <View
                style={[
                  styles.settingInfo,
                  { marginRight: isTablet ? 14 : 12 },
                ]}
              >
                <View
                  style={[
                    styles.settingIconContainer,
                    {
                      width: iconContainerSize,
                      height: iconContainerSize,
                      borderRadius: isTablet ? 12 : 10,
                      marginRight: isTablet ? 14 : 12,
                      backgroundColor: AppColors.primary[50],
                    },
                    categoriesDisabled && styles.iconDisabled,
                  ]}
                >
                  <Ionicons
                    name="cube-outline"
                    size={iconSize}
                    color={
                      categoriesDisabled
                        ? AppColors.gray[400]
                        : AppColors.primary[600]
                    }
                  />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text
                    style={[
                      styles.settingLabel,
                      { fontSize: config.bodyFontSize },
                      categoriesDisabled && styles.textDisabled,
                    ]}
                  >
                    Order Updates
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      {
                        fontSize: config.smallFontSize,
                        marginTop: isTablet ? 4 : 2,
                      },
                      categoriesDisabled && styles.textDisabled,
                    ]}
                  >
                    Order confirmations, shipping & delivery updates
                  </Text>
                </View>
              </View>
              <View style={styles.switchContainer}>
                {savingKey === "orderUpdates" && (
                  <ActivityIndicator
                    size="small"
                    color={AppColors.primary[500]}
                    style={[
                      styles.switchLoader,
                      { marginRight: isTablet ? 10 : 8 },
                    ]}
                  />
                )}
                <Switch
                  value={preferences.orderUpdates}
                  onValueChange={(value) =>
                    handleCategoryToggle("orderUpdates", value)
                  }
                  disabled={categoriesDisabled || savingKey === "orderUpdates"}
                  trackColor={{
                    false: AppColors.gray[300],
                    true: AppColors.primary[400],
                  }}
                  thumbColor={
                    preferences.orderUpdates && !categoriesDisabled
                      ? AppColors.primary[600]
                      : AppColors.gray[100]
                  }
                  ios_backgroundColor={AppColors.gray[300]}
                />
              </View>
            </View>

            <View
              style={[
                styles.settingDivider,
                { marginLeft: isTablet ? 76 : 68 },
              ]}
            />

            {/* Promotions */}
            <View style={[styles.settingRow, { padding: isTablet ? 18 : 16 }]}>
              <View
                style={[
                  styles.settingInfo,
                  { marginRight: isTablet ? 14 : 12 },
                ]}
              >
                <View
                  style={[
                    styles.settingIconContainer,
                    {
                      width: iconContainerSize,
                      height: iconContainerSize,
                      borderRadius: isTablet ? 12 : 10,
                      marginRight: isTablet ? 14 : 12,
                      backgroundColor: "#FEF3C7",
                    },
                    categoriesDisabled && styles.iconDisabled,
                  ]}
                >
                  <Ionicons
                    name="pricetag-outline"
                    size={iconSize}
                    color={categoriesDisabled ? AppColors.gray[400] : "#D97706"}
                  />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text
                    style={[
                      styles.settingLabel,
                      { fontSize: config.bodyFontSize },
                      categoriesDisabled && styles.textDisabled,
                    ]}
                  >
                    Promotions & Offers
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      {
                        fontSize: config.smallFontSize,
                        marginTop: isTablet ? 4 : 2,
                      },
                      categoriesDisabled && styles.textDisabled,
                    ]}
                  >
                    Special deals, discounts & exclusive offers
                  </Text>
                </View>
              </View>
              <View style={styles.switchContainer}>
                {savingKey === "promotions" && (
                  <ActivityIndicator
                    size="small"
                    color={AppColors.primary[500]}
                    style={[
                      styles.switchLoader,
                      { marginRight: isTablet ? 10 : 8 },
                    ]}
                  />
                )}
                <Switch
                  value={preferences.promotions}
                  onValueChange={(value) =>
                    handleCategoryToggle("promotions", value)
                  }
                  disabled={categoriesDisabled || savingKey === "promotions"}
                  trackColor={{
                    false: AppColors.gray[300],
                    true: AppColors.primary[400],
                  }}
                  thumbColor={
                    preferences.promotions && !categoriesDisabled
                      ? AppColors.primary[600]
                      : AppColors.gray[100]
                  }
                  ios_backgroundColor={AppColors.gray[300]}
                />
              </View>
            </View>

            <View
              style={[
                styles.settingDivider,
                { marginLeft: isTablet ? 76 : 68 },
              ]}
            />

            {/* Reminders */}
            <View style={[styles.settingRow, { padding: isTablet ? 18 : 16 }]}>
              <View
                style={[
                  styles.settingInfo,
                  { marginRight: isTablet ? 14 : 12 },
                ]}
              >
                <View
                  style={[
                    styles.settingIconContainer,
                    {
                      width: iconContainerSize,
                      height: iconContainerSize,
                      borderRadius: isTablet ? 12 : 10,
                      marginRight: isTablet ? 14 : 12,
                      backgroundColor: "#DBEAFE",
                    },
                    categoriesDisabled && styles.iconDisabled,
                  ]}
                >
                  <Ionicons
                    name="alarm-outline"
                    size={iconSize}
                    color={categoriesDisabled ? AppColors.gray[400] : "#2563EB"}
                  />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text
                    style={[
                      styles.settingLabel,
                      { fontSize: config.bodyFontSize },
                      categoriesDisabled && styles.textDisabled,
                    ]}
                  >
                    Reminders
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      {
                        fontSize: config.smallFontSize,
                        marginTop: isTablet ? 4 : 2,
                      },
                      categoriesDisabled && styles.textDisabled,
                    ]}
                  >
                    Cart reminders & restock notifications
                  </Text>
                </View>
              </View>
              <View style={styles.switchContainer}>
                {savingKey === "reminders" && (
                  <ActivityIndicator
                    size="small"
                    color={AppColors.primary[500]}
                    style={[
                      styles.switchLoader,
                      { marginRight: isTablet ? 10 : 8 },
                    ]}
                  />
                )}
                <Switch
                  value={preferences.reminders}
                  onValueChange={(value) =>
                    handleCategoryToggle("reminders", value)
                  }
                  disabled={categoriesDisabled || savingKey === "reminders"}
                  trackColor={{
                    false: AppColors.gray[300],
                    true: AppColors.primary[400],
                  }}
                  thumbColor={
                    preferences.reminders && !categoriesDisabled
                      ? AppColors.primary[600]
                      : AppColors.gray[100]
                  }
                  ios_backgroundColor={AppColors.gray[300]}
                />
              </View>
            </View>
          </View>

          {/* Disabled explanation */}
          {categoriesDisabled && (
            <Text
              style={[
                styles.disabledExplanation,
                {
                  fontSize: config.smallFontSize,
                  marginTop: isTablet ? 10 : 8,
                },
              ]}
            >
              Enable push notifications above to customize notification types
            </Text>
          )}
        </View>

        {/* Info Card */}
        <View
          style={[
            styles.infoCard,
            {
              padding: isTablet ? 16 : 14,
              borderRadius: isTablet ? 12 : 10,
              gap: isTablet ? 12 : 10,
            },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={isTablet ? 22 : 20}
            color={AppColors.text.tertiary}
          />
          <Text
            style={[
              styles.infoText,
              {
                fontSize: config.smallFontSize,
                lineHeight: config.smallFontSize * 1.5,
              },
            ]}
          >
            Even with push notifications disabled, you can still view your
            notifications in the app by tapping the bell icon.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    marginTop: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {},
  // Warning Card
  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  warningIconContainer: {
    backgroundColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: "#92400E",
  },
  warningText: {
    fontFamily: "Poppins_400Regular",
    color: "#B45309",
  },
  // Section
  section: {},
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  sectionSubtitle: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  // Card
  card: {
    backgroundColor: AppColors.background.primary,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDisabled: {
    opacity: 0.7,
  },
  // Setting Row
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIconContainer: {
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  iconDisabled: {
    backgroundColor: AppColors.gray[100],
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
  },
  settingDescription: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  textDisabled: {
    color: AppColors.gray[400],
  },
  settingDivider: {
    height: 1,
    backgroundColor: AppColors.gray[100],
  },
  disabledExplanation: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
    textAlign: "center",
    fontStyle: "italic",
  },
  // Switch Container
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchLoader: {},
  // Info Card
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: AppColors.gray[50],
  },
  infoText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
  },
})
