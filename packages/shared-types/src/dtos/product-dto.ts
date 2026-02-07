import type { ProductType, ProductStatus, ProductChannel, GradingStatus } from '../enums'

export interface CreateProductDTO {
  type: ProductType
  category: string
  name: string
  series?: string
  cardNumber?: string
  gradingStatus?: GradingStatus
  gradingScore?: number
  costPrice: number
  sellingPrice: number
  sellerId?: string
  channel: ProductChannel
  description: string
  conditionNotes?: string
  supplier?: string
}

export interface UpdateProductDTO {
  name?: string
  sellingPrice?: number
  status?: ProductStatus
  channel?: ProductChannel
  description?: string
  conditionNotes?: string
}

export interface QueryProductsDTO {
  category?: string
  status?: ProductStatus
  channel?: ProductChannel
  minPrice?: number
  maxPrice?: number
  search?: string
  page?: number
  limit?: number
  sort?: string
}
