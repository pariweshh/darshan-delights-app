import * as Notifications from "expo-notifications"
import { Stack, useRouter } from "expo-router"
import React, { memo, useCallback, useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import Toast from "react-native-toast-message"

import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/src/api/notifications"
import EmptyState from "@/src/components/common/EmptyState"
import Wrapper from "@/src/components/common/Wrapper"
import NotificationCard from "@/src/components/notifications/NotificationCard"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"
import { useNotificationStore } from "@/src/store/notificationStore"
import { Notification } from "@/src/types/notifications"

const PAGE_SIZE = 20

interface NotificationItemProps {
  item: Notification
  onPress: (notification: Notification) => void
  onDelete: (notification: Notification) => void
}

const NotificationItem = memo(
  ({ item, onPress, onDelete }: NotificationItemProps) => {
    const handlePress = useCallback(() => onPress(item), [onPress, item])
    const handleDelete = useCallback(() => onDelete(item), [onDelete, item])

    return (
      <NotificationCard
        notification={item}
        onPress={handlePress}
        onDelete={handleDelete}
      />
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.isRead === nextProps.item.isRead
    )
  }
)

// ==========================================
// Memoized Header Component
// ==========================================

interface ListHeaderProps {
  unreadCount: number
  hasNotifications: boolean
  onMarkAllRead: () => void
}

const ListHeader = memo(
  ({ unreadCount, hasNotifications, onMarkAllRead }: ListHeaderProps) => {
    if (!hasNotifications) return null

    return (
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
        </Text>
        {unreadCount > 0 && (
          <DebouncedTouchable onPress={onMarkAllRead} activeOpacity={0.7}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </DebouncedTouchable>
        )}
      </View>
    )
  }
)

// ==========================================
// Memoized Footer Component
// ==========================================

const ListFooter = memo(({ isLoadingMore }: { isLoadingMore: boolean }) => {
  if (!isLoadingMore) return null

  return (
    <View style={styles.loadingFooter}>
      <ActivityIndicator size="small" color={AppColors.primary[500]} />
    </View>
  )
})

export default function NotificationsScreen() {
  const router = useRouter()
  const token = useAuthStore((state) => state.token)

  const notifications = useNotificationStore((state) => state.notifications)
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const isLoading = useNotificationStore((state) => state.isLoading)
  const hasMore = useNotificationStore((state) => state.hasMore)
  const page = useNotificationStore((state) => state.page)
  const setNotifications = useNotificationStore(
    (state) => state.setNotifications
  )
  const addNotifications = useNotificationStore(
    (state) => state.addNotifications
  )
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount)
  const decrementUnreadCount = useNotificationStore(
    (state) => state.decrementUnreadCount
  )
  const markAsRead = useNotificationStore((state) => state.markAsRead)
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead)
  const removeNotification = useNotificationStore(
    (state) => state.removeNotification
  )
  const setLoading = useNotificationStore((state) => state.setLoading)
  const setHasMore = useNotificationStore((state) => state.setHasMore)
  const setPage = useNotificationStore((state) => state.setPage)
  const incrementPage = useNotificationStore((state) => state.incrementPage)

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  /**
   * Fetch notifications
   */
  const fetchNotifications = useCallback(
    async (pageNum: number = 1, refresh: boolean = false) => {
      if (!token) return

      try {
        if (refresh) {
          setIsRefreshing(true)
        } else if (pageNum === 1) {
          setLoading(true)
        } else {
          setIsLoadingMore(true)
        }

        const response = await getNotifications(token, pageNum, PAGE_SIZE)

        if (refresh || pageNum === 1) {
          setNotifications(response.data)
          setPage(1)
        } else {
          addNotifications(response.data)
        }

        setUnreadCount(response.meta.unreadCount)
        setHasMore(pageNum < response.meta.pagination.pageCount)
      } catch (error) {
        console.error("Error fetching notifications:", error)
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load notifications",
          visibilityTime: 2000,
        })
      } finally {
        setLoading(false)
        setIsRefreshing(false)
        setIsLoadingMore(false)
      }
    },
    [
      token,
      setLoading,
      setNotifications,
      setPage,
      addNotifications,
      setUnreadCount,
      setHasMore,
    ]
  )

  useEffect(() => {
    fetchNotifications(1)
  }, [])

  useEffect(() => {
    Notifications.setBadgeCountAsync(0)
  }, [])

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(() => {
    fetchNotifications(1, true)
  }, [fetchNotifications])

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading) {
      const nextPage = page + 1
      incrementPage()
      fetchNotifications(nextPage)
    }
  }, [
    isLoadingMore,
    hasMore,
    isLoading,
    page,
    incrementPage,
    fetchNotifications,
  ])

  const handleNotificationPress = useCallback(
    async (notification: Notification) => {
      if (!notification.isRead && token) {
        try {
          await markNotificationAsRead(notification.id, token)
          await Notifications.setBadgeCountAsync(unreadCount - 1)
          markAsRead(notification.id)
          decrementUnreadCount()
        } catch (error) {
          console.error("Error marking notification as read:", error)
        }
      }

      if (notification.actionUrl) {
        router.push(notification.actionUrl as any)
      } else if (notification.order) {
        router.push(`/(tabs)/more/orders?orderId=${notification.order.id}`)
      }
    },
    [token, unreadCount, router, markAsRead, decrementUnreadCount]
  )

  const handleDeleteNotification = useCallback(
    (notification: Notification) => {
      Alert.alert(
        "Delete Notification",
        "Are you sure you want to delete this notification?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              if (!token) return

              try {
                await deleteNotification(notification.id, token)
                removeNotification(notification.id)

                if (!notification.isRead) {
                  decrementUnreadCount()
                  await Notifications.setBadgeCountAsync(unreadCount - 1)
                }

                Toast.show({
                  type: "success",
                  text1: "Deleted",
                  text2: "Notification removed",
                  visibilityTime: 1500,
                })
              } catch (error) {
                console.error("Error deleting notification:", error)
                Toast.show({
                  type: "error",
                  text1: "Error",
                  text2: "Failed to delete notification",
                  visibilityTime: 2000,
                })
              }
            },
          },
        ]
      )
    },
    [token, unreadCount, removeNotification, decrementUnreadCount]
  )

  const handleMarkAllAsRead = useCallback(async () => {
    if (!token || unreadCount === 0) return

    try {
      await markAllNotificationsAsRead(token)
      await Notifications.setBadgeCountAsync(0)
      markAllAsRead()

      Toast.show({
        type: "success",
        text1: "Done",
        text2: "All notifications marked as read",
        visibilityTime: 1500,
      })
    } catch (error) {
      console.error("Error marking all as read:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to mark all as read",
        visibilityTime: 2000,
      })
    }
  }, [token, unreadCount, markAllAsRead])

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => (
      <NotificationItem
        item={item}
        onPress={handleNotificationPress}
        onDelete={handleDeleteNotification}
      />
    ),
    [handleNotificationPress, handleDeleteNotification]
  )

  const keyExtractor = useCallback(
    (item: Notification) => item.id.toString(),
    []
  )

  const ListHeaderComponent = useMemo(
    () => (
      <ListHeader
        unreadCount={unreadCount}
        hasNotifications={notifications.length > 0}
        onMarkAllRead={handleMarkAllAsRead}
      />
    ),
    [unreadCount, notifications.length, handleMarkAllAsRead]
  )

  const ListFooterComponent = useMemo(
    () => <ListFooter isLoadingMore={isLoadingMore} />,
    [isLoadingMore]
  )

  const ListEmptyComponent = useMemo(() => {
    if (isLoading) return null
    return (
      <EmptyState
        icon="notifications-outline"
        message="No Notifications"
        subMessage="You're all caught up! We'll notify you when there's something new."
      />
    )
  }, [isLoading])

  return (
    <>
      <Stack.Screen options={{}} />

      <Wrapper style={styles.container} edges={[]}>
        {isLoading && notifications.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppColors.primary[500]} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ListHeaderComponent={ListHeaderComponent}
            ListFooterComponent={ListFooterComponent}
            ListEmptyComponent={ListEmptyComponent}
            contentContainerStyle={
              notifications.length === 0 ? styles.emptyContainer : undefined
            }
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[AppColors.primary[500]]}
                tintColor={AppColors.primary[500]}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            showsVerticalScrollIndicator={false}
            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            initialNumToRender={10}
            windowSize={5}
            updateCellsBatchingPeriod={50}
          />
        )}
      </Wrapper>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.secondary,
    borderTopWidth: 0.5,
    borderTopColor: AppColors.gray[200],
  },
  backButton: {
    marginRight: 8,
    padding: 4,
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
  emptyContainer: {
    flexGrow: 1,
  },
  // Header
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AppColors.background.secondary,
  },
  listHeaderText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.text.secondary,
  },
  markAllText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.primary[600],
  },
  // Footer
  loadingFooter: {
    paddingVertical: 16,
    alignItems: "center",
  },
})
