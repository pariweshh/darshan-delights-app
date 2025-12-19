import AppColors from "@/src/constants/Colors"
import { FontAwesome, Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StyleSheet, View } from "react-native"
import ShareButton from "../common/ShareButton"
import DebouncedTouchable from "../ui/DebouncedTouchable"

interface ProductHeaderProps {
  isFavorite: boolean
  onToggleFavorite: () => void
  onShare: () => void
  showFavorite?: boolean
  showShare?: boolean
}

const ProductHeader: React.FC<ProductHeaderProps> = ({
  isFavorite,
  onToggleFavorite,
  onShare,
  showFavorite = true,
  showShare = true,
}) => {
  const router = useRouter()

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.push("/(tabs)/home")
    }
  }

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <DebouncedTouchable
        style={styles.button}
        onPress={handleGoBack}
        activeOpacity={0.7}
      >
        <Ionicons
          name="chevron-back"
          size={24}
          color={AppColors.text.primary}
        />
      </DebouncedTouchable>

      {/* Right Actions */}
      <View style={styles.rightActions}>
        {showShare && <ShareButton onPress={onShare} />}

        {showFavorite && (
          <DebouncedTouchable
            style={[styles.button, isFavorite && styles.favoriteActive]}
            onPress={onToggleFavorite}
            activeOpacity={0.7}
          >
            <FontAwesome
              name={isFavorite ? "heart" : "heart-o"}
              size={20}
              color={isFavorite ? "white" : AppColors.text.primary}
            />
          </DebouncedTouchable>
        )}
      </View>
    </View>
  )
}

export default ProductHeader

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AppColors.background.primary,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  rightActions: {
    flexDirection: "row",
    gap: 10,
  },
  favoriteActive: {
    backgroundColor: AppColors.error,
  },
})
