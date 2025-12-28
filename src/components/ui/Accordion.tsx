import { Ionicons } from "@expo/vector-icons"
import React from "react"
import { StyleSheet, Text, View } from "react-native"
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import DebouncedTouchable from "./DebouncedTouchable"

interface AccordionProps {
  question: string
  answer: string
  isExpanded: boolean
  onToggle: () => void
  isTablet?: boolean
  config?: ReturnType<typeof useResponsive>["config"]
}

const Accordion: React.FC<AccordionProps> = ({
  question,
  answer,
  isExpanded,
  onToggle,
  isTablet: propIsTablet,
  config: propConfig,
}) => {
  // Use hook if props not provided
  const responsive = useResponsive()
  const isTablet = propIsTablet ?? responsive.isTablet
  const config = propConfig ?? responsive.config

  const rotation = useDerivedValue(() => {
    return withTiming(isExpanded ? 180 : 0, { duration: 200 })
  })

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  const animatedContentStyle = useAnimatedStyle(() => ({
    height: isExpanded ? "auto" : 0,
    opacity: withTiming(isExpanded ? 1 : 0, { duration: 200 }),
  }))

  return (
    <View style={styles.container}>
      <DebouncedTouchable
        style={[
          styles.header,
          {
            paddingVertical: isTablet ? 16 : 14,
            paddingHorizontal: isTablet ? 22 : 20,
          },
        ]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.question,
            {
              fontSize: config.bodyFontSize,
              lineHeight: config.bodyFontSize * 1.4,
              flex: 1,
              marginRight: isTablet ? 14 : 12,
            },
            isExpanded && styles.questionExpanded,
          ]}
        >
          {question}
        </Text>
        <Animated.View style={animatedIconStyle}>
          <Ionicons
            name="chevron-down"
            size={isTablet ? 22 : 20}
            color={isExpanded ? AppColors.primary[600] : AppColors.gray[400]}
          />
        </Animated.View>
      </DebouncedTouchable>

      {isExpanded && (
        <Animated.View
          style={[
            styles.content,
            {
              paddingHorizontal: isTablet ? 22 : 20,
              paddingBottom: isTablet ? 18 : 16,
            },
            animatedContentStyle,
          ]}
        >
          <Text
            style={[
              styles.answer,
              {
                fontSize: config.bodyFontSize - 1,
                lineHeight: (config.bodyFontSize - 1) * 1.6,
              },
            ]}
          >
            {answer}
          </Text>
        </Animated.View>
      )}
    </View>
  )
}

export default Accordion

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.background.primary,
  },
  question: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
  },
  questionExpanded: {
    color: AppColors.primary[600],
  },
  content: {
    backgroundColor: AppColors.gray[50],
  },
  answer: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
})
