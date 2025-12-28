import api from "./client"

export interface ValidatedCoupon {
  id: number
  code: string
  discountType: "percentage" | "fixed"
  discountValue: number
  discountAmount: number
  description?: string
  onePerUser?: boolean
}

export interface CouponValidationResult {
  valid: boolean
  error?: string
  appExclusive?: boolean
  coupon?: ValidatedCoupon
}

/**
 * Validate a coupon code
 */
export const validateCoupon = async (
  code: string,
  subtotal: number,
  token?: string | null
): Promise<CouponValidationResult> => {
  const headers: Record<string, string> = {}

  // Include auth token if available (for per-user validation)
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await api.post(
    "/coupons/validate",
    {
      code: code.toUpperCase(),
      platform: "mobile", // Always "mobile" for the app
      subtotal,
      token,
    },
    { headers }
  )
  return response.data
}

/**
 * Apply coupon after successful order
 */
export const applyCoupon = async (
  code: string,
  orderId: number,
  orderNumber: string,
  discountAmount: number,
  token: string
): Promise<{ success: boolean }> => {
  const response = await api.post(
    "/coupons/apply",
    {
      code: code.toUpperCase(),
      orderId,
      orderNumber,
      discountAmount,
      platform: "mobile",
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
  return response.data
}

/**
 * Get user's coupon usage history
 */
export const getMyCouponUsage = async (
  token: string
): Promise<{ usages: any[] }> => {
  const response = await api.get("/coupons/my-usage", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return response.data
}
