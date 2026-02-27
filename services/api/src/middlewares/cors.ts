import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import cors from '@fastify/cors'
import { config } from '../config/index.js'

const corsPlugin: FastifyPluginAsync = async (server) => {
  await server.register(cors, {
    origin:
      config.NODE_ENV === 'production'
        ? ['https://astral-hub.com', 'https://admin.astral-hub.com']
        : true,
    credentials: true,
  })
}

export default fp(corsPlugin, { name: 'cors' })
