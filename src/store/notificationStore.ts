import { Notification } from "@/src/types/notifications"
import { create } from "zustand"

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  hasMore: boolean
  page: number

  // Actions
  setNotifications: (notifications: Notification[]) => void
  addNotifications: (notifications: Notification[]) => void
  setUnreadCount: (count: number) => void
  decrementUnreadCount: () => void
  markAsRead: (id: number) => void
  markAllAsRead: () => void
  removeNotification: (id: number) => void
  setLoading: (loading: boolean) => void
  setHasMore: (hasMore: boolean) => void
  setPage: (page: number) => void
  incrementPage: () => void
  reset: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasMore: true,
  page: 1,

  setNotifications: (notifications) => set({ notifications }),

  addNotifications: (newNotifications) =>
    set((state) => ({
      notifications: [...state.notifications, ...newNotifications],
    })),

  setUnreadCount: (count) => set({ unreadCount: count }),

  decrementUnreadCount: () =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id
          ? { ...n, isRead: true, readAt: new Date().toISOString() }
          : n
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        isRead: true,
        readAt: n.readAt || new Date().toISOString(),
      })),
      unreadCount: 0,
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setHasMore: (hasMore) => set({ hasMore }),

  setPage: (page) => set({ page }),

  incrementPage: () => set((state) => ({ page: state.page + 1 })),

  reset: () =>
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      hasMore: true,
      page: 1,
    }),
}))
