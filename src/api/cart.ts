import { CartItem } from "@/src/types"
import api from "./client"

export const getUserCartItems = async (token: string): Promise<CartItem[]> => {
  try {
    const { data } = await api.get("/baskets", {
      headers: { Authorization: `Bearer ${token}` },
    })

    const result = data.data
    const basketItems: CartItem[] = result.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      cover: item.cover,
      amount: item.amount,
      product_id: item.product_id,
      unit_price: item.unit_price,
      basket_item_id: item.id,
      user_id: item.user_id,
      slug: item.slug,
      weight: item.weight,
    }))

    return basketItems
  } catch (error) {
    console.error("[CART ERROR - getUserCartItems]:", error)
    throw error
  }
}

export const addToCart = async (
  basketData: any,
  token: string
): Promise<CartItem> => {
  try {
    const { data } = await api.post(
      "/baskets",
      { data: basketData },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    const basketItem: CartItem = {
      name: data.name,
      quantity: data.quantity,
      cover: data.cover,
      amount: data.amount,
      product_id: data.product_id,
      unit_price: data.unit_price,
      basket_item_id: data.id,
      user_id: data.user_id,
      slug: data.slug,
      brand: data?.brand,
      weight: data?.weight_in_grams || data?.weight,
    }

    return basketItem
  } catch (error) {
    console.error("[CART ERROR - addToCart]:", error)
    throw error
  }
}

export const updateCartItem = async (
  cartItemId: number,
  cartData: any,
  token: string
): Promise<CartItem> => {
  try {
    const { data } = await api.put(
      `/baskets/${cartItemId}`,
      { data: cartData },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    const result = data.data

    const basketItem: CartItem = {
      name: result.attributes.name,
      quantity: result.attributes.quantity,
      cover: result.attributes.cover,
      amount: result.attributes.amount,
      product_id: result.attributes.product_id,
      unit_price: result.attributes.unit_price,
      basket_item_id: result.id,
      user_id: result.attributes.user_id,
      slug: result.attributes.slug,
      brand: result.attributes.brand ?? "",
      weight: result.attributes.weight,
    }

    return basketItem
  } catch (error) {
    console.error("[CART ERROR - updateCartItem]:", error)
    throw error
  }
}

export const deleteCartItem = async (
  cartItemId: number,
  token: string
): Promise<any> => {
  try {
    const { data } = await api.delete(`/baskets/${cartItemId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return data
  } catch (error) {
    console.error("[CART ERROR - deleteCartItem]:", error)
    throw error
  }
}

export const deleteBasket = async (
  token: string
): Promise<{ count: number }> => {
  try {
    const { data } = await api.delete("/baskets/fakeId", {
      headers: { Authorization: `Bearer ${token}` },
    })
    return data
  } catch (error) {
    console.error("[CART ERROR - deleteBasket]:", error)
    throw error
  }
}
