import { FontAwesome5, Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import React, { memo, useCallback, useEffect, useMemo, useState } from "react"
import {
  Dimensions,
  FlatList,
  RefreshControl,
  ScaledSize,
  StyleSheet,
  Text,
  View,
} from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated"

import Wrapper from "@/src/components/common/Wrapper"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
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
      return { numColumns: 6, gridPadding: 24, gridGap: 16, maxItemWidth: 160 }
    case "tablet":
      return { numColumns: 4, gridPadding: 20, gridGap: 14, maxItemWidth: 180 }
    default:
      return { numColumns: 3, gridPadding: 16, gridGap: 12, maxItemWidth: 200 }
  }
}

const getQuickAccessLayout = (width: number): "vertical" | "horizontal" => {
  return width >= 768 ? "horizontal" : "vertical"
}

// ==========================================
// Memoized Skeleton Components
// ==========================================

const SkeletonPulse = memo(({ style }: { style?: any }) => {
  const opacity = useSharedValue(0.3)

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 800 }), -1, true)
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[
        { backgroundColor: AppColors.gray[200], borderRadius: 8 },
        style,
        animatedStyle,
      ]}
    />
  )
})

interface CategorySkeletonProps {
  itemWidth: number
  deviceType: "phone" | "tablet" | "largeTablet"
}

const CategorySkeleton = memo(
  ({ itemWidth, deviceType }: CategorySkeletonProps) => {
    const imageSize = itemWidth * 0.7

    return (
      <View
        style={[
          styles.categoryItem,
          {
            width: itemWidth,
            paddingVertical: deviceType === "phone" ? 12 : 16,
          },
        ]}
      >
        <SkeletonPulse
          style={{
            width: imageSize,
            height: imageSize,
            borderRadius: imageSize / 2,
            marginBottom: 10,
          }}
        />
        <SkeletonPulse
          style={{
            width: itemWidth * 0.8,
            height: deviceType === "phone" ? 14 : 16,
            marginBottom: 4,
          }}
        />
        <SkeletonPulse
          style={{
            width: itemWidth * 0.5,
            height: deviceType === "phone" ? 12 : 14,
          }}
        />
      </View>
    )
  }
)

interface QuickAccessSkeletonProps {
  isHorizontal: boolean
  deviceType: "phone" | "tablet" | "largeTablet"
}

const QuickAccessSkeleton = memo(
  ({ isHorizontal, deviceType }: QuickAccessSkeletonProps) => {
    const iconSize = deviceType === "phone" ? 44 : 52

    const SkeletonItem = () => (
      <View
        style={[
          styles.quickAccessItem,
          isHorizontal && styles.quickAccessItemHorizontal,
          !isHorizontal && { marginBottom: 10 },
        ]}
      >
        <SkeletonPulse
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: 12,
            marginRight: 14,
          }}
        />
        <View style={styles.quickAccessContent}>
          <SkeletonPulse
            style={{
              width: 120,
              height: deviceType === "phone" ? 16 : 18,
              marginBottom: 6,
            }}
          />
          <SkeletonPulse
            style={{
              width: 100,
              height: deviceType === "phone" ? 12 : 14,
            }}
          />
        </View>
      </View>
    )

    return (
      <View
        style={[
          styles.quickAccessInner,
          isHorizontal && styles.quickAccessInnerHorizontal,
        ]}
      >
        <SkeletonItem />
        <SkeletonItem />
      </View>
    )
  }
)

// ==========================================
// Memoized Category Item Component
// ==========================================

interface CategoryItemProps {
  item: Category
  index: number
  numColumns: number
  gridGap: number
  itemWidth: number
  deviceType: "phone" | "tablet" | "largeTablet"
  onPress: (name: string) => void
}

const CategoryItem = memo(
  ({
    item,
    index,
    numColumns,
    gridGap,
    itemWidth,
    deviceType,
    onPress,
  }: CategoryItemProps) => {
    const isFirstInRow = index % numColumns === 0
    const isLastInRow = index % numColumns === numColumns - 1
    const imageSize = itemWidth * 0.7

    const handlePress = useCallback(() => {
      onPress(item.name)
    }, [onPress, item.name])

    return (
      <DebouncedTouchable
        onPress={handlePress}
        style={[
          styles.categoryItem,
          {
            width: itemWidth,
            marginLeft: isFirstInRow ? 0 : gridGap / 2,
            marginRight: isLastInRow ? 0 : gridGap / 2,
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
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              recyclingKey={`category-${item.id}`}
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
      </DebouncedTouchable>
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.name === nextProps.item.name &&
      prevProps.item.cover?.url === nextProps.item.cover?.url &&
      prevProps.index === nextProps.index &&
      prevProps.numColumns === nextProps.numColumns &&
      prevProps.itemWidth === nextProps.itemWidth
    )
  }
)

// ==========================================
// Memoized Quick Access Section
// ==========================================

interface QuickAccessSectionProps {
  userId: string | number | undefined
  isHorizontal: boolean
  deviceType: "phone" | "tablet" | "largeTablet"
  gridPadding: number
  onPurchasedBefore: () => void
  onWeeklySale: () => void
}

const QuickAccessSection = memo(
  ({
    userId,
    isHorizontal,
    deviceType,
    gridPadding,
    onPurchasedBefore,
    onWeeklySale,
  }: QuickAccessSectionProps) => (
    <View
      style={[
        styles.quickAccessSection,
        isHorizontal && styles.quickAccessSectionHorizontal,
        { paddingHorizontal: gridPadding },
      ]}
    >
      <View
        style={[
          styles.quickAccessInner,
          isHorizontal && styles.quickAccessInnerHorizontal,
        ]}
      >
        {userId && (
          <DebouncedTouchable
            onPress={onPurchasedBefore}
            style={[
              styles.quickAccessItem,
              isHorizontal && styles.quickAccessItemHorizontal,
            ]}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.quickAccessIconContainer,
                deviceType !== "phone" && styles.quickAccessIconContainerLarge,
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
          </DebouncedTouchable>
        )}

        <DebouncedTouchable
          onPress={onWeeklySale}
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
              deviceType !== "phone" && styles.quickAccessIconContainerLarge,
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
        </DebouncedTouchable>
      </View>
    </View>
  )
)

interface SkeletonScreenProps {
  gridConfig: ReturnType<typeof getGridConfig>
  quickAccessLayout: "vertical" | "horizontal"
  deviceType: "phone" | "tablet" | "largeTablet"
  itemWidth: number
}

const SkeletonScreen = memo(
  ({
    gridConfig,
    quickAccessLayout,
    deviceType,
    itemWidth,
  }: SkeletonScreenProps) => {
    const isHorizontal = quickAccessLayout === "horizontal"
    const skeletonCount = gridConfig.numColumns * 3

    return (
      <Wrapper style={styles.container}>
        <View style={styles.headerContainer}>
          {/* Quick Access Skeleton */}
          <View
            style={[
              styles.quickAccessSection,
              isHorizontal && styles.quickAccessSectionHorizontal,
              { paddingHorizontal: gridConfig.gridPadding },
            ]}
          >
            <QuickAccessSkeleton
              isHorizontal={isHorizontal}
              deviceType={deviceType}
            />
          </View>

          {/* Section Header Skeleton */}
          <View
            style={[
              styles.sectionHeader,
              { paddingHorizontal: gridConfig.gridPadding },
            ]}
          >
            <SkeletonPulse
              style={{
                width: 150,
                height: deviceType === "phone" ? 20 : 24,
              }}
            />
            <SkeletonPulse
              style={{
                width: 80,
                height: deviceType === "phone" ? 14 : 16,
              }}
            />
          </View>

          {/* Category Grid Skeleton */}
          <View style={{ paddingHorizontal: gridConfig.gridPadding }}>
            <View style={styles.skeletonGridContainer}>
              {Array.from({ length: skeletonCount }).map((_, index) => {
                const isFirstInRow = index % gridConfig.numColumns === 0
                const isLastInRow =
                  index % gridConfig.numColumns === gridConfig.numColumns - 1

                return (
                  <View
                    key={index}
                    style={{
                      marginLeft: isFirstInRow ? 0 : gridConfig.gridGap / 2,
                      marginRight: isLastInRow ? 0 : gridConfig.gridGap / 2,
                      marginBottom: gridConfig.gridGap,
                    }}
                  >
                    <CategorySkeleton
                      itemWidth={itemWidth}
                      deviceType={deviceType}
                    />
                  </View>
                )
              })}
            </View>
          </View>
        </View>
      </Wrapper>
    )
  }
)

// ==========================================
// Main Component
// ==========================================

export default function ProductsScreen() {
  const router = useRouter()

  // Use individual selectors
  const user = useAuthStore((state) => state.user)
  const fetchCategories = useProductsStore((state) => state.fetchCategories)
  const categories = useProductsStore((state) => state.categories)
  const categoriesLoading = useProductsStore((state) => state.categoriesLoading)
  const setCategory = useProductsStore((state) => state.setCategory)

  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
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

  // Memoize computed values
  const gridConfig = useMemo(
    () => getGridConfig(dimensions.width),
    [dimensions.width]
  )
  const quickAccessLayout = useMemo(
    () => getQuickAccessLayout(dimensions.width),
    [dimensions.width]
  )
  const deviceType = useMemo(
    () => getDeviceType(dimensions.width),
    [dimensions.width]
  )

  const itemWidth = useMemo(() => {
    const calculated =
      (dimensions.width -
        gridConfig.gridPadding * 2 -
        gridConfig.gridGap * (gridConfig.numColumns - 1)) /
      gridConfig.numColumns
    return Math.min(calculated, gridConfig.maxItemWidth)
  }, [dimensions.width, gridConfig])

  // Fetch once on mount
  useEffect(() => {
    const loadCategories = async () => {
      // If categories already exist, skip showing skeleton
      if (categories?.length > 0) {
        setIsInitialLoad(false)
        return
      }

      await fetchCategories()
      setIsInitialLoad(false)
    }
    loadCategories()
  }, [fetchCategories, categories?.length])

  // Memoize handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await fetchCategories()
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchCategories])

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

  // Memoize renderItem
  const renderCategoryItem = useCallback(
    ({ item, index }: { item: Category; index: number }) => (
      <CategoryItem
        item={item}
        index={index}
        numColumns={gridConfig.numColumns}
        gridGap={gridConfig.gridGap}
        itemWidth={itemWidth}
        deviceType={deviceType}
        onPress={navigateToCategory}
      />
    ),
    [
      gridConfig.numColumns,
      gridConfig.gridGap,
      itemWidth,
      deviceType,
      navigateToCategory,
    ]
  )

  const keyExtractor = useCallback((item: Category) => item.id.toString(), [])

  const ListHeader = useMemo(() => {
    const isHorizontal = quickAccessLayout === "horizontal"

    return (
      <View style={styles.headerContainer}>
        {/* Quick Access Section */}
        <QuickAccessSection
          userId={user?.id}
          isHorizontal={isHorizontal}
          deviceType={deviceType}
          gridPadding={gridConfig.gridPadding}
          onPurchasedBefore={navigateToPurchasedBefore}
          onWeeklySale={navigateToWeeklySale}
        />

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
    categories?.length,
    quickAccessLayout,
    gridConfig,
    deviceType,
    navigateToPurchasedBefore,
    navigateToWeeklySale,
  ])

  const ListEmpty = useMemo(() => {
    // Don't show empty state while loading
    if (categoriesLoading) return null

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="grid-outline" size={48} color={AppColors.gray[400]} />
        </View>
        <Text style={styles.emptyTitle}>No Categories Available</Text>
        <Text style={styles.emptySubtitle}>
          Check back later for our product categories
        </Text>
        <DebouncedTouchable
          style={styles.retryButton}
          onPress={handleRefresh}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.retryButtonText}>Refresh</Text>
        </DebouncedTouchable>
      </View>
    )
  }, [categoriesLoading, handleRefresh])

  const showSkeleton = isInitialLoad && categoriesLoading && !categories?.length

  if (showSkeleton) {
    return (
      <SkeletonScreen
        gridConfig={gridConfig}
        quickAccessLayout={quickAccessLayout}
        deviceType={deviceType}
        itemWidth={itemWidth}
      />
    )
  }

  return (
    <Wrapper style={styles.container}>
      <FlatList
        key={`grid-${gridConfig.numColumns}`}
        data={categoriesLoading ? [] : categories}
        renderItem={renderCategoryItem}
        keyExtractor={keyExtractor}
        numColumns={gridConfig.numColumns}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: deviceType === "phone" ? 24 : 40 },
          !categories?.length && !categoriesLoading && styles.listContentEmpty,
        ]}
        columnWrapperStyle={
          categories?.length
            ? [
                styles.columnWrapper,
                {
                  paddingHorizontal: gridConfig.gridPadding,
                  marginBottom: gridConfig.gridGap,
                },
              ]
            : undefined
        }
        showsVerticalScrollIndicator={false}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={12}
        initialNumToRender={15}
        windowSize={5}
        updateCellsBatchingPeriod={50}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[AppColors.primary[500]]}
            tintColor={AppColors.primary[500]}
          />
        }
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
  listContent: {},
  listContentEmpty: {
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: "flex-start",
  },
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
  skeletonGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.gray[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: AppColors.text.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.primary[500],
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 8,
  },
  retryButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
})
