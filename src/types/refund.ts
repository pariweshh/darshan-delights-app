export type RefundReason =
  | "Wrong product"
  | "Quality issue"
  | "Damaged"
  | "Never received"
  | "Other"

export type RefundStatus = "pending" | "under_review" | "approved" | "rejected"

export type RefundResult =
  | "full_refund"
  | "partial_refund"
  | "rejected"
  | "pending"

export interface RefundQuestion {
  question: string
  answer: string
}

export interface RefundRequest {
  id: number
  fName: string
  lName: string
  email: string
  order_number: string
  reason: RefundReason
  other_reason?: string
  requested_amount: number
  additional_notes?: string
  refund_account_agreement: boolean
  questions?: {
    proof: "Yes" | "No"
    policy: "Yes" | "No"
    eligibility: "Yes" | "No"
  }
  purchase_date: string
  status: "open" | "closed"
  result?: "pending" | "refunded" | "no refund"
  createdAt: string
  updatedAt: string
}

export interface CreateRefundRequestParams {
  fName: string
  lName: string
  email: string
  order_number: string
  reason: RefundReason
  other_reason?: string
  requested_amount: number
  additional_notes?: string
  refund_account_agreement: boolean
  questions?: {
    proof: "Yes" | "No" | null
    policy: "Yes" | "No" | null
    eligibility: "Yes" | "No" | null
  }
  purchase_date: string
}
