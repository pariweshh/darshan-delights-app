// src/components/reviews/ReviewCard.tsx

import { Ionicons } from "@expo/vector-icons"
import { formatDistanceToNow } from "date-fns"
import React, { useState } from "react"
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native"

import { markReviewHelpful } from "@/src/api/reviews"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"
import { Review } from "@/src/types/review"
import Rating from "./Rating"

interface ReviewCardProps {
  review: Review
  onEdit?: () => void
  onDelete?: () => void
  showActions?: boolean
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const { config, isTablet } = useResponsive()
  const { user: currentUser, token } = useAuthStore()
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount || 0)
  const [hasMarkedHelpful, setHasMarkedHelpful] = useState(false)

  const isOwnReview = currentUser && +currentUser?.id === +review?.user?.id

  const getUserDisplayName = (): string => {
    if (review?.user?.fName) {
      const lastName = review?.user?.lName
        ? ` ${review?.user?.lName.charAt(0)}.`
        : ""
      return `${review?.user?.fName}${lastName}`
    }
    return review?.user?.username
  }

  const getInitials = (): string => {
    if (review?.user?.fName) {
      const firstInitial = review?.user?.fName.charAt(0)
      const lastInitial = review?.user?.lName?.charAt(0) || ""
      return `${firstInitial}${lastInitial}`.toUpperCase()
    }
    return review?.user?.username.charAt(0).toUpperCase()
  }

  const handleHelpful = async () => {
    if (!token) {
      Alert.alert("Login Required", "Please login to mark reviews as helpful")
      return
    }

    if (isOwnReview || hasMarkedHelpful) return

    try {
      const result = await markReviewHelpful(review.id, token)
      setHelpfulCount(result.helpfulCount)
      setHasMarkedHelpful(true)
    } catch (error) {
      console.error("Error marking review as helpful:", error)
    }
  }

  const handleDelete = () => {
    Alert.alert(
      "Delete Review",
      "Are you sure you want to delete your review?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDelete },
      ]
    )
  }

  const formattedDate = formatDistanceToNow(new Date(review.createdAt), {
    addSuffix: true,
  })

  const avatarSize = isTablet ? 48 : 40

  return (
    <View
      style={[
        styles.container,
        {
          padding: isTablet ? 20 : 16,
          borderRadius: isTablet ? 10 : 8,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View
            style={[
              styles.avatar,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                marginRight: isTablet ? 12 : 10,
              },
            ]}
          >
            <Text
              style={[styles.avatarText, { fontSize: config.bodyFontSize }]}
            >
              {getInitials()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <View style={[styles.nameRow, { gap: isTablet ? 8 : 6 }]}>
              <Text
                style={[styles.userName, { fontSize: config.bodyFontSize }]}
              >
                {getUserDisplayName()}
              </Text>
              {review.isVerifiedPurchase && (
                <View style={styles.verifiedBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={isTablet ? 14 : 12}
                    color={AppColors.success}
                  />
                  <Text
                    style={[
                      styles.verifiedText,
                      { fontSize: isTablet ? 11 : 10 },
                    ]}
                  >
                    Verified Purchase
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.date, { fontSize: config.smallFontSize }]}>
              {formattedDate}
            </Text>
          </View>
        </View>

        {/* Edit/Delete for own reviews */}
        {isOwnReview && showActions && (
          <View style={[styles.actions, { gap: isTablet ? 10 : 8 }]}>
            {onEdit && (
              <TouchableOpacity
                onPress={onEdit}
                style={[styles.actionButton, { padding: isTablet ? 6 : 4 }]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="pencil-outline"
                  size={config.iconSize}
                  color={AppColors.text.secondary}
                />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={handleDelete}
                style={[styles.actionButton, { padding: isTablet ? 6 : 4 }]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="trash-outline"
                  size={config.iconSize}
                  color={AppColors.error}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Rating */}
      <View style={[styles.ratingRow, { gap: isTablet ? 10 : 8 }]}>
        <Rating rating={review.rating} size="small" />
        {review.title && (
          <Text style={[styles.title, { fontSize: config.bodyFontSize }]}>
            {review.title}
          </Text>
        )}
      </View>

      {/* Message */}
      <Text
        style={[
          styles.message,
          {
            fontSize: config.bodyFontSize,
            lineHeight: config.bodyFontSize * 1.5,
          },
        ]}
      >
        {review.message}
      </Text>

      {/* Helpful */}
      {!isOwnReview && (
        <View style={styles.helpfulSection}>
          <TouchableOpacity
            style={[
              styles.helpfulButton,
              hasMarkedHelpful && styles.helpfulButtonActive,
              {
                paddingVertical: isTablet ? 6 : 4,
                paddingHorizontal: isTablet ? 10 : 8,
                borderRadius: isTablet ? 8 : 6,
              },
            ]}
            onPress={handleHelpful}
            disabled={hasMarkedHelpful}
            activeOpacity={0.7}
          >
            <Ionicons
              name={hasMarkedHelpful ? "thumbs-up" : "thumbs-up-outline"}
              size={config.iconSizeSmall}
              color={
                hasMarkedHelpful
                  ? AppColors.primary[600]
                  : AppColors.text.secondary
              }
            />
            <Text
              style={[
                styles.helpfulText,
                hasMarkedHelpful && styles.helpfulTextActive,
                { fontSize: config.smallFontSize },
              ]}
            >
              Helpful ({helpfulCount})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

export default ReviewCard

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    backgroundColor: AppColors.primary[100],
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.primary[700],
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  userName: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  verifiedText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.success,
  },
  date: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
  },
  actionButton: {},
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
    flex: 1,
  },
  message: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  helpfulSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
  },
  helpfulButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: AppColors.gray[100],
  },
  helpfulButtonActive: {
    backgroundColor: AppColors.primary[50],
  },
  helpfulText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  helpfulTextActive: {
    color: AppColors.primary[600],
  },
})
