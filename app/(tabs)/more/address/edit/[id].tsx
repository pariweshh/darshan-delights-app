import { useLocalSearchParams, useRouter } from "expo-router"
import React, { useCallback, useEffect, useState } from "react"
import { StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

import { getAddressById, updateAddress } from "@/src/api/addresses"
import AddressForm from "@/src/components/addresses/AddressForm"
import Loader from "@/src/components/common/Loader"
import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"
import { Address, AddressFormData } from "@/src/types/address"

export default function EditAddressScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user, token } = useAuthStore()

  const [address, setAddress] = useState<Address | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  /**
   * Fetch address details
   */
  const fetchAddress = useCallback(async () => {
    if (!token || !id) {
      setIsLoading(false)
      return
    }

    try {
      const data = await getAddressById(parseInt(id), token)
      setAddress(data)
    } catch (error: any) {
      console.error("Error fetching address:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to load address",
        visibilityTime: 2500,
      })
      router.back()
    } finally {
      setIsLoading(false)
    }
  }, [token, id, router])

  useEffect(() => {
    fetchAddress()
  }, [fetchAddress])

  /**
   * Handle form submit
   */
  const handleSubmit = async (data: AddressFormData) => {
    if (!token || !id || !user?.id) return

    setIsSaving(true)

    try {
      await updateAddress(parseInt(id), data, token)

      Toast.show({
        type: "success",
        text1: "Address Updated",
        text2: "Your address has been saved",
        visibilityTime: 2000,
      })

      router.back()
    } catch (error: any) {
      console.error("Error updating address:", error)
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error.message || "Failed to update address",
        visibilityTime: 2500,
      })
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    router.back()
  }

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Loader fullScreen text="Loading address..." />
      </SafeAreaView>
    )
  }

  // No address found
  if (!address) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Loader fullScreen text="Address not found" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <AddressForm
        initialData={address}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isSaving}
        submitLabel="Save Changes"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.secondary,
  },
})
