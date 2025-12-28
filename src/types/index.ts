import { Address } from "./address"
import { Review } from "./review"

// Landing screen types
export interface LandingSlide {
  color: string
  title: string
  subTitle: string
  image: React.ReactNode
}

export interface ShippingAddress {
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postCode: string
}

export interface User {
  id: string
  fName: string
  lName: string
  phone?: string
  username: string
  email: string
  createdAt?: string
  updatedAt?: string
  provider?: string
  confirmed: boolean
  blocked: boolean
  shipping_address?: ShippingAddress
  addresses?: Address[]
}

export interface LoginProps {
  identifier: string
  password: string
}

export interface SignUpProps {
  username: string
  email: string
  password: string
  fName: string
  lName: string
  phone?: string
  platform: "mobile"
  agreedToPolicies: boolean
}

export interface AuthResponse {
  jwt: string
  user: User
  message?: string
}

export interface VerifyOTPResponse {
  jwt: string
  user: User
  message: string
}

export interface VerifyTokenResponse {
  jwt: string
  user: User
  message: string
}

export interface VerifyResetOTPResponse {
  ok: boolean
  resetToken: string
  message: string
}

export interface SimpleResponse {
  ok: boolean
  message?: string
}

export interface ProductParams {
  start?: number | undefined
  limit?: number | undefined
  sort?: string
  minPrice?: number
  maxPrice?: number
  popular?: boolean
  onSale?: boolean
  category?: string
  brand?: string
  selectedBrands?: any
  query?: string
}

export interface Product {
  SKU: string
  brand: any
  categories: any[]
  cost_price: number
  cover: any
  description: string
  id: number
  images: any[]
  name: string
  nutrition: any
  popular: boolean
  reviews?: Review[]
  rrp: number
  sale_price: number
  slug: string
  stock: number
  sub_categoties: any[]
  createdAt: string
  weight_in_grams: number
  updatedAt: string
}

export interface Category {
  cover: any
  createdAt?: string
  id: number
  name: string
  publishedAt?: string
  updatedAt?: string
}

export interface Brand {
  id: number
  createdAt?: string
  name: string
  publishedAt?: string
  updatedAt?: string
  cover?: any
}

export interface CartItem {
  product_id: number
  name: string
  quantity: number
  amount: number
  cover: string
  size?: number
  brand?: string
  basket_item_id?: number
  unit_price: number
  user_id: number | string | null
  loading?: boolean
  slug: string
  weight: number
}

export type DeliveryStatus =
  | "processing"
  | "dispatched"
  | "delivered"
  | "ready for pickup"
  | "picked up"
  | "canceled"

export type OrderStatus = "processing" | "complete" | "canceled"

export type PaymentStatus = "paid" | "pending" | "failed"

export interface Order {
  id: number
  email: string
  orders: {
    products: CartItem[]
  }
  order_status: "processing" | "complete" | "canceled"
  total_order_amount: number
  stripe_event_id: string
  status?: "paid" | "pending" | "failed"
  payment_status: "paid" | "pending" | "failed"
  name: string
  receipt_url: string
  phone: string
  shipping_details: any
  billing_details: any
  tax_amount: number
  delivery_fee: number
  payment_method: string
  delivery_status: DeliveryStatus
  order_number: string
  discount_applied: number
  localPickup: boolean
  createdAt: string
  updatedAt: string
}

// Session types
export interface SessionCheckResult {
  isValid: boolean
  user: User | null
  token: string | null
  error?: string
}
