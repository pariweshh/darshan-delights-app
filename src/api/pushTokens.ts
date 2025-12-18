import { PushTokenPayload } from "../types/notifications"
import api from "./client"
export interface NotificationPreferences {
  pushEnabled: boolean
  orderUpdates: boolean
  promotions?: boolean
  reminders?: boolean
}

/**
 * Register push token with backend
 */
export async function registerPushToken(
  payload: PushTokenPayload & {
    preferences?: Partial<NotificationPreferences>
  },
  token: string
): Promise<{
  success: boolean
  message: string
  preferences: NotificationPreferences
}> {
  const response = await api.post("/push-tokens/register", payload, {
    headers: { Authorization: `Bearer ${token}` },
  })

  return response.data
}

/**
 * Unregister push token
 */
export async function unregisterPushToken(
  pushToken: string,
  authToken: string
): Promise<{ success: boolean; message: string }> {
  const response = await api.post(
    "/push-tokens/unregister",
    { token: pushToken },
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  )

  return response.data
}

/**
 * Get notification preferences from backend
 */
export async function getNotificationPreferences(
  token: string
): Promise<NotificationPreferences> {
  const response = await api.get("/push-tokens/preferences", {
    headers: { Authorization: `Bearer ${token}` },
  })

  return response.data
}

/**
 * Update notification preferences on backend
 */
export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>,
  token: string
): Promise<{ success: boolean; preferences: NotificationPreferences }> {
  const response = await api.put("/push-tokens/preferences", preferences, {
    headers: { Authorization: `Bearer ${token}` },
  })

  return response.data
}
