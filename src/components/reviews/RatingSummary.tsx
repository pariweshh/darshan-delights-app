import { StyleSheet, Text, View } from "react-native"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { ReviewStats } from "@/src/types/review"
import Rating from "./Rating"

interface RatingSummaryProps {
  stats: ReviewStats
}

const RatingSummary: React.FC<RatingSummaryProps> = ({ stats }) => {
  const { config, isTablet } = useResponsive()
  const { averageRating, totalReviews, ratingDistribution } = stats

  const getPercentage = (count: number): number => {
    if (totalReviews === 0) return 0
    return (count / totalReviews) * 100
  }

  return (
    <View
      style={[
        styles.container,
        {
          padding: isTablet ? 20 : 16,
          gap: isTablet ? 24 : 20,
          borderRadius: config.cardBorderRadius,
        },
      ]}
    >
      {/* Average Rating */}
      <View
        style={[styles.averageSection, { paddingRight: isTablet ? 24 : 20 }]}
      >
        <Text style={[styles.averageRating, { fontSize: isTablet ? 48 : 40 }]}>
          {averageRating.toFixed(1)}
        </Text>
        <Rating rating={averageRating} size={isTablet ? "large" : "medium"} />
        <Text style={[styles.totalReviews, { fontSize: config.smallFontSize }]}>
          Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
        </Text>
      </View>

      {/* Rating Distribution */}
      <View style={[styles.distributionSection, { gap: isTablet ? 8 : 6 }]}>
        {[5, 4, 3, 2, 1].map((star) => (
          <View
            key={star}
            style={[styles.distributionRow, { gap: isTablet ? 10 : 8 }]}
          >
            <Text
              style={[
                styles.starLabel,
                { fontSize: config.smallFontSize, width: isTablet ? 16 : 14 },
              ]}
            >
              {star}
            </Text>
            <View
              style={[
                styles.barContainer,
                { height: isTablet ? 10 : 8, borderRadius: isTablet ? 5 : 4 },
              ]}
            >
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${getPercentage(
                      ratingDistribution[
                        star as keyof typeof ratingDistribution
                      ]
                    )}%`,
                    borderRadius: isTablet ? 5 : 4,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.countLabel,
                {
                  fontSize: config.smallFontSize - 1,
                  width: isTablet ? 28 : 24,
                },
              ]}
            >
              {ratingDistribution[star as keyof typeof ratingDistribution]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export default RatingSummary

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: AppColors.background.primary,
    marginBottom: 16,
  },
  averageSection: {
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: AppColors.gray[200],
  },
  averageRating: {
    fontFamily: "Poppins_700Bold",
    color: AppColors.text.primary,
    lineHeight: 56,
  },
  totalReviews: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
    marginTop: 4,
    textAlign: "center",
  },
  distributionSection: {
    flex: 1,
    justifyContent: "center",
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  starLabel: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.secondary,
    textAlign: "center",
  },
  barContainer: {
    flex: 1,
    backgroundColor: AppColors.gray[200],
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: AppColors.star,
  },
  countLabel: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
    textAlign: "right",
  },
})
