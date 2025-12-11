import AppColors from "@/src/constants/Colors"
import { AntDesign, Ionicons } from "@expo/vector-icons"
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"

interface RecentSearchesProps {
  searches: string[]
  onSearchSelect: (query: string) => void
  onRemoveSearch: (query: string) => void
  onClearAll: () => void
}

const RecentSearches: React.FC<RecentSearchesProps> = ({
  searches,
  onSearchSelect,
  onRemoveSearch,
  onClearAll,
}) => {
  if (searches.length === 0) {
    return null
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="time-outline" size={18} color={AppColors.gray[500]} />
          <Text style={styles.headerTitle}>Recent Searches</Text>
        </View>
        <TouchableOpacity onPress={onClearAll} activeOpacity={0.7}>
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Search Items */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {searches.map((search, index) => (
          <View key={`${search}-${index}`} style={styles.chipContainer}>
            <TouchableOpacity
              style={styles.chip}
              onPress={() => onSearchSelect(search)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipText}>{search}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemoveSearch(search)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AntDesign name="close" size={12} color={AppColors.gray[500]} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

export default RecentSearches

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  clearAllText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.primary[500],
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chipContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    backgroundColor: AppColors.gray[100],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  chipText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.primary,
  },
  removeButton: {
    backgroundColor: AppColors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    marginLeft: 1,
  },
})
