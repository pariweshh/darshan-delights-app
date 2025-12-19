import { FontAwesome } from "@expo/vector-icons"
import React from "react"
import { StyleSheet, Text, View } from "react-native"

import AppColors from "@/src/constants/Colors"
import DebouncedTouchable from "../ui/DebouncedTouchable"

interface StarRatingInputProps {
  rating: number
  onRatingChange: (rating: number) => void
  size?: number
  label?: string
  error?: string
}

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"]

const StarRatingInput: React.FC<StarRatingInputProps> = ({
  rating,
  onRatingChange,
  size = 36,
  label,
  error,
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <DebouncedTouchable
            key={star}
            onPress={() => onRatingChange(star)}
            activeOpacity={0.7}
            style={styles.starButton}
          >
            <FontAwesome
              name={star <= rating ? "star" : "star-o"}
              size={size}
              color={star <= rating ? AppColors.star : AppColors.gray[300]}
            />
          </DebouncedTouchable>
        ))}
      </View>

      {rating > 0 && (
        <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

export default StarRatingInput

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  label: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.primary,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: "row",
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.primary[600],
    marginTop: 8,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.error,
    marginTop: 4,
  },
})
