import { useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { getProductById } from "@/src/api/products"
import Loader from "@/src/components/common/Loader"
import AppColors from "@/src/constants/Colors"
import { Product } from "@/src/types"

type NutritionTab = "per-serving" | "per-100g"

interface NutritionItem {
  nutrient: string
  per_serving?: string
  per_100g?: string
  eng_per_serving?: string
  eng_per_100g?: string
}

export default function NutritionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<NutritionTab>("per-serving")

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return

      setLoading(true)
      try {
        const data = await getProductById(+id)
        setProduct(data)
      } catch (err) {
        console.error("Error fetching product:", err)
        setError("Failed to load nutrition information")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  if (loading) {
    return <Loader fullScreen text="Loading nutrition info..." />
  }

  if (error || !product?.nutrition) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || "No nutrition information available"}
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  const nutrition = product.nutrition
  const nutritionItems: NutritionItem[] = nutrition.nutrition || []

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Name */}
        <Text style={styles.productName}>{product.name}</Text>

        {/* Serving Info */}
        <View style={styles.servingInfo}>
          {nutrition.servings_per_packet && (
            <Text style={styles.servingText}>
              Servings per package: {nutrition.servings_per_packet}
            </Text>
          )}
          {nutrition.serving_size && (
            <Text style={styles.servingText}>
              Serving size: {nutrition.serving_size}
            </Text>
          )}
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "per-serving" && styles.tabActive,
            ]}
            onPress={() => setActiveTab("per-serving")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "per-serving" && styles.tabTextActive,
              ]}
            >
              Per Serving
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "per-100g" && styles.tabActive]}
            onPress={() => setActiveTab("per-100g")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "per-100g" && styles.tabTextActive,
              ]}
            >
              Per 100g/ml
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nutrition Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.headerText}>Nutrient</Text>
            <Text style={styles.headerText}>
              {activeTab === "per-serving" ? "Per Serving" : "Per 100g"}
            </Text>
          </View>

          {/* Table Rows */}
          {nutritionItems.map((item, index) => {
            const value =
              activeTab === "per-serving"
                ? item.eng_per_serving || item.per_serving
                : item.eng_per_100g || item.per_100g

            return (
              <View
                key={index}
                style={[
                  styles.tableRow,
                  index % 2 === 0 && styles.tableRowEven,
                ]}
              >
                <Text style={styles.nutrientName}>{item.nutrient}</Text>
                <Text style={styles.nutrientValue}>{value || "-"}</Text>
              </View>
            )
          })}
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          * Percent Daily Values are based on a 2,000 calorie diet. Your daily
          values may be higher or lower depending on your calorie needs.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  productName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: AppColors.text.primary,
    textTransform: "capitalize",
    marginBottom: 16,
  },
  servingInfo: {
    backgroundColor: AppColors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 4,
  },
  servingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: AppColors.gray[200],
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: AppColors.background.primary,
  },
  tabText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  tabTextActive: {
    color: AppColors.text.primary,
  },
  table: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: AppColors.primary[500],
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "white",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: AppColors.background.primary,
  },
  tableRowEven: {
    backgroundColor: AppColors.background.secondary,
  },
  nutrientName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.primary,
    textTransform: "capitalize",
    flex: 1,
  },
  nutrientValue: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.primary,
    textAlign: "right",
  },
  disclaimer: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.tertiary,
    marginTop: 20,
    lineHeight: 18,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: AppColors.text.secondary,
    textAlign: "center",
  },
})
