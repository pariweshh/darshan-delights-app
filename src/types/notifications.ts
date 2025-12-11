export type NotificationType =
  | "order_placed"
  | "order_confirmed"
  | "order_processing"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "payment_success"
  | "payment_failed"
  | "promo"
  | "general"
  | "system"

export type NotificationPriority = "low" | "normal" | "high" | "urgent"

export interface Notification {
  id: number
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  isRead: boolean
  readAt: string | null
  actionUrl: string | null
  metadata: Record<string, any> | null
  order?: {
    id: number
    orderNumber: string
  } | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface NotificationResponse {
  data: Notification[]
  meta: {
    pagination: {
      page: number
      pageSize: number
      total: number
      pageCount: number
    }
    unreadCount: number
  }
}

export interface PushTokenPayload {
  token: string
  platform: "ios" | "android"
  deviceName?: string
}

// Notification icon mapping
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  order_placed: "cart-outline",
  order_confirmed: "checkmark-circle-outline",
  order_processing: "cube-outline",
  order_shipped: "car-outline",
  order_delivered: "gift-outline",
  order_cancelled: "close-circle-outline",
  payment_success: "card-outline",
  payment_failed: "alert-circle-outline",
  promo: "pricetag-outline",
  general: "notifications-outline",
  system: "settings-outline",
}

// Notification color mapping
export const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  order_placed: "#3B82F6", // blue
  order_confirmed: "#10B981", // green
  order_processing: "#F59E0B", // amber
  order_shipped: "#8B5CF6", // purple
  order_delivered: "#10B981", // green
  order_cancelled: "#EF4444", // red
  payment_success: "#10B981", // green
  payment_failed: "#EF4444", // red
  promo: "#F97316", // orange
  general: "#6B7280", // gray
  system: "#6B7280", // gray
}
