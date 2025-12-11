import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import TitleHeader from "@/src/components/common/TitleHeader"
import ScrollProductList from "@/src/components/product/ScrollProductList"
import AppColors from "@/src/constants/Colors"
import { IsIPAD, windowHeight } from "@/src/themes/app.constants"

export default function WeeklySaleScreen() {
  const router = useRouter()

  const handlePressBack = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.push("/(tabs)/home")
    }
  }

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.container}>
      {/* iPad Header */}
      {IsIPAD && (
        <View style={styles.ipadHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handlePressBack}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={AppColors.primary[500]}
            />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <TitleHeader
              title="🔥 Weekly Specials"
              subtitle="Shop specials for the week"
            />
          </View>

          {/* Spacer for centering */}
          <View style={styles.headerSpacer} />
        </View>
      )}

      {/* Products List */}
      <View style={styles.content}>
        <ScrollProductList productParam={{ onSale: true }} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.primary,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
  ipadHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: windowHeight(40),
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "white",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: AppColors.primary[500],
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerSpacer: {
    width: 80,
  },
  mobileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  mobileBackButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  mobileTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: AppColors.text.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
})
