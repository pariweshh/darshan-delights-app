import AppColors from "@/src/constants/Colors"
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
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={color} />
        {text && <Text style={styles.text}>{text}</Text>}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  )
}

export default Loader

const styles = StyleSheet.create({
  container: {
    padding: 16,
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
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
})
