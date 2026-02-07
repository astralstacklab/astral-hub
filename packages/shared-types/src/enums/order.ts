export const PaymentMethod = {
  CASH: 'CASH',
  CREDIT_CARD: 'CREDIT_CARD',
  LINE_PAY: 'LINE_PAY',
  TRANSFER: 'TRANSFER',
} as const
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]

export const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]

export const ShippingMethod = {
  SEVEN_ELEVEN: 'SEVEN_ELEVEN',
  FAMILY_MART: 'FAMILY_MART',
  FACE_TO_FACE: 'FACE_TO_FACE',
  IN_STORE: 'IN_STORE',
} as const
export type ShippingMethod = (typeof ShippingMethod)[keyof typeof ShippingMethod]

export const OrderStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]

export const OrderChannel = {
  ONLINE: 'ONLINE',
  POS: 'POS',
} as const
export type OrderChannel = (typeof OrderChannel)[keyof typeof OrderChannel]
