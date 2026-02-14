import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestServer, closeTestServer } from '../../helpers.js'

describe('Auctions API', () => {
  let server: FastifyInstance
  let authToken: string

  const testUserId = '11111111-1111-1111-1111-111111111111'

  beforeAll(async () => {
    server = await buildTestServer()
    authToken = server.jwt.sign({ id: testUserId, role: 'SUPER_ADMIN' })

    const user = await server.prisma.user.findUnique({ where: { id: testUserId } })
    if (!user) {
      await server.prisma.user.create({
        data: {
          id: testUserId,
          email: 'test-admin-auctions@example.com',
          name: 'Test Admin',
          provider: 'GOOGLE',
          providerId: 'test-admin-auctions-provider',
        },
      })
    }
  })

  afterAll(async () => {
    await server.prisma.bid.deleteMany()
    await server.prisma.auction.deleteMany()
    await server.prisma.orderItem.deleteMany()
    await server.prisma.product.deleteMany({ where: { name: { startsWith: 'AUCT-ROUTE-' } } })
    await server.prisma.user.deleteMany({ where: { id: testUserId } })
    await closeTestServer(server)
  })

  beforeEach(async () => {
    await server.prisma.bid.deleteMany()
    await server.prisma.auction.deleteMany()
    await server.prisma.orderItem.deleteMany()
    await server.prisma.product.deleteMany({ where: { name: { startsWith: 'AUCT-ROUTE-' } } })

    const keys = await server.redis.keys('auction:*')
    if (keys.length > 0) await server.redis.del(...keys)
  })

  async function createTestProduct() {
    const res = await server.inject({
      method: 'POST',
      url: '/api/products',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        type: 'CARD',
        category: '寶可夢',
        name: `AUCT-ROUTE-商品-${Date.now()}`,
        costPrice: 1000,
        sellingPrice: 3000,
        channel: 'BOTH',
        description: '競標測試用商品',
      },
    })

    return res.json().data.id as string
  }

  async function createTestAuction(productId: string) {
    const now = new Date()
    const res = await server.inject({
      method: 'POST',
      url: '/api/auctions',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        productId,
        startingPrice: 100,
        incrementAmount: 10,
        startTime: new Date(now.getTime() - 60_000).toISOString(),
        endTime: new Date(now.getTime() + 3_600_000).toISOString(),
      },
    })

    return res.json().data
  }

  describe('POST /api/auctions', () => {
    it('should create an auction (201)', async () => {
      const productId = await createTestProduct()

      const now = new Date()
      const response = await server.inject({
        method: 'POST',
        url: '/api/auctions',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          productId,
          startingPrice: 100,
          incrementAmount: 10,
          startTime: new Date(now.getTime() - 60_000).toISOString(),
          endTime: new Date(now.getTime() + 3_600_000).toISOString(),
        },
      })

      expect(response.statusCode).toBe(201)
      const json = response.json()
      expect(json.success).toBe(true)
      expect(json.data.productId).toBe(productId)
    })

    it('should return 400 for invalid payload', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/auctions',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { startingPrice: -1 },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 401 without token', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/auctions',
        payload: {
          productId: '00000000-0000-0000-0000-000000000000',
          startingPrice: 100,
          incrementAmount: 10,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 3_600_000).toISOString(),
        },
      })

      expect(response.statusCode).toBe(401)
      expect(response.json().error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('GET /api/auctions', () => {
    it('should return auctions list with pagination', async () => {
      const productId = await createTestProduct()
      await createTestAuction(productId)

      const response = await server.inject({
        method: 'GET',
        url: '/api/auctions?page=1&limit=10',
      })

      expect(response.statusCode).toBe(200)
      const json = response.json()
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data).toHaveLength(1)
      expect(json.meta.total).toBe(1)
    })

    it('should filter by status', async () => {
      const productId = await createTestProduct()
      await createTestAuction(productId)

      const response = await server.inject({
        method: 'GET',
        url: '/api/auctions?status=ACTIVE',
      })

      expect(response.statusCode).toBe(200)
      const json = response.json()
      expect(json.data).toHaveLength(1)
      expect(json.data[0].status).toBe('ACTIVE')
    })
  })

  describe('GET /api/auctions/:id', () => {
    it('should return a single auction', async () => {
      const productId = await createTestProduct()
      const created = await createTestAuction(productId)

      const response = await server.inject({
        method: 'GET',
        url: `/api/auctions/${created.id}`,
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.id).toBe(created.id)
    })

    it('should return 404 for non-existent auction', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/auctions/00000000-0000-0000-0000-000000000000',
      })

      expect(response.statusCode).toBe(404)
      expect(response.json().error.code).toBe('AUCTION_NOT_FOUND')
    })
  })

  describe('POST /api/auctions/:id/bid', () => {
    it('should place a bid (201)', async () => {
      const productId = await createTestProduct()
      const created = await createTestAuction(productId)

      const response = await server.inject({
        method: 'POST',
        url: `/api/auctions/${created.id}/bid`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { amount: 110 },
      })

      expect(response.statusCode).toBe(201)
      const json = response.json()
      expect(json.success).toBe(true)
      expect(Number(json.data.amount)).toBe(110)
    })

    it('should return 400 for insufficient amount', async () => {
      const productId = await createTestProduct()
      const created = await createTestAuction(productId)

      const response = await server.inject({
        method: 'POST',
        url: `/api/auctions/${created.id}/bid`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { amount: 105 },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().error.code).toBe('BID_REJECTED')
    })

    it('should return 401 without token', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/auctions/00000000-0000-0000-0000-000000000000/bid',
        payload: { amount: 100 },
      })

      expect(response.statusCode).toBe(401)
      expect(response.json().error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('GET /api/auctions/:id/bids', () => {
    it('should return bids list', async () => {
      const productId = await createTestProduct()
      const created = await createTestAuction(productId)

      await server.inject({
        method: 'POST',
        url: `/api/auctions/${created.id}/bid`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { amount: 110 },
      })

      const response = await server.inject({
        method: 'GET',
        url: `/api/auctions/${created.id}/bids`,
      })

      expect(response.statusCode).toBe(200)
      const json = response.json()
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data).toHaveLength(1)
      expect(Number(json.data[0].amount)).toBe(110)
    })
  })

  describe('PUT /api/auctions/:id/cancel', () => {
    it('should cancel an auction', async () => {
      const productId = await createTestProduct()
      const created = await createTestAuction(productId)

      const response = await server.inject({
        method: 'PUT',
        url: `/api/auctions/${created.id}/cancel`,
        headers: { authorization: `Bearer ${authToken}` },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().data.status).toBe('CANCELLED')
    })
  })
})
