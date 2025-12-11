import AppColors from "@/src/constants/Colors"
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
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* All Button */}
      <TouchableOpacity
        style={[styles.chip, selectedCategory === null && styles.selectedChip]}
        onPress={() => onSelectCategory(null)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.chipText,
            selectedCategory === null && styles.selectedChipText,
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
          ]}
          onPress={() => onSelectCategory(category.name)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.chipText,
              selectedCategory === category.name && styles.selectedChipText,
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
    paddingLeft: 20,
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: AppColors.background.secondary,
    marginRight: 8,
  },
  selectedChip: {
    backgroundColor: AppColors.primary[500],
  },
  chipText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.primary,
    textTransform: "capitalize",
  },
  selectedChipText: {
    color: "white",
  },
})
