export type AddressType = "shipping" | "billing" | "both"

export interface FullAddress {
  line1: string
  line2?: string
  city: string
  state: string
  postal_code: string
  country: string
}

export interface Address {
  id: number
  user: number | null
  label?: string // "Home", "Work", "Office", etc.
  type: AddressType
  is_default: boolean

  // Contact
  full_name: string
  phone: string
  email?: string

  // Address fields
  line1: string
  line2?: string
  city: string
  state: string
  postal_code: string
  country: string

  // Metadata
  createdAt: string
  updatedAt: string
}

export interface AddressFormData {
  label?: string
  type: AddressType
  is_default: boolean
  full_name: string
  phone: string
  email?: string
  line1: string
  line2?: string
  city: string
  state: string
  postal_code: string
  country: string
}

export interface AddressValidationErrors {
  full_name?: string
  phone?: string
  email?: string
  line1?: string
  city?: string
  state?: string
  postal_code?: string
}

// Australian states for picker
export const AUSTRALIAN_STATES = [
  { label: "New South Wales", value: "NSW" },
  { label: "Victoria", value: "VIC" },
  { label: "Queensland", value: "QLD" },
  { label: "South Australia", value: "SA" },
  { label: "Western Australia", value: "WA" },
  { label: "Tasmania", value: "TAS" },
  { label: "Northern Territory", value: "NT" },
  { label: "Australian Capital Territory", value: "ACT" },
] as const

// Address labels
export const ADDRESS_LABELS = [
  { label: "Home", value: "Home", icon: "home-outline" },
  { label: "Work", value: "Work", icon: "briefcase-outline" },
  { label: "Office", value: "Office", icon: "business-outline" },
  { label: "Other", value: "Other", icon: "location-outline" },
] as const
