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

import EmptyState from "@/src/components/common/EmptyState"
import Wrapper from "@/src/components/common/Wrapper"
import NotificationCard from "@/src/components/notifications/NotificationCard"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import {
  useDeleteNotification,
  useInfiniteNotifications,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
} from "@/src/hooks/queries/useNotifications"
import { useAuthStore } from "@/src/store/authStore"
import { useNotificationStore } from "@/src/store/notificationStore"
import { Notification } from "@/src/types/notifications"

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
NotificationItem.displayName = "NotificationItem"

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
ListHeader.displayName = "ListHeader"

const ListFooter = memo(({ isLoadingMore }: { isLoadingMore: boolean }) => {
  if (!isLoadingMore) return null

  return (
    <View style={styles.loadingFooter}>
      <ActivityIndicator size="small" color={AppColors.primary[500]} />
    </View>
  )
})
ListFooter.displayName = "ListFooter"

export default function NotificationsScreen() {
  const router = useRouter()
  const { token, user } = useAuthStore()
  const userId = user?.id ?? null
  const { unreadCount, setUnreadCount, decrementUnreadCount } =
    useNotificationStore()

  const [isRefreshing, setIsRefreshing] = useState(false)

  const {
    data: notificationsData,
    isLoading,
    isFetchingNextPage: isLoadingMore,
    hasNextPage: hasMore,
    fetchNextPage,
    refetch,
  } = useInfiniteNotifications(token, userId)

  const notifications = notificationsData?.pages.flatMap((p) => p.data) ?? []

  const serverUnreadCount = notificationsData?.pages[0]?.meta.unreadCount
  useEffect(() => {
    if (serverUnreadCount !== undefined) setUnreadCount(serverUnreadCount)
  }, [serverUnreadCount, setUnreadCount])

  useEffect(() => {
    Notifications.setBadgeCountAsync(0)
  }, [])

  const { mutate: markAsReadMutate } = useMarkNotificationAsRead()
  const { mutate: markAllReadMutate } = useMarkAllNotificationsAsRead()
  const { mutate: deleteMutate } = useDeleteNotification()

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }, [refetch])

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      fetchNextPage()
    }
  }, [hasMore, isLoadingMore, fetchNextPage])

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      if (!notification.isRead && token) {
        markAsReadMutate(
          { id: notification.id, token },
          {
            onSuccess: () => {
              decrementUnreadCount()
              Notifications.setBadgeCountAsync(Math.max(0, unreadCount - 1))
            },
          }
        )
      }

      if (notification.actionUrl) {
        router.push(notification.actionUrl as any)
      } else if (notification.order) {
        router.push(`/(tabs)/more/orders?orderId=${notification.order.id}`)
      }
    },
    [token, unreadCount, router, markAsReadMutate, decrementUnreadCount]
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
            onPress: () => {
              if (!token) return
              deleteMutate(
                { id: notification.id, token },
                {
                  onSuccess: () => {
                    if (!notification.isRead) {
                      decrementUnreadCount()
                      Notifications.setBadgeCountAsync(
                        Math.max(0, unreadCount - 1)
                      )
                    }
                    Toast.show({
                      type: "success",
                      text1: "Deleted",
                      text2: "Notification removed",
                      visibilityTime: 1500,
                    })
                  },
                  onError: () => {
                    Toast.show({
                      type: "error",
                      text1: "Error",
                      text2: "Failed to delete notification",
                      visibilityTime: 2000,
                    })
                  },
                }
              )
            },
          },
        ]
      )
    },
    [token, unreadCount, deleteMutate, decrementUnreadCount]
  )

  const handleMarkAllAsRead = useCallback(() => {
    if (!token || unreadCount === 0) return
    markAllReadMutate(
      { token },
      {
        onSuccess: () => {
          setUnreadCount(0)
          Notifications.setBadgeCountAsync(0)
          Toast.show({
            type: "success",
            text1: "Done",
            text2: "All notifications marked as read",
            visibilityTime: 1500,
          })
        },
        onError: () => {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to mark all as read",
            visibilityTime: 2000,
          })
        },
      }
    )
  }, [token, unreadCount, markAllReadMutate, setUnreadCount])

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
  loadingFooter: {
    paddingVertical: 16,
    alignItems: "center",
  },
})
