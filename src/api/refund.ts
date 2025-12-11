import { CreateRefundRequestParams, RefundRequest } from "../types/refund"
import api from "./client"

/**
 * Submit a refund request
 */
export const submitRefundRequest = async (
  params: CreateRefundRequestParams
): Promise<RefundRequest> => {
  const { data } = await api.post("/refund-requests", {
    data: {
      ...params,
      status: "pending",
    },
  })
  return data.data
}

/**
 * Get user's refund requests
 */
export const getMyRefundRequests = async (
  email: string
): Promise<RefundRequest[]> => {
  const { data } = await api.get("/refund-requests", {
    params: {
      filters: {
        email: {
          $eq: email,
        },
      },
      sort: ["createdAt:desc"],
    },
  })
  return data.data
}

/**
 * Get a single refund request by ID
 */
export const getRefundRequest = async (id: number): Promise<RefundRequest> => {
  const { data } = await api.get(`/refund-requests/${id}`)
  return data.data
}

/**
 * Get refund request by order number
 */
export const getRefundByOrderNumber = async (
  orderNumber: string
): Promise<RefundRequest | null> => {
  const { data } = await api.get("/refund-requests", {
    params: {
      filters: {
        order_number: {
          $eq: orderNumber,
        },
      },
    },
  })
  return data.data?.[0] || null
}
