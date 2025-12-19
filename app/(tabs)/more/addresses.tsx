import {
  deleteAddress,
  getUserAddresses,
  setDefaultAddress,
} from "@/src/api/addresses"
import AddressCard from "@/src/components/addresses/AddressCard"
import EmptyState from "@/src/components/common/EmptyState"
import Loader from "@/src/components/common/Loader"
import Wrapper from "@/src/components/common/Wrapper"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"
import { Address } from "@/src/types/address"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import React, { useCallback, useState } from "react"
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native"
import Toast from "react-native-toast-message"

export default function AddressesScreen() {
  const router = useRouter()
  const { user, token } = useAuthStore()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  /**
   * Fetch addresses from API
   */
  const fetchAddresses = useCallback(async () => {
    if (!token || !user?.id) {
      setIsLoading(false)
      return
    }

    try {
      const data = await getUserAddresses(token)
      // Sort addresses: default first, then by updatedAt
      const sortedAddresses = data.sort((a, b) => {
        if (a.is_default && !b.is_default) return -1
        if (!a.is_default && b.is_default) return 1
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
      setAddresses(sortedAddresses)
    } catch (error: any) {
      console.error("Error fetching addresses:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to load addresses",
        visibilityTime: 2500,
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [token, user?.id])

  /**
   * Handle pull to refresh
   */
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    fetchAddresses()
  }, [fetchAddresses])

  /**
   * Handle edit address
   */
  const handleEdit = useCallback(
    (address: Address) => {
      router.push({
        pathname: "/(tabs)/more/address/edit/[id]",
        params: { id: address.id.toString() },
      })
    },
    [router]
  )

  /**
   * Handle delete address
   */
  const handleDelete = useCallback(
    async (addressId: number) => {
      if (!token) return

      try {
        await deleteAddress(addressId, token)

        // Remove from local state
        setAddresses((prev) => prev.filter((a) => a.id !== addressId))

        Toast.show({
          type: "success",
          text1: "Address Deleted",
          text2: "The address has been removed",
          visibilityTime: 2000,
        })
      } catch (error: any) {
        console.error("Error deleting address:", error)
        Toast.show({
          type: "error",
          text1: "Delete Failed",
          text2: error.message || "Failed to delete address",
          visibilityTime: 2500,
        })
      }
    },
    [token]
  )

  /**
   * Handle set default address
   */
  const handleSetDefault = useCallback(
    async (addressId: number) => {
      if (!token || !user?.id) return

      try {
        await setDefaultAddress(addressId, token)

        // Update local state
        setAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            is_default: a.id === addressId,
          }))
        )

        Toast.show({
          type: "success",
          text1: "Default Address Updated",
          text2: "This address is now your default",
          visibilityTime: 2000,
        })
      } catch (error: any) {
        console.error("Error setting default address:", error)
        Toast.show({
          type: "error",
          text1: "Update Failed",
          text2: error.message || "Failed to set default address",
          visibilityTime: 2500,
        })
      }
    },
    [token]
  )

  /**
   * Navigate to add address
   */
  const handleAddAddress = useCallback(() => {
    router.push("/(tabs)/more/address/add")
  }, [router])

  /**
   * Render address item
   */
  const renderAddressItem = useCallback(
    ({ item }: { item: Address }) => (
      <AddressCard
        address={item}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSetDefault={handleSetDefault}
      />
    ),
    [handleEdit, handleDelete, handleSetDefault]
  )

  /**
   * Render list header
   */
  const renderHeader = () => {
    if (addresses.length === 0) return null

    return (
      <View style={styles.listHeader}>
        <Text style={styles.addressCount}>
          {addresses.length} {addresses.length === 1 ? "address" : "addresses"}
        </Text>
      </View>
    )
  }

  // Fetch addresses on focus
  useFocusEffect(
    useCallback(() => {
      fetchAddresses()
    }, [fetchAddresses])
  )

  // Loading state
  if (isLoading) {
    return (
      <Wrapper style={styles.container} edges={[]}>
        <Loader fullScreen text="Loading addresses..." />
      </Wrapper>
    )
  }

  // Empty state
  if (addresses.length === 0) {
    return (
      <Wrapper style={styles.container} edges={[]}>
        <EmptyState
          icon="location-outline"
          message="No addresses saved"
          subMessage="Add your delivery addresses for faster checkout"
          actionLabel="Add Address"
          onAction={handleAddAddress}
        />
      </Wrapper>
    )
  }

  return (
    <Wrapper style={styles.container} edges={[]}>
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderAddressItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={AppColors.primary[500]}
            colors={[AppColors.primary[500]]}
          />
        }
      />

      {/* Floating Add Button */}
      <DebouncedTouchable
        style={styles.fab}
        onPress={handleAddAddress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="white" />
      </DebouncedTouchable>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.secondary,
    borderTopWidth: 0.5,
    borderTopColor: AppColors.gray[200],
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listHeader: {
    marginBottom: 12,
  },
  addressCount: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: AppColors.text.secondary,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.primary[500],
    alignItems: "center",
    justifyContent: "center",
    shadowColor: AppColors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
})
