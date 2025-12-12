import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect } from "react"
import { BackHandler, ScrollView, StyleSheet, Text, View } from "react-native"

import RatingPromptModal from "@/src/components/common/RatingPromptModal"
import Wrapper from "@/src/components/common/Wrapper"
import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"
import { useAppRating } from "@/src/hooks/useAppRating"
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated"

export default function PaymentSuccessScreen() {
  const router = useRouter()
  const { orderId } = useLocalSearchParams<{ orderId: string }>()
  const { showRatingModal, onSuccessfulOrder, closeRatingModal } =
    useAppRating()

  // Animation values
  const checkmarkScale = useSharedValue(0)
  const checkmarkRotate = useSharedValue(-45)
  const circleScale = useSharedValue(0)
  const pulseScale = useSharedValue(1)

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

  // Trigger animations and rating prompt on mount
  useEffect(() => {
    // Circle scale animation
    circleScale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
    })

    // Checkmark animation with delay
    checkmarkScale.value = withDelay(
      300,
      withSpring(1, {
        damping: 10,
        stiffness: 100,
      })
    )

    checkmarkRotate.value = withDelay(
      300,
      withSpring(0, {
        damping: 10,
        stiffness: 100,
      })
    )

    // Pulse animation (repeating)
    const startPulse = () => {
      pulseScale.value = withSequence(
        withTiming(1.15, { duration: 800 }),
        withTiming(1, { duration: 800 })
      )
    }

    // Start pulse after initial animation
    const pulseTimeout = setTimeout(() => {
      startPulse()
      // Repeat pulse
      const pulseInterval = setInterval(startPulse, 2000)
      return () => clearInterval(pulseInterval)
    }, 1000)

    // Trigger rating prompt check
    onSuccessfulOrder()

    return () => clearTimeout(pulseTimeout)
  }, [])

  // Animated styles
  const circleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }))

  const checkmarkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: checkmarkScale.value },
      { rotate: `${checkmarkRotate.value}deg` },
    ],
  }))

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: 2 - pulseScale.value, // Fade out as it grows
  }))

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
          {/* Pulse ring */}
          <Animated.View style={[styles.pulseRing, pulseAnimatedStyle]} />
          {/* Main circle */}
          <Animated.View style={[styles.successCircle, circleAnimatedStyle]}>
            <Animated.View style={checkmarkAnimatedStyle}>
              <Ionicons name="checkmark" size={60} color="white" />
            </Animated.View>
          </Animated.View>
        </View>

        {/* Success Message */}
        <Animated.Text
          entering={FadeInDown.delay(400).duration(500)}
          style={styles.title}
        >
          Payment Successful!
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(500).duration(500)}
          style={styles.subtitle}
        >
          Thank you for your order. Your order is being processed.
        </Animated.Text>

        {/* Order Info */}
        {orderId && (
          <Animated.View
            entering={FadeInDown.delay(600).duration(500)}
            style={styles.orderInfoCard}
          >
            <View style={styles.orderInfoRow}>
              <Text style={styles.orderInfoLabel}>Order Number</Text>
              <Text style={styles.orderInfoValue}>#{orderId}</Text>
            </View>
            <Text style={styles.orderInfoHint}>
              You'll receive a confirmation email shortly with your order
              details.
            </Text>
          </Animated.View>
        )}

        {/* What's Next */}
        <Animated.View
          entering={FadeInDown.delay(700).duration(500)}
          style={styles.nextStepsCard}
        >
          <Text style={styles.nextStepsTitle}>What's Next?</Text>

          <Animated.View
            entering={FadeIn.delay(800).duration(400)}
            style={styles.stepItem}
          >
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
          </Animated.View>

          <Animated.View
            entering={FadeIn.delay(900).duration(400)}
            style={styles.stepItem}
          >
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
          </Animated.View>

          <Animated.View
            entering={FadeIn.delay(1000).duration(400)}
            style={styles.stepItem}
          >
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
          </Animated.View>
        </Animated.View>
      </ScrollView>

      {/* Action Buttons */}
      <Animated.View
        entering={FadeInDown.delay(1100).duration(500)}
        style={styles.footer}
      >
        <Button
          title="Continue Shopping"
          onPress={handleContinueShopping}
          icon={<Ionicons name="cart-outline" size={20} color="white" />}
          // variant="outline"
        />
      </Animated.View>

      {/* Rating Modal */}
      <RatingPromptModal visible={showRatingModal} onClose={closeRatingModal} />
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
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.success,
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
