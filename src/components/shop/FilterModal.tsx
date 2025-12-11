import AppColors from "@/src/constants/Colors"
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
  const isFilterActive = selectedBrands.length > 0 || activeSortOption !== null

  const isBrandSelected = (brandId: string | number) => {
    return selectedBrands.some((b) => b.id.toString() === brandId.toString())
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filter & Sort</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <AntDesign
                name="close"
                size={24}
                color={AppColors.text.primary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Brand Filters */}
            {brands && brands.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Brands</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.brandsContainer}
                >
                  {brands.map((brand) => (
                    <TouchableOpacity
                      key={brand.id}
                      style={[
                        styles.brandChip,
                        isBrandSelected(brand.id) && styles.brandChipSelected,
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
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort By</Text>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    activeSortOption === option.value &&
                      styles.sortOptionActive,
                  ]}
                  onPress={() => onSortChange(option.value)}
                  activeOpacity={0.7}
                >
                  {activeSortOption === option.value && (
                    <AntDesign
                      name="check"
                      size={16}
                      color={AppColors.primary[500]}
                    />
                  )}
                  <Text
                    style={[
                      styles.sortOptionText,
                      activeSortOption === option.value &&
                        styles.sortOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Applied Filters */}
            {isFilterActive && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Applied Filters</Text>
                <View style={styles.appliedFilters}>
                  {selectedBrands.map((brand) => (
                    <View key={brand.id} style={styles.appliedChip}>
                      <Text style={styles.appliedChipText}>{brand.name}</Text>
                      <TouchableOpacity
                        onPress={() => onBrandToggle(brand)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <AntDesign
                          name="close"
                          size={14}
                          color={AppColors.text.secondary}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {activeSortOption && (
                    <View style={styles.appliedChip}>
                      <Text style={styles.appliedChipText}>
                        {SORT_OPTIONS.find((o) => o.value === activeSortOption)
                          ?.label || "Sorted"}
                      </Text>
                      <TouchableOpacity
                        onPress={() => onSortChange("")}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <AntDesign
                          name="close"
                          size={14}
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
                style={styles.resetButton}
                onPress={onReset}
                activeOpacity={0.7}
              >
                <Text style={styles.resetButtonText}>Reset All Filters</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Apply Button */}
          <TouchableOpacity
            style={styles.applyButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.applyButtonText}>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: AppColors.text.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.text.primary,
    marginBottom: 12,
  },
  brandsContainer: {
    gap: 8,
  },
  brandChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
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
    fontSize: 14,
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
    padding: 14,
    borderRadius: 8,
    gap: 10,
  },
  sortOptionActive: {
    backgroundColor: AppColors.primary[50],
  },
  sortOptionText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: AppColors.text.primary,
  },
  sortOptionTextActive: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.primary[600],
  },
  appliedFilters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  appliedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.primary[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
  },
  appliedChipText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: AppColors.primary[700],
    textTransform: "capitalize",
  },
  resetButton: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.error,
    alignItems: "center",
    marginBottom: 16,
  },
  resetButtonText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.error,
  },
  applyButton: {
    backgroundColor: AppColors.primary[500],
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  applyButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "white",
  },
})
