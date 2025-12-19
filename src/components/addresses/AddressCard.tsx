import { Ionicons } from "@expo/vector-icons"
import React, { useState } from "react"
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native"

import AppColors from "@/src/constants/Colors"
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

  return (
    <View
      style={[styles.container, address.is_default && styles.containerDefault]}
    >
      {/* Default Badge */}
      {address.is_default && (
        <View style={styles.defaultBadge}>
          <Text style={styles.defaultBadgeText}>Default</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <View style={styles.labelIcon}>
            <Ionicons
              name={getLabelIcon(address.label)}
              size={18}
              color={AppColors.primary[600]}
            />
          </View>
          <Text style={styles.label}>{address.label || "Address"}</Text>
          {address.type !== "both" && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {address.type === "shipping" ? "Shipping" : "Billing"}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <DebouncedTouchable
            style={styles.actionButton}
            onPress={() => onEdit(address)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="pencil-outline"
              size={18}
              color={AppColors.primary[600]}
            />
          </DebouncedTouchable>

          <DebouncedTouchable
            style={styles.actionButton}
            onPress={handleDelete}
            disabled={isDeleting}
            activeOpacity={0.7}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={AppColors.error} />
            ) : (
              <Ionicons
                name="trash-outline"
                size={18}
                color={AppColors.error}
              />
            )}
          </DebouncedTouchable>
        </View>
      </View>

      {/* Contact Info */}
      <View style={styles.contactInfo}>
        <Text style={styles.name}>{address.full_name}</Text>
        <Text style={styles.phone}>{address.phone}</Text>
      </View>

      {/* Address */}
      <Text style={styles.address}>{formatAddress()}</Text>

      {/* Set Default Button */}
      {!address.is_default && (
        <DebouncedTouchable
          style={styles.setDefaultButton}
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
                size={16}
                color={AppColors.primary[600]}
              />
              <Text style={styles.setDefaultText}>Set as Default</Text>
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    right: 16,
    backgroundColor: AppColors.primary[500],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  defaultBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    color: "white",
    textTransform: "uppercase",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  labelIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  label: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.text.primary,
  },
  typeBadge: {
    backgroundColor: AppColors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  typeBadgeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
    color: AppColors.text.secondary,
    textTransform: "uppercase",
  },
  actions: {
    flexDirection: "row",
    gap: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: AppColors.gray[50],
    alignItems: "center",
    justifyContent: "center",
  },
  contactInfo: {
    marginBottom: 8,
  },
  name: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: AppColors.text.primary,
  },
  phone: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    marginTop: 2,
  },
  address: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
    lineHeight: 20,
  },
  setDefaultButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
    gap: 6,
  },
  setDefaultText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.primary[600],
  },
})
