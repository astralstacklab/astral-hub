import type { PaymentMethod, ShippingMethod, OrderStatus } from '../enums'

export interface CreateOrderItemDTO {
  productId: string
  quantity: number
}

export interface CreateOrderDTO {
  items: CreateOrderItemDTO[]
  paymentMethod: PaymentMethod
  shippingMethod: ShippingMethod
  shippingAddress?: {
    recipientName: string
    phone: string
    zipCode: string
    city: string
    district: string
    address: string
    storeId?: string
    storeName?: string
  }
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus
  trackingNumber?: string
}

export interface QueryOrdersDTO {
  status?: OrderStatus
  page?: number
  limit?: number
}
