import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

import AppColors from "@/src/constants/Colors"

interface AppExclusiveBannerProps {
  onPress?: () => void
}

/**
 * Small banner for app-exclusive 10% discount
 */
export default function AppExclusiveBanner({
  onPress,
}: AppExclusiveBannerProps) {
  const router = useRouter()

  const handlePress = () => {
    if (onPress) {
      onPress()
    } else {
      router.push({ pathname: "/shop", params: {} })
    }
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={[AppColors.primary[400], AppColors.primary[500]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {/* Decorative circles */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="phone-portrait-outline" size={24} color="#fff" />
          </View>

          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>APP EXCLUSIVE</Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>10% OFF</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              Use code <Text style={styles.code}>APP10</Text> at checkout
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="rgba(255,255,255,0.7)"
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 2,
    marginBottom: 24,
    marginTop: -12,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: AppColors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    position: "relative",
    overflow: "hidden",
  },
  decorCircle1: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  decorCircle2: {
    position: "absolute",
    bottom: -20,
    right: 40,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: "#fff",
    letterSpacing: 0.5,
  },
  discountBadge: {
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    color: AppColors.primary[600],
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
  },
  code: {
    fontFamily: "Poppins_700Bold",
    color: "#fff",
  },
})
