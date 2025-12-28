import { StyleSheet, View } from "react-native"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { SkeletonBase } from "./SkeletonBase"

const AddressCardSkeleton: React.FC = () => {
  const { config, isTablet } = useResponsive()

  const cardPadding = isTablet ? 18 : 16
  const labelIconSize = isTablet ? 36 : 32
  const actionButtonSize = isTablet ? 40 : 36

  return (
    <View
      style={[
        styles.container,
        {
          padding: cardPadding,
          borderRadius: config.cardBorderRadius + 4,
          marginBottom: isTablet ? 14 : 12,
        },
      ]}
    >
      {/* Header Row */}
      <View style={[styles.header, { marginBottom: isTablet ? 14 : 12 }]}>
        <View style={styles.labelContainer}>
          <SkeletonBase
            width={labelIconSize}
            height={labelIconSize}
            borderRadius={isTablet ? 10 : 8}
          />
          <SkeletonBase
            width={isTablet ? 80 : 70}
            height={isTablet ? 18 : 16}
            style={{ marginLeft: isTablet ? 12 : 10 }}
          />
          <SkeletonBase
            width={60}
            height={isTablet ? 20 : 18}
            borderRadius={4}
            style={{ marginLeft: 8 }}
          />
        </View>
        <View style={styles.actions}>
          <SkeletonBase
            width={actionButtonSize}
            height={actionButtonSize}
            borderRadius={isTablet ? 10 : 8}
          />
          <SkeletonBase
            width={actionButtonSize}
            height={actionButtonSize}
            borderRadius={isTablet ? 10 : 8}
            style={{ marginLeft: 4 }}
          />
        </View>
      </View>

      {/* Contact Info */}
      <View style={[styles.contactInfo, { marginBottom: isTablet ? 10 : 8 }]}>
        <SkeletonBase width="50%" height={isTablet ? 17 : 15} />
        <SkeletonBase
          width="35%"
          height={isTablet ? 14 : 13}
          style={{ marginTop: isTablet ? 4 : 2 }}
        />
      </View>

      {/* Address Lines */}
      <SkeletonBase width="90%" height={isTablet ? 15 : 14} />
      <SkeletonBase
        width="70%"
        height={isTablet ? 15 : 14}
        style={{ marginTop: 4 }}
      />

      {/* Set Default Button */}
      <View
        style={[
          styles.setDefaultSection,
          {
            marginTop: isTablet ? 16 : 14,
            paddingTop: isTablet ? 12 : 10,
          },
        ]}
      >
        <SkeletonBase
          width={isTablet ? 130 : 110}
          height={isTablet ? 18 : 16}
        />
      </View>
    </View>
  )
}

export default AddressCardSkeleton

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  actions: {
    flexDirection: "row",
  },
  contactInfo: {},
  setDefaultSection: {
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
    alignItems: "center",
  },
})
