import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, TouchableOpacity, ViewStyle } from "react-native"

import AppColors from "@/src/constants/Colors"
import React from "react"

interface ShareButtonProps {
  onPress: () => void
  size?: number
  color?: string
  style?: ViewStyle
  iconName?: keyof typeof Ionicons.glyphMap
}

const ShareButton: React.FC<ShareButtonProps> = ({
  onPress,
  size = 24,
  color = AppColors.text.primary,
  style,
  iconName = "share-outline",
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name={iconName} size={size} color={color} />
    </TouchableOpacity>
  )
}

export default ShareButton

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
})
