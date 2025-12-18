import { AntDesign, Ionicons } from "@expo/vector-icons"
import { useRef } from "react"
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"

interface SearchHeaderProps {
  searchQuery: string
  onSearchChange: (text: string) => void
  onClear: () => void
  onSubmit: () => void
  autoFocus?: boolean
}

const SearchHeader: React.FC<SearchHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onClear,
  onSubmit,
  autoFocus = true,
}) => {
  const { config, isTablet, isLandscape } = useResponsive()
  const inputRef = useRef<TextInput>(null)

  // Responsive sizes
  const inputHeight = isTablet ? 56 : 50
  const buttonSize = isTablet ? 56 : 50
  const titleSize = isTablet ? 32 : 28
  const inputFontSize = isTablet ? 16 : 15

  // For tablet landscape, constrain the search bar width
  const maxWidth = isTablet && isLandscape ? 600 : undefined

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: config.horizontalPadding,
          paddingBottom: isTablet ? 20 : 16,
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          {
            fontSize: titleSize,
            marginBottom: isTablet ? 20 : 16,
          },
        ]}
      >
        Search
      </Text>

      <View
        style={[
          styles.searchRow,
          {
            gap: isTablet ? 12 : 10,
            maxWidth,
            alignSelf: maxWidth ? "center" : undefined,
            width: maxWidth ? "100%" : undefined,
          },
        ]}
      >
        {/* Search Input */}
        <View
          style={[
            styles.inputContainer,
            {
              borderRadius: isTablet ? 14 : 12,
              paddingHorizontal: isTablet ? 16 : 14,
              height: inputHeight,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={isTablet ? 22 : 20}
            color={AppColors.gray[400]}
            style={[styles.searchIcon, { marginRight: isTablet ? 12 : 10 }]}
          />
          <TextInput
            ref={inputRef}
            value={searchQuery}
            onChangeText={onSearchChange}
            onSubmitEditing={onSubmit}
            placeholder="Search products..."
            placeholderTextColor={AppColors.gray[400]}
            style={[styles.input, { fontSize: inputFontSize }]}
            returnKeyType="search"
            autoFocus={autoFocus}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={onClear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <AntDesign
                name="close-circle"
                size={isTablet ? 20 : 18}
                color={AppColors.gray[400]}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={[
            styles.searchButton,
            {
              borderRadius: isTablet ? 14 : 12,
              width: buttonSize,
              height: buttonSize,
            },
          ]}
          onPress={onSubmit}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={isTablet ? 24 : 22} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default SearchHeader

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  title: {
    fontFamily: "Poppins_700Bold",
    color: AppColors.text.primary,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.secondary,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  searchIcon: {},
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: AppColors.primary[500],
    alignItems: "center",
    justifyContent: "center",
  },
})
