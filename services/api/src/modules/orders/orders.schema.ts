import { z } from 'zod/v4'

export const CreateOrderItemSchema = z.object({
  productId: z.string().uuid(),
})

export const CreateOrderSchema = z.object({
  items: z.array(CreateOrderItemSchema).min(1),
  buyerName: z.string().optional(),
  buyerEmail: z.string().email().optional(),
  buyerPhone: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'CREDIT_CARD', 'LINE_PAY', 'TRANSFER']),
  shippingMethod: z.enum(['SEVEN_ELEVEN', 'FAMILY_MART', 'FACE_TO_FACE', 'IN_STORE']),
  shippingAddress: z
    .object({
      storeId: z.string().optional(),
      storeName: z.string().optional(),
      recipient: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  discountAmount: z.number().min(0).default(0),
  channel: z.enum(['ONLINE', 'POS']),
  notes: z.string().optional(),
})

export const QueryOrdersSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED']).optional(),
  channel: z.enum(['ONLINE', 'POS']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
})

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED']),
  trackingNumber: z.string().optional(),
})

export const UpdatePaymentStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']),
  transactionId: z.string().optional(),
})

export const OrderIdParamSchema = z.object({
  id: z.string().uuid(),
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
export type QueryOrdersInput = z.infer<typeof QueryOrdersSchema>
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>
export type UpdatePaymentStatusInput = z.infer<typeof UpdatePaymentStatusSchema>
