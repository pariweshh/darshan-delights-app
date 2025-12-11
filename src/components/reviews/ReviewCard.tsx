import { Ionicons } from "@expo/vector-icons"
import { formatDistanceToNow } from "date-fns"
import React, { useState } from "react"
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native"

import { markReviewHelpful } from "@/src/api/reviews"
import AppColors from "@/src/constants/Colors"
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
  const { user: currentUser, token } = useAuthStore()
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount || 0)
  const [hasMarkedHelpful, setHasMarkedHelpful] = useState(false)

  const isOwnReview = currentUser && +currentUser?.id === +review.user.id

  const getUserDisplayName = (): string => {
    if (review.user.fName) {
      const lastName = review.user.lName
        ? ` ${review.user.lName.charAt(0)}.`
        : ""
      return `${review.user.fName}${lastName}`
    }
    return review.user.username
  }

  const getInitials = (): string => {
    if (review.user.fName) {
      const firstInitial = review.user.fName.charAt(0)
      const lastInitial = review.user.lName?.charAt(0) || ""
      return `${firstInitial}${lastInitial}`.toUpperCase()
    }
    return review.user.username.charAt(0).toUpperCase()
  }

  const handleHelpful = async () => {
    if (!token) {
      Alert.alert("Login Required", "Please login to mark reviews as helpful")
      return
    }

    if (isOwnReview) {
      return
    }

    if (hasMarkedHelpful) {
      return
    }

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
        {
          text: "Delete",
          style: "destructive",
          onPress: onDelete,
        },
      ]
    )
  }

  const formattedDate = formatDistanceToNow(new Date(review.createdAt), {
    addSuffix: true,
  })

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{getUserDisplayName()}</Text>
              {review.isVerifiedPurchase && (
                <View style={styles.verifiedBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={12}
                    color={AppColors.success}
                  />
                  <Text style={styles.verifiedText}>Verified Purchase</Text>
                </View>
              )}
            </View>
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
        </View>

        {/* Edit/Delete for own reviews */}
        {isOwnReview && showActions && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity
                onPress={onEdit}
                style={styles.actionButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="pencil-outline"
                  size={18}
                  color={AppColors.text.secondary}
                />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.actionButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={AppColors.error}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Rating */}
      <View style={styles.ratingRow}>
        <Rating rating={review.rating} size="small" />
        {review.title && <Text style={styles.title}>{review.title}</Text>}
      </View>

      {/* Message */}
      <Text style={styles.message}>{review.message}</Text>

      {/* Helpful */}
      {!isOwnReview && (
        <View style={styles.helpfulSection}>
          <TouchableOpacity
            style={[
              styles.helpfulButton,
              hasMarkedHelpful && styles.helpfulButtonActive,
            ]}
            onPress={handleHelpful}
            disabled={hasMarkedHelpful}
            activeOpacity={0.7}
          >
            <Ionicons
              name={hasMarkedHelpful ? "thumbs-up" : "thumbs-up-outline"}
              size={14}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
    borderRadius: 8,
  },
  // Header
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.primary[700],
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  userName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.text.primary,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  verifiedText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: AppColors.success,
  },
  date: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.tertiary,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  // Rating
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.text.primary,
    flex: 1,
  },
  // Message
  message: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
    lineHeight: 20,
  },
  // Helpful
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
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: AppColors.gray[100],
  },
  helpfulButtonActive: {
    backgroundColor: AppColors.primary[50],
  },
  helpfulText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.secondary,
  },
  helpfulTextActive: {
    color: AppColors.primary[600],
  },
})
