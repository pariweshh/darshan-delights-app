import { Ionicons } from "@expo/vector-icons"
import { useEffect, useState } from "react"
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import Toast from "react-native-toast-message"

import { createReview, updateReview } from "@/src/api/reviews"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"
import { Review } from "@/src/types/review"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Button from "../ui/Button"
import DebouncedTouchable from "../ui/DebouncedTouchable"
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
  const { config, isTablet, isLandscape, width, height } = useResponsive()
  const { token } = useAuthStore()

  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [title, setTitle] = useState(existingReview?.title || "")
  const [message, setMessage] = useState(existingReview?.message || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const insets = useSafeAreaInsets()

  const isEditing = !!existingReview

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

    if (!validateForm()) return

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

  // Modal sizing for tablet
  const modalMaxWidth = isTablet ? (isLandscape ? 550 : 500) : undefined
  const modalMaxHeight = isTablet ? height * 0.85 : undefined

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={isTablet ? "formSheet" : "pageSheet"}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[
          styles.container,
          { paddingTop: Platform.OS === "android" ? insets.top : 0 },
          isTablet && {
            maxWidth: modalMaxWidth,
            alignSelf: "center",
            width: "100%",
          },
        ]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: config.horizontalPadding,
              paddingVertical: isTablet ? 20 : 16,
            },
          ]}
        >
          <DebouncedTouchable
            onPress={handleClose}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            <Ionicons
              name="close"
              size={config.iconSizeLarge}
              color={AppColors.text.primary}
            />
          </DebouncedTouchable>
          <Text
            style={[styles.headerTitle, { fontSize: config.titleFontSize }]}
          >
            {isEditing ? "Edit Review" : "Write a Review"}
          </Text>
          <View style={{ width: config.iconSizeLarge }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.contentContainer,
            { padding: config.horizontalPadding },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Product Name */}
          <View
            style={[
              styles.productInfo,
              {
                padding: isTablet ? 14 : 12,
                borderRadius: isTablet ? 12 : 10,
              },
            ]}
          >
            <Text
              style={[styles.productLabel, { fontSize: config.smallFontSize }]}
            >
              Reviewing:
            </Text>
            <Text
              style={[styles.productName, { fontSize: config.bodyFontSize }]}
              numberOfLines={2}
            >
              {productName}
            </Text>
          </View>

          {/* Star Rating */}
          <View style={[styles.section, { marginBottom: isTablet ? 24 : 20 }]}>
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
          <View style={[styles.section, { marginBottom: isTablet ? 24 : 20 }]}>
            <Text style={[styles.label, { fontSize: config.bodyFontSize }]}>
              Review Title (Optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  paddingHorizontal: isTablet ? 16 : 14,
                  paddingVertical: isTablet ? 14 : 12,
                  borderRadius: isTablet ? 12 : 10,
                  fontSize: config.bodyFontSize,
                },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="Summarise your experience"
              placeholderTextColor={AppColors.gray[400]}
              maxLength={100}
            />
          </View>

          {/* Message */}
          <View style={[styles.section, { marginBottom: isTablet ? 24 : 20 }]}>
            <Text style={[styles.label, { fontSize: config.bodyFontSize }]}>
              Your Review *
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                errors.message && styles.inputError,
                {
                  paddingHorizontal: isTablet ? 16 : 14,
                  paddingVertical: isTablet ? 14 : 12,
                  borderRadius: isTablet ? 12 : 10,
                  fontSize: config.bodyFontSize,
                  minHeight: isTablet ? 140 : 120,
                },
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
              <Text
                style={[
                  styles.charCountText,
                  { fontSize: config.smallFontSize - 1 },
                ]}
              >
                {message.length}/1000
              </Text>
            </View>
            {errors.message && (
              <Text
                style={[styles.errorText, { fontSize: config.smallFontSize }]}
              >
                {errors.message}
              </Text>
            )}
          </View>

          {/* Guidelines */}
          <View
            style={[
              styles.guidelines,
              {
                padding: isTablet ? 14 : 12,
                borderRadius: isTablet ? 12 : 10,
              },
            ]}
          >
            <Text
              style={[
                styles.guidelinesTitle,
                { fontSize: config.smallFontSize },
              ]}
            >
              Review Guidelines
            </Text>
            <Text
              style={[
                styles.guidelinesText,
                {
                  fontSize: config.smallFontSize,
                  lineHeight: config.smallFontSize * 1.5,
                },
              ]}
            >
              • Be honest and helpful to other shoppers{"\n"}• Focus on the
              product quality and your experience{"\n"}• Avoid inappropriate
              language or personal information
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { padding: config.horizontalPadding }]}>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {},
  productInfo: {
    backgroundColor: AppColors.gray[50],
    marginBottom: 20,
  },
  productLabel: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
    marginBottom: 4,
  },
  productName: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
    textTransform: "capitalize",
  },
  section: {},
  label: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: AppColors.gray[50],
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
  },
  textArea: {
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
    color: AppColors.text.tertiary,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.error,
    marginTop: 4,
  },
  guidelines: {
    backgroundColor: AppColors.primary[50],
    borderWidth: 1,
    borderColor: AppColors.primary[100],
  },
  guidelinesTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.primary[700],
    marginBottom: 6,
  },
  guidelinesText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.primary[600],
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
})
