import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect } from "react"
import {
  BackHandler,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
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

import RatingPromptModal from "@/src/components/common/RatingPromptModal"
import Wrapper from "@/src/components/common/Wrapper"
import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"
import { useAppRating } from "@/src/hooks/useAppRating"
import { useResponsive } from "@/src/hooks/useResponsive"

export default function PaymentSuccessScreen() {
  const router = useRouter()
  const { config, isTablet, isLandscape } = useResponsive()
  const { orderId } = useLocalSearchParams<{ orderId: string }>()
  const { showRatingModal, onSuccessfulOrder, closeRatingModal } =
    useAppRating()

  // Animation values
  const checkmarkScale = useSharedValue(0)
  const checkmarkRotate = useSharedValue(-45)
  const circleScale = useSharedValue(0)
  const pulseScale = useSharedValue(1)

  // Layout configuration
  const contentMaxWidth = isTablet ? (isLandscape ? 500 : 450) : undefined

  // Icon sizes
  const successCircleSize = isTablet ? 140 : 120
  const checkmarkIconSize = isTablet ? 72 : 60

  // Prevent going back with hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.replace("/(tabs)/home")
        return true
      }
    )

    return () => backHandler.remove()
  }, [router])

  // Trigger animations and rating prompt on mount
  useEffect(() => {
    circleScale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
    })

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

    const startPulse = () => {
      pulseScale.value = withSequence(
        withTiming(1.15, { duration: 800 }),
        withTiming(1, { duration: 800 })
      )
    }

    const pulseTimeout = setTimeout(() => {
      startPulse()
      const pulseInterval = setInterval(startPulse, 2000)
      return () => clearInterval(pulseInterval)
    }, 1000)

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
    opacity: 2 - pulseScale.value,
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
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: config.horizontalPadding + 8,
            paddingTop: isTablet ? 60 : 40,
            paddingBottom: isTablet ? 32 : 24,
            maxWidth: contentMaxWidth,
            alignSelf: contentMaxWidth ? "center" : undefined,
            width: contentMaxWidth ? "100%" : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Animation/Icon */}
        <View
          style={[styles.iconContainer, { marginBottom: isTablet ? 32 : 24 }]}
        >
          {/* Pulse ring */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                width: successCircleSize,
                height: successCircleSize,
                borderRadius: successCircleSize / 2,
              },
              pulseAnimatedStyle,
            ]}
          />
          {/* Main circle */}
          <Animated.View
            style={[
              styles.successCircle,
              {
                width: successCircleSize,
                height: successCircleSize,
                borderRadius: successCircleSize / 2,
              },
              circleAnimatedStyle,
            ]}
          >
            <Animated.View style={checkmarkAnimatedStyle}>
              <Ionicons
                name="checkmark"
                size={checkmarkIconSize}
                color="white"
              />
            </Animated.View>
          </Animated.View>
        </View>

        {/* Success Message */}
        <Animated.Text
          entering={FadeInDown.delay(400).duration(500)}
          style={[styles.title, { fontSize: isTablet ? 32 : 28 }]}
        >
          Payment Successful!
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(500).duration(500)}
          style={[
            styles.subtitle,
            {
              fontSize: config.bodyFontSize,
              lineHeight: config.bodyFontSize * 1.5,
              marginBottom: isTablet ? 20 : 16,
              paddingHorizontal: isTablet ? 24 : 16,
            },
          ]}
        >
          Thank you for your order. Your order is being processed.
        </Animated.Text>

        {/* Order Info */}
        {orderId && (
          <Animated.View
            entering={FadeInDown.delay(600).duration(500)}
            style={[
              styles.orderInfoCard,
              {
                padding: isTablet ? 20 : 16,
                borderRadius: config.cardBorderRadius + 4,
                marginBottom: isTablet ? 20 : 16,
              },
            ]}
          >
            <View style={[styles.orderInfoRow, { gap: isTablet ? 10 : 8 }]}>
              <Text
                style={[
                  styles.orderInfoLabel,
                  { fontSize: config.bodyFontSize },
                ]}
              >
                Order Number
              </Text>
              <Text
                style={[
                  styles.orderInfoValue,
                  { fontSize: isTablet ? 20 : 18 },
                ]}
              >
                #{orderId}
              </Text>
            </View>
            <Text
              style={[
                styles.orderInfoHint,
                { fontSize: config.bodyFontSize - 1 },
              ]}
            >
              You'll receive a confirmation email shortly with your order
              details.
            </Text>
          </Animated.View>
        )}

        {/* What's Next */}
        <Animated.View
          entering={FadeInDown.delay(700).duration(500)}
          style={[
            styles.nextStepsCard,
            {
              padding: isTablet ? 20 : 16,
              borderRadius: config.cardBorderRadius + 4,
            },
          ]}
        >
          <Text
            style={[
              styles.nextStepsTitle,
              {
                fontSize: isTablet ? 18 : 16,
                marginBottom: isTablet ? 20 : 16,
              },
            ]}
          >
            What's Next?
          </Text>

          <Animated.View
            entering={FadeIn.delay(800).duration(400)}
            style={[styles.stepItem, { marginBottom: isTablet ? 16 : 14 }]}
          >
            <View
              style={[
                styles.stepIcon,
                {
                  width: isTablet ? 44 : 36,
                  height: isTablet ? 44 : 36,
                  borderRadius: isTablet ? 12 : 10,
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={config.iconSize}
                color={AppColors.primary[600]}
              />
            </View>
            <Text style={[styles.stepText, { fontSize: config.bodyFontSize }]}>
              Check your email for order confirmation
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeIn.delay(900).duration(400)}
            style={[styles.stepItem, { marginBottom: isTablet ? 16 : 14 }]}
          >
            <View
              style={[
                styles.stepIcon,
                {
                  width: isTablet ? 44 : 36,
                  height: isTablet ? 44 : 36,
                  borderRadius: isTablet ? 12 : 10,
                },
              ]}
            >
              <Ionicons
                name="cube-outline"
                size={config.iconSize}
                color={AppColors.primary[600]}
              />
            </View>
            <Text style={[styles.stepText, { fontSize: config.bodyFontSize }]}>
              We'll notify you when your order ships
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeIn.delay(1000).duration(400)}
            style={styles.stepItem}
          >
            <View
              style={[
                styles.stepIcon,
                {
                  width: isTablet ? 44 : 36,
                  height: isTablet ? 44 : 36,
                  borderRadius: isTablet ? 12 : 10,
                },
              ]}
            >
              <Ionicons
                name="location-outline"
                size={config.iconSize}
                color={AppColors.primary[600]}
              />
            </View>
            <Text style={[styles.stepText, { fontSize: config.bodyFontSize }]}>
              Track your delivery in the Orders section
            </Text>
          </Animated.View>
        </Animated.View>
      </ScrollView>

      {/* Action Buttons */}
      <Animated.View
        entering={FadeInDown.delay(1100).duration(500)}
        style={[
          styles.footer,
          {
            padding: config.horizontalPadding + 4,
            paddingBottom:
              Platform.OS === "ios" ? (isTablet ? 32 : 52) : isTablet ? 28 : 52,
            maxWidth: contentMaxWidth,
            alignSelf: contentMaxWidth ? "center" : undefined,
            width: contentMaxWidth ? "100%" : undefined,
          },
        ]}
      >
        <Button
          title="Continue Shopping"
          onPress={handleContinueShopping}
          icon={
            <Ionicons
              name="cart-outline"
              size={config.iconSize}
              color="white"
            />
          }
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
    alignItems: "center",
  },
  // Icon
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    backgroundColor: AppColors.success,
  },
  successCircle: {
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
    color: AppColors.text.primary,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    textAlign: "center",
  },
  // Order Info Card
  orderInfoCard: {
    backgroundColor: AppColors.primary[50],
    width: "100%",
    alignItems: "center",
  },
  orderInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  orderInfoLabel: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.secondary,
  },
  orderInfoValue: {
    fontFamily: "Poppins_700Bold",
    color: AppColors.primary[600],
  },
  orderInfoHint: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.tertiary,
    textAlign: "center",
  },
  // Next Steps
  nextStepsCard: {
    backgroundColor: AppColors.background.secondary,
    width: "100%",
  },
  nextStepsTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepIcon: {
    backgroundColor: AppColors.primary[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  // Footer
  footer: {},
})
