import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestServer, closeTestServer } from './helpers.js'

describe('Server', () => {
  let server: FastifyInstance

  beforeAll(async () => {
    server = await buildTestServer()
  })

  afterAll(async () => {
    await closeTestServer(server)
  })

  it('should start successfully', () => {
    expect(server).toBeDefined()
  })

  describe('GET /health', () => {
    it('should respond with status ok', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
      })

      expect(response.statusCode).toBe(200)
      const json = response.json()
      expect(json.status).toBe('ok')
      expect(json.timestamp).toBeDefined()
    })
  })

  describe('GET /api', () => {
    it('should respond with API info', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api',
      })

      expect(response.statusCode).toBe(200)
      const json = response.json()
      expect(json.name).toBe('Card ERP API')
      expect(json.version).toBeDefined()
    })
  })

  describe('404 handling', () => {
    it('should return structured error for unknown routes', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/nonexistent',
      })

      expect(response.statusCode).toBe(404)
      const json = response.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('NOT_FOUND')
    })
  })

  describe('Prisma plugin', () => {
    it('should have prisma client available', () => {
      expect(server.prisma).toBeDefined()
    })

    it('should be able to query database', async () => {
      const count = await server.prisma.product.count()
      expect(count).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Redis plugin', () => {
    it('should have redis client available', () => {
      expect(server.redis).toBeDefined()
    })

    it('should be able to ping redis', async () => {
      const result = await server.redis.ping()
      expect(result).toBe('PONG')
    })
  })

  describe('Auth plugin', () => {
    it('should have authenticate decorator', () => {
      expect(server.authenticate).toBeDefined()
      expect(typeof server.authenticate).toBe('function')
    })

    it('should generate and verify JWT token', async () => {
      const token = server.jwt.sign({ id: 'test-user', role: 'ADMIN' })
      expect(token).toBeDefined()

      const decoded = server.jwt.verify(token) as { id: string; role: string }
      expect(decoded.id).toBe('test-user')
      expect(decoded.role).toBe('ADMIN')
    })
  })
})
