import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect } from "react"
import { BackHandler, ScrollView, StyleSheet, Text, View } from "react-native"

import Wrapper from "@/src/components/common/Wrapper"
import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"

export default function PaymentSuccessScreen() {
  const router = useRouter()
  const { orderId } = useLocalSearchParams<{ orderId: string }>()

  // Prevent going back with hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        // Navigate to home instead of going back
        router.replace("/(tabs)/home")
        return true
      }
    )

    return () => backHandler.remove()
  }, [router])

  const handleViewOrder = () => {
    router.replace("/(tabs)/more/orders")
  }

  const handleContinueShopping = () => {
    router.replace("/(tabs)/home")
  }

  return (
    <Wrapper style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Animation/Icon */}
        <View style={styles.iconContainer}>
          {/* Option 1: Use Lottie animation (if you have lottie-react-native) */}
          {/* <LottieView
            source={require("@/assets/animations/success.json")}
            autoPlay
            loop={false}
            style={styles.lottie}
          /> */}

          {/* Option 2: Simple icon */}
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={60} color="white" />
          </View>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>
          Thank you for your order. Your order is being processed.
        </Text>

        {/* Order Info */}
        {orderId && (
          <View style={styles.orderInfoCard}>
            <View style={styles.orderInfoRow}>
              <Text style={styles.orderInfoLabel}>Order Number</Text>
              <Text style={styles.orderInfoValue}>#{orderId}</Text>
            </View>
            <Text style={styles.orderInfoHint}>
              You'll receive a confirmation email shortly with your order
              details.
            </Text>
          </View>
        )}

        {/* What's Next */}
        <View style={styles.nextStepsCard}>
          <Text style={styles.nextStepsTitle}>What's Next?</Text>

          <View style={styles.stepItem}>
            <View style={styles.stepIcon}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={AppColors.primary[600]}
              />
            </View>
            <Text style={styles.stepText}>
              Check your email for order confirmation
            </Text>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepIcon}>
              <Ionicons
                name="cube-outline"
                size={20}
                color={AppColors.primary[600]}
              />
            </View>
            <Text style={styles.stepText}>
              We'll notify you when your order ships
            </Text>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepIcon}>
              <Ionicons
                name="location-outline"
                size={20}
                color={AppColors.primary[600]}
              />
            </View>
            <Text style={styles.stepText}>
              Track your delivery in the Orders section
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        {/* <Button
          title="View My Orders"
          onPress={handleViewOrder}
          containerStyles="mb-3"
        /> */}
        <Button
          title="Continue Shopping"
          onPress={handleContinueShopping}
          // variant="outline"
        />
      </View>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: "center",
  },
  // Icon
  iconContainer: {
    marginBottom: 24,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.success,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: AppColors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  lottie: {
    width: 150,
    height: 150,
  },
  // Text
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: AppColors.text.primary,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  // Order Info Card
  orderInfoCard: {
    backgroundColor: AppColors.primary[50],
    borderRadius: 16,
    padding: 16,
    width: "100%",
    marginBottom: 16,
    alignItems: "center",
  },
  orderInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  orderInfoLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  orderInfoValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: AppColors.primary[600],
  },
  orderInfoHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.tertiary,
    textAlign: "center",
  },
  // Next Steps
  nextStepsCard: {
    backgroundColor: AppColors.background.secondary,
    borderRadius: 16,
    padding: 16,
    width: "100%",
  },
  nextStepsTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.text.primary,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: AppColors.primary[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  // Footer
  footer: {
    padding: 20,
    paddingBottom: 52,
  },
})
