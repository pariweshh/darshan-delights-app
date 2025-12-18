import * as Notifications from "expo-notifications"
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
import {
  NotificationCardSkeleton,
  SkeletonBase,
} from "@/src/components/skeletons"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"
import { useNotificationStore } from "@/src/store/notificationStore"
import { Notification } from "@/src/types/notifications"

const PAGE_SIZE = 20

export default function NotificationsScreenTab() {
  const router = useRouter()
  const pathname = usePathname()
  const { config, isTablet, isLandscape, width } = useResponsive()

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

  // Layout configuration
  const useColumnsLayout = isTablet && isLandscape
  const numColumns = useColumnsLayout ? 2 : 1
  const contentMaxWidth = isTablet && !isLandscape ? 600 : undefined

  // Calculate item width for grid
  const gap = config.gap
  const containerPadding = config.horizontalPadding
  const itemWidth = useColumnsLayout
    ? (width - containerPadding * 2 - gap) / 2
    : undefined

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
  }, [])

  useEffect(() => {
    Notifications.setBadgeCountAsync(0)
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
    // Mark as read if unread
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
  }

  /**
   * Handle mark all as read
   */
  const handleMarkAllAsRead = async () => {
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
  }

  /**
   * Render notification item
   */
  const renderItem = useCallback(
    ({ item, index }: { item: Notification; index: number }) => {
      const notificationCard = (
        <NotificationCard
          notification={item}
          onPress={() => handleNotificationPress(item)}
          onDelete={() => handleDeleteNotification(item)}
        />
      )

      if (useColumnsLayout) {
        const isLastInRow = (index + 1) % numColumns === 0
        const marginRight = isLastInRow ? 0 : gap

        return (
          <View
            style={{
              width: itemWidth,
              marginRight,
              marginBottom: gap,
              borderRadius: config.cardBorderRadius,
              overflow: "hidden",
            }}
          >
            {notificationCard}
          </View>
        )
      }

      return notificationCard
    },
    [
      useColumnsLayout,
      numColumns,
      itemWidth,
      gap,
      config.cardBorderRadius,
      handleNotificationPress,
      handleDeleteNotification,
    ]
  )

  /**
   * Render header
   */
  const renderHeader = () => {
    if (notifications.length === 0) return null

    return (
      <View
        style={[
          styles.listHeader,
          {
            paddingHorizontal: useColumnsLayout ? 0 : config.horizontalPadding,
            paddingVertical: isTablet ? 14 : 12,
          },
        ]}
      >
        <Text
          style={[styles.listHeaderText, { fontSize: config.bodyFontSize - 1 }]}
        >
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead} activeOpacity={0.7}>
            <Text
              style={[
                styles.markAllText,
                { fontSize: config.bodyFontSize - 1 },
              ]}
            >
              Mark all as read
            </Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  /**
   * Render footer
   */
  const renderFooter = () => {
    if (!isLoadingMore) return <View style={{ height: isTablet ? 60 : 40 }} />

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={AppColors.primary[500]} />
        <Text
          style={[styles.loadingFooterText, { fontSize: config.bodyFontSize }]}
        >
          Loading more...
        </Text>
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

  /**
   * Render skeleton loading
   */
  const renderSkeleton = () => {
    const skeletonCount = isTablet ? 6 : 5

    if (useColumnsLayout) {
      const rows: number[][] = []
      for (let i = 0; i < skeletonCount; i += numColumns) {
        const row: number[] = []
        for (let j = 0; j < numColumns && i + j < skeletonCount; j++) {
          row.push(i + j)
        }
        rows.push(row)
      }

      return (
        <View
          style={[
            styles.skeletonContainer,
            { padding: config.horizontalPadding },
          ]}
        >
          {/* Header skeleton */}
          <View
            style={[
              styles.listHeader,
              { paddingVertical: isTablet ? 14 : 12, paddingHorizontal: 0 },
            ]}
          >
            <SkeletonBase width={80} height={config.bodyFontSize} />
            <SkeletonBase width={100} height={config.bodyFontSize} />
          </View>

          {rows.map((row, rowIndex) => (
            <View key={`skeleton-row-${rowIndex}`} style={styles.skeletonRow}>
              {row.map((_, colIndex) => {
                const isLastInRow = colIndex === numColumns - 1
                return (
                  <View
                    key={`skeleton-${rowIndex}-${colIndex}`}
                    style={{
                      width: itemWidth,
                      marginRight: isLastInRow ? 0 : gap,
                      marginBottom: gap,
                      borderRadius: config.cardBorderRadius,
                      overflow: "hidden",
                    }}
                  >
                    <NotificationCardSkeleton />
                  </View>
                )
              })}
            </View>
          ))}
        </View>
      )
    }

    return (
      <View
        style={[
          styles.skeletonContainer,
          {
            maxWidth: contentMaxWidth,
            alignSelf: contentMaxWidth ? "center" : undefined,
            width: contentMaxWidth ? "100%" : undefined,
          },
        ]}
      >
        {/* Header skeleton */}
        <View
          style={[
            styles.listHeader,
            {
              paddingHorizontal: config.horizontalPadding,
              paddingVertical: isTablet ? 14 : 12,
            },
          ]}
        >
          <SkeletonBase width={80} height={config.bodyFontSize} />
          <SkeletonBase width={100} height={config.bodyFontSize} />
        </View>

        {Array.from({ length: skeletonCount }).map((_, index) => (
          <NotificationCardSkeleton key={`skeleton-${index}`} />
        ))}
      </View>
    )
  }

  // Create a key for FlatList to force re-render when columns change
  const flatListKey = `notifications-${numColumns}`

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {isLoading && notifications.length === 0 ? (
        renderSkeleton()
      ) : (
        <FlatList
          key={flatListKey}
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={numColumns}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            notifications.length === 0
              ? styles.emptyContainer
              : styles.listContent,
            useColumnsLayout && {
              padding: config.horizontalPadding,
            },
            !useColumnsLayout &&
              notifications.length > 0 && {
                maxWidth: contentMaxWidth,
                alignSelf: contentMaxWidth ? "center" : undefined,
                width: contentMaxWidth ? "100%" : undefined,
              },
          ]}
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
  emptyContainer: {
    flexGrow: 1,
  },
  listContent: {},
  skeletonContainer: {
    flex: 1,
  },
  skeletonRow: {
    flexDirection: "row",
  },
  // Header
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: AppColors.background.secondary,
  },
  listHeaderText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.secondary,
  },
  markAllText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[600],
  },
  // Footer
  loadingFooter: {
    flexDirection: "row",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingFooterText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.primary[500],
  },
})
