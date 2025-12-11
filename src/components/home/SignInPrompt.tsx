import AppColors from "@/src/constants/Colors"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

const SignInPrompt = () => {
  const router = useRouter()

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push("/(auth)/login")}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Sign in or sign up</Text>
          <Text style={styles.subtitle}>
            Place orders, add products to wishlist, and more.
          </Text>
        </View>

        <View style={styles.iconContainer}>
          <Ionicons
            name="person-outline"
            size={24}
            color={AppColors.primary[500]}
          />
        </View>
      </View>

      <View style={styles.arrowContainer}>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={AppColors.gray[400]}
        />
      </View>
    </TouchableOpacity>
  )
}

export default SignInPrompt

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
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
    fontSize: 16,
    color: AppColors.text.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    lineHeight: 18,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
