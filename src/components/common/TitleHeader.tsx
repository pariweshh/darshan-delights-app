import AppColors from "@/src/constants/Colors"
import { StyleSheet, Text, View } from "react-native"

interface TitleHeaderProps {
  title: string
  subtitle?: string
}

const TitleHeader: React.FC<TitleHeaderProps> = ({ title, subtitle }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  )
}

export default TitleHeader

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: AppColors.text.primary,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
    marginTop: 4,
  },
})
