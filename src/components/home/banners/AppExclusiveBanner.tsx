import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { StyleSheet, Text, View } from "react-native"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import DebouncedTouchable from "../../ui/DebouncedTouchable"

interface AppExclusiveBannerProps {
  onPress?: () => void
}

export default function AppExclusiveBanner({
  onPress,
}: AppExclusiveBannerProps) {
  const router = useRouter()
  const { config, isTablet, isLandscape, width } = useResponsive()

  const handlePress = () => {
    if (onPress) {
      onPress()
    } else {
      router.push({ pathname: "/shop", params: {} })
    }
  }

  // Responsive sizing
  const iconContainerSize = isTablet ? 52 : 44
  const iconSize = isTablet ? 28 : 24
  const verticalPadding = isTablet ? 18 : 14
  const horizontalPadding = isTablet ? 20 : 16

  // For landscape on tablets, limit the banner width
  const maxWidth = isTablet && isLandscape ? width * 0.7 : undefined

  return (
    <DebouncedTouchable
      style={[
        styles.container,
        {
          marginBottom: config.sectionSpacing,
          borderRadius: config.cardBorderRadius + 2,
          maxWidth,
          alignSelf: maxWidth ? "center" : undefined,
          width: maxWidth ? "100%" : undefined,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={[AppColors.primary[400], AppColors.primary[500]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradient,
          {
            paddingVertical: verticalPadding,
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        {/* Decorative circles */}
        <View
          style={[
            styles.decorCircle1,
            {
              width: isTablet ? 100 : 80,
              height: isTablet ? 100 : 80,
              borderRadius: isTablet ? 50 : 40,
              top: isTablet ? -40 : -30,
              right: isTablet ? -40 : -30,
            },
          ]}
        />
        <View
          style={[
            styles.decorCircle2,
            {
              width: isTablet ? 60 : 50,
              height: isTablet ? 60 : 50,
              borderRadius: isTablet ? 30 : 25,
              bottom: isTablet ? -25 : -20,
            },
          ]}
        />

        {/* Content */}
        <View style={styles.content}>
          <View
            style={[
              styles.iconContainer,
              {
                width: iconContainerSize,
                height: iconContainerSize,
                borderRadius: isTablet ? 14 : 12,
                marginRight: isTablet ? 16 : 12,
              },
            ]}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={iconSize}
              color="#fff"
            />
          </View>

          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { fontSize: isTablet ? 15 : 13 }]}>
                APP EXCLUSIVE
              </Text>
              <View
                style={[
                  styles.discountBadge,
                  { paddingHorizontal: isTablet ? 10 : 8 },
                ]}
              >
                <Text
                  style={[
                    styles.discountText,
                    { fontSize: isTablet ? 13 : 11 },
                  ]}
                >
                  10% OFF
                </Text>
              </View>
            </View>
            <Text style={[styles.subtitle, { fontSize: isTablet ? 14 : 12 }]}>
              Use code <Text style={styles.code}>APP10</Text> at checkout
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={isTablet ? 24 : 20}
            color="rgba(255,255,255,0.7)"
          />
        </View>
      </LinearGradient>
    </DebouncedTouchable>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 2,
    overflow: "hidden",
    shadowColor: AppColors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    position: "relative",
    overflow: "hidden",
  },
  decorCircle1: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  decorCircle2: {
    position: "absolute",
    right: 40,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
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
    color: "#fff",
    letterSpacing: 0.5,
  },
  discountBadge: {
    backgroundColor: "#fff",
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontFamily: "Poppins_700Bold",
    color: AppColors.primary[600],
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    color: "rgba(255, 255, 255, 0.9)",
  },
  code: {
    fontFamily: "Poppins_700Bold",
    color: "#fff",
  },
})
