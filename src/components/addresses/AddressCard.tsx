import { Ionicons } from "@expo/vector-icons"
import React, { useState } from "react"
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native"

import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { Address } from "@/src/types/address"
import DebouncedTouchable from "../ui/DebouncedTouchable"

interface Props {
  address: Address
  onEdit: (address: Address) => void
  onDelete: (addressId: number) => Promise<void>
  onSetDefault: (addressId: number) => Promise<void>
}

const AddressCard: React.FC<Props> = ({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}) => {
  const { config, isTablet } = useResponsive()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSettingDefault, setIsSettingDefault] = useState(false)

  const getLabelIcon = (label?: string): keyof typeof Ionicons.glyphMap => {
    switch (label?.toLowerCase()) {
      case "home":
        return "home-outline"
      case "work":
        return "briefcase-outline"
      case "office":
        return "business-outline"
      default:
        return "location-outline"
    }
  }

  const handleDelete = () => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true)
            try {
              await onDelete(address.id)
            } finally {
              setIsDeleting(false)
            }
          },
        },
      ]
    )
  }

  const handleSetDefault = async () => {
    if (address.is_default) return

    setIsSettingDefault(true)
    try {
      await onSetDefault(address.id)
    } finally {
      setIsSettingDefault(false)
    }
  }

  const formatAddress = (): string => {
    const parts = [
      address.line1,
      address.line2,
      address.city,
      `${address.state} ${address.postal_code}`,
    ].filter(Boolean)

    return parts.join(", ")
  }

  // Responsive sizes
  const labelIconContainerSize = isTablet ? 36 : 32
  const labelIconSize = isTablet ? 20 : 18
  const actionButtonSize = isTablet ? 40 : 36
  const actionIconSize = isTablet ? 20 : 18

  return (
    <View
      style={[
        styles.container,
        {
          padding: isTablet ? 18 : 16,
          borderRadius: config.cardBorderRadius + 4,
          marginBottom: isTablet ? 14 : 12,
        },
        address.is_default && styles.containerDefault,
      ]}
    >
      {/* Default Badge */}
      {address.is_default && (
        <View style={[styles.defaultBadge, { right: isTablet ? 18 : 16 }]}>
          <Text
            style={[styles.defaultBadgeText, { fontSize: isTablet ? 11 : 10 }]}
          >
            Default
          </Text>
        </View>
      )}

      {/* Header */}
      <View style={[styles.header, { marginBottom: isTablet ? 14 : 12 }]}>
        <View style={styles.labelContainer}>
          <View
            style={[
              styles.labelIcon,
              {
                width: labelIconContainerSize,
                height: labelIconContainerSize,
                borderRadius: isTablet ? 10 : 8,
                marginRight: isTablet ? 12 : 10,
              },
            ]}
          >
            <Ionicons
              name={getLabelIcon(address.label)}
              size={labelIconSize}
              color={AppColors.primary[600]}
            />
          </View>
          <Text style={[styles.label, { fontSize: isTablet ? 17 : 16 }]}>
            {address.label || "Address"}
          </Text>
          {address.type !== "both" && (
            <View
              style={[
                styles.typeBadge,
                {
                  paddingHorizontal: isTablet ? 10 : 8,
                  paddingVertical: isTablet ? 3 : 2,
                  marginLeft: isTablet ? 10 : 8,
                },
              ]}
            >
              <Text
                style={[styles.typeBadgeText, { fontSize: isTablet ? 11 : 10 }]}
              >
                {address.type === "shipping" ? "Shipping" : "Billing"}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={[styles.actions, { gap: isTablet ? 6 : 4 }]}>
          <DebouncedTouchable
            style={[
              styles.actionButton,
              {
                width: actionButtonSize,
                height: actionButtonSize,
                borderRadius: isTablet ? 10 : 8,
              },
            ]}
            onPress={() => onEdit(address)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="pencil-outline"
              size={actionIconSize}
              color={AppColors.primary[600]}
            />
          </DebouncedTouchable>

          <DebouncedTouchable
            style={[
              styles.actionButton,
              {
                width: actionButtonSize,
                height: actionButtonSize,
                borderRadius: isTablet ? 10 : 8,
              },
            ]}
            onPress={handleDelete}
            disabled={isDeleting}
            activeOpacity={0.7}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={AppColors.error} />
            ) : (
              <Ionicons
                name="trash-outline"
                size={actionIconSize}
                color={AppColors.error}
              />
            )}
          </DebouncedTouchable>
        </View>
      </View>

      {/* Contact Info */}
      <View style={[styles.contactInfo, { marginBottom: isTablet ? 10 : 8 }]}>
        <Text style={[styles.name, { fontSize: isTablet ? 16 : 15 }]}>
          {address.full_name}
        </Text>
        <Text
          style={[
            styles.phone,
            { fontSize: config.bodyFontSize - 1, marginTop: isTablet ? 4 : 2 },
          ]}
        >
          {address.phone}
        </Text>
      </View>

      {/* Address */}
      <Text
        style={[
          styles.address,
          {
            fontSize: config.bodyFontSize,
            lineHeight: config.bodyFontSize * 1.45,
          },
        ]}
      >
        {formatAddress()}
      </Text>

      {/* Set Default Button */}
      {!address.is_default && (
        <DebouncedTouchable
          style={[
            styles.setDefaultButton,
            {
              marginTop: isTablet ? 16 : 14,
              paddingVertical: isTablet ? 12 : 10,
              gap: isTablet ? 8 : 6,
            },
          ]}
          onPress={handleSetDefault}
          disabled={isSettingDefault}
          activeOpacity={0.7}
        >
          {isSettingDefault ? (
            <ActivityIndicator size="small" color={AppColors.primary[600]} />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={isTablet ? 18 : 16}
                color={AppColors.primary[600]}
              />
              <Text
                style={[
                  styles.setDefaultText,
                  { fontSize: config.bodyFontSize - 1 },
                ]}
              >
                Set as Default
              </Text>
            </>
          )}
        </DebouncedTouchable>
      )}
    </View>
  )
}

export default AddressCard

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },
  containerDefault: {
    borderWidth: 2,
    borderColor: AppColors.primary[500],
  },
  defaultBadge: {
    position: "absolute",
    top: -1,
    backgroundColor: AppColors.primary[500],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  defaultBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    color: "white",
    textTransform: "uppercase",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  labelIcon: {
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  typeBadge: {
    backgroundColor: AppColors.gray[100],
    borderRadius: 4,
  },
  typeBadgeText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.secondary,
    textTransform: "uppercase",
  },
  actions: {
    flexDirection: "row",
  },
  actionButton: {
    backgroundColor: AppColors.gray[50],
    alignItems: "center",
    justifyContent: "center",
  },
  contactInfo: {},
  name: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.text.primary,
  },
  phone: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  address: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  setDefaultButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
  },
  setDefaultText: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[600],
  },
})
