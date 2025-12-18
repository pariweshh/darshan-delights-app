import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"

interface SearchSuggestionsProps {
  onSuggestionSelect: (query: string) => void
}

// Popular/trending searches - could be fetched from API
const POPULAR_SEARCHES = [
  "rice",
  "spices",
  "dal",
  "ghee",
  "noodles",
  "pickles",
  "tea",
  "snacks",
]

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  onSuggestionSelect,
}) => {
  const { config, isTablet, isLandscape } = useResponsive()

  // Responsive sizes
  const chipPaddingH = isTablet ? 16 : 12
  const chipPaddingV = isTablet ? 10 : 8
  const chipFontSize = isTablet ? 14 : 12
  const iconSize = isTablet ? 16 : 14

  // For tablet landscape, constrain width
  const maxWidth = isTablet && isLandscape ? 600 : undefined

  return (
    <View
      style={[
        styles.container,
        {
          paddingVertical: isTablet ? 24 : 20,
          paddingHorizontal: config.horizontalPadding,
        },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            gap: isTablet ? 10 : 8,
            marginBottom: isTablet ? 18 : 16,
            maxWidth,
          },
        ]}
      >
        <Ionicons
          name="trending-up"
          size={isTablet ? 20 : 18}
          color={AppColors.primary[500]}
        />
        <Text
          style={[styles.headerTitle, { fontSize: config.subtitleFontSize }]}
        >
          Popular Searches
        </Text>
      </View>

      {/* Suggestions Grid */}
      <View
        style={[
          styles.suggestionsGrid,
          {
            gap: isTablet ? 10 : 8,
            maxWidth,
          },
        ]}
      >
        {POPULAR_SEARCHES.map((suggestion, index) => (
          <TouchableOpacity
            key={`${suggestion}-${index}`}
            style={[
              styles.suggestionChip,
              {
                paddingHorizontal: chipPaddingH,
                paddingVertical: chipPaddingV,
                gap: isTablet ? 6 : 4,
              },
            ]}
            onPress={() => onSuggestionSelect(suggestion)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="search-outline"
              size={iconSize}
              color={AppColors.gray[400]}
            />
            <Text style={[styles.suggestionText, { fontSize: chipFontSize }]}>
              {suggestion}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

export default SearchSuggestions

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.secondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  suggestionText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
    textTransform: "capitalize",
  },
})
