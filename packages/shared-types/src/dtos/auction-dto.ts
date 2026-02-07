import type { AuctionStatus } from '../enums'

export interface CreateAuctionDTO {
  productId: string
  startingPrice: number
  buyNowPrice?: number
  incrementAmount: number
  startTime: string
  endTime: string
}

export interface PlaceBidDTO {
  amount: number
}

export interface QueryAuctionsDTO {
  status?: AuctionStatus
  page?: number
  limit?: number
}
