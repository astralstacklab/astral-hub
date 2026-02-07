import type { AuctionStatus } from '../enums'

export interface Auction {
  id: string
  productId: string
  startingPrice: number
  buyNowPrice: number | null
  currentPrice: number
  incrementAmount: number
  currentBidderId: string | null
  startTime: Date
  endTime: Date
  status: AuctionStatus
  createdAt: Date
}

export interface Bid {
  id: string
  auctionId: string
  bidderId: string
  amount: number
  createdAt: Date
}
