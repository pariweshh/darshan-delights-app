import AppColors from "@/src/constants/Colors"
import { ScrollView, StyleSheet, Text, View } from "react-native"

interface ActiveFiltersProps {
  selectedBrands: any[]
  activeSortOption: string | null
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  selectedBrands,
  activeSortOption,
}) => {
  if (selectedBrands.length === 0 && !activeSortOption) {
    return null
  }

  const getSortLabel = (sort: string) => {
    switch (sort) {
      case "rrp:asc":
        return "Price: Low → High"
      case "rrp:desc":
        return "Price: High → Low"
      case "createdAt:desc":
        return "Newest"
      case "name:asc":
        return "Name: A → Z"
      default:
        return "Sorted"
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {selectedBrands.map((brand) => (
          <View key={brand.id} style={styles.chip}>
            <Text style={styles.chipText}>{brand.name}</Text>
          </View>
        ))}
        {activeSortOption && (
          <View style={[styles.chip, styles.sortChip]}>
            <Text style={styles.chipText}>
              {getSortLabel(activeSortOption)}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

export default ActiveFilters

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  scrollContent: {
    gap: 6,
  },
  chip: {
    backgroundColor: AppColors.primary[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sortChip: {
    backgroundColor: AppColors.accent[100] || AppColors.primary[100],
  },
  chipText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: AppColors.primary[700],
    textTransform: "capitalize",
  },
})
