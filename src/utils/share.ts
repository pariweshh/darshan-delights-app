import * as Linking from "expo-linking"
import { Platform, Share } from "react-native"

const WEB_URL = "https://darshandelights.com.au"

interface ShareProductParams {
  productId: number
  productName: string
  productSlug: string
  productImage?: string
  price?: number
  salePrice?: number | null
}

interface ShareResult {
  success: boolean
  action?: string
  error?: string
}

// App Store URLs - Update these once your app is published
const APP_STORE_URL = "https://apps.apple.com/app/darshan-delights/id0000000000" // Replace with actual ID
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.darshandelights.app" // Replace with actual package name

// Set to true once app is published to stores
const IS_APP_PUBLISHED = false

// ... (keep all existing functions: shareProduct, shareCategory, shareOrderConfirmation)

/**
 * Get the appropriate app download link based on platform
 */
export function getAppDownloadUrl(): string {
  if (!IS_APP_PUBLISHED) {
    return WEB_URL
  }

  return Platform.select({
    ios: APP_STORE_URL,
    android: PLAY_STORE_URL,
    default: WEB_URL,
  })!
}

/**
 * Get both store links for sharing
 */
export function getAppStoreLinks(): {
  ios: string
  android: string
  web: string
} {
  return {
    ios: IS_APP_PUBLISHED ? APP_STORE_URL : WEB_URL,
    android: IS_APP_PUBLISHED ? PLAY_STORE_URL : WEB_URL,
    web: WEB_URL,
  }
}

/**
 * Generate product web URL for sharing
 */
export function getProductShareUrl(productSlug: string): string {
  return `${WEB_URL}/shop/products/${productSlug}`
}

/**
 * Share a product via native share sheet
 */
export async function shareProduct(
  params: ShareProductParams
): Promise<ShareResult> {
  const { productName, productSlug, price, salePrice } = params

  try {
    const webUrl = getProductShareUrl(productSlug)

    // Format price for message
    let priceText = ""
    if (salePrice && salePrice < (price || 0)) {
      priceText = ` - Now $${salePrice.toFixed(2)} (was $${price?.toFixed(2)})`
    } else if (price) {
      priceText = ` - $${price.toFixed(2)}`
    }

    // Create share message
    const message = Platform.select({
      ios: `Check out ${productName}${priceText} on Darshan Delights! 🛒`,
      android: `Check out ${productName}${priceText} on Darshan Delights! 🛒\n\n${webUrl}`,
      default: `Check out ${productName} on Darshan Delights!`,
    })

    const result = await Share.share(
      {
        message: message!,
        url: webUrl, // iOS only - Android includes URL in message
        title: `${productName} - Darshan Delights`,
      },
      {
        // iOS specific options
        subject: `${productName} - Darshan Delights`,
        // Android specific options
        dialogTitle: `Share ${productName}`,
      }
    )

    if (result.action === Share.sharedAction) {
      return {
        success: true,
        action: result.activityType || "shared",
      }
    } else if (result.action === Share.dismissedAction) {
      return {
        success: false,
        action: "dismissed",
      }
    }

    return { success: false }
  } catch (error: any) {
    console.error("Error sharing product:", error)
    return {
      success: false,
      error: error.message || "Failed to share product",
    }
  }
}

interface ShareCategoryParams {
  categoryName: string
  categorySlug: string
}

/**
 * Share a category via native share sheet
 */
export async function shareCategory(
  params: ShareCategoryParams
): Promise<ShareResult> {
  const { categoryName, categorySlug } = params

  try {
    const webUrl = `${WEB_URL}/shop/${categorySlug}`

    const message = Platform.select({
      ios: `Check out ${categoryName} products on Darshan Delights! 🛒`,
      android: `Check out ${categoryName} products on Darshan Delights! 🛒\n\n${webUrl}`,
      default: `Check out ${categoryName} on Darshan Delights!`,
    })

    const result = await Share.share(
      {
        message: message!,
        url: webUrl,
        title: `${categoryName} - Darshan Delights`,
      },
      {
        subject: `${categoryName} - Darshan Delights`,
        dialogTitle: `Share ${categoryName}`,
      }
    )

    if (result.action === Share.sharedAction) {
      return { success: true, action: result.activityType || "shared" }
    }

    return { success: false, action: "dismissed" }
  } catch (error: any) {
    console.error("Error sharing category:", error)
    return { success: false, error: error.message }
  }
}

interface ShareOrderParams {
  orderNumber: string
  totalAmount: number
}

/**
 * Share order confirmation (for user to share their purchase)
 */
export async function shareOrderConfirmation(
  params: ShareOrderParams
): Promise<ShareResult> {
  const { orderNumber, totalAmount } = params

  try {
    const message = `I just ordered from Darshan Delights! 🎉 Order #${orderNumber} - $${totalAmount.toFixed(
      2
    )}\n\nCheck them out for authentic Nepali & Indian groceries! 🛒\n\n${WEB_URL}`

    const result = await Share.share(
      {
        message,
        title: "My Darshan Delights Order",
      },
      {
        subject: "My Darshan Delights Order",
        dialogTitle: "Share your order",
      }
    )

    if (result.action === Share.sharedAction) {
      return { success: true, action: result.activityType || "shared" }
    }

    return { success: false, action: "dismissed" }
  } catch (error: any) {
    console.error("Error sharing order:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Share the app itself
 */
export async function shareApp(): Promise<ShareResult> {
  try {
    let message: string
    let url: string

    if (IS_APP_PUBLISHED) {
      // App is published - share with store links
      const storeUrl = getAppDownloadUrl()

      message = Platform.select({
        ios: `Check out Darshan Delights for authentic Nepali & Indian groceries delivered to your door! 🛒🇳🇵🇮🇳\n\nDownload the app:`,
        android: `Check out Darshan Delights for authentic Nepali & Indian groceries delivered to your door! 🛒🇳🇵🇮🇳\n\nDownload the app: ${storeUrl}`,
        default: `Check out Darshan Delights for authentic Nepali & Indian groceries!`,
      })!

      url = storeUrl
    } else {
      // App not yet published - share website
      message = Platform.select({
        ios: `Check out Darshan Delights for authentic Nepali & Indian groceries delivered to your door! 🛒🇳🇵🇮🇳\n\nVisit us at:`,
        android: `Check out Darshan Delights for authentic Nepali & Indian groceries delivered to your door! 🛒🇳🇵🇮🇳\n\nVisit us at: ${WEB_URL}`,
        default: `Check out Darshan Delights!`,
      })!

      url = WEB_URL
    }

    const result = await Share.share(
      {
        message,
        url, // iOS only
        title: "Darshan Delights - Nepali & Indian Groceries",
      },
      {
        subject: "Darshan Delights - Nepali & Indian Groceries",
        dialogTitle: "Share Darshan Delights",
      }
    )

    if (result.action === Share.sharedAction) {
      return { success: true, action: result.activityType || "shared" }
    }

    return { success: false, action: "dismissed" }
  } catch (error: any) {
    console.error("Error sharing app:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Share app with both store links (for cross-platform sharing)
 * Useful when you want to include both iOS and Android links
 */
export async function shareAppWithBothLinks(): Promise<ShareResult> {
  try {
    let message: string

    if (IS_APP_PUBLISHED) {
      message = `Check out Darshan Delights for authentic Nepali & Indian groceries delivered to your door! 🛒🇳🇵🇮🇳

📱 Download the app:
- iPhone: ${APP_STORE_URL}
- Android: ${PLAY_STORE_URL}

🌐 Or visit: ${WEB_URL}`
    } else {
      message = `Check out Darshan Delights for authentic Nepali & Indian groceries delivered to your door! 🛒🇳🇵🇮🇳

🌐 Visit us: ${WEB_URL}

📱 Mobile app coming soon to App Store & Google Play!`
    }

    const result = await Share.share(
      {
        message,
        title: "Darshan Delights - Nepali & Indian Groceries",
      },
      {
        subject: "Darshan Delights - Nepali & Indian Groceries",
        dialogTitle: "Share Darshan Delights",
      }
    )

    if (result.action === Share.sharedAction) {
      return { success: true, action: result.activityType || "shared" }
    }

    return { success: false, action: "dismissed" }
  } catch (error: any) {
    console.error("Error sharing app:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Open app store page for rating/review
 */
export async function openAppStoreForRating(): Promise<boolean> {
  if (!IS_APP_PUBLISHED) {
    console.log("App not yet published to stores")
    return false
  }

  try {
    const storeUrl = Platform.select({
      ios: `${APP_STORE_URL}?action=write-review`,
      android: PLAY_STORE_URL,
      default: null,
    })

    if (storeUrl) {
      const canOpen = await Linking.canOpenURL(storeUrl)
      if (canOpen) {
        await Linking.openURL(storeUrl)
        return true
      }
    }

    return false
  } catch (error) {
    console.error("Error opening app store:", error)
    return false
  }
}
