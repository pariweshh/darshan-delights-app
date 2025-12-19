import { Ionicons } from "@expo/vector-icons"
import React, { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"

import { getUserAddresses } from "@/src/api/addresses"
import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"
import { Address } from "@/src/types/address"
import DebouncedTouchable from "../ui/DebouncedTouchable"

interface Props {
  visible: boolean
  onClose: () => void
  onSelect: (address: Address) => void
  onAddNew: () => void
  filterType?: "shipping" | "billing" | "all"
  title?: string
}

const AddressSelector: React.FC<Props> = ({
  visible,
  onClose,
  onSelect,
  onAddNew,
  filterType = "all",
  title = "Select Address",
}) => {
  const { token } = useAuthStore()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  /**
   * Fetch addresses
   */
  const fetchAddresses = useCallback(async () => {
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const data = await getUserAddresses(token)

      // Filter by type if needed
      let filteredAddresses = data
      if (filterType !== "all") {
        filteredAddresses = data.filter(
          (addr) => addr.type === filterType || addr.type === "both"
        )
      }

      setAddresses(filteredAddresses)

      // Pre-select default address
      const defaultAddr = filteredAddresses.find((a) => a.is_default)
      if (defaultAddr) {
        setSelectedId(defaultAddr.id)
      }
    } catch (error) {
      console.error("Error fetching addresses:", error)
    } finally {
      setIsLoading(false)
    }
  }, [token, filterType])

  useEffect(() => {
    if (visible) {
      fetchAddresses()
    }
  }, [visible, fetchAddresses])

  /**
   * Format address for display
   */
  const formatAddress = (address: Address): string => {
    const parts = [
      address.line1,
      address.line2,
      address.city,
      `${address.state} ${address.postal_code}`,
    ].filter(Boolean)

    return parts.join(", ")
  }

  /**
   * Get label icon
   */
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

  /**
   * Handle address selection
   */
  const handleSelect = (address: Address) => {
    setSelectedId(address.id)
  }

  /**
   * Confirm selection
   */
  const handleConfirm = () => {
    const selected = addresses.find((a) => a.id === selectedId)
    if (selected) {
      onSelect(selected)
      onClose()
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <DebouncedTouchable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={AppColors.text.primary} />
            </DebouncedTouchable>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={AppColors.primary[500]} />
              <Text style={styles.loadingText}>Loading addresses...</Text>
            </View>
          ) : addresses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="location-outline"
                size={48}
                color={AppColors.gray[400]}
              />
              <Text style={styles.emptyTitle}>No saved addresses</Text>
              <Text style={styles.emptyText}>
                Add an address to speed up checkout
              </Text>
              <DebouncedTouchable
                style={styles.addNewButton}
                onPress={() => {
                  onClose()
                  onAddNew()
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.addNewButtonText}>Add New Address</Text>
              </DebouncedTouchable>
            </View>
          ) : (
            <>
              <ScrollView
                style={styles.addressList}
                showsVerticalScrollIndicator={false}
              >
                {addresses.map((address) => (
                  <DebouncedTouchable
                    key={address.id}
                    style={[
                      styles.addressCard,
                      selectedId === address.id && styles.addressCardSelected,
                    ]}
                    onPress={() => handleSelect(address)}
                    activeOpacity={0.7}
                  >
                    {/* Radio Button */}
                    <View
                      style={[
                        styles.radio,
                        selectedId === address.id && styles.radioSelected,
                      ]}
                    >
                      {selectedId === address.id && (
                        <View style={styles.radioInner} />
                      )}
                    </View>

                    {/* Address Content */}
                    <View style={styles.addressContent}>
                      {/* Label & Default Badge */}
                      <View style={styles.addressHeader}>
                        <View style={styles.labelContainer}>
                          <Ionicons
                            name={getLabelIcon(address.label)}
                            size={16}
                            color={AppColors.primary[600]}
                          />
                          <Text style={styles.labelText}>
                            {address.label || "Address"}
                          </Text>
                        </View>
                        {address.is_default && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                      </View>

                      {/* Name & Phone */}
                      <Text style={styles.addressName}>
                        {address.full_name}
                      </Text>
                      <Text style={styles.addressPhone}>{address.phone}</Text>

                      {/* Address */}
                      <Text style={styles.addressText}>
                        {formatAddress(address)}
                      </Text>
                    </View>
                  </DebouncedTouchable>
                ))}

                {/* Add New Address Option */}
                <DebouncedTouchable
                  style={styles.addNewCard}
                  onPress={() => {
                    onClose()
                    onAddNew()
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.addNewIcon}>
                    <Ionicons
                      name="add"
                      size={24}
                      color={AppColors.primary[600]}
                    />
                  </View>
                  <Text style={styles.addNewText}>Add New Address</Text>
                </DebouncedTouchable>
              </ScrollView>

              {/* Footer */}
              <View style={styles.footer}>
                <DebouncedTouchable
                  style={[
                    styles.confirmButton,
                    !selectedId && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleConfirm}
                  disabled={!selectedId}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmButtonText}>Use This Address</Text>
                </DebouncedTouchable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}

export default AddressSelector

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: AppColors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: AppColors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  // Loading
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
    marginTop: 12,
  },
  // Empty
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.text.primary,
    marginTop: 16,
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
    marginTop: 4,
    textAlign: "center",
  },
  addNewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.primary[500],
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  addNewButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "white",
  },
  // Address List
  addressList: {
    padding: 16,
    maxHeight: 400,
  },
  addressCard: {
    flexDirection: "row",
    backgroundColor: AppColors.background.secondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  addressCardSelected: {
    borderColor: AppColors.primary[500],
    backgroundColor: AppColors.primary[50],
  },
  // Radio
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: AppColors.gray[300],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  radioSelected: {
    borderColor: AppColors.primary[500],
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AppColors.primary[500],
  },
  // Address Content
  addressContent: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  labelText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: AppColors.text.primary,
  },
  defaultBadge: {
    backgroundColor: AppColors.primary[500],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
    color: "white",
    textTransform: "uppercase",
  },
  addressName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.primary,
  },
  addressPhone: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    marginTop: 2,
  },
  addressText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: AppColors.text.secondary,
    marginTop: 4,
    lineHeight: 18,
  },
  // Add New Card
  addNewCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background.secondary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: AppColors.gray[200],
    borderStyle: "dashed",
  },
  addNewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  addNewText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.primary[600],
  },
  // Footer
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
  confirmButton: {
    backgroundColor: AppColors.primary[500],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: AppColors.gray[300],
  },
  confirmButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "white",
  },
})
