import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StyleSheet, Text, View } from "react-native"
import DebouncedTouchable from "../ui/DebouncedTouchable"

const SignInPrompt = () => {
  const router = useRouter()
  const { config, isTablet } = useResponsive()

  const iconContainerSize = isTablet ? 56 : 48

  return (
    <DebouncedTouchable
      style={[
        styles.container,
        {
          padding: isTablet ? 20 : 16,
          borderRadius: config.cardBorderRadius + 4,
        },
      ]}
      onPress={() => router.push("/(auth)/login")}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text
            style={[styles.title, { fontSize: config.subtitleFontSize + 2 }]}
          >
            Sign in or sign up
          </Text>
          <Text
            style={[styles.subtitle, { fontSize: config.bodyFontSize - 1 }]}
          >
            Place orders, add products to wishlist, and more.
          </Text>
        </View>

        <View
          style={[
            styles.iconContainer,
            {
              width: iconContainerSize,
              height: iconContainerSize,
              borderRadius: iconContainerSize / 2,
            },
          ]}
        >
          <Ionicons
            name="person-outline"
            size={config.iconSizeLarge}
            color={AppColors.primary[500]}
          />
        </View>
      </View>

      <View style={styles.arrowContainer}>
        <Ionicons
          name="chevron-forward"
          size={config.iconSize}
          color={AppColors.gray[400]}
        />
      </View>
    </DebouncedTouchable>
  )
}

export default SignInPrompt

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    marginHorizontal: 4,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: AppColors.gray[100],
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    lineHeight: 18,
  },
  iconContainer: {
    borderWidth: 1.5,
    borderColor: AppColors.primary[200],
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  arrowContainer: {
    marginLeft: 8,
  },
})
