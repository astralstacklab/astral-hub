import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import cors from '@fastify/cors'
import { config } from '../config/index.js'

const corsPlugin: FastifyPluginAsync = async (server) => {
  await server.register(cors, {
    origin:
      config.NODE_ENV === 'production'
        ? ['https://card-erp.com', 'https://admin.card-erp.com']
        : true,
    credentials: true,
  })
}

export default fp(corsPlugin, { name: 'cors' })
