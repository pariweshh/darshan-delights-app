// src/components/skeletons/SkeletonBase.tsx

import { useEffect } from "react"
import { StyleSheet, View, ViewStyle } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated"

import AppColors from "@/src/constants/Colors"

interface SkeletonBaseProps {
  width: number | `${number}%`
  height: number
  borderRadius?: number
  style?: ViewStyle
}

export const SkeletonBase: React.FC<SkeletonBaseProps> = ({
  width,
  height,
  borderRadius = 4,
  style,
}) => {
  const opacity = useSharedValue(0.3)

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  )
}

// Skeleton container for grouping multiple skeleton elements
interface SkeletonContainerProps {
  children: React.ReactNode
  style?: ViewStyle
}

export const SkeletonContainer: React.FC<SkeletonContainerProps> = ({
  children,
  style,
}) => {
  return <View style={[styles.container, style]}>{children}</View>
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: AppColors.gray[200],
  },
  container: {
    overflow: "hidden",
  },
})

export default SkeletonBase
