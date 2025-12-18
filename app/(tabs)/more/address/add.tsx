import { createAddress } from "@/src/api/addresses"
import AddressForm from "@/src/components/addresses/AddressForm"
import AppColors from "@/src/constants/Colors"
import { useAuthStore } from "@/src/store/authStore"
import { AddressFormData } from "@/src/types/address"
import { useRouter } from "expo-router"
import React, { useState } from "react"
import { StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

export default function AddAddressScreen() {
  const router = useRouter()
  const { user, token } = useAuthStore()

  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: AddressFormData) => {
    if (!token || !user?.id) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please login to add an address",
        visibilityTime: 2000,
      })
      return
    }

    setIsLoading(true)

    try {
      await createAddress(data, token)

      Toast.show({
        type: "success",
        text1: "Address Added",
        text2: "Your new address has been saved",
        visibilityTime: 2000,
      })

      router.back()
    } catch (error: any) {
      console.error("Error creating address:", error)
      Toast.show({
        type: "error",
        text1: "Save Failed",
        text2: error.message || "Failed to save address",
        visibilityTime: 2500,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <AddressForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
        submitLabel="Add Address"
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
