export type RefundReason =
  | "damaged_product"
  | "wrong_product"
  | "quality_issue"
  | "changed_mind"
  | "late_delivery"
  | "other"

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
  questions?: RefundQuestion[]
  purchase_date: string
  status: RefundStatus
  result?: RefundResult
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
  questions?: RefundQuestion[]
  purchase_date: string
}
