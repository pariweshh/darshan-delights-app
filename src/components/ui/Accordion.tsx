import AppColors from "@/src/constants/Colors"
import { Ionicons } from "@expo/vector-icons"
import React from "react"
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native"
import DebouncedTouchable from "./DebouncedTouchable"

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

interface AccordionProps {
  question: string
  answer: string
  isExpanded: boolean
  onToggle: () => void
}

const Accordion: React.FC<AccordionProps> = ({
  question,
  answer,
  isExpanded,
  onToggle,
}) => {
  const handlePress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    onToggle()
  }

  return (
    <View style={styles.container}>
      <DebouncedTouchable
        style={styles.header}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={styles.question}>{question}</Text>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={AppColors.gray[500]}
        />
      </DebouncedTouchable>

      {isExpanded && (
        <View style={styles.answerContainer}>
          <Text style={styles.answer}>{answer}</Text>
        </View>
      )}
    </View>
  )
}

export default Accordion

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  question: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.primary,
    paddingRight: 12,
  },
  answerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  answer: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
    lineHeight: 22,
  },
})
