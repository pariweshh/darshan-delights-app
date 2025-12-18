import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { ScrollView, StyleSheet, Text, View } from "react-native"

interface ActiveFiltersProps {
  selectedBrands: any[]
  activeSortOption: string | null
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  selectedBrands,
  activeSortOption,
}) => {
  const { config, isTablet } = useResponsive()

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

  const chipPaddingHorizontal = isTablet ? 12 : 10
  const chipPaddingVertical = isTablet ? 6 : 4

  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal: config.horizontalPadding + 4 },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { gap: config.gapSmall }]}
      >
        {selectedBrands.map((brand) => (
          <View
            key={brand.id}
            style={[
              styles.chip,
              {
                paddingHorizontal: chipPaddingHorizontal,
                paddingVertical: chipPaddingVertical,
                borderRadius: isTablet ? 14 : 12,
              },
            ]}
          >
            <Text style={[styles.chipText, { fontSize: config.smallFontSize }]}>
              {brand.name}
            </Text>
          </View>
        ))}
        {activeSortOption && (
          <View
            style={[
              styles.chip,
              styles.sortChip,
              {
                paddingHorizontal: chipPaddingHorizontal,
                paddingVertical: chipPaddingVertical,
                borderRadius: isTablet ? 14 : 12,
              },
            ]}
          >
            <Text style={[styles.chipText, { fontSize: config.smallFontSize }]}>
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
  },
  scrollContent: {},
  chip: {
    backgroundColor: AppColors.primary[100],
  },
  sortChip: {
    backgroundColor: AppColors.accent?.[100] || AppColors.primary[100],
  },
  chipText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[700],
    textTransform: "capitalize",
  },
})
