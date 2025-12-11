import React from "react"
import { StyleSheet, Text, View } from "react-native"

import AppColors from "@/src/constants/Colors"
import { ReviewStats } from "@/src/types/review"
import Rating from "./Rating"

interface RatingSummaryProps {
  stats: ReviewStats
}

const RatingSummary: React.FC<RatingSummaryProps> = ({ stats }) => {
  const { averageRating, totalReviews, ratingDistribution } = stats

  const getPercentage = (count: number): number => {
    if (totalReviews === 0) return 0
    return (count / totalReviews) * 100
  }

  return (
    <View style={styles.container}>
      {/* Average Rating */}
      <View style={styles.averageSection}>
        <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
        <Rating rating={averageRating} size="medium" />
        <Text style={styles.totalReviews}>
          Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
        </Text>
      </View>

      {/* Rating Distribution */}
      <View style={styles.distributionSection}>
        {[5, 4, 3, 2, 1].map((star) => (
          <View key={star} style={styles.distributionRow}>
            <Text style={styles.starLabel}>{star}</Text>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${getPercentage(
                      ratingDistribution[
                        star as keyof typeof ratingDistribution
                      ]
                    )}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.countLabel}>
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
    borderRadius: 12,
    padding: 16,
    gap: 20,
    marginBottom: 16,
  },
  // Average Section
  averageSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: AppColors.gray[200],
  },
  averageRating: {
    fontFamily: "Poppins_700Bold",
    fontSize: 40,
    color: AppColors.text.primary,
    lineHeight: 48,
  },
  totalReviews: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: AppColors.text.tertiary,
    marginTop: 4,
    textAlign: "center",
  },
  // Distribution Section
  distributionSection: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  starLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: AppColors.text.secondary,
    width: 14,
    textAlign: "center",
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: AppColors.gray[200],
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: AppColors.star,
    borderRadius: 4,
  },
  countLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: AppColors.text.tertiary,
    width: 24,
    textAlign: "right",
  },
})
