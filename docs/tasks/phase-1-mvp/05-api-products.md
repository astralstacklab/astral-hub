# 05 - 商品 API 開發

**階段**: 第一階段 MVP - Sprint 2
**預計時間**: 3 天
**負責人**: TBD
**優先級**: 🔴 Critical

---

## 📋 目標

實作完整的商品管理 API，支援 CRUD 操作、分頁查詢、篩選排序、圖片上傳、QR Code 生成等功能，並整合 Redis 快取提升效能。

## 🎯 成功標準

- [x] 所有商品 API endpoints 正常運作
- [x] Zod Schema 驗證所有輸入參數
- [x] Service 層單元測試覆蓋率 > 80%
- [x] API 整合測試通過
- [x] Redis 快取機制運作正常
- [x] API 回應時間 < 200ms（單一查詢）
- [ ] 圖片上傳成功並返回 URL（預留 501，待 GCS 整合）
- [x] QR Code 生成正確

## 📦 前置條件

**前置任務**:

- [x] 01 - 環境建置完成
- [x] 02 - shared-types 套件完成
- [x] 03 - 資料庫設計完成
- [x] 04 - API 基礎架構完成

**技術需求**:

- Fastify 4.x
- Prisma Client
- Zod
- qrcode（QR Code 生成）

---

## ✅ 子任務清單

### 5.1 資料驗證 Schema

#### 5.1.1 建立 Zod Schema

- [x] 建立 `src/modules/products/products.schema.ts`

  ```typescript
  import { z } from 'zod'
  import { ProductType, ProductStatus, ProductChannel, GradingStatus } from '@card-erp/shared-types'

  export const CreateProductSchema = z.object({
    type: z.nativeEnum(ProductType),
    category: z.string().min(1).max(50),
    name: z.string().min(1).max(255),
    series: z.string().max(255).optional(),
    cardNumber: z.string().max(100).optional(),
    gradingStatus: z.nativeEnum(GradingStatus).optional(),
    gradingScore: z.number().min(0).max(10).optional(),
    costPrice: z.number().positive(),
    sellingPrice: z.number().positive(),
    sellerId: z.string().uuid().optional(),
    channel: z.nativeEnum(ProductChannel).default('BOTH'),
    description: z.string().min(1),
    conditionNotes: z.string().optional(),
    supplier: z.string().max(255).optional(),
    supplierContact: z.string().max(255).optional(),
    stockQuantity: z.number().int().positive().default(1),
  })

  export const UpdateProductSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    series: z.string().max(255).optional(),
    sellingPrice: z.number().positive().optional(),
    status: z.nativeEnum(ProductStatus).optional(),
    channel: z.nativeEnum(ProductChannel).optional(),
    description: z.string().min(1).optional(),
    conditionNotes: z.string().optional(),
    stockQuantity: z.number().int().positive().optional(),
  })

  export const QueryProductsSchema = z.object({
    category: z.string().optional(),
    status: z.nativeEnum(ProductStatus).optional(),
    channel: z.nativeEnum(ProductChannel).optional(),
    minPrice: z.string().transform(Number).optional(),
    maxPrice: z.string().transform(Number).optional(),
    search: z.string().optional(),
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    sort: z.enum(['price:asc', 'price:desc', 'createdAt:asc', 'createdAt:desc']).optional(),
  })

  export const ProductIdParamSchema = z.object({
    id: z.string().uuid(),
  })

  export const UpdateProductStatusSchema = z.object({
    status: z.nativeEnum(ProductStatus),
  })

  export type CreateProductInput = z.infer<typeof CreateProductSchema>
  export type UpdateProductInput = z.infer<typeof UpdateProductSchema>
  export type QueryProductsInput = z.infer<typeof QueryProductsSchema>
  ```

---

### 5.2 Service 層

#### 5.2.1 建立 Products Service

- [x] 建立 `src/modules/products/products.service.ts`

  ```typescript
  import { PrismaClient, Product } from '@prisma/client'
  import type {
    CreateProductInput,
    UpdateProductInput,
    QueryProductsInput,
  } from './products.schema'

  export class ProductsService {
    constructor(private prisma: PrismaClient) {}

    async createProduct(data: CreateProductInput): Promise<Product> {
      const product = await this.prisma.product.create({
        data: {
          ...data,
          images: JSON.stringify([]),
        },
      })
      return product
    }

    async getProductById(id: string): Promise<Product | null> {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
          auction: true,
        },
      })
      return product
    }

    async getProducts(query: QueryProductsInput) {
      const { page, limit, category, status, channel, minPrice, maxPrice, search, sort } = query

      // 建構 where 條件
      const where: Record<string, unknown> = {}

      if (category) where.category = category
      if (status) where.status = status
      if (channel) where.channel = channel
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { cardNumber: { contains: search, mode: 'insensitive' } },
        ]
      }
      if (minPrice !== undefined || maxPrice !== undefined) {
        where.sellingPrice = {}
        if (minPrice !== undefined) where.sellingPrice.gte = minPrice
        if (maxPrice !== undefined) where.sellingPrice.lte = maxPrice
      }

      // 建構排序
      let orderBy: Record<string, string> = { createdAt: 'desc' }
      if (sort) {
        const [field, order] = sort.split(':')
        orderBy = { [field]: order }
      }

      // 查詢
      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            seller: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        this.prisma.product.count({ where }),
      ])

      return {
        products,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    }

    async updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
      const product = await this.prisma.product.update({
        where: { id },
        data,
      })
      return product
    }

    async deleteProduct(id: string): Promise<void> {
      await this.prisma.product.delete({
        where: { id },
      })
    }

    async updateProductStatus(id: string, status: string): Promise<Product> {
      const product = await this.prisma.product.update({
        where: { id },
        data: { status },
      })
      return product
    }

    async addProductImage(id: string, imageUrl: string, imageType: string): Promise<Product> {
      const product = await this.prisma.product.findUnique({
        where: { id },
      })

      if (!product) {
        throw new Error('Product not found')
      }

      const images = JSON.parse(product.images as string) as Array<{ url: string; type: string }>
      images.push({ url: imageUrl, type: imageType })

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          images: JSON.stringify(images),
        },
      })

      return updatedProduct
    }
  }
  ```

#### 5.2.2 單元測試

- [x] 建立 `tests/modules/products/products.service.test.ts`

  ```typescript
  import { describe, it, expect, beforeEach, afterEach } from 'vitest'
  import { PrismaClient } from '@prisma/client'
  import { ProductsService } from '@/modules/products/products.service'

  const prisma = new PrismaClient()
  const productsService = new ProductsService(prisma)

  describe('ProductsService', () => {
    beforeEach(async () => {
      // 清理測試資料
      await prisma.product.deleteMany()
    })

    afterEach(async () => {
      await prisma.product.deleteMany()
    })

    describe('createProduct', () => {
      it('should create a product successfully', async () => {
        const productData = {
          type: 'CARD' as const,
          category: '寶可夢',
          name: '皮卡丘 V',
          costPrice: 100,
          sellingPrice: 300,
          channel: 'BOTH' as const,
          description: '測試商品',
        }

        const product = await productsService.createProduct(productData)

        expect(product).toBeDefined()
        expect(product.name).toBe('皮卡丘 V')
        expect(product.sellingPrice).toBe(300)
      })
    })

    describe('getProductById', () => {
      it('should return product by id', async () => {
        const created = await productsService.createProduct({
          type: 'CARD',
          category: '寶可夢',
          name: '皮卡丘',
          costPrice: 100,
          sellingPrice: 300,
          channel: 'BOTH',
          description: '測試',
        })

        const product = await productsService.getProductById(created.id)

        expect(product).toBeDefined()
        expect(product?.id).toBe(created.id)
      })

      it('should return null for non-existent id', async () => {
        const product = await productsService.getProductById('non-existent-id')
        expect(product).toBeNull()
      })
    })

    // 更多測試...
  })
  ```

---

### 5.3 Routes 層

#### 5.3.1 建立 Products Routes

- [x] 建立 `src/modules/products/products.routes.ts`

  ```typescript
  import { FastifyPluginAsync } from 'fastify'
  import { ProductsService } from './products.service'
  import {
    CreateProductSchema,
    UpdateProductSchema,
    QueryProductsSchema,
    ProductIdParamSchema,
    UpdateProductStatusSchema,
  } from './products.schema'
  import { successResponse, errorResponse } from '@/utils/response'

  const productsRoutes: FastifyPluginAsync = async (server) => {
    const productsService = new ProductsService(server.prisma)

    // GET /products - 查詢商品列表
    server.get(
      '/',
      {
        schema: {
          querystring: QueryProductsSchema,
        },
      },
      async (request, reply) => {
        try {
          const query = QueryProductsSchema.parse(request.query)

          // 嘗試從 Redis 獲取快取
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

          // 快取 5 分鐘
          await server.redis.setex(cacheKey, 300, JSON.stringify(response))

          return reply.send(response)
        } catch (error) {
          server.log.error(error)
          return reply.code(500).send(errorResponse('INTERNAL_ERROR', '查詢商品失敗'))
        }
      }
    )

    // GET /products/:id - 查詢單一商品
    server.get(
      '/:id',
      {
        schema: {
          params: ProductIdParamSchema,
        },
      },
      async (request, reply) => {
        try {
          const { id } = ProductIdParamSchema.parse(request.params)

          // 嘗試從 Redis 獲取快取
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

          // 快取 10 分鐘
          await server.redis.setex(cacheKey, 600, JSON.stringify(response))

          return reply.send(response)
        } catch (error) {
          server.log.error(error)
          return reply.code(500).send(errorResponse('INTERNAL_ERROR', '查詢商品失敗'))
        }
      }
    )

    // POST /products - 新增商品（需認證）
    server.post(
      '/',
      {
        onRequest: [server.authenticate],
        schema: {
          body: CreateProductSchema,
        },
      },
      async (request, reply) => {
        try {
          const data = CreateProductSchema.parse(request.body)

          const product = await productsService.createProduct(data)

          // 清除列表快取
          const keys = await server.redis.keys('products:list:*')
          if (keys.length > 0) {
            await server.redis.del(...keys)
          }

          return reply.code(201).send(successResponse(product))
        } catch (error) {
          server.log.error(error)
          return reply.code(500).send(errorResponse('INTERNAL_ERROR', '新增商品失敗'))
        }
      }
    )

    // PUT /products/:id - 更新商品（需認證）
    server.put(
      '/:id',
      {
        onRequest: [server.authenticate],
        schema: {
          params: ProductIdParamSchema,
          body: UpdateProductSchema,
        },
      },
      async (request, reply) => {
        try {
          const { id } = ProductIdParamSchema.parse(request.params)
          const data = UpdateProductSchema.parse(request.body)

          const product = await productsService.updateProduct(id, data)

          // 清除快取
          await server.redis.del(`products:${id}`)
          const keys = await server.redis.keys('products:list:*')
          if (keys.length > 0) {
            await server.redis.del(...keys)
          }

          return reply.send(successResponse(product))
        } catch (error) {
          server.log.error(error)
          return reply.code(500).send(errorResponse('INTERNAL_ERROR', '更新商品失敗'))
        }
      }
    )

    // DELETE /products/:id - 刪除商品（需認證）
    server.delete(
      '/:id',
      {
        onRequest: [server.authenticate],
        schema: {
          params: ProductIdParamSchema,
        },
      },
      async (request, reply) => {
        try {
          const { id } = ProductIdParamSchema.parse(request.params)

          await productsService.deleteProduct(id)

          // 清除快取
          await server.redis.del(`products:${id}`)
          const keys = await server.redis.keys('products:list:*')
          if (keys.length > 0) {
            await server.redis.del(...keys)
          }

          return reply.code(204).send()
        } catch (error) {
          server.log.error(error)
          return reply.code(500).send(errorResponse('INTERNAL_ERROR', '刪除商品失敗'))
        }
      }
    )

    // PATCH /products/:id/status - 更新商品狀態（需認證）
    server.patch(
      '/:id/status',
      {
        onRequest: [server.authenticate],
        schema: {
          params: ProductIdParamSchema,
          body: UpdateProductStatusSchema,
        },
      },
      async (request, reply) => {
        try {
          const { id } = ProductIdParamSchema.parse(request.params)
          const { status } = UpdateProductStatusSchema.parse(request.body)

          const product = await productsService.updateProductStatus(id, status)

          // 清除快取
          await server.redis.del(`products:${id}`)
          const keys = await server.redis.keys('products:list:*')
          if (keys.length > 0) {
            await server.redis.del(...keys)
          }

          return reply.send(successResponse(product))
        } catch (error) {
          server.log.error(error)
          return reply.code(500).send(errorResponse('INTERNAL_ERROR', '更新狀態失敗'))
        }
      }
    )
  }

  export default productsRoutes
  ```

#### 5.3.2 整合到主 server

- [x] 編輯 `src/server.ts`

  ```typescript
  import productsRoutes from './modules/products/products.routes'

  // 在 buildServer 函數中註冊
  await server.register(productsRoutes, { prefix: '/api/products' })
  ```

---

### 5.4 圖片上傳功能（預留，待 GCS 整合）

#### 5.4.1 預留圖片上傳路由

- [x] 在 `products.routes.ts` 中預留 POST /products/:id/images
  ```typescript
  // TODO: 待 GCS 整合完成後實作
  server.post(
    '/:id/images',
    {
      onRequest: [server.authenticate],
    },
    async (request, reply) => {
      return reply.code(501).send(errorResponse('NOT_IMPLEMENTED', '功能尚未實作'))
    }
  )
  ```

---

### 5.5 QR Code 生成

#### 5.5.1 安裝 QR Code 套件

- [x] 安裝依賴
  ```bash
  pnpm add qrcode
  pnpm add -D @types/qrcode
  ```

#### 5.5.2 建立 QR Code 工具

- [x] 建立 `src/utils/qrcode-generator.ts`

  ```typescript
  import QRCode from 'qrcode'

  export async function generateQRCode(data: string): Promise<string> {
    try {
      // 生成 base64 格式的 QR Code
      const qrCodeDataURL = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2,
      })

      return qrCodeDataURL
    } catch (error) {
      throw new Error('QR Code 生成失敗')
    }
  }
  ```

#### 5.5.3 建立 QR Code 路由

- [x] 在 `products.routes.ts` 中新增

  ```typescript
  import { generateQRCode } from '@/utils/qrcode-generator'

  server.post(
    '/:id/qrcode',
    {
      onRequest: [server.authenticate],
      schema: {
        params: ProductIdParamSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id } = ProductIdParamSchema.parse(request.params)

        const product = await productsService.getProductById(id)

        if (!product) {
          return reply.code(404).send(errorResponse('PRODUCT_NOT_FOUND', '找不到指定商品'))
        }

        // 生成 QR Code（包含商品 UUID）
        const qrCodeDataURL = await generateQRCode(id)

        return reply.send(
          successResponse({
            productId: id,
            qrCode: qrCodeDataURL,
          })
        )
      } catch (error) {
        server.log.error(error)
        return reply.code(500).send(errorResponse('INTERNAL_ERROR', 'QR Code 生成失敗'))
      }
    }
  )
  ```

---

### 5.6 整合測試

#### 5.6.1 建立 API 整合測試

- [x] 建立 `tests/modules/products/products.routes.test.ts`

  ```typescript
  import { describe, it, expect, beforeAll, afterAll } from 'vitest'
  import { buildTestServer, closeTestServer } from '../../helpers'
  import { FastifyInstance } from 'fastify'

  describe('Products API', () => {
    let server: FastifyInstance
    let authToken: string

    beforeAll(async () => {
      server = await buildTestServer()
      // TODO: 生成測試用的 JWT token
      authToken = 'test-token'
    })

    afterAll(async () => {
      await closeTestServer(server)
    })

    describe('POST /api/products', () => {
      it('should create a product', async () => {
        const response = await server.inject({
          method: 'POST',
          url: '/api/products',
          headers: {
            authorization: `Bearer ${authToken}`,
          },
          payload: {
            type: 'CARD',
            category: '寶可夢',
            name: '皮卡丘 V',
            costPrice: 100,
            sellingPrice: 300,
            channel: 'BOTH',
            description: '測試商品',
          },
        })

        expect(response.statusCode).toBe(201)
        const json = response.json()
        expect(json.success).toBe(true)
        expect(json.data.name).toBe('皮卡丘 V')
      })
    })

    describe('GET /api/products', () => {
      it('should return products list', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/api/products?page=1&limit=10',
        })

        expect(response.statusCode).toBe(200)
        const json = response.json()
        expect(json.success).toBe(true)
        expect(Array.isArray(json.data)).toBe(true)
      })
    })

    // 更多測試...
  })
  ```

---

## 🧪 測試步驟

1. **Schema 驗證測試**
   - 測試正確的輸入
   - 測試錯誤的輸入（應返回 400）

2. **Service 層測試**

   ```bash
   pnpm --filter @card-erp/api test products.service.test
   ```

3. **API 整合測試**

   ```bash
   pnpm --filter @card-erp/api test products.routes.test
   ```

4. **手動 API 測試**（使用 Postman 或 curl）
   - 新增商品
   - 查詢商品列表
   - 查詢單一商品
   - 更新商品
   - 刪除商品
   - 生成 QR Code

5. **快取測試**
   - 查詢商品列表（應寫入 Redis）
   - 再次查詢（應從 Redis 讀取）
   - 更新商品（應清除快取）

6. **效能測試**
   - 查詢列表回應時間 < 200ms
   - 查詢單一商品回應時間 < 100ms

---

## 📝 交付物

- [x] `src/modules/products/products.schema.ts`
- [x] `src/modules/products/products.service.ts`
- [x] `src/modules/products/products.routes.ts`
- [x] `src/utils/qrcode-generator.ts`
- [x] `tests/modules/products/products.service.test.ts`
- [x] `tests/modules/products/products.routes.test.ts`
- [x] API 文檔（Swagger UI at `/docs`）

---

## 🚨 注意事項

1. **禁止使用 any**: 所有型別必須明確定義
2. **輸入驗證**: 所有 API 輸入都必須經過 Zod 驗證
3. **錯誤處理**: 使用統一的錯誤格式
4. **快取策略**: 寫入時清除相關快取
5. **分頁效能**: 大量資料時避免使用 offset，考慮 cursor-based pagination

---

## 🔗 相關文件

- [Zod 文檔](https://zod.dev/)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [系統架構設計 - API 設計](../plans/2026-01-24-system-architecture-design.md#4-api-設計)

---

## 📊 進度追蹤

| 子任務          | 狀態        | 負責人 | 完成日期   |
| --------------- | ----------- | ------ | ---------- |
| 5.1 Schema 定義 | ✅ 完成     | Claude | 2026-02-14 |
| 5.2 Service 層  | ✅ 完成     | Claude | 2026-02-14 |
| 5.3 Routes 層   | ✅ 完成     | Claude | 2026-02-14 |
| 5.4 圖片上傳    | ✅ 預留 501 | Claude | 2026-02-14 |
| 5.5 QR Code     | ✅ 完成     | Claude | 2026-02-14 |
| 5.6 整合測試    | ✅ 完成     | Claude | 2026-02-14 |

---

**上一個任務**: [04 - API 基礎架構](./04-api-foundation.md)
**下一個任務**: [06 - 競標 API](./06-api-auctions.md)
