import { z } from 'zod/v4'

export const UpdatePaymentStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(['PAID', 'FAILED', 'REFUNDED']),
  transactionId: z.string().optional(),
  paidAmount: z.number().positive().optional(),
  paidAt: z.string().datetime().optional(),
})

export const ECPayCallbackSchema = z.object({
  MerchantID: z.string(),
  MerchantTradeNo: z.string(),
  RtnCode: z.string(),
  RtnMsg: z.string(),
  TradeNo: z.string(),
  TradeAmt: z.string(),
  PaymentDate: z.string(),
  PaymentType: z.string(),
  CheckMacValue: z.string(),
})

export const CreatePaymentLogSchema = z.object({
  orderId: z.string().uuid(),
  provider: z.enum(['ECPAY', 'MANUAL', 'CASH']),
  method: z.string(),
  amount: z.number().positive(),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED']),
  transactionId: z.string().optional(),
  requestData: z.record(z.string(), z.unknown()).optional(),
  responseData: z.record(z.string(), z.unknown()).optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
})

export type UpdatePaymentStatusInput = z.infer<typeof UpdatePaymentStatusSchema>
export type ECPayCallbackInput = z.infer<typeof ECPayCallbackSchema>
export type CreatePaymentLogInput = z.infer<typeof CreatePaymentLogSchema>
