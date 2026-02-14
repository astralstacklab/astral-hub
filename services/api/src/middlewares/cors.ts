import type { FastifyPluginAsync } from 'fastify'
import cors from '@fastify/cors'
import { config } from '../config/index.js'

const corsMiddleware: FastifyPluginAsync = async (server) => {
  await server.register(cors, {
    origin:
      config.NODE_ENV === 'production'
        ? ['https://card-erp.com', 'https://admin.card-erp.com']
        : true,
    credentials: true,
  })
}

export default corsMiddleware
