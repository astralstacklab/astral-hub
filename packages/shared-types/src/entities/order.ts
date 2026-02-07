import type {
  PaymentMethod,
  PaymentStatus,
  ShippingMethod,
  OrderStatus,
  OrderChannel,
} from '../enums'

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface ShippingAddress {
  recipientName: string
  phone: string
  zipCode: string
  city: string
  district: string
  address: string
  storeId?: string
  storeName?: string
}

export interface Order {
  id: string
  orderNumber: string
  buyerId: string
  items: OrderItem[]
  totalAmount: number
  discountAmount: number
  finalAmount: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  shippingMethod: ShippingMethod
  shippingAddress: ShippingAddress | null
  trackingNumber: string | null
  status: OrderStatus
  channel: OrderChannel
  createdAt: Date
}
