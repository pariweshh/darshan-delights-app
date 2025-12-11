import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

import TitleHeader from "@/src/components/common/TitleHeader"
import Wrapper from "@/src/components/common/Wrapper"
import ScrollProductList from "@/src/components/product/ScrollProductList"
import AppColors from "@/src/constants/Colors"
import { IsIPAD, windowHeight } from "@/src/themes/app.constants"

export default function PopularProductsScreen() {
  const router = useRouter()

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
              title="Popular Products"
              subtitle="Shop our most popular products"
            />
          </View>

          {/* Spacer for centering */}
          <View style={styles.headerSpacer} />
        </View>
      )}

      {/* Products List */}
      <View style={styles.content}>
        <ScrollProductList productParam={{ popular: true }} />
      </View>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.secondary,
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
