import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import Redis from 'ioredis'
import { config } from '../config/index.js'

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis
  }
}

const redisPlugin: FastifyPluginAsync = async (server) => {
  const redis = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 3,
  })

  redis.on('error', (err) => {
    server.log.error({ err }, 'Redis error')
  })

  redis.on('connect', () => {
    server.log.info('Redis connected')
  })

  server.decorate('redis', redis)

  server.addHook('onClose', async () => {
    await redis.quit()
  })
}

export default fp(redisPlugin, { name: 'redis' })
