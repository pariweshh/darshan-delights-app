import { AntDesign, EvilIcons, FontAwesome, Ionicons } from "@expo/vector-icons"
import { StyleSheet, Text, View } from "react-native"

import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"
import { IsIPAD } from "@/src/themes/app.constants"

type EmptyStateType =
  | "cart"
  | "search"
  | "favorites"
  | "orders"
  | "profile"
  | "products"
  | "initialSearch"

interface EmptyStateProps {
  type?: EmptyStateType
  message?: string
  subMessage?: string
  actionLabel?: string
  onAction?: () => void
  icon?: keyof typeof Ionicons.glyphMap
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  message,
  subMessage,
  actionLabel,
  onAction,
  icon,
}) => {
  const getIcon = () => {
    const size = 64
    const color = AppColors.gray[400]

    if (icon) {
      return <Ionicons name={icon} size={size} color={color} />
    }

    switch (type) {
      case "cart":
        return <AntDesign name="shopping-cart" size={size} color={color} />
      case "favorites":
        return (
          <FontAwesome name="heart-o" size={size} color={AppColors.error} />
        )
      case "search":
        return <EvilIcons name="search" size={size} color={color} />
      case "orders":
        return <Ionicons name="receipt-outline" size={size} color={color} />
      case "products":
        return <Ionicons name="cube-outline" size={size} color={color} />
      case "initialSearch":
        return null
      default:
        return <Ionicons name="albums-outline" size={size} color={color} />
    }
  }

  const getDefaultMessage = () => {
    switch (type) {
      case "cart":
        return "Your cart is empty"
      case "favorites":
        return "No favorites yet"
      case "search":
        return "No results found"
      case "orders":
        return "No orders yet"
      case "products":
        return "No products found"
      case "initialSearch":
        return "Search for products"
      default:
        return "Nothing to see here"
    }
  }

  const getDefaultSubMessage = () => {
    switch (type) {
      case "cart":
        return "Add some products to get started"
      case "favorites":
        return "Tap the heart icon on products to save them here"
      case "search":
        return "Try a different search term"
      case "orders":
        return "Your orders will appear here"
      case "initialSearch":
        return "Find your favorite products"
      default:
        return ""
    }
  }

  return (
    <View style={styles.container}>
      {/* Image for initial search */}
      {type === "initialSearch" && (
        <View style={styles.imageContainer}>
          <Ionicons
            name="search"
            size={IsIPAD ? 120 : 80}
            color={AppColors.gray[300]}
          />
        </View>
      )}

      {/* Icon */}
      {type !== "initialSearch" && (
        <View style={styles.iconContainer}>{getIcon()}</View>
      )}

      {/* Message */}
      <Text style={styles.message}>{message || getDefaultMessage()}</Text>

      {/* Sub Message */}
      {(subMessage || getDefaultSubMessage()) && (
        <Text style={styles.subMessage}>
          {subMessage || getDefaultSubMessage()}
        </Text>
      )}

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          containerStyles="mt-6 px-8"
        />
      )}
    </View>
  )
}

export default EmptyState

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    minHeight: 300,
    borderTopWidth: 0.5,
    borderTopColor: AppColors.gray[200],
  },
  imageContainer: {
    marginBottom: 24,
    opacity: 0.8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  message: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: AppColors.text.primary,
    textAlign: "center",
  },
  subMessage: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
})
