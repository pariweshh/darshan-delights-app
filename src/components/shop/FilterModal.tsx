import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { Brand } from "@/src/types"
import { AntDesign } from "@expo/vector-icons"
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"

interface FilterModalProps {
  visible: boolean
  onClose: () => void
  brands: Brand[]
  selectedBrands: any[]
  activeSortOption: string | null
  onBrandToggle: (brand: any) => void
  onSortChange: (sort: string) => void
  onReset: () => void
  productCount: number
}

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Newest First" },
  { value: "rrp:asc", label: "Price: Low to High" },
  { value: "rrp:desc", label: "Price: High to Low" },
  { value: "name:asc", label: "Name: A to Z" },
]

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  brands,
  selectedBrands,
  activeSortOption,
  onBrandToggle,
  onSortChange,
  onReset,
  productCount,
}) => {
  const { config, isTablet, isLandscape, width, height } = useResponsive()

  const isFilterActive = selectedBrands.length > 0 || activeSortOption !== null

  const isBrandSelected = (brandId: string | number) => {
    return selectedBrands.some((b) => b.id.toString() === brandId.toString())
  }

  // Modal sizing for tablet
  const modalMaxWidth = isTablet ? (isLandscape ? 500 : 450) : undefined
  const modalMaxHeight = isTablet ? height * 0.8 : "85%"

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.content,
            {
              maxHeight: modalMaxHeight,
              maxWidth: modalMaxWidth,
              width: modalMaxWidth ? "100%" : undefined,
              alignSelf: modalMaxWidth ? "center" : undefined,
              padding: isTablet ? 24 : 20,
              borderTopLeftRadius: isTablet ? 24 : 20,
              borderTopRightRadius: isTablet ? 24 : 20,
              // For tablet, also round bottom corners
              ...(isTablet && {
                borderBottomLeftRadius: 24,
                borderBottomRightRadius: 24,
                marginBottom: 40,
              }),
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              {
                marginBottom: isTablet ? 24 : 20,
                paddingBottom: isTablet ? 20 : 16,
              },
            ]}
          >
            <Text style={[styles.title, { fontSize: config.titleFontSize }]}>
              Filter & Sort
            </Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <AntDesign
                name="close"
                size={config.iconSizeLarge}
                color={AppColors.text.primary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Brand Filters */}
            {brands && brands.length > 0 && (
              <View
                style={[
                  styles.section,
                  { marginBottom: config.sectionSpacing },
                ]}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      fontSize: config.subtitleFontSize,
                      marginBottom: config.gap,
                    },
                  ]}
                >
                  Brands
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[
                    styles.brandsContainer,
                    { gap: config.gapSmall },
                  ]}
                >
                  {brands.map((brand) => (
                    <TouchableOpacity
                      key={brand.id}
                      style={[
                        styles.brandChip,
                        isBrandSelected(brand.id) && styles.brandChipSelected,
                        {
                          paddingHorizontal: isTablet ? 18 : 14,
                          paddingVertical: isTablet ? 10 : 8,
                          borderRadius: isTablet ? 24 : 20,
                        },
                      ]}
                      onPress={() =>
                        onBrandToggle({
                          id: brand.id.toString(),
                          name: brand.name,
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.brandChipText,
                          isBrandSelected(brand.id) &&
                            styles.brandChipTextSelected,
                          { fontSize: config.bodyFontSize },
                        ]}
                      >
                        {brand.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Sort Options */}
            <View
              style={[styles.section, { marginBottom: config.sectionSpacing }]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    fontSize: config.subtitleFontSize,
                    marginBottom: config.gap,
                  },
                ]}
              >
                Sort By
              </Text>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    activeSortOption === option.value &&
                      styles.sortOptionActive,
                    {
                      padding: isTablet ? 16 : 14,
                      borderRadius: isTablet ? 10 : 8,
                    },
                  ]}
                  onPress={() => onSortChange(option.value)}
                  activeOpacity={0.7}
                >
                  {activeSortOption === option.value && (
                    <AntDesign
                      name="check"
                      size={config.iconSizeSmall}
                      color={AppColors.primary[500]}
                    />
                  )}
                  <Text
                    style={[
                      styles.sortOptionText,
                      activeSortOption === option.value &&
                        styles.sortOptionTextActive,
                      { fontSize: config.subtitleFontSize },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Applied Filters */}
            {isFilterActive && (
              <View
                style={[
                  styles.section,
                  { marginBottom: config.sectionSpacing },
                ]}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      fontSize: config.subtitleFontSize,
                      marginBottom: config.gap,
                    },
                  ]}
                >
                  Applied Filters
                </Text>
                <View style={[styles.appliedFilters, { gap: config.gapSmall }]}>
                  {selectedBrands.map((brand) => (
                    <View
                      key={brand.id}
                      style={[
                        styles.appliedChip,
                        {
                          paddingHorizontal: isTablet ? 14 : 12,
                          paddingVertical: isTablet ? 8 : 6,
                          borderRadius: isTablet ? 18 : 16,
                          gap: config.gapSmall,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.appliedChipText,
                          { fontSize: config.smallFontSize },
                        ]}
                      >
                        {brand.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => onBrandToggle(brand)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <AntDesign
                          name="close"
                          size={config.iconSizeSmall - 2}
                          color={AppColors.text.secondary}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {activeSortOption && (
                    <View
                      style={[
                        styles.appliedChip,
                        {
                          paddingHorizontal: isTablet ? 14 : 12,
                          paddingVertical: isTablet ? 8 : 6,
                          borderRadius: isTablet ? 18 : 16,
                          gap: config.gapSmall,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.appliedChipText,
                          { fontSize: config.smallFontSize },
                        ]}
                      >
                        {SORT_OPTIONS.find((o) => o.value === activeSortOption)
                          ?.label || "Sorted"}
                      </Text>
                      <TouchableOpacity
                        onPress={() => onSortChange("")}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <AntDesign
                          name="close"
                          size={config.iconSizeSmall - 2}
                          color={AppColors.text.secondary}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Reset Button */}
            {isFilterActive && (
              <TouchableOpacity
                style={[
                  styles.resetButton,
                  {
                    padding: isTablet ? 16 : 14,
                    borderRadius: isTablet ? 10 : 8,
                    marginBottom: config.gap,
                  },
                ]}
                onPress={onReset}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.resetButtonText,
                    { fontSize: config.bodyFontSize },
                  ]}
                >
                  Reset All Filters
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Apply Button */}
          <TouchableOpacity
            style={[
              styles.applyButton,
              {
                padding: isTablet ? 18 : 16,
                borderRadius: isTablet ? 14 : 12,
                marginTop: config.gapSmall,
              },
            ]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.applyButtonText,
                { fontSize: config.subtitleFontSize },
              ]}
            >
              Apply Filters
              {productCount > 0 ? ` (${productCount} products)` : ""}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

export default FilterModal

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: AppColors.background.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  section: {},
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  brandsContainer: {},
  brandChip: {
    backgroundColor: AppColors.background.secondary,
    borderWidth: 1,
    borderColor: AppColors.gray[300],
  },
  brandChipSelected: {
    backgroundColor: AppColors.primary[100],
    borderColor: AppColors.primary[500],
  },
  brandChipText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.primary,
    textTransform: "capitalize",
  },
  brandChipTextSelected: {
    color: AppColors.primary[700],
    fontFamily: "Poppins_600SemiBold",
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sortOptionActive: {
    backgroundColor: AppColors.primary[50],
  },
  sortOptionText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
  },
  sortOptionTextActive: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.primary[600],
  },
  appliedFilters: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  appliedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.primary[100],
  },
  appliedChipText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[700],
    textTransform: "capitalize",
  },
  resetButton: {
    borderWidth: 1,
    borderColor: AppColors.error,
    alignItems: "center",
  },
  resetButtonText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.error,
  },
  applyButton: {
    backgroundColor: AppColors.primary[500],
    alignItems: "center",
  },
  applyButtonText: {
    fontFamily: "Poppins_600SemiBold",
    color: "white",
  },
})
