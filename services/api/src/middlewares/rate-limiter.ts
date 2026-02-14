import type { FastifyPluginAsync } from 'fastify'
import rateLimit from '@fastify/rate-limit'

const rateLimiterMiddleware: FastifyPluginAsync = async (server) => {
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis: server.redis,
  })
}

export default rateLimiterMiddleware
