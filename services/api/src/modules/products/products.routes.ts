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

// ── 共用 JSON Schema 片段 ──────────────────────────
const ErrorResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', enum: [false] },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
} as const

const ProductSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    type: { type: 'string', enum: ['CARD', 'ACCESSORY'] },
    category: { type: 'string' },
    name: { type: 'string' },
    series: { type: 'string', nullable: true },
    cardNumber: { type: 'string', nullable: true },
    gradingStatus: { type: 'string', enum: ['RAW', 'PSA', 'ARS', 'BGS'] },
    gradingScore: { type: 'number', nullable: true },
    costPrice: { type: 'number' },
    sellingPrice: { type: 'number' },
    status: { type: 'string', enum: ['PENDING', 'LISTED', 'SOLD'] },
    channel: { type: 'string', enum: ['ONLINE', 'OFFLINE', 'BOTH'] },
    description: { type: 'string' },
    conditionNotes: { type: 'string', nullable: true },
    supplier: { type: 'string', nullable: true },
    supplierContact: { type: 'string', nullable: true },
    stockQuantity: { type: 'integer' },
    sellerId: { type: 'string', format: 'uuid', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const

const productsRoutes: FastifyPluginAsync = async (server) => {
  const productsService = new ProductsService(server.prisma)

  // ============================================
  // GET / — 查詢商品列表
  // ============================================
  server.get(
    '/',
    {
      schema: {
        tags: ['Products'],
        summary: '查詢商品列表',
        description: '支援分頁、篩選（category/status/channel/price range）、搜尋、排序',
        querystring: {
          type: 'object',
          properties: {
            category: { type: 'string', description: '商品分類' },
            status: { type: 'string', enum: ['PENDING', 'LISTED', 'SOLD'] },
            channel: { type: 'string', enum: ['ONLINE', 'OFFLINE', 'BOTH'] },
            minPrice: { type: 'number', description: '最低價格' },
            maxPrice: { type: 'number', description: '最高價格' },
            search: { type: 'string', description: '搜尋關鍵字（name / cardNumber）' },
            page: { type: 'integer', default: 1, minimum: 1 },
            limit: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
            sort: {
              type: 'string',
              enum: ['price:asc', 'price:desc', 'createdAt:asc', 'createdAt:desc'],
            },
          },
        },
        response: {
          200: {
            description: '成功回傳商品列表',
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [true] },
              data: { type: 'array', items: ProductSchema },
              meta: {
                type: 'object',
                properties: {
                  page: { type: 'integer' },
                  limit: { type: 'integer' },
                  total: { type: 'integer' },
                  totalPages: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
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
    }
  )

  // ============================================
  // GET /:id — 查詢單一商品
  // ============================================
  server.get(
    '/:id',
    {
      schema: {
        tags: ['Products'],
        summary: '查詢單一商品',
        description: '根據 ID 查詢商品詳情，含 seller 與 auction 關聯',
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
        response: {
          200: {
            description: '成功回傳商品詳情',
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [true] },
              data: ProductSchema,
            },
          },
          404: { description: '找不到指定商品', ...ErrorResponseSchema },
        },
      },
    },
    async (request, reply) => {
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
    }
  )

  // ============================================
  // POST / — 新增商品（需認證）
  // ============================================
  server.post(
    '/',
    {
      onRequest: [server.authenticate],
      schema: {
        tags: ['Products'],
        summary: '新增商品',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['type', 'category', 'name', 'costPrice', 'sellingPrice', 'description'],
          properties: {
            type: { type: 'string', enum: ['CARD', 'ACCESSORY'] },
            category: { type: 'string', minLength: 1, maxLength: 50 },
            name: { type: 'string', minLength: 1, maxLength: 255 },
            series: { type: 'string', maxLength: 255 },
            cardNumber: { type: 'string', maxLength: 100 },
            gradingStatus: { type: 'string', enum: ['RAW', 'PSA', 'ARS', 'BGS'] },
            gradingScore: { type: 'number', minimum: 0, maximum: 10 },
            costPrice: { type: 'number', exclusiveMinimum: 0 },
            sellingPrice: { type: 'number', exclusiveMinimum: 0 },
            sellerId: { type: 'string', format: 'uuid' },
            channel: { type: 'string', enum: ['ONLINE', 'OFFLINE', 'BOTH'], default: 'BOTH' },
            description: { type: 'string', minLength: 1 },
            conditionNotes: { type: 'string' },
            supplier: { type: 'string', maxLength: 255 },
            supplierContact: { type: 'string', maxLength: 255 },
            stockQuantity: { type: 'integer', minimum: 1, default: 1 },
          },
        },
        response: {
          201: {
            description: '商品建立成功',
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [true] },
              data: ProductSchema,
            },
          },
          400: { description: '請求參數驗證失敗', ...ErrorResponseSchema },
          401: { description: '未授權', ...ErrorResponseSchema },
        },
      },
    },
    async (request, reply) => {
      const data = CreateProductSchema.parse(request.body)

      const product = await productsService.createProduct(data)

      await invalidateListCache(server)

      return reply.code(201).send(successResponse(product))
    }
  )

  // ============================================
  // PUT /:id — 更新商品（需認證）
  // ============================================
  server.put(
    '/:id',
    {
      onRequest: [server.authenticate],
      schema: {
        tags: ['Products'],
        summary: '更新商品',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 255 },
            series: { type: 'string', maxLength: 255 },
            cardNumber: { type: 'string', maxLength: 100 },
            gradingStatus: { type: 'string', enum: ['RAW', 'PSA', 'ARS', 'BGS'] },
            gradingScore: { type: 'number', minimum: 0, maximum: 10 },
            costPrice: { type: 'number', exclusiveMinimum: 0 },
            sellingPrice: { type: 'number', exclusiveMinimum: 0 },
            channel: { type: 'string', enum: ['ONLINE', 'OFFLINE', 'BOTH'] },
            description: { type: 'string', minLength: 1 },
            conditionNotes: { type: 'string' },
            supplier: { type: 'string', maxLength: 255 },
            supplierContact: { type: 'string', maxLength: 255 },
            stockQuantity: { type: 'integer', minimum: 1 },
          },
        },
        response: {
          200: {
            description: '商品更新成功',
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [true] },
              data: ProductSchema,
            },
          },
          400: { description: '請求參數驗證失敗', ...ErrorResponseSchema },
          401: { description: '未授權', ...ErrorResponseSchema },
          404: { description: '找不到指定商品', ...ErrorResponseSchema },
        },
      },
    },
    async (request, reply) => {
      const { id } = ProductIdParamSchema.parse(request.params)
      const data = UpdateProductSchema.parse(request.body)

      const product = await productsService.updateProduct(id, data)

      await server.redis.del(`products:${id}`)
      await invalidateListCache(server)

      return reply.send(successResponse(product))
    }
  )

  // ============================================
  // DELETE /:id — 刪除商品（需認證）
  // ============================================
  server.delete(
    '/:id',
    {
      onRequest: [server.authenticate],
      schema: {
        tags: ['Products'],
        summary: '刪除商品',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
        response: {
          204: { description: '商品刪除成功', type: 'null' },
          401: { description: '未授權', ...ErrorResponseSchema },
          404: { description: '找不到指定商品', ...ErrorResponseSchema },
        },
      },
    },
    async (request, reply) => {
      const { id } = ProductIdParamSchema.parse(request.params)

      await productsService.deleteProduct(id)

      await server.redis.del(`products:${id}`)
      await invalidateListCache(server)

      return reply.code(204).send()
    }
  )

  // ============================================
  // PATCH /:id/status — 更新商品狀態（需認證）
  // ============================================
  server.patch(
    '/:id/status',
    {
      onRequest: [server.authenticate],
      schema: {
        tags: ['Products'],
        summary: '更新商品狀態',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
        body: {
          type: 'object',
          required: ['status'],
          properties: { status: { type: 'string', enum: ['PENDING', 'LISTED', 'SOLD'] } },
        },
        response: {
          200: {
            description: '狀態更新成功',
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [true] },
              data: ProductSchema,
            },
          },
          400: { description: '請求參數驗證失敗', ...ErrorResponseSchema },
          401: { description: '未授權', ...ErrorResponseSchema },
          404: { description: '找不到指定商品', ...ErrorResponseSchema },
        },
      },
    },
    async (request, reply) => {
      const { id } = ProductIdParamSchema.parse(request.params)
      const { status } = UpdateProductStatusSchema.parse(request.body)

      const product = await productsService.updateProductStatus(id, status)

      await server.redis.del(`products:${id}`)
      await invalidateListCache(server)

      return reply.send(successResponse(product))
    }
  )

  // ============================================
  // POST /:id/images — 圖片上傳（預留）
  // ============================================
  server.post(
    '/:id/images',
    {
      onRequest: [server.authenticate],
      schema: {
        tags: ['Products'],
        summary: '上傳商品圖片（未實作）',
        description: '待 GCS 整合後實作，目前回傳 501',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
        response: {
          401: { description: '未授權', ...ErrorResponseSchema },
          501: { description: '功能尚未實作', ...ErrorResponseSchema },
        },
      },
    },
    async (_request, reply) => {
      return reply
        .code(501)
        .send(errorResponse('NOT_IMPLEMENTED', '圖片上傳功能尚未實作，待 GCS 整合'))
    }
  )

  // ============================================
  // GET /:id/qrcode — 生成 QR Code（需認證）
  // ============================================
  server.get(
    '/:id/qrcode',
    {
      onRequest: [server.authenticate],
      schema: {
        tags: ['Products'],
        summary: '生成商品 QR Code',
        description: '回傳 base64 PNG data URL',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
        response: {
          200: {
            description: '成功回傳 QR Code',
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [true] },
              data: {
                type: 'object',
                properties: {
                  productId: { type: 'string', format: 'uuid' },
                  qrCode: { type: 'string', description: 'base64 PNG data URL' },
                },
              },
            },
          },
          401: { description: '未授權', ...ErrorResponseSchema },
          404: { description: '找不到指定商品', ...ErrorResponseSchema },
        },
      },
    },
    async (request, reply) => {
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
    }
  )
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
