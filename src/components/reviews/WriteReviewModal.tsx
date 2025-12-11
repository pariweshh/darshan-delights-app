import { Ionicons } from "@expo/vector-icons"
import React, { useEffect, useState } from "react"
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import Toast from "react-native-toast-message"

import { createReview, updateReview } from "@/src/api/reviews"
import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"
import { Review } from "@/src/types/review"
import Button from "../ui/Button"
import StarRatingInput from "./StarRatingInput"

interface WriteReviewModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: (review: Review) => void
  productId: number
  productName: string
  existingReview?: Review | null
  orderId?: number
}

const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  visible,
  onClose,
  onSuccess,
  productId,
  productName,
  existingReview,
  orderId,
}) => {
  const { token } = useAuthStore()

  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [title, setTitle] = useState(existingReview?.title || "")
  const [message, setMessage] = useState(existingReview?.message || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!existingReview

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      setRating(existingReview?.rating || 0)
      setTitle(existingReview?.title || "")
      setMessage(existingReview?.message || "")
      setErrors({})
    }
  }, [visible, existingReview])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (rating === 0) {
      newErrors.rating = "Please select a rating"
    }

    if (!message.trim()) {
      newErrors.message = "Please write a review"
    } else if (message.trim().length < 10) {
      newErrors.message = "Review must be at least 10 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!token) {
      Toast.show({
        type: "error",
        text1: "Login Required",
        text2: "Please login to submit a review",
        visibilityTime: 2000,
      })
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      let review: Review

      if (isEditing && existingReview) {
        review = await updateReview(
          existingReview.id,
          { rating, title: title.trim() || undefined, message: message.trim() },
          token
        )
        Toast.show({
          type: "success",
          text1: "Review Updated",
          text2: "Your review has been updated successfully",
          visibilityTime: 2000,
        })
      } else {
        review = await createReview(
          {
            rating,
            title: title.trim() || undefined,
            message: message.trim(),
            productId,
            orderId,
          },
          token
        )
        Toast.show({
          type: "success",
          text1: "Review Submitted",
          text2: "Thank you for your review!",
          visibilityTime: 2000,
        })
      }

      onSuccess(review)
      onClose()
    } catch (error: any) {
      console.error("Error submitting review:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to submit review",
        visibilityTime: 2000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting) return
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={AppColors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? "Edit Review" : "Write a Review"}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Product Name */}
          <View style={styles.productInfo}>
            <Text style={styles.productLabel}>Reviewing:</Text>
            <Text style={styles.productName} numberOfLines={2}>
              {productName}
            </Text>
          </View>

          {/* Star Rating */}
          <View style={styles.section}>
            <StarRatingInput
              rating={rating}
              onRatingChange={(r) => {
                setRating(r)
                if (errors.rating) {
                  setErrors((prev) => ({ ...prev, rating: "" }))
                }
              }}
              label="Your Rating"
              error={errors.rating}
            />
          </View>

          {/* Title (Optional) */}
          <View style={styles.section}>
            <Text style={styles.label}>Review Title (Optional)</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Summarize your experience"
              placeholderTextColor={AppColors.gray[400]}
              maxLength={100}
            />
          </View>

          {/* Message */}
          <View style={styles.section}>
            <Text style={styles.label}>Your Review *</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                errors.message && styles.inputError,
              ]}
              value={message}
              onChangeText={(text) => {
                setMessage(text)
                if (errors.message) {
                  setErrors((prev) => ({ ...prev, message: "" }))
                }
              }}
              placeholder="Share your experience with this product..."
              placeholderTextColor={AppColors.gray[400]}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={1000}
            />
            <View style={styles.charCount}>
              <Text style={styles.charCountText}>{message.length}/1000</Text>
            </View>
            {errors.message && (
              <Text style={styles.errorText}>{errors.message}</Text>
            )}
          </View>

          {/* Guidelines */}
          <View style={styles.guidelines}>
            <Text style={styles.guidelinesTitle}>Review Guidelines</Text>
            <Text style={styles.guidelinesText}>
              • Be honest and helpful to other shoppers{"\n"}• Focus on the
              product quality and your experience{"\n"}• Avoid inappropriate
              language or personal information
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title={isEditing ? "Update Review" : "Submit Review"}
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export default WriteReviewModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.primary,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: AppColors.text.primary,
  },
  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  // Product Info
  productInfo: {
    backgroundColor: AppColors.gray[50],
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  productLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.tertiary,
    marginBottom: 4,
  },
  productName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.text.primary,
    textTransform: "capitalize",
  },
  // Section
  section: {
    marginBottom: 20,
  },
  label: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: AppColors.gray[50],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.primary,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: AppColors.error,
  },
  charCount: {
    alignItems: "flex-end",
    marginTop: 4,
  },
  charCountText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: AppColors.text.tertiary,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.error,
    marginTop: 4,
  },
  // Guidelines
  guidelines: {
    backgroundColor: AppColors.primary[50],
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.primary[100],
  },
  guidelinesTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: AppColors.primary[700],
    marginBottom: 6,
  },
  guidelinesText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.primary[600],
    lineHeight: 18,
  },
  // Footer
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
})
