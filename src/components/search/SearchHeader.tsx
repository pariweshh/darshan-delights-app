import AppColors from "@/src/constants/Colors"
import { AntDesign, Ionicons } from "@expo/vector-icons"
import { useRef } from "react"
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

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
  const inputRef = useRef<TextInput>(null)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>

      <View style={styles.searchRow}>
        {/* Search Input */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color={AppColors.gray[400]}
            style={styles.searchIcon}
          />
          <TextInput
            ref={inputRef}
            value={searchQuery}
            onChangeText={onSearchChange}
            onSubmitEditing={onSubmit}
            placeholder="Search products..."
            placeholderTextColor={AppColors.gray[400]}
            style={styles.input}
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
                size={18}
                color={AppColors.gray[400]}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={styles.searchButton}
          onPress={onSubmit}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={22} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default SearchHeader

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.primary,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: AppColors.text.primary,
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: AppColors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: AppColors.primary[500],
    borderRadius: 12,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
})
