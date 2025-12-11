import AppColors from "@/src/constants/Colors"
import type { JSX } from "react"
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"

interface ButtonProps {
  title: string | JSX.Element
  variant?: "primary" | "secondary" | "outline" | "ghost"
  size?: "small" | "medium" | "large"
  onPress?: () => void
  fullWidth?: boolean
  disabled?: boolean
  loading?: boolean
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  containerStyles?: string
  icon?: JSX.Element
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = "primary",
  size = "medium",
  onPress,
  fullWidth = false,
  disabled = false,
  loading = false,
  style,
  textStyle,
  containerStyles,
  icon,
}) => {
  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ]

  const textStyles = [styles.text, styles[`${variant}Text`], textStyle]

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      className={`bg-secondary rounded-2xl min-h-[48px] justify-center items-center ${containerStyles} ${
        loading ? "opacity-50" : ""
      }`}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "white" : AppColors.primary[500]}
        />
      ) : (
        <View className="flex-row items-center gap-3">
          {icon}
          <Text style={[textStyles, { fontFamily: "Poppins_500Medium" }]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

export default Button

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  text: {
    fontWeight: "600",
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  // Variants
  primary: {
    backgroundColor: AppColors.primary[500],
  },
  secondary: {
    backgroundColor: AppColors.accent[500],
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: AppColors.primary[500],
  },
  ghost: {
    backgroundColor: "transparent",
  },
  // Text styles for variants
  primaryText: {
    color: AppColors.background.primary,
  },
  secondaryText: {
    color: AppColors.background.primary,
  },
  outlineText: {
    color: AppColors.primary[500],
  },
  ghostText: {
    color: AppColors.primary[500],
  },
  // Sizes
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
})
