import AppColors from "@/src/constants/Colors"
import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

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
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="trending-up" size={18} color={AppColors.primary[500]} />
        <Text style={styles.headerTitle}>Popular Searches</Text>
      </View>

      {/* Suggestions Grid */}
      <View style={styles.suggestionsGrid}>
        {POPULAR_SEARCHES.map((suggestion, index) => (
          <TouchableOpacity
            key={`${suggestion}-${index}`}
            style={styles.suggestionChip}
            onPress={() => onSuggestionSelect(suggestion)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="search-outline"
              size={14}
              color={AppColors.gray[400]}
            />
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

export default SearchSuggestions

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: AppColors.text.primary,
  },
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  suggestionText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.primary,
    textTransform: "capitalize",
  },
})
