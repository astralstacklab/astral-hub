import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestServer, closeTestServer } from '../../helpers.js'
import { generateCheckMacValue } from '../../../src/utils/ecpay-validator.js'

describe('Payments API', () => {
  let server: FastifyInstance
  let authToken: string
  let testUserId: string
  let testProductId: string
  let testOrderId: string
  let testOrderNumber: string

  beforeAll(async () => {
    server = await buildTestServer()

    testUserId = '33333333-3333-3333-3333-333333333333'
    authToken = server.jwt.sign({ id: testUserId, role: 'SUPER_ADMIN' })

    const user = await server.prisma.user.findUnique({ where: { id: testUserId } })
    if (!user) {
      await server.prisma.user.create({
        data: {
          id: testUserId,
          email: 'test-admin-payments@example.com',
          name: 'Test Payments Admin',
          provider: 'GOOGLE',
          providerId: 'test-admin-payments-provider',
        },
      })
    }

    const productRes = await server.inject({
      method: 'POST',
      url: '/api/products',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        type: 'CARD',
        category: 'PAYMENT-ROUTE-TEST',
        name: `PAYMENT-ROUTE-${Date.now()}`,
        costPrice: 100,
        sellingPrice: 300,
        channel: 'BOTH',
        description: 'payment routes test product',
      },
    })

    testProductId = productRes.json().data.id as string

    await server.inject({
      method: 'PATCH',
      url: `/api/products/${testProductId}/status`,
      headers: { authorization: `Bearer ${authToken}` },
      payload: { status: 'LISTED' },
    })

    const orderRes = await server.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        items: [{ productId: testProductId }],
        paymentMethod: 'CREDIT_CARD',
        shippingMethod: 'IN_STORE',
        channel: 'ONLINE',
      },
    })

    testOrderId = orderRes.json().data.id as string
    testOrderNumber = orderRes.json().data.orderNumber as string
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
    await server.prisma.product.deleteMany({ where: { id: testProductId } })
    await server.prisma.user.deleteMany({ where: { id: testUserId } })
    await closeTestServer(server)
  })

  it('POST /api/payments/status should update payment to PAID', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/payments/status',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        orderId: testOrderId,
        status: 'PAID',
        transactionId: 'PAY-ROUTE-001',
        paidAmount: 300,
      },
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.success).toBe(true)
    expect(json.data.paymentStatus).toBe('PAID')
  })

  it('POST /api/payments/status should return 401 without auth', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/payments/status',
      payload: {
        orderId: testOrderId,
        status: 'PAID',
      },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().error.code).toBe('UNAUTHORIZED')
  })

  it('POST /api/payments/status should return 400 for invalid body', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/payments/status',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        status: 'PAID',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().error.code).toBe('VALIDATION_ERROR')
  })

  it('POST /api/payments/cash should process cash payment', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/payments/cash',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        orderId: testOrderId,
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data.paymentStatus).toBe('PAID')
    expect(response.json().data.paymentMethod).toBe('CASH')
  })

  it('POST /api/payments/cash should return 401 without auth', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/payments/cash',
      payload: {
        orderId: testOrderId,
      },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().error.code).toBe('UNAUTHORIZED')
  })

  it('POST /api/payments/ecpay/callback should return 1|OK for valid callback', async () => {
    const callbackPayload = {
      MerchantID: '2000132',
      MerchantTradeNo: testOrderNumber,
      RtnCode: '1',
      RtnMsg: 'Succeeded',
      TradeNo: `ECPAY-${Date.now()}`,
      TradeAmt: '300',
      PaymentDate: '2026/02/16 01:00:00',
      PaymentType: 'Credit_CreditCard',
    }
    const checkMacValue = generateCheckMacValue(callbackPayload)

    const response = await server.inject({
      method: 'POST',
      url: '/api/payments/ecpay/callback',
      payload: {
        ...callbackPayload,
        CheckMacValue: checkMacValue,
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).toBe('1|OK')
  })

  it('GET /api/payments/logs/:orderId should return payment logs', async () => {
    await server.inject({
      method: 'POST',
      url: '/api/payments/status',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        orderId: testOrderId,
        status: 'PAID',
        transactionId: 'PAY-ROUTE-LOG-001',
      },
    })

    const response = await server.inject({
      method: 'GET',
      url: `/api/payments/logs/${testOrderId}`,
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data.length).toBeGreaterThan(0)
  })

  it('POST /api/payments/ecpay/create should return 501 NOT_IMPLEMENTED', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/payments/ecpay/create',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {},
    })

    expect(response.statusCode).toBe(501)
    expect(response.json().error.code).toBe('NOT_IMPLEMENTED')
  })
})
