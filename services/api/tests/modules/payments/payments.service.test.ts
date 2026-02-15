import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestServer, closeTestServer } from '../../helpers.js'
import { PaymentsService } from '../../../src/modules/payments/payments.service.js'

describe('PaymentsService', () => {
  let server: FastifyInstance
  let service: PaymentsService
  let testUserId: string
  let testProductId: string
  let testOrderId: string
  let testOrderNumber: string

  beforeAll(async () => {
    server = await buildTestServer()
    service = new PaymentsService(server.prisma)

    const user = await server.prisma.user.create({
      data: {
        email: `payment-service-user-${Date.now()}@example.com`,
        name: 'Payment Service User',
        provider: 'GOOGLE',
        providerId: `payment-service-provider-${Date.now()}`,
      },
    })
    testUserId = user.id

    const product = await server.prisma.product.create({
      data: {
        type: 'CARD',
        category: 'PAYMENT-TEST',
        name: `PAYMENT-SERVICE-PRODUCT-${Date.now()}`,
        costPrice: 100,
        sellingPrice: 300,
        description: 'payment service test product',
        status: 'LISTED',
      },
    })
    testProductId = product.id

    testOrderNumber = `ORD-PAYMENT-${Date.now()}`
    const order = await server.prisma.order.create({
      data: {
        orderNumber: testOrderNumber,
        buyerId: testUserId,
        subtotal: 300,
        shippingFee: 0,
        discountAmount: 0,
        finalAmount: 300,
        paymentMethod: 'CREDIT_CARD',
        paymentStatus: 'PENDING',
        shippingMethod: 'IN_STORE',
        status: 'PENDING',
        channel: 'ONLINE',
      },
    })
    testOrderId = order.id

    await server.prisma.orderItem.create({
      data: {
        orderId: testOrderId,
        productId: testProductId,
        productName: 'PAYMENT-SERVICE-ITEM',
        productPrice: 300,
      },
    })
  })

  beforeEach(async () => {
    await server.prisma.paymentLog.deleteMany()
    await server.prisma.order.update({
      where: { id: testOrderId },
      data: {
        paymentStatus: 'PENDING',
        paymentTransactionId: null,
        paidAt: null,
      },
    })
  })

  afterAll(async () => {
    await server.prisma.paymentLog.deleteMany()
    await server.prisma.orderItem.deleteMany()
    await server.prisma.order.deleteMany()
    await server.prisma.product.deleteMany({
      where: { id: testProductId },
    })
    await server.prisma.user.deleteMany({
      where: { id: testUserId },
    })
    await closeTestServer(server)
  })

  it('createPaymentLog should create log successfully', async () => {
    const log = await service.createPaymentLog({
      orderId: testOrderId,
      provider: 'MANUAL',
      method: 'MANUAL_UPDATE',
      amount: 300,
      status: 'SUCCESS',
      transactionId: 'MANUAL-001',
    })

    expect(log.id).toBeDefined()
    expect(log.orderId).toBe(testOrderId)
    expect(log.provider).toBe('MANUAL')
    expect(log.amount.toNumber()).toBe(300)
  })

  it('updatePaymentStatus should set PAID and create payment log', async () => {
    const order = await service.updatePaymentStatus({
      orderId: testOrderId,
      status: 'PAID',
      transactionId: 'TXN-PAID-001',
      paidAmount: 300,
    })

    expect(order.paymentStatus).toBe('PAID')
    expect(order.paidAt).not.toBeNull()
    expect(order.paymentTransactionId).toBe('TXN-PAID-001')

    const logs = await service.getPaymentLogsByOrderId(testOrderId)
    expect(logs).toHaveLength(1)
    expect(logs[0].status).toBe('SUCCESS')
  })

  it('updatePaymentStatus should set FAILED and create failed payment log', async () => {
    const order = await service.updatePaymentStatus({
      orderId: testOrderId,
      status: 'FAILED',
      transactionId: 'TXN-FAILED-001',
      paidAmount: 300,
    })

    expect(order.paymentStatus).toBe('FAILED')

    const logs = await service.getPaymentLogsByOrderId(testOrderId)
    expect(logs).toHaveLength(1)
    expect(logs[0].status).toBe('FAILED')
  })

  it('updatePaymentStatus should throw 404 when order does not exist', async () => {
    await expect(
      service.updatePaymentStatus({
        orderId: '00000000-0000-0000-0000-000000000000',
        status: 'PAID',
      })
    ).rejects.toMatchObject({ statusCode: 404 })
  })

  it('getPaymentLogsByOrderId should return logs ordered by createdAt desc', async () => {
    await service.createPaymentLog({
      orderId: testOrderId,
      provider: 'MANUAL',
      method: 'M1',
      amount: 100,
      status: 'SUCCESS',
      transactionId: 'LOG-001',
    })
    await service.createPaymentLog({
      orderId: testOrderId,
      provider: 'MANUAL',
      method: 'M2',
      amount: 200,
      status: 'SUCCESS',
      transactionId: 'LOG-002',
    })

    const logs = await service.getPaymentLogsByOrderId(testOrderId)
    expect(logs).toHaveLength(2)
    expect(logs[0].createdAt.getTime()).toBeGreaterThanOrEqual(logs[1].createdAt.getTime())
  })

  it('processCashPayment should set order PAID and create CASH payment log', async () => {
    const order = await service.processCashPayment(testOrderId)

    expect(order.paymentStatus).toBe('PAID')
    expect(order.paidAt).not.toBeNull()

    const logs = await service.getPaymentLogsByOrderId(testOrderId)
    expect(logs).toHaveLength(1)
    expect(logs[0].provider).toBe('CASH')
    expect(logs[0].status).toBe('SUCCESS')
  })

  it('processCashPayment should throw 404 when order does not exist', async () => {
    await expect(
      service.processCashPayment('00000000-0000-0000-0000-000000000000')
    ).rejects.toMatchObject({
      statusCode: 404,
    })
  })

  it('handleECPayCallback should process successful callback', async () => {
    const order = await service.handleECPayCallback({
      MerchantID: '2000132',
      MerchantTradeNo: testOrderNumber,
      RtnCode: '1',
      RtnMsg: 'Succeeded',
      TradeNo: 'ECPAY-TRADE-001',
      TradeAmt: '300',
      PaymentDate: '2026/02/15 21:00:00',
      PaymentType: 'Credit_CreditCard',
      CheckMacValue: 'IGNORED-IN-SERVICE-TEST',
    })

    expect(order.paymentStatus).toBe('PAID')
    expect(order.paymentTransactionId).toBe('ECPAY-TRADE-001')

    const logs = await service.getPaymentLogsByOrderId(testOrderId)
    expect(logs).toHaveLength(2)
    expect(logs.some((log) => log.provider === 'ECPAY')).toBe(true)
  })
})
