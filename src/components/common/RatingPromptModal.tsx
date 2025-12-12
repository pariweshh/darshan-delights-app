import { Ionicons } from "@expo/vector-icons"
import React, { useEffect, useState } from "react"
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"

import AppColors from "@/src/constants/Colors"
import {
  markAsDismissed,
  markAsRated,
  openAppStorePage,
  requestInAppReview,
} from "@/src/services/appRating"

interface RatingPromptModalProps {
  visible: boolean
  onClose: () => void
}

export default function RatingPromptModal({
  visible,
  onClose,
}: RatingPromptModalProps) {
  const [selectedRating, setSelectedRating] = useState<number>(0)
  const [step, setStep] = useState<"rating" | "feedback" | "thanks">("rating")
  const scaleAnim = useState(new Animated.Value(0))[0]

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start()
    } else {
      scaleAnim.setValue(0)
      setSelectedRating(0)
      setStep("rating")
    }
  }, [visible])

  const handleStarPress = (rating: number) => {
    setSelectedRating(rating)
  }

  const handleSubmitRating = async () => {
    if (selectedRating >= 4) {
      // High rating - try to get store review
      const nativeReviewShown = await requestInAppReview()

      if (!nativeReviewShown) {
        // Fallback to opening store
        await markAsRated()
        await openAppStorePage()
      } else {
        await markAsRated()
      }

      setStep("thanks")
      setTimeout(() => {
        onClose()
      }, 2000)
    } else if (selectedRating > 0) {
      // Low rating - show feedback option
      setStep("feedback")
    }
  }

  const handleSendFeedback = async () => {
    // Here you could open email or feedback form
    await markAsRated()
    setStep("thanks")
    setTimeout(() => {
      onClose()
    }, 2000)
  }

  const handleDismiss = async () => {
    await markAsDismissed()
    onClose()
  }

  const handleNeverAsk = async () => {
    await markAsRated() // This prevents future prompts
    onClose()
  }

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleStarPress(star)}
            activeOpacity={0.7}
            style={styles.starButton}
          >
            <Ionicons
              name={selectedRating >= star ? "star" : "star-outline"}
              size={40}
              color={selectedRating >= star ? "#FBBF24" : AppColors.gray[300]}
            />
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  const renderContent = () => {
    switch (step) {
      case "rating":
        return (
          <>
            <View style={styles.iconContainer}>
              <Text style={styles.emoji}>🎉</Text>
            </View>
            <Text style={styles.title}>Enjoying Darshan Delights?</Text>
            <Text style={styles.message}>
              Your feedback helps us improve! How would you rate your
              experience?
            </Text>
            {renderStars()}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  !selectedRating && styles.buttonDisabled,
                ]}
                onPress={handleSubmitRating}
                disabled={!selectedRating}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Submit</Text>
              </TouchableOpacity>
              <View style={styles.secondaryButtons}>
                <TouchableOpacity
                  style={styles.textButton}
                  onPress={handleDismiss}
                  activeOpacity={0.7}
                >
                  <Text style={styles.textButtonText}>Maybe Later</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.textButton}
                  onPress={handleNeverAsk}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.textButtonText, styles.neverAskText]}>
                    Don't Ask Again
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )

      case "feedback":
        return (
          <>
            <View style={styles.iconContainer}>
              <Text style={styles.emoji}>💭</Text>
            </View>
            <Text style={styles.title}>We'd Love Your Feedback</Text>
            <Text style={styles.message}>
              We're sorry to hear that. Would you like to tell us how we can
              improve?
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSendFeedback}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.primaryButtonText}>Send Feedback</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  markAsRated()
                  onClose()
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>No Thanks</Text>
              </TouchableOpacity>
            </View>
          </>
        )

      case "thanks":
        return (
          <>
            <View style={styles.iconContainer}>
              <Text style={styles.emoji}>❤️</Text>
            </View>
            <Text style={styles.title}>Thank You!</Text>
            <Text style={styles.message}>
              We appreciate your feedback. It helps us make Darshan Delights
              better for everyone!
            </Text>
          </>
        )
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Close Button */}
          {step !== "thanks" && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleDismiss}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={AppColors.gray[400]} />
            </TouchableOpacity>
          )}

          {renderContent()}
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.gray[100],
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 16,
    marginTop: 8,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: AppColors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  starButton: {
    padding: 4,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.primary[500],
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "white",
  },
  buttonDisabled: {
    backgroundColor: AppColors.gray[300],
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.gray[100],
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.text.secondary,
  },
  secondaryButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  textButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  textButtonText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  neverAskText: {
    color: AppColors.gray[400],
  },
})
