import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import rateLimit from '@fastify/rate-limit'

const rateLimiterPlugin: FastifyPluginAsync = async (server) => {
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis: server.redis,
  })
}

export default fp(rateLimiterPlugin, { name: 'rate-limiter' })
