import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

interface SeasonalBannerProps {
  title: string
  subtitle: string
  emoji?: string
  gradientColors?: readonly [string, string, ...string[]]
  onPress?: () => void
}

/**
 * Large seasonal/festive banner
 */
export default function SeasonalBanner({
  title,
  subtitle,
  emoji = "🎄",
  gradientColors = ["#dc2626", "#b91c1c"],
  onPress,
}: SeasonalBannerProps) {
  const router = useRouter()

  const handlePress = () => {
    if (onPress) {
      onPress()
    } else {
      router.push("/shop")
    }
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.95}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Decorative pattern */}
        <View style={styles.patternContainer}>
          {[...Array(6)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.patternCircle,
                {
                  top: Math.random() * 100,
                  left: `${i * 18}%`,
                  width: 20 + Math.random() * 30,
                  height: 20 + Math.random() * 30,
                },
              ]}
            />
          ))}
        </View>

        {/* Sparkles */}
        <View style={styles.sparkleContainer}>
          <Text style={styles.sparkle}>✨</Text>
          <Text style={[styles.sparkle, styles.sparkle2]}>✨</Text>
          <Text style={[styles.sparkle, styles.sparkle3]}>✨</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.ctaContainer}>
            <View style={styles.ctaButton}>
              <Text style={styles.ctaText}>Explore</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  gradient: {
    minHeight: 160,
    paddingVertical: 24,
    paddingHorizontal: 20,
    position: "relative",
    overflow: "hidden",
  },
  patternContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  patternCircle: {
    position: "absolute",
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  sparkleContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkle: {
    position: "absolute",
    fontSize: 16,
    top: 20,
    right: 30,
  },
  sparkle2: {
    top: 60,
    right: 80,
    fontSize: 12,
  },
  sparkle3: {
    top: 100,
    right: 20,
    fontSize: 14,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  emojiContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  emoji: {
    fontSize: 36,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
  },
  ctaContainer: {
    marginLeft: 10,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  ctaText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#fff",
  },
})
