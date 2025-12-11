/**
 * Shipping configuration constants
 */

export const SHIPPING_CONFIG = {
  // free shipping threshold in AUD
  FREE_SHIPPING_THRESHOLD: 100,

  // Express shipping flat rate when free shipping is unlocked
  EXPRESS_SHIPPING_COST: 15,

  // Shipping options when free shipping is unlocked
  FREE_SHIPPING_OPTIONS: [
    {
      serviceCode: "FREE_STANDARD",
      serviceName: "Standard Delivery",
      cost: 0,
      deliveryTime: "3-5 business days",
    },
    {
      serviceCode: "EXPRESS_FLAT",
      serviceName: "Express Delivery",
      cost: 15,
      deliveryTime: "1-2 business days",
    },
  ],

  // Pickup address
  PICKUP_ADDRESS: "8 Lethbridge Road, Austral, NSW 2179",
}

/**
 * Check if order qualifies for free shipping options
 */
export function qualifiesForFreeShipping(subtotal: number): boolean {
  return subtotal >= SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD
}

/**
 * Calculate remaining amount for free shipping
 */
export function amountToFreeShipping(subtotal: number): number {
  if (qualifiesForFreeShipping(subtotal)) return 0
  return SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD - subtotal
}

/**
 * Get free shipping progress percentage (0-100)
 */
export function freeShippingProgress(subtotal: number): number {
  if (qualifiesForFreeShipping(subtotal)) return 100
  return Math.min(
    (subtotal / SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD) * 100,
    100
  )
}

/**
 * Get shipping options for orders that qualify for free shipping
 */
export function getFreeShippingOptions() {
  return SHIPPING_CONFIG.FREE_SHIPPING_OPTIONS
}
