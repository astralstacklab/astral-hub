import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestServer, closeTestServer } from '../../helpers.js'

describe('Products API', () => {
  let server: FastifyInstance
  let authToken: string

  beforeAll(async () => {
    server = await buildTestServer()
    // 產生測試用 JWT
    authToken = server.jwt.sign({ id: 'test-admin', role: 'SUPER_ADMIN' })
  })

  afterAll(async () => {
    await server.prisma.orderItem.deleteMany()
    await server.prisma.product.deleteMany()
    await closeTestServer(server)
  })

  beforeEach(async () => {
    await server.prisma.orderItem.deleteMany()
    await server.prisma.product.deleteMany()
    // 清除 Redis 快取
    const keys = await server.redis.keys('products:*')
    if (keys.length > 0) await server.redis.del(...keys)
  })

  const samplePayload = {
    type: 'CARD',
    category: '寶可夢',
    name: '皮卡丘 V (SR)',
    costPrice: 1000,
    sellingPrice: 3000,
    channel: 'BOTH',
    description: '測試商品',
  }

  describe('POST /api/products', () => {
    it('should create a product (201)', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/products',
        headers: { authorization: `Bearer ${authToken}` },
        payload: samplePayload,
      })

      expect(response.statusCode).toBe(201)
      const json = response.json()
      expect(json.success).toBe(true)
      expect(json.data.name).toBe('皮卡丘 V (SR)')
      expect(json.data.status).toBe('PENDING')
    })

    it('should return 400 for invalid payload', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/products',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { name: '缺少必填欄位' },
      })

      expect(response.statusCode).toBe(400)
      const json = response.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 401 without token', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/products',
        payload: samplePayload,
      })

      expect(response.statusCode).toBe(401)
      const json = response.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('GET /api/products', () => {
    it('should return products list with pagination', async () => {
      // 先建立商品
      await server.inject({
        method: 'POST',
        url: '/api/products',
        headers: { authorization: `Bearer ${authToken}` },
        payload: samplePayload,
      })

      const response = await server.inject({
        method: 'GET',
        url: '/api/products?page=1&limit=10',
      })

      expect(response.statusCode).toBe(200)
      const json = response.json()
      expect(json.success).toBe(true)
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data).toHaveLength(1)
      expect(json.meta).toBeDefined()
      expect(json.meta.page).toBe(1)
      expect(json.meta.total).toBe(1)
    })

    it('should return empty list when no products', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/products',
      })

      expect(response.statusCode).toBe(200)
      const json = response.json()
      expect(json.data).toHaveLength(0)
      expect(json.meta.total).toBe(0)
    })
  })

  describe('GET /api/products/:id', () => {
    it('should return a single product', async () => {
      const createRes = await server.inject({
        method: 'POST',
        url: '/api/products',
        headers: { authorization: `Bearer ${authToken}` },
        payload: samplePayload,
      })
      const productId = createRes.json().data.id

      const response = await server.inject({
        method: 'GET',
        url: `/api/products/${productId}`,
      })

      expect(response.statusCode).toBe(200)
      const json = response.json()
      expect(json.success).toBe(true)
      expect(json.data.id).toBe(productId)
    })

    it('should return 404 for non-existent product', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/products/00000000-0000-0000-0000-000000000000',
      })

      expect(response.statusCode).toBe(404)
      const json = response.json()
      expect(json.error.code).toBe('PRODUCT_NOT_FOUND')
    })
  })

  describe('PUT /api/products/:id', () => {
    it('should update a product', async () => {
      const createRes = await server.inject({
        method: 'POST',
        url: '/api/products',
        headers: { authorization: `Bearer ${authToken}` },
        payload: samplePayload,
      })
      const productId = createRes.json().data.id

      const response = await server.inject({
        method: 'PUT',
        url: `/api/products/${productId}`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { name: '更新後的名稱', sellingPrice: 5000 },
      })

      expect(response.statusCode).toBe(200)
      const json = response.json()
      expect(json.data.name).toBe('更新後的名稱')
      expect(Number(json.data.sellingPrice)).toBe(5000)
    })
  })

  describe('DELETE /api/products/:id', () => {
    it('should delete a product (204)', async () => {
      const createRes = await server.inject({
        method: 'POST',
        url: '/api/products',
        headers: { authorization: `Bearer ${authToken}` },
        payload: samplePayload,
      })
      const productId = createRes.json().data.id

      const response = await server.inject({
        method: 'DELETE',
        url: `/api/products/${productId}`,
        headers: { authorization: `Bearer ${authToken}` },
      })

      expect(response.statusCode).toBe(204)

      // 確認已刪除
      const getRes = await server.inject({
        method: 'GET',
        url: `/api/products/${productId}`,
      })
      expect(getRes.statusCode).toBe(404)
    })
  })

  describe('PATCH /api/products/:id/status', () => {
    it('should update product status', async () => {
      const createRes = await server.inject({
        method: 'POST',
        url: '/api/products',
        headers: { authorization: `Bearer ${authToken}` },
        payload: samplePayload,
      })
      const productId = createRes.json().data.id

      const response = await server.inject({
        method: 'PATCH',
        url: `/api/products/${productId}/status`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { status: 'LISTED' },
      })

      expect(response.statusCode).toBe(200)
      const json = response.json()
      expect(json.data.status).toBe('LISTED')
    })
  })

  describe('GET /api/products/:id/qrcode', () => {
    it('should generate QR code for product', async () => {
      const createRes = await server.inject({
        method: 'POST',
        url: '/api/products',
        headers: { authorization: `Bearer ${authToken}` },
        payload: samplePayload,
      })
      const productId = createRes.json().data.id

      const response = await server.inject({
        method: 'GET',
        url: `/api/products/${productId}/qrcode`,
        headers: { authorization: `Bearer ${authToken}` },
      })

      expect(response.statusCode).toBe(200)
      const json = response.json()
      expect(json.success).toBe(true)
      expect(json.data.productId).toBe(productId)
      expect(json.data.qrCode).toContain('data:image/png;base64,')
    })

    it('should return 404 for non-existent product', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/products/00000000-0000-0000-0000-000000000000/qrcode',
        headers: { authorization: `Bearer ${authToken}` },
      })

      expect(response.statusCode).toBe(404)
    })
  })
})
