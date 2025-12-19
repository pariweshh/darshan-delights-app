import { Ionicons } from "@expo/vector-icons"
import React, { useState } from "react"
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import Toast from "react-native-toast-message"

import { sendFeedback } from "@/src/api/feedback"
import Wrapper from "@/src/components/common/Wrapper"
import Button from "@/src/components/ui/Button"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"

const FEEDBACK_TOPICS = [
  { label: "Feature Request", icon: "bulb-outline" },
  { label: "Bug Report", icon: "bug-outline" },
  { label: "App Performance", icon: "speedometer-outline" },
  { label: "User Experience", icon: "hand-left-outline" },
  { label: "Other", icon: "ellipsis-horizontal-outline" },
]

const RATINGS = [
  { value: 1, emoji: "😞", label: "Poor" },
  { value: 2, emoji: "😕", label: "Fair" },
  { value: 3, emoji: "😐", label: "Good" },
  { value: 4, emoji: "😊", label: "Great" },
  { value: 5, emoji: "🤩", label: "Excellent" },
]

export default function FeedbackScreen() {
  const { user } = useAuthStore()

  const [name, setName] = useState(
    user ? `${user.fName || ""} ${user.lName || ""}`.trim() : ""
  )
  const [email, setEmail] = useState(user?.email || "")
  const [selectedTopic, setSelectedTopic] = useState("")
  const [rating, setRating] = useState<number | null>(null)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTopicModal, setShowTopicModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = "Name is required"
    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email"
    }
    if (!selectedTopic) newErrors.topic = "Please select a topic"
    if (!message.trim()) {
      newErrors.message = "Feedback message is required"
    } else if (message.trim().length < 15) {
      newErrors.message = "Please provide more detail (at least 15 characters)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please fill in all required fields",
        visibilityTime: 2000,
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await sendFeedback({
        name,
        email,
        topic: selectedTopic,
        rating,
        message,
      })

      if (res?.status === "success") {
        Alert.alert(
          "Thank You! 🎉",
          "Your feedback helps us improve. We appreciate you taking the time to share your thoughts.",
          [
            {
              text: "OK",
              onPress: () => {
                setSelectedTopic("")
                setRating(null)
                setMessage("")
              },
            },
          ]
        )
      }
    } catch (error) {
      console.error("Error sending feedback:", error)
      Toast.show({
        type: "error",
        text1: "Failed to Send",
        text2: "Please try again later",
        visibilityTime: 2000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateField = (field: string, value: string) => {
    if (field === "name") setName(value)
    if (field === "email") setEmail(value)
    if (field === "message") setMessage(value)
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Wrapper style={styles.container} edges={[]}>
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        enableAutomaticScroll
        keyboardOpeningTime={250}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="chatbubbles-outline"
              size={32}
              color={AppColors.primary[600]}
            />
          </View>
          <Text style={styles.headerTitle}>We Value Your Feedback</Text>
          <Text style={styles.headerSubtitle}>
            Help us improve the Darshan Delights app by sharing your thoughts,
            suggestions, or reporting issues.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={name}
              onChangeText={(text) => updateField("name", text)}
              placeholder="Enter your name"
              placeholderTextColor={AppColors.gray[400]}
              autoCapitalize="words"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={email}
              onChangeText={(text) => updateField("email", text)}
              placeholder="Enter your email"
              placeholderTextColor={AppColors.gray[400]}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Topic */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Feedback Topic *</Text>
            <DebouncedTouchable
              style={[styles.selector, errors.topic && styles.inputError]}
              onPress={() => setShowTopicModal(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.selectorText,
                  !selectedTopic && styles.selectorPlaceholder,
                ]}
              >
                {selectedTopic || "Select a topic"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={15}
                color={AppColors.gray[400]}
              />
            </DebouncedTouchable>
            {errors.topic && (
              <Text style={styles.errorText}>{errors.topic}</Text>
            )}
          </View>

          {/* Rating (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              How would you rate your experience?
            </Text>
            <View style={styles.ratingContainer}>
              {RATINGS.map((item) => (
                <DebouncedTouchable
                  key={item.value}
                  style={[
                    styles.ratingItem,
                    rating === item.value && styles.ratingItemSelected,
                  ]}
                  onPress={() => setRating(item.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.ratingEmoji}>{item.emoji}</Text>
                  <Text
                    style={[
                      styles.ratingLabel,
                      rating === item.value && styles.ratingLabelSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </DebouncedTouchable>
              ))}
            </View>
          </View>

          {/* Message */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Feedback *</Text>
            <TextInput
              style={[styles.textArea, errors.message && styles.inputError]}
              value={message}
              onChangeText={(text) => updateField("message", text)}
              placeholder="Tell us what you think, what could be improved, or report any issues..."
              placeholderTextColor={AppColors.gray[400]}
              multiline
              numberOfLines={6}
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

          {/* Submit Button */}
          <Button
            title="Submit Feedback"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            icon={
              <Ionicons name="paper-plane-outline" size={18} color="white" />
            }
          />
        </View>
      </KeyboardAwareScrollView>

      {/* Topic Modal */}
      <Modal
        visible={showTopicModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTopicModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Topic</Text>
              <DebouncedTouchable onPress={() => setShowTopicModal(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={AppColors.text.primary}
                />
              </DebouncedTouchable>
            </View>
            <ScrollView>
              {FEEDBACK_TOPICS.map((topic, index) => (
                <DebouncedTouchable
                  key={index}
                  style={[
                    styles.modalOption,
                    selectedTopic === topic.label && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedTopic(topic.label)
                    setShowTopicModal(false)
                    if (errors.topic) {
                      setErrors((prev) => ({ ...prev, topic: "" }))
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalOptionLeft}>
                    <Ionicons
                      name={topic.icon as any}
                      size={20}
                      color={
                        selectedTopic === topic.label
                          ? AppColors.primary[600]
                          : AppColors.text.secondary
                      }
                    />
                    <Text
                      style={[
                        styles.modalOptionText,
                        selectedTopic === topic.label &&
                          styles.modalOptionTextSelected,
                      ]}
                    >
                      {topic.label}
                    </Text>
                  </View>
                  {selectedTopic === topic.label && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={AppColors.primary[600]}
                    />
                  )}
                </DebouncedTouchable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 0.5,
    borderTopColor: AppColors.gray[200],
    backgroundColor: AppColors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Header Card
  headerCard: {
    backgroundColor: AppColors.primary[50],
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: AppColors.primary[100],
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.background.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: AppColors.primary[700],
    marginBottom: 8,
    textAlign: "center",
  },
  headerSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  // Form Card
  formCard: {
    backgroundColor: AppColors.background.primary,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  // Input
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
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
  inputError: {
    borderColor: AppColors.error,
  },
  textArea: {
    backgroundColor: AppColors.gray[50],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.primary,
    minHeight: 140,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.error,
    marginTop: 4,
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
  // Selector
  selector: {
    backgroundColor: AppColors.gray[50],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.primary,
  },
  selectorPlaceholder: {
    color: AppColors.gray[400],
  },
  // Rating
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ratingItem: {
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    backgroundColor: AppColors.gray[50],
    minWidth: 58,
  },
  ratingItemSelected: {
    borderColor: AppColors.primary[500],
    backgroundColor: AppColors.primary[50],
  },
  ratingEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  ratingLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: AppColors.text.secondary,
  },
  ratingLabelSelected: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[600],
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: AppColors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  modalTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: AppColors.text.primary,
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  modalOptionSelected: {
    backgroundColor: AppColors.primary[50],
  },
  modalOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalOptionText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.primary,
  },
  modalOptionTextSelected: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[600],
  },
})
