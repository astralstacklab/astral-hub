import type { SellerLevel, SellerStatus } from '../enums'

export interface Seller {
  id: string
  email: string
  name: string
  level: SellerLevel
  totalSales: number
  balance: number
  commissionRate: number
  onlineListingFee: number
  offlineListingFee: number
  status: SellerStatus
  createdAt: Date
}
