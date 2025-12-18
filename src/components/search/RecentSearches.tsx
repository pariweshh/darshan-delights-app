import { AntDesign, Ionicons } from "@expo/vector-icons"
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"

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
  const { config, isTablet } = useResponsive()

  if (searches.length === 0) {
    return null
  }

  // Responsive sizes
  const chipPaddingH = isTablet ? 16 : 14
  const chipPaddingV = isTablet ? 10 : 8
  const chipFontSize = isTablet ? 14 : 13
  const removeIconSize = isTablet ? 14 : 12

  return (
    <View style={[styles.container, { paddingVertical: isTablet ? 20 : 16 }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: config.horizontalPadding,
            marginBottom: isTablet ? 14 : 12,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name="time-outline"
            size={isTablet ? 20 : 18}
            color={AppColors.gray[500]}
          />
          <Text style={[styles.headerTitle, { fontSize: config.bodyFontSize }]}>
            Recent Searches
          </Text>
        </View>
        <TouchableOpacity onPress={onClearAll} activeOpacity={0.7}>
          <Text
            style={[styles.clearAllText, { fontSize: config.bodyFontSize - 1 }]}
          >
            Clear All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Items */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: config.horizontalPadding,
            gap: isTablet ? 10 : 8,
          },
        ]}
      >
        {searches.map((search, index) => (
          <View key={`${search}-${index}`} style={styles.chipContainer}>
            <TouchableOpacity
              style={[
                styles.chip,
                {
                  paddingHorizontal: chipPaddingH,
                  paddingVertical: chipPaddingV,
                },
              ]}
              onPress={() => onSearchSelect(search)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, { fontSize: chipFontSize }]}>
                {search}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.removeButton,
                {
                  paddingHorizontal: isTablet ? 10 : 8,
                  paddingVertical: chipPaddingV,
                },
              ]}
              onPress={() => onRemoveSearch(search)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AntDesign
                name="close"
                size={removeIconSize}
                color={AppColors.gray[500]}
              />
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
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.secondary,
  },
  clearAllText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[500],
  },
  scrollContent: {},
  chipContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    backgroundColor: AppColors.gray[100],
    borderRadius: 20,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  chipText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
  },
  removeButton: {
    backgroundColor: AppColors.gray[100],
    borderRadius: 20,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    marginLeft: 1,
  },
})
