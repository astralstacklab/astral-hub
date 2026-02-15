import { Prisma } from '../../generated/prisma/client.js'
import type { PrismaClient, PaymentLog } from '../../generated/prisma/client.js'
import type {
  UpdatePaymentStatusInput,
  CreatePaymentLogInput,
  ECPayCallbackInput,
} from './payments.schema.js'

export class PaymentsService {
  constructor(private prisma: PrismaClient) {}

  async createPaymentLog(data: CreatePaymentLogInput): Promise<PaymentLog> {
    return this.prisma.paymentLog.create({
      data: {
        orderId: data.orderId,
        provider: data.provider,
        method: data.method,
        amount: data.amount,
        status: data.status,
        transactionId: data.transactionId,
        requestData: data.requestData as Prisma.InputJsonValue | undefined,
        responseData: data.responseData as Prisma.InputJsonValue | undefined,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage,
      },
    })
  }

  async updatePaymentStatus(data: UpdatePaymentStatusInput) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: data.orderId },
      })
      if (!order) {
        throw this.httpError(404, '訂單不存在')
      }

      const paidAt =
        data.status === 'PAID' ? (data.paidAt ? new Date(data.paidAt) : new Date()) : order.paidAt

      const updatedOrder = await tx.order.update({
        where: { id: data.orderId },
        data: {
          paymentStatus: data.status,
          paymentTransactionId: data.transactionId ?? order.paymentTransactionId,
          paidAt,
        },
      })

      await tx.paymentLog.create({
        data: {
          orderId: order.id,
          provider: 'MANUAL',
          method: 'MANUAL_UPDATE',
          amount: data.paidAmount ?? order.finalAmount.toNumber(),
          status: data.status === 'FAILED' ? 'FAILED' : 'SUCCESS',
          transactionId: data.transactionId,
          requestData: data as unknown as Prisma.InputJsonValue,
        },
      })

      return updatedOrder
    })
  }

  async getPaymentLogsByOrderId(orderId: string): Promise<PaymentLog[]> {
    return this.prisma.paymentLog.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async processCashPayment(orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      })
      if (!order) {
        throw this.httpError(404, '訂單不存在')
      }

      const now = new Date()
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentMethod: 'CASH',
          paymentStatus: 'PAID',
          paidAt: now,
        },
      })

      await tx.paymentLog.create({
        data: {
          orderId,
          provider: 'CASH',
          method: 'CASH',
          amount: order.finalAmount.toNumber(),
          status: 'SUCCESS',
          responseData: { paidAt: now.toISOString() } as Prisma.InputJsonValue,
        },
      })

      return updatedOrder
    })
  }

  async handleECPayCallback(callbackData: ECPayCallbackInput) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber: callbackData.MerchantTradeNo },
    })
    if (!order) {
      throw this.httpError(404, '訂單不存在')
    }

    const isSuccess = callbackData.RtnCode === '1'

    const updatedOrder = await this.updatePaymentStatus({
      orderId: order.id,
      status: isSuccess ? 'PAID' : 'FAILED',
      transactionId: callbackData.TradeNo,
      paidAmount: Number(callbackData.TradeAmt),
    })

    await this.createPaymentLog({
      orderId: order.id,
      provider: 'ECPAY',
      method: callbackData.PaymentType,
      amount: Number(callbackData.TradeAmt),
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      transactionId: callbackData.TradeNo,
      requestData: callbackData,
      responseData: {
        rtnCode: callbackData.RtnCode,
        rtnMsg: callbackData.RtnMsg,
      },
      errorCode: isSuccess ? undefined : callbackData.RtnCode,
      errorMessage: isSuccess ? undefined : callbackData.RtnMsg,
    })

    return updatedOrder
  }

  private httpError(statusCode: number, message: string): Error & { statusCode: number } {
    return Object.assign(new Error(message), { statusCode })
  }
}
