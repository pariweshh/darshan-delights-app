import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import React, { useCallback, useState } from "react"
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native"
import Toast from "react-native-toast-message"

import {
  deleteAddress,
  getUserAddresses,
  setDefaultAddress,
} from "@/src/api/addresses"
import AddressCard from "@/src/components/addresses/AddressCard"
import EmptyState from "@/src/components/common/EmptyState"
import Wrapper from "@/src/components/common/Wrapper"
import { AddressCardSkeleton, SkeletonBase } from "@/src/components/skeletons"
import DebouncedTouchable from "@/src/components/ui/DebouncedTouchable"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"
import { useAuthStore } from "@/src/store/authStore"
import { Address } from "@/src/types/address"

export default function AddressesScreen() {
  const router = useRouter()
  const { config, isTablet, isLandscape, width } = useResponsive()
  const { user, token } = useAuthStore()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Layout configuration
  const useColumnsLayout = isTablet && isLandscape
  const numColumns = useColumnsLayout ? 2 : 1
  const contentMaxWidth = isTablet && !isLandscape ? 600 : undefined

  // Calculate item width for grid
  const gap = config.gap
  const containerPadding = config.horizontalPadding
  const itemWidth = useColumnsLayout
    ? (width - containerPadding * 2 - gap) / 2
    : undefined

  // FAB sizes
  const fabSize = isTablet ? 64 : 56
  const fabIconSize = isTablet ? 32 : 28
  const fabBottom = isTablet ? 28 : 24
  const fabRight = isTablet ? 24 : 20

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
    [token, user?.id]
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
    ({ item, index }: { item: Address; index: number }) => {
      if (useColumnsLayout) {
        const isLastInRow = (index + 1) % numColumns === 0
        const marginRight = isLastInRow ? 0 : gap

        return (
          <View style={{ width: itemWidth, marginRight, marginBottom: gap }}>
            <AddressCard
              address={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          </View>
        )
      }

      return (
        <AddressCard
          address={item}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSetDefault={handleSetDefault}
        />
      )
    },
    [
      handleEdit,
      handleDelete,
      handleSetDefault,
      useColumnsLayout,
      numColumns,
      itemWidth,
      gap,
    ]
  )

  /**
   * Render list header
   */
  const renderHeader = () => {
    if (addresses.length === 0) return null

    return (
      <View style={[styles.listHeader, { marginBottom: isTablet ? 14 : 12 }]}>
        <Text style={[styles.addressCount, { fontSize: config.bodyFontSize }]}>
          {addresses.length} {addresses.length === 1 ? "address" : "addresses"}
        </Text>
      </View>
    )
  }

  /**
   * Render skeleton loading
   */
  const renderSkeleton = () => {
    const skeletonCount = isTablet ? 4 : 3

    if (useColumnsLayout) {
      const rows: number[][] = []
      for (let i = 0; i < skeletonCount; i += numColumns) {
        const row: number[] = []
        for (let j = 0; j < numColumns && i + j < skeletonCount; j++) {
          row.push(i + j)
        }
        rows.push(row)
      }

      return (
        <View
          style={[
            styles.skeletonContainer,
            { padding: config.horizontalPadding },
          ]}
        >
          {/* Header skeleton */}
          <View
            style={[styles.listHeader, { marginBottom: isTablet ? 14 : 12 }]}
          >
            <SkeletonBase width={100} height={config.bodyFontSize + 2} />
          </View>

          {rows.map((row, rowIndex) => (
            <View key={`skeleton-row-${rowIndex}`} style={styles.skeletonRow}>
              {row.map((_, colIndex) => {
                const isLastInRow = colIndex === numColumns - 1
                return (
                  <View
                    key={`skeleton-${rowIndex}-${colIndex}`}
                    style={{
                      width: itemWidth,
                      marginRight: isLastInRow ? 0 : gap,
                    }}
                  >
                    <AddressCardSkeleton />
                  </View>
                )
              })}
            </View>
          ))}
        </View>
      )
    }

    return (
      <View
        style={[
          styles.skeletonContainer,
          {
            padding: config.horizontalPadding,
            maxWidth: contentMaxWidth,
            alignSelf: contentMaxWidth ? "center" : undefined,
            width: contentMaxWidth ? "100%" : undefined,
          },
        ]}
      >
        {/* Header skeleton */}
        <View style={[styles.listHeader, { marginBottom: isTablet ? 14 : 12 }]}>
          <SkeletonBase width={100} height={config.bodyFontSize + 2} />
        </View>

        {Array.from({ length: skeletonCount }).map((_, index) => (
          <AddressCardSkeleton key={`skeleton-${index}`} />
        ))}
      </View>
    )
  }

  // Fetch addresses on focus
  useFocusEffect(
    useCallback(() => {
      fetchAddresses()
    }, [fetchAddresses])
  )

  // Loading state with skeleton
  if (isLoading) {
    return (
      <Wrapper style={styles.container} edges={[]}>
        {renderSkeleton()}
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

  // Create a key for FlatList to force re-render when columns change
  const flatListKey = `addresses-${numColumns}`

  return (
    <Wrapper style={styles.container} edges={[]}>
      <FlatList
        key={flatListKey}
        data={addresses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderAddressItem}
        numColumns={numColumns}
        contentContainerStyle={[
          styles.listContent,
          {
            padding: config.horizontalPadding,
            paddingBottom: isTablet ? 120 : 100,
            maxWidth: !useColumnsLayout ? contentMaxWidth : undefined,
            alignSelf:
              !useColumnsLayout && contentMaxWidth ? "center" : undefined,
            width: !useColumnsLayout && contentMaxWidth ? "100%" : undefined,
          },
        ]}
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
        style={[
          styles.fab,
          {
            bottom: fabBottom,
            right: fabRight,
            width: fabSize,
            height: fabSize,
            borderRadius: fabSize / 2,
          },
        ]}
        onPress={handleAddAddress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={fabIconSize} color="white" />
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
  listContent: {},
  listHeader: {},
  addressCount: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.text.secondary,
  },
  skeletonContainer: {
    flex: 1,
  },
  skeletonRow: {
    flexDirection: "row",
  },
  fab: {
    position: "absolute",
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
