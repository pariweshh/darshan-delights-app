import { usePathname, useRouter } from "expo-router"
import React, { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/src/api/notifications"
import EmptyState from "@/src/components/common/EmptyState"
import NotificationCard from "@/src/components/notifications/NotificationCard"
import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"
import { useNotificationStore } from "@/src/store/notificationStore"
import { Notification } from "@/src/types/notifications"

const PAGE_SIZE = 20

export default function NotificationsScreenTab() {
  const router = useRouter()
  const pathname = usePathname()

  const { token } = useAuthStore()
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    page,
    setNotifications,
    addNotifications,
    setUnreadCount,
    decrementUnreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    setLoading,
    setHasMore,
    setPage,
    incrementPage,
    reset,
  } = useNotificationStore()

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
    [token]
  )

  /**
   * Initial fetch
   */
  useEffect(() => {
    fetchNotifications(1)

    return () => {
      // Reset on unmount
      // reset();
    }
  }, [])

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    fetchNotifications(1, true)
  }

  /**
   * Handle load more
   */
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading) {
      const nextPage = page + 1
      incrementPage()
      fetchNotifications(nextPage)
    }
  }

  /**
   * Handle notification press
   */
  const handleNotificationPress = async (notification: Notification) => {
    console.log({ notification })
    // Mark as read if unread
    if (!notification.isRead && token) {
      try {
        await markNotificationAsRead(notification.id, token)
        markAsRead(notification.id)
        decrementUnreadCount()
      } catch (error) {
        console.error("Error marking notification as read:", error)
      }
    }

    // Navigate based on notification type
    if (notification.actionUrl && pathname !== "/more/notifications") {
      router.push(notification.actionUrl as any)
    } else if (notification.order) {
      router.push(`/(tabs)/more/orders?orderId=${notification.order.id}`)
    }
  }

  /**
   * Handle delete notification
   */
  const handleDeleteNotification = (notification: Notification) => {
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
  }

  /**
   * Handle mark all as read
   */
  const handleMarkAllAsRead = async () => {
    if (!token || unreadCount === 0) return

    try {
      await markAllNotificationsAsRead(token)
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
  }

  /**
   * Render notification item
   */
  const renderItem = ({ item }: { item: Notification }) => (
    <NotificationCard
      notification={item}
      onPress={() => handleNotificationPress(item)}
      onDelete={() => handleDeleteNotification(item)}
    />
  )

  /**
   * Render header
   */
  const renderHeader = () => {
    if (notifications.length === 0) return null

    return (
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead} activeOpacity={0.7}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  /**
   * Render footer
   */
  const renderFooter = () => {
    if (!isLoadingMore) return null

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={AppColors.primary[500]} />
      </View>
    )
  }

  /**
   * Render empty state
   */
  const renderEmpty = () => {
    if (isLoading) return null

    return (
      <EmptyState
        icon="notifications-outline"
        message="No Notifications"
        subMessage="You're all caught up! We'll notify you when there's something new."
      />
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {isLoading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary[500]} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
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
        />
      )}
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
