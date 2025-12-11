import { NotificationResponse } from "../types/notifications"
import api from "./client"

/**
 * Get user notifications with pagination
 */
export async function getNotifications(
  token: string,
  page: number = 1,
  pageSize: number = 20,
  unreadOnly: boolean = false
): Promise<NotificationResponse> {
  const response = await api.get("/notifications", {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      page,
      pageSize,
      unreadOnly: unreadOnly ? "true" : undefined,
    },
  })

  return response.data
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(token: string): Promise<number> {
  const response = await api.get("/notifications/unread-count", {
    headers: { Authorization: `Bearer ${token}` },
  })

  return response.data.count
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: number,
  token: string
): Promise<Notification> {
  const response = await api.put(
    `/notifications/${notificationId}/read`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  return response.data.data
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(
  token: string
): Promise<{ success: boolean; message: string }> {
  const response = await api.put(
    "/notifications/read-all",
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  return response.data
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: number,
  token: string
): Promise<{ success: boolean; message: string }> {
  const response = await api.delete(`/notifications/${notificationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  return response.data
}
