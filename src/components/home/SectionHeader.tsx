import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, Text, View } from "react-native"
import DebouncedTouchable from "../ui/DebouncedTouchable"

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
  const { config } = useResponsive()

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontSize: config.titleFontSize }]}>
        {title}
      </Text>
      {showViewAll && onViewAll && (
        <DebouncedTouchable
          style={styles.viewAllButton}
          onPress={onViewAll}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.viewAllText, { fontSize: config.subtitleFontSize }]}
          >
            View All
          </Text>
          <Ionicons
            name="chevron-forward"
            size={config.iconSizeSmall}
            color={AppColors.primary[500]}
          />
        </DebouncedTouchable>
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
    color: AppColors.text.primary,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewAllText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[500],
  },
})
