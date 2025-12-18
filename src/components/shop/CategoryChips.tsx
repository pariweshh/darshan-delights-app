import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { Category } from "@/src/types"
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native"

interface CategoryChipsProps {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
}

const CategoryChips: React.FC<CategoryChipsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const { config, isTablet } = useResponsive()

  const chipPaddingHorizontal = isTablet ? 20 : 16
  const chipPaddingVertical = isTablet ? 10 : 8

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.container,
        {
          paddingLeft: config.horizontalPadding + 4,
          paddingRight: config.gapSmall,
          gap: config.gapSmall,
        },
      ]}
    >
      {/* All Button */}
      <TouchableOpacity
        style={[
          styles.chip,
          selectedCategory === null && styles.selectedChip,
          {
            paddingHorizontal: chipPaddingHorizontal,
            paddingVertical: chipPaddingVertical,
            borderRadius: isTablet ? 24 : 20,
          },
        ]}
        onPress={() => onSelectCategory(null)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.chipText,
            selectedCategory === null && styles.selectedChipText,
            { fontSize: config.bodyFontSize },
          ]}
        >
          All
        </Text>
      </TouchableOpacity>

      {/* Category Chips */}
      {categories?.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.chip,
            selectedCategory === category.name && styles.selectedChip,
            {
              paddingHorizontal: chipPaddingHorizontal,
              paddingVertical: chipPaddingVertical,
              borderRadius: isTablet ? 24 : 20,
            },
          ]}
          onPress={() => onSelectCategory(category.name)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.chipText,
              selectedCategory === category.name && styles.selectedChipText,
              { fontSize: config.bodyFontSize },
            ]}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

export default CategoryChips

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  chip: {
    backgroundColor: AppColors.background.secondary,
  },
  selectedChip: {
    backgroundColor: AppColors.primary[500],
  },
  chipText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
    textTransform: "capitalize",
  },
  selectedChipText: {
    color: "white",
  },
})
