import { FontAwesome } from "@expo/vector-icons"
import React from "react"
import { StyleSheet, Text, View } from "react-native"

import AppColors from "@/src/constants/Colors"

interface RatingProps {
  rating: number
  showValue?: boolean
  showCount?: boolean
  count?: number
  size?: "small" | "medium" | "large"
  interactive?: boolean
  onRatingChange?: (rating: number) => void
}

const SIZES = {
  small: { star: 12, text: 10, gap: 2 },
  medium: { star: 16, text: 12, gap: 3 },
  large: { star: 24, text: 16, gap: 4 },
}

const Rating: React.FC<RatingProps> = ({
  rating,
  showValue = false,
  showCount = false,
  count = 0,
  size = "medium",
  interactive = false,
  onRatingChange,
}) => {
  const sizeConfig = SIZES[size]

  const handleStarPress = (star: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(star)
    }
  }

  const renderStars = () => {
    const stars = []
    const roundedRating = Math.round(rating * 2) / 2 // Round to nearest 0.5

    for (let i = 1; i <= 5; i++) {
      let iconName: "star" | "star-o" | "star-half" = "star-o"

      if (i <= roundedRating) {
        iconName = "star"
      } else if (i - 0.5 === roundedRating) {
        iconName = "star-half"
      }

      stars.push(
        <FontAwesome
          key={i}
          name={iconName}
          size={sizeConfig.star}
          color={AppColors.star}
          onPress={interactive ? () => handleStarPress(i) : undefined}
          style={{ marginRight: sizeConfig.gap }}
        />
      )
    }

    return stars
  }

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>{renderStars()}</View>

      {showValue && rating > 0 && (
        <Text style={[styles.ratingValue, { fontSize: sizeConfig.text }]}>
          {rating.toFixed(1)}
        </Text>
      )}

      {showCount && (
        <Text style={[styles.count, { fontSize: sizeConfig.text }]}>
          ({count})
        </Text>
      )}
    </View>
  )
}

export default Rating

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingValue: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
    marginLeft: 6,
  },
  count: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
    marginLeft: 4,
  },
})
