import AsyncStorage from "@react-native-async-storage/async-storage"
import * as StoreReview from "expo-store-review"
import { Alert, Linking, Platform } from "react-native"

const RATING_STORAGE_KEY = "@app_rating"
const ORDERS_BEFORE_PROMPT = 2 // Show after 2nd successful order
const DAYS_BETWEEN_PROMPTS = 30 // Don't ask again for 30 days
const MAX_DISMISS_COUNT = 2
const APP_STORE_ID = process.env.APP_STORE_ID
const PLAY_STORE_ID = process.env.PLAY_STORE_ID

interface RatingData {
  hasRated: boolean
  lastPromptDate: string | null
  successfulOrders: number
  dismissCount: number
  lastDismissDate: string | null
}

const DEFAULT_RATING_DATA: RatingData = {
  hasRated: false,
  lastPromptDate: null,
  successfulOrders: 0,
  dismissCount: 0,
  lastDismissDate: null,
}

/**
 * Get stored rating data
 */
const getRatingData = async (): Promise<RatingData> => {
  try {
    const data = await AsyncStorage.getItem(RATING_STORAGE_KEY)
    if (data) {
      return { ...DEFAULT_RATING_DATA, ...JSON.parse(data) }
    }
    return DEFAULT_RATING_DATA
  } catch (error) {
    console.error("Error getting rating data:", error)
    return DEFAULT_RATING_DATA
  }
}

/**
 * Save rating data
 */
const saveRatingData = async (data: Partial<RatingData>): Promise<void> => {
  try {
    const currentData = await getRatingData()
    const newData = { ...currentData, ...data }
    await AsyncStorage.setItem(RATING_STORAGE_KEY, JSON.stringify(newData))
  } catch (error) {
    console.error("Error saving rating data:", error)
  }
}

/**
 * Check if enough time has passed since last prompt
 */
const hasEnoughTimePassed = (lastDate: string | null): boolean => {
  if (!lastDate) return true

  const lastPrompt = new Date(lastDate)
  const now = new Date()
  const daysDiff = Math.floor(
    (now.getTime() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24)
  )

  return daysDiff >= DAYS_BETWEEN_PROMPTS
}

/**
 * Increment successful order count
 */
export const recordSuccessfulOrder = async (): Promise<void> => {
  const data = await getRatingData()
  await saveRatingData({
    successfulOrders: data.successfulOrders + 1,
  })
}

/**
 * Check if we should show the rating prompt
 */
export const shouldShowRatingPrompt = async (): Promise<boolean> => {
  const data = await getRatingData()

  // Don't show if user has already rated
  if (data.hasRated) {
    return false
  }

  // Don't show if dismissed too many times (max 2)
  if (data.dismissCount >= MAX_DISMISS_COUNT) {
    return false
  }

  // Check if enough orders have been made
  if (data.successfulOrders < ORDERS_BEFORE_PROMPT) {
    return false
  }

  // Check if enough time has passed since last prompt
  if (!hasEnoughTimePassed(data.lastPromptDate)) {
    return false
  }

  // Check if enough time has passed since last dismiss
  if (!hasEnoughTimePassed(data.lastDismissDate)) {
    return false
  }

  return true
}

/**
 * Mark that user has rated the app
 */
export const markAsRated = async (): Promise<void> => {
  await saveRatingData({
    hasRated: true,
    lastPromptDate: new Date().toISOString(),
  })
}

/**
 * Mark that user dismissed the prompt
 */
export const markAsDismissed = async (): Promise<void> => {
  const data = await getRatingData()
  await saveRatingData({
    dismissCount: data.dismissCount + 1,
    lastDismissDate: new Date().toISOString(),
    lastPromptDate: new Date().toISOString(),
  })
}

/**
 * Open the app store page directly
 */
export const openAppStorePage = async (): Promise<void> => {
  const storeUrl = Platform.select({
    ios: `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`,
    android: `market://details?id=${PLAY_STORE_ID}`,
    default: "",
  })

  if (storeUrl) {
    try {
      const canOpen = await Linking.canOpenURL(storeUrl)
      if (canOpen) {
        await Linking.openURL(storeUrl)
      } else {
        // Fallback to web URL
        const webUrl = Platform.select({
          ios: `https://apps.apple.com/app/id${APP_STORE_ID}`,
          android: `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}`,
          default: "",
        })
        if (webUrl) {
          await Linking.openURL(webUrl)
        }
      }
    } catch (error) {
      console.error("Error opening store:", error)
    }
  }
}

/**
 * Request in-app review using native API
 */
export const requestInAppReview = async (): Promise<boolean> => {
  try {
    const isAvailable = await StoreReview.isAvailableAsync()

    if (isAvailable) {
      await StoreReview.requestReview()
      return true
    }

    return false
  } catch (error) {
    console.error("Error requesting review:", error)
    return false
  }
}

/**
 * Show the rating prompt with custom UI fallback
 */
export const showRatingPrompt = async (): Promise<void> => {
  const data = await getRatingData()

  // Update last prompt date
  await saveRatingData({
    lastPromptDate: new Date().toISOString(),
  })

  // Try native in-app review first
  const nativeReviewShown = await requestInAppReview()

  if (nativeReviewShown) {
    // Mark as rated (we can't know if they actually rated, but we tried)
    await markAsRated()
    return
  }

  // Fallback to custom alert
  Alert.alert(
    "Enjoying Darshan Delights? 🎉",
    "We'd love to hear your feedback! Would you mind taking a moment to rate us?",
    [
      {
        text: "Not Now",
        style: "cancel",
        onPress: () => markAsDismissed(),
      },
      {
        text: "Never Ask Again",
        style: "destructive",
        onPress: () => saveRatingData({ hasRated: true }),
      },
      {
        text: "Rate Now ⭐",
        onPress: async () => {
          await markAsRated()
          await openAppStorePage()
        },
      },
    ],
    { cancelable: true, onDismiss: () => markAsDismissed() }
  )
}

/**
 * Reset rating data (for testing)
 */
export const resetRatingData = async (): Promise<void> => {
  await AsyncStorage.removeItem(RATING_STORAGE_KEY)
}
