import type { FastifyPluginAsync, FastifyError } from 'fastify'
import fp from 'fastify-plugin'
import { config } from '../config/index.js'

const errorHandlerPlugin: FastifyPluginAsync = async (server) => {
  server.setErrorHandler((error: FastifyError, request, reply) => {
    server.log.error({ err: error, url: request.url }, 'Request error')

    // Zod v4 驗證錯誤（用 issues 屬性判斷，比 name 更可靠）
    if (
      error.name === 'ZodError' ||
      ('issues' in error && Array.isArray((error as Record<string, unknown>).issues))
    ) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '請求參數驗證失敗',
          details:
            config.NODE_ENV !== 'production'
              ? { issues: (error as unknown as { issues: unknown }).issues }
              : undefined,
        },
      })
    }

    // Fastify 錯誤（含 rate limit 429 等）
    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        success: false,
        error: {
          code: error.statusCode === 429 ? 'RATE_LIMITED' : 'BAD_REQUEST',
          message: error.message,
        },
      })
    }

    // 未知錯誤
    return reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: config.NODE_ENV === 'production' ? '伺服器內部錯誤' : error.message,
      },
    })
  })

  // 404 處理
  server.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `路由 ${request.method} ${request.url} 不存在`,
      },
    })
  })
}

export default fp(errorHandlerPlugin, { name: 'error-handler' })
