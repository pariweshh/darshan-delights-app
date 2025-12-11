import { Ionicons } from "@expo/vector-icons"
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

interface CategorySpotlightBannerProps {
  categoryName: string
  itemCount?: number
  backgroundColor?: string
  textColor?: string
  imageUrl?: string
  localImage?: ImageSourcePropType
  onPress?: () => void
}

/**
 * Small category spotlight banner
 */
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

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor }]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.content}>
        <View style={styles.textSection}>
          <Text style={[styles.label, { color: textColor }]}>EXPLORE</Text>
          <Text style={[styles.categoryName, { color: textColor }]}>
            {categoryName}
          </Text>
          {itemCount && (
            <Text style={[styles.itemCount, { color: textColor }]}>
              {itemCount}+ products
            </Text>
          )}
        </View>

        <View style={styles.imageSection}>
          {(imageUrl || localImage) && (
            <Image
              source={localImage || { uri: imageUrl }}
              style={styles.image}
              resizeMode="contain"
            />
          )}
        </View>

        <View style={[styles.arrowContainer, { backgroundColor: textColor }]}>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 2,
    marginTop: 0,
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  textSection: {
    flex: 1,
  },
  label: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 2,
    opacity: 0.7,
  },
  categoryName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    marginBottom: 2,
    textTransform: "capitalize",
  },
  itemCount: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    opacity: 0.8,
  },
  imageSection: {
    width: 80,
    height: 70,
    marginRight: 10,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  arrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
})
