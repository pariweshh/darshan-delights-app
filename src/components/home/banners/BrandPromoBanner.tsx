import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"

import AppColors from "@/src/constants/Colors"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

interface BrandPromoBannerProps {
  brandName: string
  tagline: string
  discount?: string
  backgroundColor?: readonly [string, string, ...string[]]
  accentColor?: string
  imageUrl?: string
  localImage?: ImageSourcePropType
  onPress?: () => void
}

/**
 * Large banner for brand promotions
 */
export default function BrandPromoBanner({
  brandName,
  tagline,
  discount,
  backgroundColor = ["#1a1a2e", "#16213e"],
  accentColor = AppColors.primary[500],
  imageUrl,
  localImage,
  onPress,
}: BrandPromoBannerProps) {
  const router = useRouter()

  const handlePress = () => {
    if (onPress) {
      onPress()
    } else {
      router.push({
        pathname: "/shop",
        params: { brand: brandName },
      })
    }
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.95}
    >
      <LinearGradient
        colors={backgroundColor}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Decorative elements */}
        <View style={[styles.decorShape1, { backgroundColor: accentColor }]} />
        <View style={[styles.decorShape2, { borderColor: accentColor }]} />
        <View style={styles.decorDots}>
          {[...Array(5)].map((_, i) => (
            <View key={i} style={[styles.dot, { opacity: 0.1 + i * 0.1 }]} />
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.textSection}>
            {discount && (
              <View
                style={[styles.discountTag, { backgroundColor: accentColor }]}
              >
                <Text style={styles.discountText}>{discount}</Text>
              </View>
            )}

            <Text style={styles.brandName}>{brandName}</Text>
            <Text style={styles.tagline}>{tagline}</Text>

            <View style={[styles.shopButton, { backgroundColor: accentColor }]}>
              <Text style={styles.shopButtonText}>Shop Now</Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={AppColors.primary[500]}
              />
            </View>
          </View>

          {/* Product Image */}
          <View style={styles.imageSection}>
            {(imageUrl || localImage) && (
              <Image
                source={localImage || { uri: imageUrl }}
                style={styles.productImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 2,
    marginTop: -12,
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  gradient: {
    minHeight: 180,
    paddingVertical: 20,
    paddingHorizontal: 20,
    position: "relative",
    overflow: "hidden",
  },
  decorShape1: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.15,
  },
  decorShape2: {
    position: "absolute",
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 20,
    opacity: 0.1,
  },
  decorDots: {
    position: "absolute",
    top: 20,
    right: 20,
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textSection: {
    flex: 1,
    paddingRight: 10,
  },
  discountTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 10,
  },
  discountText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: AppColors.primary[500],
    letterSpacing: 0.5,
  },
  brandName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: "#fff",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.primary[800],
    marginBottom: 16,
    lineHeight: 20,
  },
  shopButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
  },
  shopButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: AppColors.primary[500],
  },
  imageSection: {
    width: SCREEN_WIDTH * 0.35,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
})
