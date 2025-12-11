import { CartItem, Order } from "../types"
import api from "./client"

export const createOrderAndPaymentIntent = async ({
  cart,
  user_name,
  customer_phone,
  shippingCost,
  localPickup,
  tax_amount,
  shippingDetails,
  selectedShipping,
  billingDetails,
  token,
  subtotal,
  discountAmount,
  totalAmount,
  couponCode,
  platform,
}: {
  cart?: CartItem[]
  selectedShipping?: any
  user_name?: string
  customer_phone?: string
  shippingCost?: number
  localPickup?: boolean
  tax_amount?: number
  shippingDetails?: any
  billingDetails?: any
  token?: string | null
  subtotal?: number
  discountAmount?: number
  totalAmount?: number
  couponCode?: string
  platform?: string
}) => {
  if (!token) return
  try {
    const { data } = await api.post(
      "/orders",
      {
        orderData: {
          products: cart,
        },
        user_name,
        customer_phone,
        selectedShipping,
        shippingCost,
        localPickup,
        tax_amount,
        shippingDetails,
        billingDetails,
        subtotal,
        discountAmount,
        totalAmount,
        couponCode,
        platform,
        isMobile: true,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    return data
  } catch (error) {
    console.error("Failed to save order: ", error)
    throw error
  }
}

export const getUserOrders = async (
  token: string,
  limit: number = 10,
  start?: number
): Promise<{ orders: Order[]; totalOrders: number }> => {
  try {
    const { data } = await api.get<{ orders: Order[]; totalOrders: number }>(
      "/orders",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          _limit: limit,
          _start: start || 0,
          _sort: "createdAt:desc",
        },
      }
    )
    return data
  } catch (error) {
    console.error("[ORDERS ERROR - getUserOrders]:", error)
    throw error
  }
}

export const getOrderById = async (
  orderId: string,
  token: string
): Promise<Order> => {
  try {
    const { data } = await api.get<Order>(`/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
      },
    })
    return data
  } catch (error) {
    console.error("[ORDERS ERROR - getOrderById]:", error)
    throw error
  }
}

export const cancelOrder = async (
  orderId: number,
  token: string
): Promise<Order> => {
  try {
    const updateData = {
      order_status: "canceled",
      delivery_status: "canceled",
    }

    const { data } = await api.put(
      `/orders/${orderId}`,
      { update: updateData },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    return data
  } catch (error: any) {
    console.error("Error canceling order:", error)
    throw new Error(
      error.response?.data?.error?.message || "Failed to cancel order"
    )
  }
}

export const deleteOrder = async (
  orderId: number,
  token: string
): Promise<{ success: boolean }> => {
  try {
    await api.delete(`/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting order:", error)
    throw new Error(
      error.response?.data?.error?.message || "Failed to delete order"
    )
  }
}

export const updateOrder = async (
  orderId: number,
  orderData: Partial<Order>,
  token: string
): Promise<Order> => {
  try {
    const { data } = await api.put(`/orders/${orderId}`, orderData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return data
  } catch (error: any) {
    console.error("Error updating order:", error)
    throw new Error(
      error.response?.data?.error?.message || "Failed to update order"
    )
  }
}
