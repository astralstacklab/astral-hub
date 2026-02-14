import type { FastifyInstance } from 'fastify'
import { buildServer } from '../src/server.js'

export async function buildTestServer(): Promise<FastifyInstance> {
  const server = await buildServer()
  await server.ready()
  return server
}

export async function closeTestServer(server: FastifyInstance) {
  await server.close()
}
