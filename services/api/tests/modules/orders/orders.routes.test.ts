import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestServer, closeTestServer } from '../../helpers.js'

describe('Orders API', () => {
  let server: FastifyInstance
  let authToken: string

  const testUserId = '22222222-2222-2222-2222-222222222222'

  beforeAll(async () => {
    server = await buildTestServer()
    authToken = server.jwt.sign({ id: testUserId, role: 'SUPER_ADMIN' })

    const user = await server.prisma.user.findUnique({ where: { id: testUserId } })
    if (!user) {
      await server.prisma.user.create({
        data: {
          id: testUserId,
          email: 'test-admin-orders@example.com',
          name: 'Test Orders Admin',
          provider: 'GOOGLE',
          providerId: 'test-admin-orders-provider',
        },
      })
    }
  })

  afterAll(async () => {
    await server.prisma.orderItem.deleteMany()
    await server.prisma.order.deleteMany()
    await server.prisma.product.deleteMany({ where: { name: { startsWith: 'ORDER-ROUTE-' } } })
    await server.prisma.user.deleteMany({ where: { id: testUserId } })
    await closeTestServer(server)
  })

  beforeEach(async () => {
    await server.prisma.orderItem.deleteMany()
    await server.prisma.order.deleteMany()
    await server.prisma.product.deleteMany({ where: { name: { startsWith: 'ORDER-ROUTE-' } } })
  })

  async function createTestProduct() {
    const res = await server.inject({
      method: 'POST',
      url: '/api/products',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        type: 'CARD',
        category: 'ORDER-TEST',
        name: `ORDER-ROUTE-商品-${Date.now()}`,
        costPrice: 100,
        sellingPrice: 300,
        channel: 'BOTH',
        description: '訂單 routes 測試商品',
      },
    })
    const productId = res.json().data.id as string

    await server.inject({
      method: 'PATCH',
      url: `/api/products/${productId}/status`,
      headers: { authorization: `Bearer ${authToken}` },
      payload: { status: 'LISTED' },
    })

    return productId
  }

  async function createTestOrder() {
    const productId = await createTestProduct()
    const response = await server.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        items: [{ productId }],
        paymentMethod: 'CREDIT_CARD',
        shippingMethod: 'IN_STORE',
        channel: 'ONLINE',
      },
    })

    return response.json().data
  }

  describe('POST /api/orders', () => {
    it('should create an order (201)', async () => {
      const productId = await createTestProduct()

      const response = await server.inject({
        method: 'POST',
        url: '/api/orders',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          items: [{ productId }],
          paymentMethod: 'CREDIT_CARD',
          shippingMethod: 'IN_STORE',
          channel: 'ONLINE',
        },
      })

      expect(response.statusCode).toBe(201)
      const json = response.json()
      expect(json.success).toBe(true)
      expect(json.data.orderNumber).toMatch(/^ORD\d{8}\d{3}$/)
    })

    it('should return 400 for invalid payload', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/orders',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          items: [],
        },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 401 without token', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/orders',
        payload: {
          items: [{ productId: '00000000-0000-0000-0000-000000000000' }],
          paymentMethod: 'CREDIT_CARD',
          shippingMethod: 'IN_STORE',
          channel: 'ONLINE',
        },
      })

      expect(response.statusCode).toBe(401)
      expect(response.json().error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('GET /api/orders', () => {
    it('should return orders list with pagination meta', async () => {
      await createTestOrder()

      const response = await server.inject({
        method: 'GET',
        url: '/api/orders?page=1&limit=10',
        headers: { authorization: `Bearer ${authToken}` },
      })

      expect(response.statusCode).toBe(200)
      const json = response.json()
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data).toHaveLength(1)
      expect(json.meta.total).toBe(1)
      expect(json.meta.page).toBe(1)
    })
  })

  describe('GET /api/orders/:id', () => {
    it('should return a single order', async () => {
      const created = await createTestOrder()

      const response = await server.inject({
        method: 'GET',
        url: `/api/orders/${created.id}`,
        headers: { authorization: `Bearer ${authToken}` },
      })

      expect(response.statusCode).toBe(200)
      const json = response.json()
      expect(json.success).toBe(true)
      expect(json.data.id).toBe(created.id)
      expect(json.data.items).toHaveLength(1)
    })

    it('should return 404 for non-existent order', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/orders/00000000-0000-0000-0000-000000000000',
        headers: { authorization: `Bearer ${authToken}` },
      })

      expect(response.statusCode).toBe(404)
      expect(response.json().error.code).toBe('ORDER_NOT_FOUND')
    })
  })

  describe('PATCH /api/orders/:id/status', () => {
    it('should update order status successfully', async () => {
      const created = await createTestOrder()

      const response = await server.inject({
        method: 'PATCH',
        url: `/api/orders/${created.id}/status`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { status: 'PROCESSING' },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.status).toBe('PROCESSING')
    })

    it('should return 400 for illegal status transition', async () => {
      const created = await createTestOrder()

      const response = await server.inject({
        method: 'PATCH',
        url: `/api/orders/${created.id}/status`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { status: 'SHIPPED' },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().error.code).toBe('BAD_REQUEST')
    })
  })

  describe('PATCH /api/orders/:id/payment', () => {
    it('should update payment status', async () => {
      const created = await createTestOrder()

      const response = await server.inject({
        method: 'PATCH',
        url: `/api/orders/${created.id}/payment`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          status: 'PAID',
          transactionId: 'TXN-ROUTE-001',
        },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.paymentStatus).toBe('PAID')
      expect(response.json().data.paymentTransactionId).toBe('TXN-ROUTE-001')
    })
  })

  describe('PUT /api/orders/:id/cancel', () => {
    it('should cancel order successfully', async () => {
      const created = await createTestOrder()

      const response = await server.inject({
        method: 'PUT',
        url: `/api/orders/${created.id}/cancel`,
        headers: { authorization: `Bearer ${authToken}` },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.status).toBe('CANCELLED')
    })

    it('should return 401 without token', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: '/api/orders/00000000-0000-0000-0000-000000000000/cancel',
      })

      expect(response.statusCode).toBe(401)
      expect(response.json().error.code).toBe('UNAUTHORIZED')
    })

    it('should return 400 for non-pending order', async () => {
      const created = await createTestOrder()

      await server.inject({
        method: 'PATCH',
        url: `/api/orders/${created.id}/status`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { status: 'PROCESSING' },
      })

      const response = await server.inject({
        method: 'PUT',
        url: `/api/orders/${created.id}/cancel`,
        headers: { authorization: `Bearer ${authToken}` },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().error.code).toBe('BAD_REQUEST')
    })
  })
})
