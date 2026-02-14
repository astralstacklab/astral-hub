import Fastify from 'fastify'
import { config } from './config/index.js'
import { logger, loggerConfig } from './utils/logger.js'

// Plugins
import prismaPlugin from './plugins/prisma.js'
import redisPlugin from './plugins/redis.js'
import authPlugin from './plugins/auth.js'

// Middlewares
import corsMiddleware from './middlewares/cors.js'
import rateLimiterMiddleware from './middlewares/rate-limiter.js'
import errorHandlerMiddleware from './middlewares/error-handler.js'

// Routes
import { productsRoutes } from './modules/products/index.js'

export async function buildServer() {
  const server = Fastify({
    logger: loggerConfig,
  })

  // 註冊 plugins（順序重要：prisma/redis 先於 auth）
  await server.register(prismaPlugin)
  await server.register(redisPlugin)
  await server.register(authPlugin)

  // 註冊 middlewares
  await server.register(corsMiddleware)
  await server.register(rateLimiterMiddleware)
  await server.register(errorHandlerMiddleware)

  // Health check
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // 業務路由
  await server.register(productsRoutes, { prefix: '/api/products' })

  // API 版本資訊
  server.get('/api', async () => {
    return {
      name: 'Card ERP API',
      version: '0.1.0',
      environment: config.NODE_ENV,
    }
  })

  return server
}

async function start() {
  try {
    const server = await buildServer()

    await server.listen({
      port: config.API_PORT,
      host: config.API_HOST,
    })
  } catch (err) {
    logger.error(err)
    process.exit(1)
  }
}

// 只在直接執行時啟動，避免被 test import 時觸發
const isMainModule =
  process.argv[1]?.endsWith('server.js') || process.argv[1]?.endsWith('server.ts')
if (isMainModule) {
  start()
}
