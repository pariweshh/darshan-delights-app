import { Address, AddressFormData } from "@/src/types/address"
import api from "./client"

export const getUserAddresses = async (token: string): Promise<Address[]> => {
  try {
    const { data } = await api.get("/addresses", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return data.data
  } catch (error: any) {
    if (__DEV__) {
      console.error("Error fetching addresses:", error)
    }
    throw new Error(
      error.response?.data?.error?.message || "Failed to fetch addresses"
    )
  }
}

export const getAddressById = async (
  addressId: number,
  token: string
): Promise<Address> => {
  try {
    const { data } = await api.get(`/addresses/${addressId}`, {
      params: {
        populate: "*",
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!data?.data) {
      throw new Error("Address not found")
    }

    return data.data
  } catch (error: any) {
    if (__DEV__) {
      console.error("Error fetching address:", error)
    }
    throw new Error(
      error.response?.data?.error?.message || "Failed to fetch address"
    )
  }
}

export const createAddress = async (
  addressData: AddressFormData,
  token: string
): Promise<Address> => {
  try {
    const { data } = await api.post(
      "/addresses",
      {
        data: {
          ...addressData,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    return data.data
  } catch (error: any) {
    if (__DEV__) {
      console.error("Error creating address:", error)
    }
    throw new Error(
      error.response?.data?.error?.message || "Failed to create address"
    )
  }
}

export const updateAddress = async (
  addressId: number,
  addressData: Partial<AddressFormData>,
  token: string
): Promise<Address> => {
  try {
    const { data } = await api.put(
      `/addresses/${addressId}`,
      { data: addressData },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    return data.data
  } catch (error: any) {
    if (__DEV__) {
      console.error("Error updating address:", error)
    }
    throw new Error(
      error.response?.data?.error?.message || "Failed to update address"
    )
  }
}

export const deleteAddress = async (
  addressId: number,
  token: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const { data } = await api.delete(`/addresses/${addressId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return {
      success: true,
      message: data?.message || "Address deleted successfully",
    }
  } catch (error: any) {
    if (__DEV__) {
      console.error("Error deleting address:", error)
    }
    throw new Error(
      error.response?.data?.error?.message || "Failed to delete address"
    )
  }
}

export const setDefaultAddress = async (
  addressId: number,
  token: string
): Promise<Address> => {
  try {
    const { data } = await api.post(
      `/addresses/${addressId}/set-default`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    return data.data
  } catch (error: any) {
    if (__DEV__) {
      console.error("Error setting default address:", error)
    }
    throw new Error(
      error.response?.data?.error?.message || "Failed to set default address"
    )
  }
}

export const getDefaultAddress = async (
  token: string
): Promise<Address | null> => {
  try {
    const addresses = await getUserAddresses(token)
    return addresses.find((addr) => addr.is_default) || addresses[0] || null
  } catch (error: any) {
    if (__DEV__) {
      console.error("Error fetching default address:", error)
    }
    return null
  }
}
