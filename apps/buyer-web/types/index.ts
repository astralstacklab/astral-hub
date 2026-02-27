import type { Auction, Product, User } from '@astral-hub/shared-types'

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
}

export interface UserState {
  id: string
  email: string
  name: string
  avatar?: string
}

export interface ProductListQuery extends Record<string, string | number | boolean | undefined> {
  page?: number
  limit?: number
  search?: string
  category?: string
  status?: string
  minPrice?: number
  maxPrice?: number
}

export interface AuctionListQuery extends Record<string, string | number | boolean | undefined> {
  status?: string
  page?: number
  limit?: number
}

export interface PlaceBidPayload {
  auctionId: string
  amount: number
}

export type ProductEntity = Product
export type AuctionEntity = Auction
export type UserEntity = User
