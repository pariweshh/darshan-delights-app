import { CartItem } from "../types"
import api from "./client"

export const calculateShippingCosts = async ({
  toPostcode,
  basketItems,
}: {
  toPostcode: string
  basketItems: CartItem[]
}) => {
  try {
    const items = basketItems.map((item) => ({
      productId: item?.product_id,
      quantity: item?.quantity,
    }))

    const requestBody = {
      toPostcode,
      items,
    }

    const { data } = await api.post("/shipping/calculate", { ...requestBody })

    return data
  } catch (error) {
    console.error("Error calculating shipping costs: ", error)
    throw error
  }
}
