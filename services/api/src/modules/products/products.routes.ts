import type { FastifyPluginAsync } from 'fastify'
import { ProductsService } from './products.service.js'
import {
  CreateProductSchema,
  UpdateProductSchema,
  QueryProductsSchema,
  ProductIdParamSchema,
  UpdateProductStatusSchema,
} from './products.schema.js'
import { successResponse, errorResponse } from '../../utils/response.js'
import { generateQRCode } from '../../utils/qrcode-generator.js'

const productsRoutes: FastifyPluginAsync = async (server) => {
  const productsService = new ProductsService(server.prisma)

  // ============================================
  // GET / — 查詢商品列表
  // ============================================
  server.get('/', async (request, reply) => {
    const query = QueryProductsSchema.parse(request.query)

    const cacheKey = `products:list:${JSON.stringify(query)}`
    const cached = await server.redis.get(cacheKey)

    if (cached) {
      return reply.send(JSON.parse(cached))
    }

    const result = await productsService.getProducts(query)

    const response = successResponse(result.products, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    })

    await server.redis.setex(cacheKey, 300, JSON.stringify(response))

    return reply.send(response)
  })

  // ============================================
  // GET /:id — 查詢單一商品
  // ============================================
  server.get('/:id', async (request, reply) => {
    const { id } = ProductIdParamSchema.parse(request.params)

    const cacheKey = `products:${id}`
    const cached = await server.redis.get(cacheKey)

    if (cached) {
      return reply.send(JSON.parse(cached))
    }

    const product = await productsService.getProductById(id)

    if (!product) {
      return reply.code(404).send(errorResponse('PRODUCT_NOT_FOUND', '找不到指定商品'))
    }

    const response = successResponse(product)

    await server.redis.setex(cacheKey, 600, JSON.stringify(response))

    return reply.send(response)
  })

  // ============================================
  // POST / — 新增商品（需認證）
  // ============================================
  server.post('/', { onRequest: [server.authenticate] }, async (request, reply) => {
    const data = CreateProductSchema.parse(request.body)

    const product = await productsService.createProduct(data)

    await invalidateListCache(server)

    return reply.code(201).send(successResponse(product))
  })

  // ============================================
  // PUT /:id — 更新商品（需認證）
  // ============================================
  server.put('/:id', { onRequest: [server.authenticate] }, async (request, reply) => {
    const { id } = ProductIdParamSchema.parse(request.params)
    const data = UpdateProductSchema.parse(request.body)

    const product = await productsService.updateProduct(id, data)

    await server.redis.del(`products:${id}`)
    await invalidateListCache(server)

    return reply.send(successResponse(product))
  })

  // ============================================
  // DELETE /:id — 刪除商品（需認證）
  // ============================================
  server.delete('/:id', { onRequest: [server.authenticate] }, async (request, reply) => {
    const { id } = ProductIdParamSchema.parse(request.params)

    await productsService.deleteProduct(id)

    await server.redis.del(`products:${id}`)
    await invalidateListCache(server)

    return reply.code(204).send()
  })

  // ============================================
  // PATCH /:id/status — 更新商品狀態（需認證）
  // ============================================
  server.patch('/:id/status', { onRequest: [server.authenticate] }, async (request, reply) => {
    const { id } = ProductIdParamSchema.parse(request.params)
    const { status } = UpdateProductStatusSchema.parse(request.body)

    const product = await productsService.updateProductStatus(id, status)

    await server.redis.del(`products:${id}`)
    await invalidateListCache(server)

    return reply.send(successResponse(product))
  })

  // ============================================
  // POST /:id/images — 圖片上傳（預留）
  // ============================================
  server.post('/:id/images', { onRequest: [server.authenticate] }, async (_request, reply) => {
    return reply
      .code(501)
      .send(errorResponse('NOT_IMPLEMENTED', '圖片上傳功能尚未實作，待 GCS 整合'))
  })

  // ============================================
  // GET /:id/qrcode — 生成 QR Code（需認證）
  // ============================================
  server.get('/:id/qrcode', { onRequest: [server.authenticate] }, async (request, reply) => {
    const { id } = ProductIdParamSchema.parse(request.params)

    const product = await productsService.getProductById(id)

    if (!product) {
      return reply.code(404).send(errorResponse('PRODUCT_NOT_FOUND', '找不到指定商品'))
    }

    const qrCode = await generateQRCode(id)

    return reply.send(
      successResponse({
        productId: id,
        qrCode,
      })
    )
  })
}

async function invalidateListCache(server: {
  redis: {
    keys: (pattern: string) => Promise<string[]>
    del: (...keys: string[]) => Promise<number>
  }
}) {
  const keys = await server.redis.keys('products:list:*')
  if (keys.length > 0) {
    await server.redis.del(...keys)
  }
}

export default productsRoutes
