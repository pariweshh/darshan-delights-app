import { AntDesign, EvilIcons, FontAwesome, Ionicons } from "@expo/vector-icons"
import { StyleSheet, Text, View } from "react-native"

import Button from "@/src/components/ui/Button"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"

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
  const { config, isTablet } = useResponsive()

  const iconSize = isTablet ? 80 : 64
  const searchIconSize = isTablet ? 120 : 80

  const getIcon = () => {
    const color = AppColors.gray[400]

    if (icon) {
      return <Ionicons name={icon} size={iconSize} color={color} />
    }

    switch (type) {
      case "cart":
        return <AntDesign name="shopping-cart" size={iconSize} color={color} />
      case "favorites":
        return (
          <FontAwesome name="heart-o" size={iconSize} color={AppColors.error} />
        )
      case "search":
        return <EvilIcons name="search" size={iconSize} color={color} />
      case "orders":
        return <Ionicons name="receipt-outline" size={iconSize} color={color} />
      case "products":
        return <Ionicons name="cube-outline" size={iconSize} color={color} />
      case "initialSearch":
        return null
      default:
        return <Ionicons name="albums-outline" size={iconSize} color={color} />
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
    <View
      style={[
        styles.container,
        {
          padding: config.sectionSpacing,
          minHeight: isTablet ? 400 : 300,
        },
      ]}
    >
      {/* Image for initial search */}
      {type === "initialSearch" && (
        <View
          style={[
            styles.imageContainer,
            { marginBottom: config.sectionSpacing },
          ]}
        >
          <Ionicons
            name="search"
            size={searchIconSize}
            color={AppColors.gray[300]}
          />
        </View>
      )}

      {/* Icon */}
      {type !== "initialSearch" && (
        <View style={[styles.iconContainer, { marginBottom: config.gap }]}>
          {getIcon()}
        </View>
      )}

      {/* Message */}
      <Text style={[styles.message, { fontSize: config.titleFontSize }]}>
        {message || getDefaultMessage()}
      </Text>

      {/* Sub Message */}
      {(subMessage || getDefaultSubMessage()) && (
        <Text
          style={[
            styles.subMessage,
            {
              fontSize: config.bodyFontSize,
              marginTop: config.gapSmall,
              paddingHorizontal: isTablet ? 40 : 20,
              lineHeight: config.bodyFontSize * 1.5,
            },
          ]}
        >
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
    borderTopWidth: 0.5,
    borderTopColor: AppColors.gray[200],
  },
  imageContainer: {
    opacity: 0.8,
  },
  iconContainer: {},
  message: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
    textAlign: "center",
  },
  subMessage: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
    textAlign: "center",
  },
})
