import { StyleSheet, View } from "react-native"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { SkeletonBase } from "./SkeletonBase"

const NotificationCardSkeleton: React.FC = () => {
  const { config, isTablet } = useResponsive()

  const iconContainerSize = isTablet ? 50 : 44
  const paddingV = isTablet ? 16 : 14
  const paddingH = isTablet ? 18 : 16

  return (
    <View
      style={[
        styles.container,
        {
          paddingVertical: paddingV,
          paddingHorizontal: paddingH,
        },
      ]}
    >
      {/* Icon skeleton */}
      <SkeletonBase
        width={iconContainerSize}
        height={iconContainerSize}
        borderRadius={isTablet ? 14 : 12}
        style={{ marginRight: isTablet ? 14 : 12 }}
      />

      {/* Content skeleton */}
      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.header}>
          <SkeletonBase width="60%" height={isTablet ? 16 : 14} />
          <SkeletonBase width={60} height={isTablet ? 12 : 11} />
        </View>

        {/* Message - two lines */}
        <View style={{ marginTop: isTablet ? 8 : 6 }}>
          <SkeletonBase width="100%" height={isTablet ? 14 : 13} />
          <View style={{ height: 4 }} />
          <SkeletonBase width="75%" height={isTablet ? 14 : 13} />
        </View>

        {/* Order info skeleton (optional) */}
        <View style={{ marginTop: isTablet ? 10 : 8 }}>
          <SkeletonBase
            width={100}
            height={isTablet ? 12 : 11}
            borderRadius={4}
          />
        </View>
      </View>

      {/* Delete button skeleton */}
      <SkeletonBase
        width={isTablet ? 24 : 20}
        height={isTablet ? 24 : 20}
        borderRadius={(isTablet ? 24 : 20) / 2}
        style={{ marginLeft: isTablet ? 10 : 8 }}
      />
    </View>
  )
}

export default NotificationCardSkeleton

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: AppColors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
})
