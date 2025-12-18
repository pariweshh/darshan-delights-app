// src/components/home/banners/BrandPromoBanner.tsx

import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"

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
  const { config, isTablet, isLandscape, width } = useResponsive()

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

  // Responsive sizing
  const minHeight = isTablet ? 200 : 180
  const verticalPadding = isTablet ? 24 : 20
  const horizontalPadding = isTablet ? 24 : 20
  const brandNameSize = isTablet ? 32 : 26
  const taglineSize = isTablet ? 16 : 14
  const discountSize = isTablet ? 16 : 14
  const buttonTextSize = isTablet ? 15 : 13
  const imageWidth = isTablet ? width * 0.3 : width * 0.35
  const imageHeight = isTablet ? 160 : 140

  // For landscape on tablets, limit the banner width
  const maxWidth = isTablet && isLandscape ? width * 0.7 : undefined

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          marginBottom: config.sectionSpacing,
          borderRadius: config.cardBorderRadius + 8,
          maxWidth,
          alignSelf: maxWidth ? "center" : undefined,
          width: maxWidth ? "100%" : undefined,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.95}
    >
      <LinearGradient
        colors={backgroundColor}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          {
            minHeight,
            paddingVertical: verticalPadding,
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        {/* Decorative elements */}
        <View
          style={[
            styles.decorShape1,
            {
              backgroundColor: accentColor,
              width: isTablet ? 180 : 150,
              height: isTablet ? 180 : 150,
              borderRadius: isTablet ? 90 : 75,
              top: isTablet ? -60 : -50,
              right: isTablet ? -60 : -50,
            },
          ]}
        />
        <View
          style={[
            styles.decorShape2,
            {
              borderColor: accentColor,
              width: isTablet ? 120 : 100,
              height: isTablet ? 120 : 100,
              borderRadius: isTablet ? 60 : 50,
              borderWidth: isTablet ? 24 : 20,
              bottom: isTablet ? -40 : -30,
              left: isTablet ? -40 : -30,
            },
          ]}
        />
        <View style={styles.decorDots}>
          {[...Array(5)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  opacity: 0.1 + i * 0.1,
                  width: isTablet ? 10 : 8,
                  height: isTablet ? 10 : 8,
                  borderRadius: isTablet ? 5 : 4,
                },
              ]}
            />
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View
            style={[styles.textSection, { paddingRight: isTablet ? 16 : 10 }]}
          >
            {discount && (
              <View
                style={[
                  styles.discountTag,
                  {
                    backgroundColor: accentColor,
                    paddingHorizontal: isTablet ? 14 : 12,
                    paddingVertical: isTablet ? 6 : 5,
                    borderRadius: isTablet ? 8 : 6,
                    marginBottom: isTablet ? 12 : 10,
                  },
                ]}
              >
                <Text style={[styles.discountText, { fontSize: discountSize }]}>
                  {discount}
                </Text>
              </View>
            )}

            <Text
              style={[
                styles.brandName,
                { fontSize: brandNameSize, marginBottom: isTablet ? 6 : 4 },
              ]}
            >
              {brandName}
            </Text>
            <Text
              style={[
                styles.tagline,
                {
                  fontSize: taglineSize,
                  marginBottom: isTablet ? 20 : 16,
                  lineHeight: taglineSize * 1.4,
                },
              ]}
            >
              {tagline}
            </Text>

            <View
              style={[
                styles.shopButton,
                {
                  backgroundColor: accentColor,
                  paddingHorizontal: isTablet ? 20 : 16,
                  paddingVertical: isTablet ? 12 : 10,
                  borderRadius: isTablet ? 28 : 25,
                },
              ]}
            >
              <Text
                style={[styles.shopButtonText, { fontSize: buttonTextSize }]}
              >
                Shop Now
              </Text>
              <Ionicons
                name="arrow-forward"
                size={isTablet ? 18 : 16}
                color={AppColors.primary[500]}
              />
            </View>
          </View>

          {/* Product Image */}
          <View
            style={[
              styles.imageSection,
              { width: imageWidth, height: imageHeight },
            ]}
          >
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
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  gradient: {
    position: "relative",
    overflow: "hidden",
  },
  decorShape1: {
    position: "absolute",
    opacity: 0.15,
  },
  decorShape2: {
    position: "absolute",
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
    backgroundColor: "#fff",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textSection: {
    flex: 1,
  },
  discountTag: {
    alignSelf: "flex-start",
  },
  discountText: {
    fontFamily: "Poppins_700Bold",
    color: AppColors.primary[500],
    letterSpacing: 0.5,
  },
  brandName: {
    fontFamily: "Poppins_700Bold",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.primary[800],
  },
  shopButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
  },
  shopButtonText: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.primary[500],
  },
  imageSection: {
    alignItems: "center",
    justifyContent: "center",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
})
