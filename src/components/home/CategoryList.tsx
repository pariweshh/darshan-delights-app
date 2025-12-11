import AppColors from "@/src/constants/Colors"
import { Category } from "@/src/types"
import { Ionicons } from "@expo/vector-icons"
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"

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
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={AppColors.primary[500]} />
      </View>
    )
  }

  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* All Products Button */}
      <TouchableOpacity
        style={[styles.categoryButton, styles.allButton]}
        onPress={() => onCategoryPress(null)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, styles.allIconContainer]}>
          <Ionicons name="grid-outline" size={20} color="white" />
        </View>
        <Text style={[styles.categoryText, styles.allText]}>All</Text>
      </TouchableOpacity>

      {/* Category Buttons */}
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={styles.categoryButton}
          onPress={() => onCategoryPress(category.name)}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name={getCategoryIcon(category.name)}
              size={20}
              color={AppColors.primary[600]}
            />
          </View>
          <Text style={styles.categoryText} numberOfLines={1}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

export default CategoryList

const styles = StyleSheet.create({
  scrollContent: {
    paddingRight: 16,
    gap: 10,
  },
  loadingContainer: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryButton: {
    alignItems: "center",
    width: 75,
  },
  allButton: {},
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
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
    fontSize: 12,
    color: AppColors.text.primary,
    textAlign: "center",
    textTransform: "capitalize",
  },
  allText: {
    color: AppColors.primary[600],
    fontFamily: "Poppins_600SemiBold",
  },
})
