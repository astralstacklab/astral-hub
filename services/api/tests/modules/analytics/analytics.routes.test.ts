import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestServer, closeTestServer } from '../../helpers.js'

describe('Analytics API', () => {
  let server: FastifyInstance
  let authToken: string
  let testUserId: string
  let sellerId: string
  let productIds: string[] = []
  let orderIds: string[] = []

  beforeAll(async () => {
    server = await buildTestServer()

    testUserId = `analytics-routes-admin-${Date.now()}`
    authToken = server.jwt.sign({ id: testUserId, role: 'SUPER_ADMIN' })

    await server.prisma.user.create({
      data: {
        id: testUserId,
        email: `analytics-routes-${Date.now()}@example.com`,
        name: 'Analytics Routes Admin',
        provider: 'GOOGLE',
        providerId: `analytics-routes-provider-${Date.now()}`,
      },
    })

    const seller = await server.prisma.seller.create({
      data: {
        email: `analytics-routes-seller-${Date.now()}@example.com`,
        name: 'Analytics Routes Seller',
        passwordHash: 'hashed-password',
        level: 'BRONZE',
        commissionRate: 0.15,
        onlineListingFee: 10,
        offlineListingFee: 10,
        status: 'ACTIVE',
      },
    })
    sellerId = seller.id

    const p1 = await server.prisma.product.create({
      data: {
        type: 'CARD',
        category: 'ANALYTICS-ROUTES-CAT',
        name: `ANALYTICS-ROUTES-SELF-${Date.now()}`,
        costPrice: 50,
        sellingPrice: 100,
        description: 'analytics routes self product',
        status: 'SOLD',
      },
    })

    const p2 = await server.prisma.product.create({
      data: {
        type: 'CARD',
        category: 'ANALYTICS-ROUTES-CAT',
        name: `ANALYTICS-ROUTES-CONSIGN-${Date.now()}`,
        costPrice: 200,
        sellingPrice: 500,
        description: 'analytics routes consignment product',
        status: 'SOLD',
        sellerId,
      },
    })

    productIds = [p1.id, p2.id]

    const completedOrder = await server.prisma.order.create({
      data: {
        orderNumber: `ANALYTICS-ROUTES-COMP-${Date.now()}`,
        buyerId: testUserId,
        subtotal: 600,
        shippingFee: 0,
        discountAmount: 0,
        finalAmount: 600,
        paymentMethod: 'CREDIT_CARD',
        paymentStatus: 'PAID',
        shippingMethod: 'IN_STORE',
        status: 'COMPLETED',
        channel: 'ONLINE',
      },
    })

    await server.prisma.orderItem.createMany({
      data: [
        {
          orderId: completedOrder.id,
          productId: p1.id,
          productName: p1.name,
          productPrice: 100,
          sellerId: null,
        },
        {
          orderId: completedOrder.id,
          productId: p2.id,
          productName: p2.name,
          productPrice: 500,
          sellerId,
        },
      ],
    })

    const pendingOrder = await server.prisma.order.create({
      data: {
        orderNumber: `ANALYTICS-ROUTES-PENDING-${Date.now()}`,
        buyerId: testUserId,
        subtotal: 0,
        shippingFee: 0,
        discountAmount: 0,
        finalAmount: 0,
        paymentMethod: 'TRANSFER',
        paymentStatus: 'PENDING',
        shippingMethod: 'IN_STORE',
        status: 'PENDING',
        channel: 'ONLINE',
      },
    })

    orderIds = [completedOrder.id, pendingOrder.id]
  })

  beforeEach(async () => {
    const keys = await server.redis.keys('analytics:*')
    if (keys.length > 0) {
      await server.redis.del(...keys)
    }
  })

  afterAll(async () => {
    if (orderIds.length > 0) {
      await server.prisma.paymentLog.deleteMany({ where: { orderId: { in: orderIds } } })
      await server.prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })
      await server.prisma.order.deleteMany({ where: { id: { in: orderIds } } })
    }
    if (productIds.length > 0) {
      await server.prisma.product.deleteMany({ where: { id: { in: productIds } } })
    }
    await server.prisma.seller.deleteMany({ where: { id: sellerId } })
    await server.prisma.user.deleteMany({ where: { id: testUserId } })

    const keys = await server.redis.keys('analytics:*')
    if (keys.length > 0) {
      await server.redis.del(...keys)
    }

    await closeTestServer(server)
  })

  it('GET /api/analytics/sales should return sales report', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const response = await server.inject({
      method: 'GET',
      url: `/api/analytics/sales?period=DAILY&startDate=${today}&endDate=${today}`,
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.success).toBe(true)
    expect(json.data.summary.totalRevenue).toBe('600.00')
  })

  it('GET /api/analytics/products should return product stats', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/analytics/products?limit=20',
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data.topSelling)).toBe(true)
    expect(json.data.topSelling.length).toBeGreaterThan(0)
  })

  it('GET /api/analytics/sellers should return seller commission stats', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const response = await server.inject({
      method: 'GET',
      url: `/api/analytics/sellers?startDate=${today}&endDate=${today}`,
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data.sellers)).toBe(true)
    expect(json.data.sellers.length).toBeGreaterThan(0)
  })

  it('GET /api/analytics/dashboard should return dashboard data', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/analytics/dashboard',
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.success).toBe(true)
    expect(json.data.overview).toBeDefined()
  })

  it('GET /api/analytics/export sales should return csv', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const response = await server.inject({
      method: 'GET',
      url: `/api/analytics/export?reportType=sales&startDate=${today}&endDate=${today}`,
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/csv')
    expect(response.headers['content-disposition']).toContain('attachment')
    expect(response.body).toContain('date')
  })

  it('GET /api/analytics/export products should return csv', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const response = await server.inject({
      method: 'GET',
      url: `/api/analytics/export?reportType=products&startDate=${today}&endDate=${today}`,
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/csv')
    expect(response.headers['content-disposition']).toContain('attachment')
  })

  it('GET /api/analytics/sales should return 401 without auth', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const response = await server.inject({
      method: 'GET',
      url: `/api/analytics/sales?period=DAILY&startDate=${today}&endDate=${today}`,
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().error.code).toBe('UNAUTHORIZED')
  })

  it('GET /api/analytics/export should return 400 when reportType is missing', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const response = await server.inject({
      method: 'GET',
      url: `/api/analytics/export?startDate=${today}&endDate=${today}`,
      headers: { authorization: `Bearer ${authToken}` },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().error.code).toBe('VALIDATION_ERROR')
  })
})
