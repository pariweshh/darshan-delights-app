import Constants from "expo-constants"
import * as Device from "expo-device"
import * as Linking from "expo-linking"
import * as Notifications from "expo-notifications"
import { useRouter } from "expo-router"
import { useEffect, useRef, useState } from "react"
import { Platform } from "react-native"

import { getUnreadCount } from "../api/notifications"
import {
  getNotificationPreferences,
  registerPushToken,
  unregisterPushToken,
} from "../api/pushTokens"
import { useAuthStore } from "../store/authStore"
import { useNotificationStore } from "../store/notificationStore"

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

interface NotificationPreferences {
  pushEnabled: boolean
  orderUpdates: boolean
  promotions?: boolean
  reminders?: boolean
}

// Default preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  orderUpdates: true,
  promotions: true,
  reminders: true,
}

interface UsePushNotificationsReturn {
  expoPushToken: string | null
  notification: Notifications.Notification | null
  error: string | null
  isRegistered: boolean
  preferences: NotificationPreferences
  refreshUnreadCount: () => Promise<void>
  refreshPreferences: () => Promise<void>
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const router = useRouter()
  const { token: authToken, user } = useAuthStore()
  const { setUnreadCount } = useNotificationStore()

  // Check if user is authenticated (has both token and user)
  const isAuthenticated = !!authToken && !!user

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFERENCES)

  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null
  )
  const responseListener = useRef<Notifications.EventSubscription | null>(null)

  /**
   * Register for push notifications (device-level)
   * This should ALWAYS be attempted first, regardless of backend preferences
   */
  async function registerForPushNotifications(): Promise<string | null> {
    // Must be a physical device
    if (!Device.isDevice) {
      setError("Push notifications require a physical device")
      if (__DEV__) {
        console.log("Push notifications require a physical device")
      }
      return null
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    // Request permissions if not granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== "granted") {
      setError("Permission not granted for push notifications")
      if (__DEV__) {
        console.log("Permission not granted for push notifications")
      }
      return null
    }

    try {
      // Get Expo push token
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId

      if (!projectId) {
        setError("Project ID not found")
        if (__DEV__) {
          console.log("Project ID not found in app config")
        }
        return null
      }

      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId,
      })

      if (__DEV__) {
        console.log("Expo Push Token:", pushToken.data)
        console.log("Platform:", Platform.OS)
      }

      // Android-specific channel setup
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#F97316",
        })

        await Notifications.setNotificationChannelAsync("orders", {
          name: "Order Updates",
          description: "Notifications about your orders",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#F97316",
        })

        await Notifications.setNotificationChannelAsync("promos", {
          name: "Promotions",
          description: "Special offers and discounts",
          importance: Notifications.AndroidImportance.DEFAULT,
        })
      }

      return pushToken.data
    } catch (e: any) {
      setError(e.message || "Failed to get push token")
      console.error("Error getting push token:", e)
      return null
    }
  }

  /**
   * Register token with backend - this creates or updates the push token record
   */
  async function registerTokenWithBackend(
    pushToken: string,
    prefs: NotificationPreferences
  ) {
    if (!authToken) return

    try {
      const response = await registerPushToken(
        {
          token: pushToken,
          platform: Platform.OS as "ios" | "android",
          deviceName: Device.deviceName || undefined,
          preferences: {
            pushEnabled: true,
            orderUpdates: prefs.orderUpdates,
            promotions: prefs.promotions,
            reminders: prefs.reminders,
          },
        },
        authToken
      )
      setIsRegistered(true)
      if (__DEV__) {
        console.log("Push token registered with backend")
      }

      if (response?.preferences) {
        return {
          pushEnabled: response.preferences.pushEnabled ?? true,
          orderUpdates: response.preferences.orderUpdates ?? true,
          promotions: response.preferences.promotions ?? true,
          reminders: response.preferences.reminders ?? true,
        }
      }

      return { ...prefs, pushEnabled: true }
    } catch (e: any) {
      console.error("Failed to register push token with backend:", e)
      setError("Failed to register push token")
      return prefs
    }
  }

  /**
   * Fetch preferences from backend
   * Returns DEFAULT_PREFERENCES if no token exists yet

   */
  async function fetchPreferences(): Promise<NotificationPreferences> {
    if (!authToken) return DEFAULT_PREFERENCES

    try {
      const prefs = await getNotificationPreferences(authToken)
      setPreferences(prefs)
      return prefs
    } catch (error: any) {
      // If 404 or no token found, return defaults (this is expected for new users)
      if (
        error?.response?.status === 404 ||
        error?.message?.includes("not found")
      ) {
        if (__DEV__) {
          console.log("No existing push token found, will create one")
        }
        return DEFAULT_PREFERENCES
      }
      console.error("Error fetching notification preferences:", error)
      return DEFAULT_PREFERENCES
    }
  }

  /**
   * Fetch unread count
   */
  async function fetchUnreadCount() {
    if (!authToken) return

    try {
      const count = await getUnreadCount(authToken)
      setUnreadCount(count)

      // Update badge
      await Notifications.setBadgeCountAsync(count)
    } catch (e) {
      console.error("Failed to fetch unread count:", e)
    }
  }

  /**
   * Handle notification tap/interaction
   */
  function handleNotificationResponse(
    response: Notifications.NotificationResponse
  ) {
    const data = response.notification.request.content.data
    if (__DEV__) {
      console.log("Notification tapped:", data)
    }

    // Priority 1: Use deepLink if provided
    if (data.deepLink && typeof data.deepLink === "string") {
      console.log("Opening deep link:", data.deepLink)
      Linking.openURL(data.deepLink)
      return
    }

    // Priority 2: Use actionUrl if provided (legacy support)
    if (data.actionUrl && typeof data.actionUrl === "string") {
      // Check if it's a deep link or a relative path
      if (data.actionUrl.startsWith("darshandelights://")) {
        Linking.openURL(data.actionUrl)
      } else {
        // It's a relative path, navigate directly
        router.push(data.actionUrl as any)
      }
      return
    }

    // Priority 3: Navigate based on notification type
    const type = data.type?.toString() || ""

    if (
      type.startsWith("order_") ||
      type === "payment_success" ||
      type === "payment_failed"
    ) {
      if (data.orderId) {
        router.push({
          pathname: "/(tabs)/more/orders",
          params: { orderId: data.orderId.toString() },
        })
      } else {
        router.push("/(tabs)/more/orders")
      }
      return
    }

    if (type === "promo" || type === "restock") {
      if (data.productId) {
        router.push({
          pathname: "/product/[id]",
          params: { id: data.productId.toString() },
        })
      } else if (data.categorySlug) {
        router.push({
          pathname: "/shop",
          params: { category: String(data.categorySlug) },
        })
      } else {
        router.push("/(tabs)/products")
      }
      return
    }

    if (type === "cart_reminder") {
      router.push("/(tabs)/cart")
      return
    }

    // Default: Go to notifications screen
    if (data.notificationId) {
      router.push("/notifications")
    }
  }

  /**
   * Refresh preferences (can be called from outside)
   */
  async function refreshPreferences() {
    await fetchPreferences()
  }

  // Initialize push notifications
  useEffect(() => {
    if (!isAuthenticated || !authToken) {
      // Reset state when logged out
      setExpoPushToken(null)
      setIsRegistered(false)
      setPreferences(DEFAULT_PREFERENCES)
      return
    }

    let isMounted = true

    async function init() {
      if (__DEV__) {
        console.log("=== PUSH NOTIFICATION INIT ===")
        console.log("Platform:", Platform.OS)
        console.log("Is Device:", Device.isDevice)
      }

      // STEP 1: Always try to get the device push token first
      // This is independent of backend preferences
      const token = await registerForPushNotifications()

      if (!token) {
        if (__DEV__) {
          console.log("Failed to get push token, skipping backend registration")
        }
        // Still fetch unread count for in-app display
        await fetchUnreadCount()
        return
      }

      if (!isMounted) return

      setExpoPushToken(token)

      // STEP 2: Fetch existing preferences (or get defaults if none exist)
      const existingPrefs = await fetchPreferences()

      // STEP 3: Register/update token with backend
      // This will CREATE the push token record if it doesn't exist
      const updatedPrefs = await registerTokenWithBackend(token, existingPrefs)

      if (isMounted) {
        setPreferences(updatedPrefs ?? existingPrefs)
      }

      // STEP 4: Fetch initial unread count
      await fetchUnreadCount()

      if (__DEV__) {
        console.log("=== PUSH NOTIFICATION INIT COMPLETE ===")
        console.log("Token:", token)
        console.log("Preferences:", updatedPrefs)
      }
    }

    init()

    // Listen for incoming notifications (foreground)
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        if (__DEV__) {
          console.log("Notification received (foreground):", notification)
        }
        setNotification(notification)

        // Refresh unread count
        fetchUnreadCount()
      })

    // Listen for notification interactions
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationResponse(response)
      })

    return () => {
      isMounted = false

      if (notificationListener.current) {
        notificationListener.current.remove()
      }
      if (responseListener.current) {
        responseListener.current.remove()
      }
    }
  }, [isAuthenticated, authToken])

  // Unregister token on logout
  useEffect(() => {
    const wasAuthenticated = isAuthenticated

    return () => {
      if (wasAuthenticated && !isAuthenticated && expoPushToken && authToken) {
        unregisterPushToken(expoPushToken, authToken).catch(console.error)
        setIsRegistered(false)
        setExpoPushToken(null)
      }
    }
  }, [isAuthenticated])

  return {
    expoPushToken,
    notification,
    error,
    isRegistered,
    preferences,
    refreshUnreadCount: fetchUnreadCount,
    refreshPreferences,
  }
}

/**
 * Hook to get last notification response (for handling app opened via notification)
 */
export function useLastNotificationResponse() {
  return Notifications.useLastNotificationResponse()
}
