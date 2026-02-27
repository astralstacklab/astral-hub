import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { config } from '../config/index.js'

const swaggerPlugin: FastifyPluginAsync = async (server) => {
  await server.register(swagger, {
    openapi: {
      info: {
        title: 'Astral Hub API',
        description: 'OMO 收藏卡交易平台 API 文檔',
        version: '0.1.0',
      },
      servers: [
        {
          url: `http://localhost:${config.API_PORT}`,
          description: 'Development',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [
        { name: 'Products', description: '商品管理' },
        { name: 'System', description: '系統資訊' },
      ],
    },
  })

  await server.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  })
}

export default fp(swaggerPlugin, { name: 'swagger' })
