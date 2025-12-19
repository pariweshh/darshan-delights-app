// src/components/home/banners/CategorySpotlightBanner.tsx

import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from "react-native"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import DebouncedTouchable from "../../ui/DebouncedTouchable"

interface CategorySpotlightBannerProps {
  categoryName: string
  itemCount?: number
  backgroundColor?: string
  textColor?: string
  imageUrl?: string
  localImage?: ImageSourcePropType
  onPress?: () => void
}

export default function CategorySpotlightBanner({
  categoryName,
  itemCount,
  backgroundColor = AppColors.primary[50],
  textColor = AppColors.primary[700],
  imageUrl,
  localImage,
  onPress,
}: CategorySpotlightBannerProps) {
  const router = useRouter()
  const { config, isTablet, isLandscape, width } = useResponsive()

  const handlePress = () => {
    if (onPress) {
      onPress()
    } else {
      router.push({
        pathname: "/shop",
        params: { category: categoryName },
      })
    }
  }

  // Responsive sizing
  const verticalPadding = isTablet ? 20 : 16
  const horizontalPadding = isTablet ? 24 : 18
  const labelSize = isTablet ? 12 : 10
  const categoryNameSize = isTablet ? 24 : 20
  const itemCountSize = isTablet ? 14 : 12
  const imageWidth = isTablet ? 100 : 80
  const imageHeight = isTablet ? 85 : 70
  const arrowSize = isTablet ? 42 : 36
  const arrowIconSize = isTablet ? 22 : 18

  // For landscape on tablets, limit the banner width
  const maxWidth = isTablet && isLandscape ? width * 0.6 : undefined

  return (
    <DebouncedTouchable
      style={[
        styles.container,
        {
          backgroundColor,
          marginBottom: config.sectionSpacing,
          borderRadius: config.cardBorderRadius + 4,
          maxWidth,
          alignSelf: maxWidth ? "center" : undefined,
          width: maxWidth ? "100%" : undefined,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View
        style={[
          styles.content,
          {
            paddingVertical: verticalPadding,
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        <View style={styles.textSection}>
          <Text
            style={[styles.label, { color: textColor, fontSize: labelSize }]}
          >
            EXPLORE
          </Text>
          <Text
            style={[
              styles.categoryName,
              { color: textColor, fontSize: categoryNameSize },
            ]}
          >
            {categoryName}
          </Text>
          {itemCount && (
            <Text
              style={[
                styles.itemCount,
                { color: textColor, fontSize: itemCountSize },
              ]}
            >
              {itemCount}+ products
            </Text>
          )}
        </View>

        <View
          style={[
            styles.imageSection,
            {
              width: imageWidth,
              height: imageHeight,
              marginRight: isTablet ? 16 : 10,
            },
          ]}
        >
          {(imageUrl || localImage) && (
            <Image
              source={localImage || { uri: imageUrl }}
              style={styles.image}
              resizeMode="contain"
            />
          )}
        </View>

        <View
          style={[
            styles.arrowContainer,
            {
              backgroundColor: textColor,
              width: arrowSize,
              height: arrowSize,
              borderRadius: arrowSize / 2,
            },
          ]}
        >
          <Ionicons name="arrow-forward" size={arrowIconSize} color="#fff" />
        </View>
      </View>
    </DebouncedTouchable>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 2,
    marginTop: -8,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  textSection: {
    flex: 1,
  },
  label: {
    fontFamily: "Poppins_600SemiBold",
    letterSpacing: 1,
    marginBottom: 2,
    opacity: 0.7,
  },
  categoryName: {
    fontFamily: "Poppins_700Bold",
    marginBottom: 2,
    textTransform: "capitalize",
  },
  itemCount: {
    fontFamily: "Poppins_400Regular",
    opacity: 0.8,
  },
  imageSection: {},
  image: {
    width: "100%",
    height: "100%",
  },
  arrowContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
})
