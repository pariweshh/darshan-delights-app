import { StyleSheet, View } from "react-native"

import { useResponsive } from "@/src/hooks/useResponsive"
import { SkeletonBase } from "./SkeletonBase"

interface CategoryChipSkeletonProps {
  count?: number
}

const CategoryChipSkeleton: React.FC<CategoryChipSkeletonProps> = ({
  count = 6,
}) => {
  const { config, isTablet } = useResponsive()

  const chipHeight = isTablet ? 44 : 38
  const chipWidths = [80, 95, 70, 85, 100, 75, 90, 80] // Varied widths for natural look

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBase
          key={`category-chip-skeleton-${index}`}
          width={chipWidths[index % chipWidths.length]}
          height={chipHeight}
          borderRadius={chipHeight / 2}
          style={{ marginRight: config.gapSmall }}
        />
      ))}
    </View>
  )
}

export default CategoryChipSkeleton

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: 8,
  },
})
