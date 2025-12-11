/**
 * Deep link utility functions for sharing and notifications
 */

const APP_SCHEME = "darshandelights://"
const WEB_URL = "https://darshandelights.com.au"

// ============================================
// Deep Link Generators (App Scheme)
// ============================================

/**
 * Generate a product deep link
 */
export function getProductDeepLink(productId: number | string): string {
  return `${APP_SCHEME}product/${productId}`
}

/**
 * Generate a category deep link
 */
export function getCategoryDeepLink(categorySlug: string): string {
  return `${APP_SCHEME}category/${categorySlug}`
}

/**
 * Generate an order deep link
 */
export function getOrderDeepLink(orderId: number | string): string {
  return `${APP_SCHEME}order/${orderId}`
}

/**
 * Generate a search deep link
 */
export function getSearchDeepLink(query: string): string {
  return `${APP_SCHEME}search?q=${encodeURIComponent(query)}`
}

/**
 * Generate a cart deep link
 */
export function getCartDeepLink(): string {
  return `${APP_SCHEME}cart`
}

/**
 * Generate a notifications deep link
 */
export function getNotificationsDeepLink(): string {
  return `${APP_SCHEME}notifications`
}

/**
 * Generate a home deep link
 */
export function getHomeDeepLink(): string {
  return `${APP_SCHEME}home`
}

/**
 * Generate a favorites deep link
 */
export function getFavoritesDeepLink(): string {
  return `${APP_SCHEME}favorites`
}

/**
 * Generate a shop deep link with optional category
 */
export function getShopDeepLink(category?: string): string {
  if (category) {
    return `${APP_SCHEME}shop?category=${encodeURIComponent(category)}`
  }
  return `${APP_SCHEME}shop`
}

// ============================================
// Web URL Generators (For Sharing)
// ============================================

/**
 * Generate a product web URL (for sharing)
 */
export function getProductWebUrl(productSlug: string): string {
  return `${WEB_URL}/product/${productSlug}`
}

/**
 * Generate a category web URL (for sharing)
 */
export function getCategoryWebUrl(categorySlug: string): string {
  return `${WEB_URL}/category/${categorySlug}`
}

// ============================================
// Notification Deep Link Helpers
// ============================================

export interface NotificationDeepLinkData {
  deepLink?: string
  type?: string
  orderId?: number | string
  productId?: number | string
  notificationId?: number | string
}

/**
 * Create notification payload with deep link based on notification type
 */
export function createNotificationDeepLink(
  type: string,
  data: Record<string, any>
): NotificationDeepLinkData {
  let deepLink: string | undefined

  switch (type) {
    // Order notifications
    case "order_placed":
    case "order_confirmed":
    case "order_processing":
    case "order_shipped":
    case "order_delivered":
    case "order_cancelled":
    case "payment_success":
    case "payment_failed":
      deepLink = data.orderId ? getOrderDeepLink(data.orderId) : undefined
      break

    // Promotional notifications
    case "promo":
      if (data.productId) {
        deepLink = getProductDeepLink(data.productId)
      } else if (data.categorySlug) {
        deepLink = getCategoryDeepLink(data.categorySlug)
      } else {
        deepLink = getShopDeepLink()
      }
      break

    // Cart reminder
    case "cart_reminder":
      deepLink = getCartDeepLink()
      break

    // Restock notification
    case "restock":
      deepLink = data.productId
        ? getProductDeepLink(data.productId)
        : getShopDeepLink()
      break

    // General/System notifications
    case "general":
    case "system":
    default:
      deepLink = getNotificationsDeepLink()
  }

  return {
    ...data,
    type,
    deepLink,
  }
}

/**
 * Get deep link for a notification based on its type and data
 */
export function getNotificationDeepLink(notification: {
  type?: string
  data?: Record<string, any>
}): string {
  const { type, data = {} } = notification

  if (!type) return getNotificationsDeepLink()

  const result = createNotificationDeepLink(type, data)
  return result.deepLink || getNotificationsDeepLink()
}
