import { FontAwesome } from "@expo/vector-icons"
import React from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"

interface RatingProps {
  rating: number
  showValue?: boolean
  showCount?: boolean
  count?: number
  size?: "small" | "medium" | "large"
  interactive?: boolean
  onRatingChange?: (rating: number) => void
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
  const { isTablet } = useResponsive()

  // Size configurations with tablet scaling
  const SIZES = {
    small: {
      star: isTablet ? 14 : 12,
      text: isTablet ? 12 : 10,
      gap: isTablet ? 3 : 2,
    },
    medium: {
      star: isTablet ? 18 : 16,
      text: isTablet ? 14 : 12,
      gap: isTablet ? 4 : 3,
    },
    large: {
      star: isTablet ? 28 : 24,
      text: isTablet ? 18 : 16,
      gap: isTablet ? 5 : 4,
    },
  }

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
      let iconName: "star" | "star-o" | "star-half-o" = "star-o"

      if (i <= roundedRating) {
        iconName = "star"
      } else if (i - 0.5 === roundedRating) {
        iconName = "star-half-o"
      }

      const starElement = (
        <FontAwesome
          key={i}
          name={iconName}
          size={sizeConfig.star}
          color={AppColors.star}
          style={{ marginRight: sizeConfig.gap }}
        />
      )

      if (interactive) {
        stars.push(
          <TouchableOpacity
            key={i}
            onPress={() => handleStarPress(i)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            {starElement}
          </TouchableOpacity>
        )
      } else {
        stars.push(starElement)
      }
    }

    return stars
  }

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>{renderStars()}</View>

      {showValue && rating > 0 && (
        <Text
          style={[
            styles.ratingValue,
            { fontSize: sizeConfig.text, marginLeft: isTablet ? 8 : 6 },
          ]}
        >
          {rating.toFixed(1)}
        </Text>
      )}

      {showCount && (
        <Text
          style={[
            styles.count,
            { fontSize: sizeConfig.text, marginLeft: isTablet ? 6 : 4 },
          ]}
        >
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
  },
  count: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
  },
})
