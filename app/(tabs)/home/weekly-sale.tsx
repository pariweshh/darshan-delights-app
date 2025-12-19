import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StyleSheet, Text, View } from "react-native"

import TitleHeader from "@/src/components/common/TitleHeader"
import Wrapper from "@/src/components/common/Wrapper"
import ScrollProductList from "@/src/components/product/ScrollProductList"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"

export default function WeeklySaleScreen() {
  const router = useRouter()
  const { config, isTablet, isLandscape } = useResponsive()

  const handlePressBack = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.push("/(tabs)/home")
    }
  }

  return (
    <Wrapper edges={[]} style={styles.container}>
      {/* iPad Header */}
      {isTablet && (
        <View
          style={[
            styles.tabletHeader,
            {
              paddingTop: 20,
              paddingHorizontal: config.horizontalPadding,
              paddingBottom: isLandscape ? 12 : 16,
            },
          ]}
        >
          <DebouncedTouchable
            style={styles.backButton}
            onPress={handlePressBack}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={config.iconSize}
              color={AppColors.primary[500]}
            />
            <Text style={[styles.backText, { fontSize: config.bodyFontSize }]}>
              Back
            </Text>
          </DebouncedTouchable>

          <View style={styles.headerCenter}>
            <TitleHeader
              title="🔥 Weekly Specials"
              subtitle="Shop specials for the week"
            />
          </View>

          {/* Spacer for centering */}
          <View style={{ width: 100 }} />
        </View>
      )}

      {/* Products List */}
      <View style={styles.content}>
        <ScrollProductList productParam={{ onSale: true }} />
      </View>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
  tabletHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
    backgroundColor: AppColors.background.primary,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[500],
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
})
