export interface RecentlyViewedProduct {
  id: number
  name: string
  slug: string
  cover: string
  rrp: number
  sale_price?: number | null
  viewedAt: number
}
