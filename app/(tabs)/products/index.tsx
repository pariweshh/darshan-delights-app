// app/(tabs)/products/index.tsx

import { FontAwesome5, Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScaledSize,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import Wrapper from "@/src/components/common/Wrapper"
import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"
import { useProductsStore } from "@/src/store/productStore"
import { Category } from "@/src/types"

// ==========================================
// Responsive Layout Utilities
// ==========================================

const getDeviceType = (width: number): "phone" | "tablet" | "largeTablet" => {
  if (width >= 1024) return "largeTablet"
  if (width >= 768) return "tablet"
  return "phone"
}

const getGridConfig = (width: number) => {
  const deviceType = getDeviceType(width)

  switch (deviceType) {
    case "largeTablet":
      return {
        numColumns: 6,
        gridPadding: 24,
        gridGap: 16,
        maxItemWidth: 160,
      }
    case "tablet":
      return {
        numColumns: 4,
        gridPadding: 20,
        gridGap: 14,
        maxItemWidth: 180,
      }
    default:
      return {
        numColumns: 3,
        gridPadding: 16,
        gridGap: 12,
        maxItemWidth: 200,
      }
  }
}

const getQuickAccessLayout = (width: number): "vertical" | "horizontal" => {
  return width >= 768 ? "horizontal" : "vertical"
}

// ==========================================
// Component
// ==========================================

export default function ProductsScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { fetchCategories, categories, categoriesLoading, setCategory } =
    useProductsStore()

  // Track screen dimensions for responsive layout
  const [dimensions, setDimensions] = useState(() => Dimensions.get("window"))

  useEffect(() => {
    const subscription = Dimensions.addEventListener(
      "change",
      ({ window }: { window: ScaledSize }) => {
        setDimensions(window)
      }
    )

    return () => subscription?.remove()
  }, [])

  // Calculate responsive values
  const gridConfig = getGridConfig(dimensions.width)
  const quickAccessLayout = getQuickAccessLayout(dimensions.width)
  const deviceType = getDeviceType(dimensions.width)

  const itemWidth =
    (dimensions.width -
      gridConfig.gridPadding * 2 -
      gridConfig.gridGap * (gridConfig.numColumns - 1)) /
    gridConfig.numColumns

  // Clamp item width to max
  const finalItemWidth = Math.min(itemWidth, gridConfig.maxItemWidth)

  useEffect(() => {
    if (!categories || categories.length === 0) {
      fetchCategories()
    }
  }, [fetchCategories, categories])

  const navigateToCategory = useCallback(
    (categoryName: string) => {
      setCategory(categoryName)
      router.push({
        pathname: "/shop",
        params: { category: categoryName },
      })
    },
    [router, setCategory]
  )

  const navigateToPurchasedBefore = useCallback(() => {
    router.push("/(tabs)/products/purchased-before")
  }, [router])

  const navigateToWeeklySale = useCallback(() => {
    router.push("/(tabs)/home/weekly-sale")
  }, [router])

  // Render category grid item
  const renderCategoryItem = useCallback(
    ({ item, index }: { item: Category; index: number }) => {
      const isFirstInRow = index % gridConfig.numColumns === 0
      const isLastInRow =
        index % gridConfig.numColumns === gridConfig.numColumns - 1

      // Calculate image size (proportional to item width)
      const imageSize = finalItemWidth * 0.7

      return (
        <TouchableOpacity
          onPress={() => navigateToCategory(item.name)}
          style={[
            styles.categoryItem,
            {
              width: finalItemWidth,
              marginLeft: isFirstInRow ? 0 : gridConfig.gridGap / 2,
              marginRight: isLastInRow ? 0 : gridConfig.gridGap / 2,
              paddingVertical: deviceType === "phone" ? 12 : 16,
            },
          ]}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.categoryImageContainer,
              {
                width: imageSize,
                height: imageSize,
                borderRadius: imageSize / 2,
              },
            ]}
          >
            {item.cover ? (
              <Image
                source={{ uri: item.cover.url }}
                style={styles.categoryImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.categoryPlaceholder}>
                <FontAwesome5
                  name="box-open"
                  size={deviceType === "phone" ? 28 : 36}
                  color={AppColors.gray[400]}
                />
              </View>
            )}
          </View>
          <Text
            style={[
              styles.categoryName,
              {
                fontSize: deviceType === "phone" ? 12 : 14,
                height: deviceType === "phone" ? 32 : 40,
                lineHeight: deviceType === "phone" ? 16 : 20,
              },
            ]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      )
    },
    [navigateToCategory, gridConfig, finalItemWidth, deviceType]
  )

  const keyExtractor = useCallback((item: Category) => item.id.toString(), [])

  // Header component with quick access items
  const ListHeader = useCallback(() => {
    const isHorizontal = quickAccessLayout === "horizontal"

    return (
      <View style={styles.headerContainer}>
        {/* Quick Access Section */}
        <View
          style={[
            styles.quickAccessSection,
            isHorizontal && styles.quickAccessSectionHorizontal,
            { paddingHorizontal: gridConfig.gridPadding },
          ]}
        >
          <View
            style={[
              styles.quickAccessInner,
              isHorizontal && styles.quickAccessInnerHorizontal,
            ]}
          >
            {user?.id && (
              <TouchableOpacity
                onPress={navigateToPurchasedBefore}
                style={[
                  styles.quickAccessItem,
                  isHorizontal && styles.quickAccessItemHorizontal,
                ]}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.quickAccessIconContainer,
                    deviceType !== "phone" &&
                      styles.quickAccessIconContainerLarge,
                  ]}
                >
                  <Ionicons
                    name="receipt"
                    size={deviceType === "phone" ? 24 : 28}
                    color={AppColors.primary[500]}
                  />
                </View>
                <View style={styles.quickAccessContent}>
                  <Text
                    style={[
                      styles.quickAccessTitle,
                      deviceType !== "phone" && styles.quickAccessTitleLarge,
                    ]}
                  >
                    Purchased before
                  </Text>
                  <Text
                    style={[
                      styles.quickAccessSubtitle,
                      deviceType !== "phone" && styles.quickAccessSubtitleLarge,
                    ]}
                  >
                    Reorder your favorites
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={AppColors.gray[400]}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={navigateToWeeklySale}
              style={[
                styles.quickAccessItem,
                styles.saleItem,
                isHorizontal && styles.quickAccessItemHorizontal,
                !isHorizontal && { marginBottom: 0 },
              ]}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.quickAccessIconContainer,
                  styles.saleIconContainer,
                  deviceType !== "phone" &&
                    styles.quickAccessIconContainerLarge,
                ]}
              >
                <Ionicons
                  name="pricetag"
                  size={deviceType === "phone" ? 24 : 28}
                  color="#fff"
                />
              </View>
              <View style={styles.quickAccessContent}>
                <Text
                  style={[
                    styles.quickAccessTitle,
                    deviceType !== "phone" && styles.quickAccessTitleLarge,
                  ]}
                >
                  Weekly Sale
                </Text>
                <Text
                  style={[
                    styles.quickAccessSubtitle,
                    deviceType !== "phone" && styles.quickAccessSubtitleLarge,
                  ]}
                >
                  Don't miss the deals
                </Text>
              </View>
              <View style={styles.saleBadge}>
                <Text style={styles.saleBadgeText}>HOT</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={AppColors.gray[400]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories Section Header */}
        <View
          style={[
            styles.sectionHeader,
            { paddingHorizontal: gridConfig.gridPadding },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              deviceType !== "phone" && styles.sectionTitleLarge,
            ]}
          >
            Shop by Category
          </Text>
          <Text
            style={[
              styles.sectionSubtitle,
              deviceType !== "phone" && styles.sectionSubtitleLarge,
            ]}
          >
            {categories?.length || 0} categories
          </Text>
        </View>
      </View>
    )
  }, [
    user?.id,
    navigateToPurchasedBefore,
    navigateToWeeklySale,
    categories?.length,
    quickAccessLayout,
    gridConfig,
    deviceType,
  ])

  // Empty state for categories
  const ListEmpty = useCallback(() => {
    if (categoriesLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={AppColors.primary[500]} />
          <Text style={styles.emptyText}>Loading categories...</Text>
        </View>
      )
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="grid-outline" size={48} color={AppColors.gray[400]} />
        <Text style={styles.emptyText}>No categories available</Text>
      </View>
    )
  }, [categoriesLoading])

  if (categoriesLoading && (!categories || categories.length === 0)) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary[500]} />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </SafeAreaView>
    )
  }

  return (
    <Wrapper style={styles.container}>
      <FlatList
        key={`grid-${gridConfig.numColumns}`} // Force re-render on column change
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={keyExtractor}
        numColumns={gridConfig.numColumns}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: deviceType === "phone" ? 24 : 40 },
        ]}
        columnWrapperStyle={[
          styles.columnWrapper,
          {
            paddingHorizontal: gridConfig.gridPadding,
            marginBottom: gridConfig.gridGap,
          },
        ]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={15}
        initialNumToRender={18}
      />
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.primary,
    borderTopWidth: 0.5,
    borderTopColor: AppColors.gray[200],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.background.primary,
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
    marginTop: 12,
  },
  listContent: {},
  columnWrapper: {
    justifyContent: "flex-start",
  },

  // Header Section
  headerContainer: {
    marginBottom: 8,
  },
  quickAccessSection: {
    backgroundColor: AppColors.background.secondary,
    paddingVertical: 14,
    marginBottom: 16,
  },
  quickAccessSectionHorizontal: {
    paddingVertical: 16,
  },
  quickAccessInner: {},
  quickAccessInnerHorizontal: {
    flexDirection: "row",
    gap: 12,
  },
  quickAccessItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.primary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  quickAccessItemHorizontal: {
    flex: 1,
    marginBottom: 0,
  },
  saleItem: {
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  quickAccessIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  quickAccessIconContainerLarge: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  saleIconContainer: {
    backgroundColor: AppColors.primary[500],
  },
  quickAccessContent: {
    flex: 1,
  },
  quickAccessTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: AppColors.text.primary,
    marginBottom: 2,
  },
  quickAccessTitleLarge: {
    fontSize: 16,
  },
  quickAccessSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: AppColors.text.tertiary,
  },
  quickAccessSubtitleLarge: {
    fontSize: 13,
  },
  saleBadge: {
    backgroundColor: AppColors.error,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 8,
  },
  saleBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 10,
    color: "#fff",
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 14,
    backgroundColor: AppColors.background.primary,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: AppColors.text.primary,
  },
  sectionTitleLarge: {
    fontSize: 20,
  },
  sectionSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.tertiary,
  },
  sectionSubtitleLarge: {
    fontSize: 14,
  },

  // Category Grid Items
  categoryItem: {
    alignItems: "center",
    backgroundColor: AppColors.background.primary,
    borderRadius: 12,
    paddingHorizontal: 4,
  },
  categoryImageContainer: {
    overflow: "hidden",
    backgroundColor: AppColors.gray[50],
    marginBottom: 10,
    borderWidth: 2,
    borderColor: AppColors.gray[100],
  },
  categoryImage: {
    width: "100%",
    height: "100%",
  },
  categoryPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.gray[100],
  },
  categoryName: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
    textAlign: "center",
    textTransform: "capitalize",
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
    marginTop: 12,
  },
})
