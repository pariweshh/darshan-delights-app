import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { Category } from "@/src/types"
import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import DebouncedTouchable from "../ui/DebouncedTouchable"

interface CategoryListProps {
  categories: Category[]
  loading?: boolean
  onCategoryPress: (categoryName: string | null) => void
}

// Category icons mapping
const getCategoryIcon = (
  categoryName: string
): keyof typeof Ionicons.glyphMap => {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    groceries: "basket-outline",
    spices: "flame-outline",
    snacks: "fast-food-outline",
    beverages: "cafe-outline",
    dairy: "water-outline",
    frozen: "snow-outline",
    puja: "flower-outline",
    sweets: "ice-cream-outline",
    rice: "leaf-outline",
    flour: "ellipse-outline",
    oil: "beaker-outline",
    pickle: "nutrition-outline",
    default: "pricetag-outline",
  }

  const lowerName = categoryName.toLowerCase()
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key)) {
      return icon
    }
  }
  return iconMap.default
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  loading,
  onCategoryPress,
}) => {
  const { config, isTablet } = useResponsive()

  if (!categories || categories.length === 0) {
    return null
  }

  const iconContainerSize = config.categoryIconSize
  const imageSize = isTablet ? 48 : 40
  const iconSize = isTablet ? 24 : 20

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, { gap: config.gapSmall }]}
    >
      {/* All Products Button */}
      <DebouncedTouchable
        style={[styles.categoryButton, { width: config.categoryItemWidth }]}
        onPress={() => onCategoryPress(null)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconContainer,
            styles.allIconContainer,
            {
              width: iconContainerSize,
              height: iconContainerSize,
              borderRadius: iconContainerSize / 3.5,
            },
          ]}
        >
          <Ionicons name="grid-outline" size={iconSize} color="white" />
        </View>
        <Text
          style={[
            styles.categoryText,
            styles.allText,
            { fontSize: config.smallFontSize },
          ]}
        >
          All
        </Text>
      </DebouncedTouchable>

      {/* Category Buttons */}
      {categories.map((category) => (
        <DebouncedTouchable
          key={category.id}
          style={[styles.categoryButton, { width: config.categoryItemWidth }]}
          onPress={() => onCategoryPress(category.name)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.iconContainer,
              {
                width: iconContainerSize,
                height: iconContainerSize,
                borderRadius: iconContainerSize / 3.5,
              },
            ]}
          >
            {category?.cover?.url ? (
              <Image
                source={{ uri: category?.cover?.url }}
                style={{ width: imageSize, height: imageSize }}
                contentFit="cover"
                transition={200}
                cachePolicy={"memory-disk"}
                recyclingKey={`product-${category?.id}`}
              />
            ) : (
              <Ionicons
                name={getCategoryIcon(category.name)}
                size={iconSize}
                color={AppColors.primary[600]}
              />
            )}
          </View>
          <Text
            style={[styles.categoryText, { fontSize: config.smallFontSize }]}
            numberOfLines={1}
          >
            {category.name}
          </Text>
        </DebouncedTouchable>
      ))}
    </ScrollView>
  )
}

export default CategoryList

const styles = StyleSheet.create({
  scrollContent: {
    paddingRight: 16,
  },
  loadingContainer: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryButton: {
    alignItems: "center",
  },
  iconContainer: {
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: AppColors.primary[100],
  },
  allIconContainer: {
    backgroundColor: AppColors.primary[500],
    borderColor: AppColors.primary[500],
  },
  categoryText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
    textAlign: "center",
    textTransform: "capitalize",
  },
  allText: {
    color: AppColors.primary[600],
    fontFamily: "Poppins_600SemiBold",
  },
})
