import { Ionicons } from "@expo/vector-icons"
import { formatDistanceToNow } from "date-fns"
import React from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

import AppColors from "@/src/constants/Colors"
import {
  Notification,
  NOTIFICATION_COLORS,
  NOTIFICATION_ICONS,
} from "@/src/types/notifications"

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
  const iconName =
    NOTIFICATION_ICONS[notification.type] || "notifications-outline"
  const iconColor =
    NOTIFICATION_COLORS[notification.type] || AppColors.gray[500]

  const formattedTime = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  })

  return (
    <TouchableOpacity
      style={[styles.container, !notification.isRead && styles.unreadContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Unread indicator */}
      {!notification.isRead && <View style={styles.unreadDot} />}

      {/* Icon */}
      <View
        style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}
      >
        <Ionicons
          name={iconName as keyof typeof Ionicons.glyphMap}
          size={22}
          color={iconColor}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[styles.title, !notification.isRead && styles.unreadTitle]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text style={styles.time}>{formattedTime}</Text>
        </View>

        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>

        {/* Order info if available */}
        {notification.order && (
          <View style={styles.orderInfo}>
            <Ionicons
              name="cube-outline"
              size={12}
              color={AppColors.text.tertiary}
            />
            <Text style={styles.orderText}>
              Order {notification.order.orderNumber}
            </Text>
          </View>
        )}
      </View>

      {/* Delete button */}
      {onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color={AppColors.gray[400]} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )
}

export default NotificationCard

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: AppColors.background.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  unreadContainer: {
    backgroundColor: AppColors.primary[50],
  },
  unreadDot: {
    position: "absolute",
    left: 6,
    top: 22,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.primary[500],
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  title: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontFamily: "Poppins_600SemiBold",
  },
  time: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: AppColors.text.tertiary,
  },
  message: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    lineHeight: 18,
  },
  orderInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  orderText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: AppColors.text.tertiary,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
})
