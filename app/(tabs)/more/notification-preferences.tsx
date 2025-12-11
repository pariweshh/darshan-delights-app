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
  TouchableOpacity,
  View,
} from "react-native"

import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

import {
  getNotificationPreferences,
  NotificationPreferences,
  updateNotificationPreferences,
} from "@/src/api/pushTokens"
import AppColors from "@/src/constants/Colors"
import { usePushNotifications } from "@/src/hooks/usePushNotifications"
import { useAuthStore } from "@/src/store/authStore"

const DEFAULT_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  orderUpdates: true,
  promotions: true,
  reminders: true,
}

export default function NotificationSettingsScreen() {
  const { token } = useAuthStore()
  const { refreshPreferences, refreshUnreadCount } = usePushNotifications()

  const [isLoading, setIsLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [systemPermission, setSystemPermission] = useState<boolean | null>(null)
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFERENCES)

  // Track pending updates to prevent race conditions
  const pendingUpdates = useRef<Partial<NotificationPreferences>>({})

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

    // Store the pending update
    pendingUpdates.current[key] = value
    setSavingKey(key)

    try {
      const result = await updateNotificationPreferences(
        { [key]: value },
        token
      )
      setPreferences(result.preferences)

      // Clear the pending update for this key
      delete pendingUpdates.current[key]

      // Refresh the hook's preferences so other components get updated
      await refreshPreferences()

      // Refresh unread count in case badge needs updating
      await refreshUnreadCount()

      Toast.show({
        type: "success",
        text1: "Settings Updated",
        text2: "Your notification preferences have been saved",
        visibilityTime: 1500,
      })
    } catch (error) {
      console.error("Error saving preference:", error)
      // Revert the change
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
   * Handle master toggle (push notifications on/off)
   */
  const handlePushToggle = async (enabled: boolean) => {
    if (enabled && !systemPermission) {
      // First try to request permission
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
    //Prevent toggling while another save is in progress for the same key
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
   * Refresh system permission status (e.g., when returning from settings)
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
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // Check if categories should be disabled
  const categoriesDisabled = !preferences.pushEnabled || !systemPermission

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* System Permission Warning */}
        {systemPermission === false && (
          <TouchableOpacity
            style={styles.warningCard}
            onPress={openSystemSettings}
            activeOpacity={0.7}
          >
            <View style={styles.warningIconContainer}>
              <Ionicons
                name="warning-outline"
                size={24}
                color={AppColors.warning}
              />
            </View>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>
                Notifications are disabled
              </Text>
              <Text style={styles.warningText}>
                Tap here to enable notifications in your device settings
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={AppColors.gray[400]}
            />
          </TouchableOpacity>
        )}

        {/* Master Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={styles.settingIconContainer}>
                  <Ionicons
                    name="notifications"
                    size={22}
                    color={AppColors.primary[600]}
                  />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Push Notifications</Text>
                  <Text style={styles.settingDescription}>
                    Receive notifications on your device
                  </Text>
                </View>
              </View>
              <View style={styles.switchContainer}>
                {savingKey === "pushEnabled" && (
                  <ActivityIndicator
                    size="small"
                    color={AppColors.primary[500]}
                    style={styles.switchLoader}
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          <Text style={styles.sectionSubtitle}>
            Choose which notifications you'd like to receive
          </Text>

          <View
            style={[styles.card, categoriesDisabled && styles.cardDisabled]}
          >
            {/* Order Updates */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View
                  style={[
                    styles.settingIconContainer,
                    { backgroundColor: AppColors.primary[50] },
                    categoriesDisabled && styles.iconDisabled,
                  ]}
                >
                  <Ionicons
                    name="cube-outline"
                    size={20}
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
                      categoriesDisabled && styles.textDisabled,
                    ]}
                  >
                    Order Updates
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
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
                    style={styles.switchLoader}
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

            <View style={styles.settingDivider} />

            {/* Promotions */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View
                  style={[
                    styles.settingIconContainer,
                    { backgroundColor: "#FEF3C7" },
                    categoriesDisabled && styles.iconDisabled,
                  ]}
                >
                  <Ionicons
                    name="pricetag-outline"
                    size={20}
                    color={categoriesDisabled ? AppColors.gray[400] : "#D97706"}
                  />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text
                    style={[
                      styles.settingLabel,
                      categoriesDisabled && styles.textDisabled,
                    ]}
                  >
                    Promotions & Offers
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
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
                    style={styles.switchLoader}
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

            <View style={styles.settingDivider} />

            {/* Reminders */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View
                  style={[
                    styles.settingIconContainer,
                    { backgroundColor: "#DBEAFE" },
                    categoriesDisabled && styles.iconDisabled,
                  ]}
                >
                  <Ionicons
                    name="alarm-outline"
                    size={20}
                    color={categoriesDisabled ? AppColors.gray[400] : "#2563EB"}
                  />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text
                    style={[
                      styles.settingLabel,
                      categoriesDisabled && styles.textDisabled,
                    ]}
                  >
                    Reminders
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
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
                    style={styles.switchLoader}
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
            <Text style={styles.disabledExplanation}>
              Enable push notifications above to customize notification types
            </Text>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={AppColors.text.tertiary}
          />
          <Text style={styles.infoText}>
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
    fontSize: 14,
    color: AppColors.text.secondary,
    marginTop: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  // Warning Card
  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  warningIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#92400E",
  },
  warningText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#B45309",
    marginTop: 2,
  },
  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    marginBottom: 12,
  },
  // Card
  card: {
    backgroundColor: AppColors.background.primary,
    borderRadius: 12,
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
    padding: 16,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconDisabled: {
    backgroundColor: AppColors.gray[100],
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: AppColors.text.primary,
  },
  settingDescription: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.secondary,
    marginTop: 2,
  },
  textDisabled: {
    color: AppColors.gray[400],
  },
  settingDivider: {
    height: 1,
    backgroundColor: AppColors.gray[100],
    marginLeft: 68,
  },
  disabledExplanation: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.tertiary,
    marginTop: 8,
    textAlign: "center",
    fontStyle: "italic",
  },
  // Switch Container
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchLoader: {
    marginRight: 8,
  },
  // Info Card
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: AppColors.gray[50],
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.tertiary,
    lineHeight: 18,
  },
  // Saving Overlay
  savingOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: AppColors.primary[50],
    borderRadius: 8,
  },
  savingText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.primary[600],
  },
})
