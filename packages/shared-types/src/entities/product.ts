import type { ProductType, ProductStatus, ProductChannel, GradingStatus, ImageType } from '../enums'

export interface ProductImage {
  url: string
  type: ImageType
}

export interface Product {
  id: string
  type: ProductType
  category: string
  name: string
  series: string | null
  cardNumber: string | null
  gradingStatus: GradingStatus | null
  gradingScore: number | null
  costPrice: number
  sellingPrice: number
  sellerId: string | null
  status: ProductStatus
  channel: ProductChannel
  images: ProductImage[]
  video: string | null
  description: string
  conditionNotes: string | null
  supplier: string | null
  stockQuantity: number
  createdAt: Date
  updatedAt: Date
}
