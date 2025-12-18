import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"

interface LoaderProps {
  size?: "small" | "large"
  color?: string
  text?: string
  fullScreen?: boolean
}

const Loader: React.FC<LoaderProps> = ({
  size = "large",
  color = AppColors.primary[500],
  text,
  fullScreen = false,
}) => {
  const { config } = useResponsive()

  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={color} />
        {text && (
          <Text style={[styles.text, { fontSize: config.bodyFontSize }]}>
            {text}
          </Text>
        )}
      </View>
    )
  }

  return (
    <View style={[styles.container, { padding: config.gap }]}>
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text style={[styles.text, { fontSize: config.bodyFontSize }]}>
          {text}
        </Text>
      )}
    </View>
  )
}

export default Loader

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  fullScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.background.primary,
  },
  text: {
    marginTop: 8,
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
})
