import * as Notifications from "expo-notifications"
import { usePathname, useRouter } from "expo-router"
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
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"
import { useNotificationStore } from "@/src/store/notificationStore"
import { Notification } from "@/src/types/notifications"

const PAGE_SIZE = 20

interface NotificationItemProps {
  item: Notification
  index: number
  useColumnsLayout: boolean
  numColumns: number
  itemWidth: number | undefined
  gap: number
  borderRadius: number
  onPress: (notification: Notification) => void
  onDelete: (notification: Notification) => void
}

const NotificationItem = memo(
  ({
    item,
    index,
    useColumnsLayout,
    numColumns,
    itemWidth,
    gap,
    borderRadius,
    onPress,
    onDelete,
  }: NotificationItemProps) => {
    const handlePress = useCallback(() => onPress(item), [onPress, item])
    const handleDelete = useCallback(() => onDelete(item), [onDelete, item])

    const notificationCard = (
      <NotificationCard
        notification={item}
        onPress={handlePress}
        onDelete={handleDelete}
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
            borderRadius,
            overflow: "hidden",
          }}
        >
          {notificationCard}
        </View>
      )
    }

    return notificationCard
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.isRead === nextProps.item.isRead &&
      prevProps.index === nextProps.index &&
      prevProps.useColumnsLayout === nextProps.useColumnsLayout &&
      prevProps.numColumns === nextProps.numColumns &&
      prevProps.itemWidth === nextProps.itemWidth
    )
  }
)

interface ListHeaderProps {
  unreadCount: number
  hasNotifications: boolean
  useColumnsLayout: boolean
  horizontalPadding: number
  paddingVertical: number
  fontSize: number
  onMarkAllRead: () => void
}

const ListHeader = memo(
  ({
    unreadCount,
    hasNotifications,
    useColumnsLayout,
    horizontalPadding,
    paddingVertical,
    fontSize,
    onMarkAllRead,
  }: ListHeaderProps) => {
    if (!hasNotifications) return null

    return (
      <View
        style={[
          styles.listHeader,
          {
            paddingHorizontal: useColumnsLayout ? 0 : horizontalPadding,
            paddingVertical,
          },
        ]}
      >
        <Text style={[styles.listHeaderText, { fontSize: fontSize - 1 }]}>
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
        </Text>
        {unreadCount > 0 && (
          <DebouncedTouchable onPress={onMarkAllRead} activeOpacity={0.7}>
            <Text style={[styles.markAllText, { fontSize: fontSize - 1 }]}>
              Mark all as read
            </Text>
          </DebouncedTouchable>
        )}
      </View>
    )
  }
)

interface ListFooterProps {
  isLoadingMore: boolean
  fontSize: number
  bottomHeight: number
}

const ListFooter = memo(
  ({ isLoadingMore, fontSize, bottomHeight }: ListFooterProps) => {
    if (!isLoadingMore) return <View style={{ height: bottomHeight }} />

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={AppColors.primary[500]} />
        <Text style={[styles.loadingFooterText, { fontSize }]}>
          Loading more...
        </Text>
      </View>
    )
  }
)

interface SkeletonStateProps {
  useColumnsLayout: boolean
  numColumns: number
  itemWidth: number | undefined
  gap: number
  horizontalPadding: number
  paddingVertical: number
  fontSize: number
  borderRadius: number
  contentMaxWidth: number | undefined
  skeletonCount: number
}

const SkeletonState = memo(
  ({
    useColumnsLayout,
    numColumns,
    itemWidth,
    gap,
    horizontalPadding,
    paddingVertical,
    fontSize,
    borderRadius,
    contentMaxWidth,
    skeletonCount,
  }: SkeletonStateProps) => {
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
          style={[styles.skeletonContainer, { padding: horizontalPadding }]}
        >
          <View
            style={[
              styles.listHeader,
              { paddingVertical, paddingHorizontal: 0 },
            ]}
          >
            <SkeletonBase width={80} height={fontSize} />
            <SkeletonBase width={100} height={fontSize} />
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
                      borderRadius,
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
        <View
          style={[
            styles.listHeader,
            { paddingHorizontal: horizontalPadding, paddingVertical },
          ]}
        >
          <SkeletonBase width={80} height={fontSize} />
          <SkeletonBase width={100} height={fontSize} />
        </View>

        {Array.from({ length: skeletonCount }).map((_, index) => (
          <NotificationCardSkeleton key={`skeleton-${index}`} />
        ))}
      </View>
    )
  }
)

export default function NotificationsScreenTab() {
  const router = useRouter()
  const pathname = usePathname()
  const { config, isTablet, isLandscape, width } = useResponsive()

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

  // Layout configuration
  const layoutConfig = useMemo(() => {
    const useColumnsLayout = isTablet && isLandscape
    const numColumns = useColumnsLayout ? 2 : 1
    const contentMaxWidth = isTablet && !isLandscape ? 600 : undefined
    const gap = config.gap
    const containerPadding = config.horizontalPadding
    const itemWidth = useColumnsLayout
      ? (width - containerPadding * 2 - gap) / 2
      : undefined

    return {
      useColumnsLayout,
      numColumns,
      contentMaxWidth,
      gap,
      containerPadding,
      itemWidth,
    }
  }, [isTablet, isLandscape, width, config.gap, config.horizontalPadding])

  const skeletonCount = useMemo(() => (isTablet ? 6 : 5), [isTablet])

  const flatListKey = useMemo(
    () => `notifications-${layoutConfig.numColumns}`,
    [layoutConfig.numColumns]
  )

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
  const handleRefresh = useCallback(() => {
    fetchNotifications(1, true)
  }, [fetchNotifications])

  /**
   * Handle load more
   */
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
  /**
   * Handle notification press
   */
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

      if (notification.actionUrl && pathname !== "/more/notifications") {
        router.push(notification.actionUrl as any)
      } else if (notification.order) {
        router.push(`/(tabs)/more/orders?orderId=${notification.order.id}`)
      }
    },
    [token, unreadCount, pathname, router, markAsRead, decrementUnreadCount]
  )

  /**
   * Handle delete notification
   */
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

  /**
   * Handle mark all as read
   */
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

  /**
   * Render notification item
   */
  const renderItem = useCallback(
    ({ item, index }: { item: Notification; index: number }) => (
      <NotificationItem
        item={item}
        index={index}
        useColumnsLayout={layoutConfig.useColumnsLayout}
        numColumns={layoutConfig.numColumns}
        itemWidth={layoutConfig.itemWidth}
        gap={layoutConfig.gap}
        borderRadius={config.cardBorderRadius}
        onPress={handleNotificationPress}
        onDelete={handleDeleteNotification}
      />
    ),
    [
      layoutConfig,
      config.cardBorderRadius,
      handleNotificationPress,
      handleDeleteNotification,
    ]
  )

  const keyExtractor = useCallback(
    (item: Notification) => item.id.toString(),
    []
  )

  /**
   * Render header
   */
  const ListHeaderComponent = useMemo(
    () => (
      <ListHeader
        unreadCount={unreadCount}
        hasNotifications={notifications.length > 0}
        useColumnsLayout={layoutConfig.useColumnsLayout}
        horizontalPadding={config.horizontalPadding}
        paddingVertical={isTablet ? 14 : 12}
        fontSize={config.bodyFontSize}
        onMarkAllRead={handleMarkAllAsRead}
      />
    ),
    [
      unreadCount,
      notifications.length,
      layoutConfig.useColumnsLayout,
      config,
      isTablet,
      handleMarkAllAsRead,
    ]
  )

  const ListFooterComponent = useMemo(
    () => (
      <ListFooter
        isLoadingMore={isLoadingMore}
        fontSize={config.bodyFontSize}
        bottomHeight={isTablet ? 60 : 40}
      />
    ),
    [isLoadingMore, config.bodyFontSize, isTablet]
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

  // Loading state
  if (isLoading && notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <SkeletonState
          useColumnsLayout={layoutConfig.useColumnsLayout}
          numColumns={layoutConfig.numColumns}
          itemWidth={layoutConfig.itemWidth}
          gap={layoutConfig.gap}
          horizontalPadding={config.horizontalPadding}
          paddingVertical={isTablet ? 14 : 12}
          fontSize={config.bodyFontSize}
          borderRadius={config.cardBorderRadius}
          contentMaxWidth={layoutConfig.contentMaxWidth}
          skeletonCount={skeletonCount}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <FlatList
        key={flatListKey}
        data={notifications}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={layoutConfig.numColumns}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={[
          notifications.length === 0
            ? styles.emptyContainer
            : styles.listContent,
          layoutConfig.useColumnsLayout && {
            padding: config.horizontalPadding,
          },
          !layoutConfig.useColumnsLayout &&
            notifications.length > 0 && {
              maxWidth: layoutConfig.contentMaxWidth,
              alignSelf: layoutConfig.contentMaxWidth ? "center" : undefined,
              width: layoutConfig.contentMaxWidth ? "100%" : undefined,
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
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={5}
        updateCellsBatchingPeriod={50}
      />
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
