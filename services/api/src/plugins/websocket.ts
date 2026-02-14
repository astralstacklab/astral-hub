import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import websocket from '@fastify/websocket'

const websocketPlugin: FastifyPluginAsync = async (server) => {
  await server.register(websocket)
}

export default fp(websocketPlugin, { name: 'websocket' })
