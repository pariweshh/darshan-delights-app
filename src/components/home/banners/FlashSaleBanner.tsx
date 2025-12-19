import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import DebouncedTouchable from "../../ui/DebouncedTouchable"

interface FlashSaleBannerProps {
  endTime?: Date
  discount?: string
  onPress?: () => void
}

/**
 * Flash sale banner with countdown timer
 */
export default function FlashSaleBanner({
  endTime = new Date(Date.now() + 6 * 60 * 60 * 1000), // Default 6 hours from now
  discount = "UP TO 50% OFF",
  onPress,
}: FlashSaleBannerProps) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endTime.getTime() - Date.now()

      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [endTime])

  const handlePress = () => {
    if (onPress) {
      onPress()
    } else {
      router.push("/(tabs)/home/weekly-sale")
    }
  }

  const formatNumber = (num: number) => num.toString().padStart(2, "0")

  return (
    <DebouncedTouchable
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.95}
    >
      <LinearGradient
        colors={["#f97316", "#ea580c", "#dc2626"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {/* Animated flash effect */}
        <View style={styles.flashEffect}>
          <Ionicons name="flash" size={60} color="rgba(255,255,255,0.1)" />
        </View>

        <View style={styles.content}>
          {/* Left section */}
          <View style={styles.leftSection}>
            <View style={styles.flashIcon}>
              <Ionicons name="flash" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.title}>FLASH SALE</Text>
              <Text style={styles.discount}>{discount}</Text>
            </View>
          </View>

          {/* Timer section */}
          <View style={styles.timerSection}>
            <Text style={styles.endsIn}>Ends in</Text>
            <View style={styles.timerContainer}>
              <View style={styles.timerBox}>
                <Text style={styles.timerNumber}>
                  {formatNumber(timeLeft.hours)}
                </Text>
                <Text style={styles.timerLabel}>HRS</Text>
              </View>
              <Text style={styles.timerSeparator}>:</Text>
              <View style={styles.timerBox}>
                <Text style={styles.timerNumber}>
                  {formatNumber(timeLeft.minutes)}
                </Text>
                <Text style={styles.timerLabel}>MIN</Text>
              </View>
              <Text style={styles.timerSeparator}>:</Text>
              <View style={styles.timerBox}>
                <Text style={styles.timerNumber}>
                  {formatNumber(timeLeft.seconds)}
                </Text>
                <Text style={styles.timerLabel}>SEC</Text>
              </View>
            </View>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaContainer}>
          <Text style={styles.ctaText}>Shop Now</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </View>
      </LinearGradient>
    </DebouncedTouchable>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    position: "relative",
    overflow: "hidden",
  },
  flashEffect: {
    position: "absolute",
    right: -10,
    top: -10,
    opacity: 0.5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  flashIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    letterSpacing: 1,
  },
  discount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#fff",
  },
  timerSection: {
    alignItems: "flex-end",
  },
  endsIn: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timerBox: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
    minWidth: 44,
  },
  timerNumber: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  timerLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 8,
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 0.5,
  },
  timerSeparator: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
    marginHorizontal: 4,
  },
  ctaContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingVertical: 10,
    borderRadius: 8,
  },
  ctaText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
})
