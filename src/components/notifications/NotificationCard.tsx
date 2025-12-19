import { Ionicons } from "@expo/vector-icons"
import { formatDistanceToNow } from "date-fns"
import React from "react"
import { StyleSheet, Text, View } from "react-native"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import {
  Notification,
  NOTIFICATION_COLORS,
  NOTIFICATION_ICONS,
} from "@/src/types/notifications"
import DebouncedTouchable from "../ui/DebouncedTouchable"

interface NotificationCardProps {
  notification: Notification
  onPress: () => void
  onDelete?: () => void
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  onDelete,
}) => {
  const { config, isTablet } = useResponsive()

  const iconName =
    NOTIFICATION_ICONS[notification.type] || "notifications-outline"
  const iconColor =
    NOTIFICATION_COLORS[notification.type] || AppColors.gray[500]

  const formattedTime = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  })

  // Responsive sizes
  const iconContainerSize = isTablet ? 50 : 44
  const iconSize = isTablet ? 24 : 22
  const unreadDotSize = isTablet ? 10 : 8
  const deleteIconSize = isTablet ? 20 : 18

  return (
    <DebouncedTouchable
      style={[
        styles.container,
        {
          paddingVertical: isTablet ? 16 : 14,
          paddingHorizontal: isTablet ? 18 : 16,
        },
        !notification.isRead && styles.unreadContainer,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <View
          style={[
            styles.unreadDot,
            {
              left: isTablet ? 7 : 6,
              top: isTablet ? 24 : 22,
              width: unreadDotSize,
              height: unreadDotSize,
              borderRadius: unreadDotSize / 2,
            },
          ]}
        />
      )}

      {/* Icon */}
      <View
        style={[
          styles.iconContainer,
          {
            width: iconContainerSize,
            height: iconContainerSize,
            borderRadius: isTablet ? 14 : 12,
            marginRight: isTablet ? 14 : 12,
            backgroundColor: `${iconColor}15`,
          },
        ]}
      >
        <Ionicons
          name={iconName as keyof typeof Ionicons.glyphMap}
          size={iconSize}
          color={iconColor}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={[styles.header, { marginBottom: isTablet ? 6 : 4 }]}>
          <Text
            style={[
              styles.title,
              { fontSize: config.bodyFontSize },
              !notification.isRead && styles.unreadTitle,
            ]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text style={[styles.time, { fontSize: config.smallFontSize - 1 }]}>
            {formattedTime}
          </Text>
        </View>

        <Text
          style={[
            styles.message,
            {
              fontSize: config.bodyFontSize - 1,
              lineHeight: (config.bodyFontSize - 1) * 1.4,
            },
          ]}
          numberOfLines={2}
        >
          {notification.message}
        </Text>

        {/* Order info if available */}
        {notification.order && (
          <View
            style={[
              styles.orderInfo,
              { marginTop: isTablet ? 8 : 6, gap: isTablet ? 5 : 4 },
            ]}
          >
            <Ionicons
              name="cube-outline"
              size={isTablet ? 14 : 12}
              color={AppColors.text.tertiary}
            />
            <Text
              style={[styles.orderText, { fontSize: config.smallFontSize - 1 }]}
            >
              Order {notification.order.orderNumber}
            </Text>
          </View>
        )}
      </View>

      {/* Delete button */}
      {onDelete && (
        <DebouncedTouchable
          style={[styles.deleteButton, { marginLeft: isTablet ? 10 : 8 }]}
          onPress={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name="close"
            size={deleteIconSize}
            color={AppColors.gray[400]}
          />
        </DebouncedTouchable>
      )}
    </DebouncedTouchable>
  )
}

export default NotificationCard

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: AppColors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  unreadContainer: {
    backgroundColor: AppColors.primary[50],
  },
  unreadDot: {
    position: "absolute",
    backgroundColor: AppColors.primary[500],
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontFamily: "Poppins_600SemiBold",
  },
  time: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
  },
  message: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  orderInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
  },
  deleteButton: {
    padding: 4,
  },
})
