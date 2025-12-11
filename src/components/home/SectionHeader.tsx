import AppColors from "@/src/constants/Colors"
import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

interface SectionHeaderProps {
  title: string
  onViewAll?: () => void
  showViewAll?: boolean
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  onViewAll,
  showViewAll = true,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {showViewAll && onViewAll && (
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={onViewAll}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={AppColors.primary[500]}
          />
        </TouchableOpacity>
      )}
    </View>
  )
}

export default SectionHeader

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingRight: 4,
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: AppColors.text.primary,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewAllText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.primary[500],
  },
})
