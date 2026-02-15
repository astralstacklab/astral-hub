# 07 - 訂單 API 開發

**階段**: 第一階段 MVP - Sprint 2
**預計時間**: 3 天
**負責人**: TBD
**優先級**: 🔴 Critical

---

## 📋 目標

實作完整的訂單管理 API，支援線上與 POS 兩種通路的訂單建立、查詢、狀態更新等功能，並整合庫存扣減、訂單編號自動生成等邏輯。

## 🎯 成功標準

- [ ] 所有訂單 API endpoints 正常運作
- [ ] 訂單建立時正確扣減庫存
- [ ] 訂單編號自動生成（格式：ORD20260124001）
- [ ] 支援線上與 POS 兩種通路
- [ ] 訂單狀態流轉邏輯正確
- [ ] 單元測試覆蓋率 > 80%
- [ ] API 整合測試通過
- [ ] 交易使用資料庫 Transaction 保證一致性

## 📦 前置條件

**前置任務**:

- [x] 01 - 環境建置完成
- [x] 02 - shared-types 套件完成
- [x] 03 - 資料庫設計完成
- [x] 04 - API 基礎架構完成
- [x] 05 - 商品 API 完成

**技術需求**:

- Fastify 5.x（非 4.x）
- Prisma Transactions

---

## ✅ 子任務清單

### 7.1 資料驗證 Schema

#### 7.1.1 建立 Zod Schema

- [ ] 建立 `src/modules/orders/orders.schema.ts`

  ```typescript
  import { z } from 'zod'
  import {
    PaymentMethod,
    PaymentStatus,
    ShippingMethod,
    OrderStatus,
    OrderChannel,
  } from '@card-erp/shared-types'

  export const CreateOrderItemSchema = z.object({
    productId: z.string().uuid(),
  })

  export const CreateOrderSchema = z.object({
    items: z.array(CreateOrderItemSchema).min(1),
    buyerName: z.string().optional(),
    buyerEmail: z.string().email().optional(),
    buyerPhone: z.string().optional(),
    paymentMethod: z.nativeEnum(PaymentMethod),
    shippingMethod: z.nativeEnum(ShippingMethod),
    shippingAddress: z
      .object({
        storeId: z.string().optional(),
        storeName: z.string().optional(),
        recipient: z.string().optional(),
        phone: z.string().optional(),
      })
      .optional(),
    discountAmount: z.number().min(0).default(0),
    channel: z.nativeEnum(OrderChannel),
    notes: z.string().optional(),
  })

  export const UpdateOrderStatusSchema = z.object({
    status: z.nativeEnum(OrderStatus),
    trackingNumber: z.string().optional(),
  })

  export const QueryOrdersSchema = z.object({
    status: z.nativeEnum(OrderStatus).optional(),
    channel: z.nativeEnum(OrderChannel).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    search: z.string().optional(), // 訂單編號或買家名稱
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
  })

  export const OrderIdParamSchema = z.object({
    id: z.string().uuid(),
  })

  export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
  export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>
  export type QueryOrdersInput = z.infer<typeof QueryOrdersSchema>
  ```

---

### 7.2 Service 層

#### 7.2.1 建立訂單編號生成器

- [ ] 建立 `src/modules/orders/order-number-generator.ts`

  ```typescript
  import { PrismaClient } from '@prisma/client'

  export async function generateOrderNumber(prisma: PrismaClient): Promise<string> {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD

    // 查詢今天最後一筆訂單
    const lastOrder = await prisma.order.findFirst({
      where: {
        orderNumber: {
          startsWith: `ORD${dateStr}`,
        },
      },
      orderBy: {
        orderNumber: 'desc',
      },
    })

    let sequence = 1
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-3))
      sequence = lastSequence + 1
    }

    const orderNumber = `ORD${dateStr}${sequence.toString().padStart(3, '0')}`
    return orderNumber
  }
  ```

#### 7.2.2 建立 Orders Service

- [ ] 建立 `src/modules/orders/orders.service.ts`

  ```typescript
  import { PrismaClient, Order } from '@prisma/client'
  import type { CreateOrderInput, UpdateOrderStatusInput, QueryOrdersInput } from './orders.schema'
  import { generateOrderNumber } from './order-number-generator'

  export class OrdersService {
    constructor(private prisma: PrismaClient) {}

    async createOrder(data: CreateOrderInput, buyerId?: string): Promise<Order> {
      // 使用 Transaction 確保原子性
      const order = await this.prisma.$transaction(async (tx) => {
        // 1. 驗證所有商品存在且可購買
        const products = await tx.product.findMany({
          where: {
            id: {
              in: data.items.map((item) => item.productId),
            },
          },
        })

        if (products.length !== data.items.length) {
          throw new Error('部分商品不存在')
        }

        // 檢查商品狀態
        for (const product of products) {
          if (product.status === 'SOLD') {
            throw new Error(`商品 ${product.name} 已售出`)
          }
          if (product.status !== 'LISTED') {
            throw new Error(`商品 ${product.name} 尚未上架`)
          }
        }

        // 2. 計算金額
        const subtotal = products.reduce((sum, product) => {
          return sum + product.sellingPrice.toNumber()
        }, 0)

        const shippingFee = this.calculateShippingFee(data.shippingMethod)
        const finalAmount = subtotal + shippingFee - data.discountAmount

        // 3. 生成訂單編號
        const orderNumber = await generateOrderNumber(tx as PrismaClient)

        // 4. 建立訂單
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            buyerId,
            buyerName: data.buyerName,
            buyerEmail: data.buyerEmail,
            buyerPhone: data.buyerPhone,
            subtotal,
            shippingFee,
            discountAmount: data.discountAmount,
            finalAmount,
            paymentMethod: data.paymentMethod,
            paymentStatus: data.paymentMethod === 'CASH' ? 'PAID' : 'PENDING',
            shippingMethod: data.shippingMethod,
            shippingAddress: data.shippingAddress ? JSON.stringify(data.shippingAddress) : null,
            status: 'PENDING',
            channel: data.channel,
            notes: data.notes,
            paidAt: data.paymentMethod === 'CASH' ? new Date() : null,
          },
        })

        // 5. 建立訂單項目
        await tx.orderItem.createMany({
          data: products.map((product) => ({
            orderId: newOrder.id,
            productId: product.id,
            productName: product.name,
            productPrice: product.sellingPrice,
            sellerId: product.sellerId,
          })),
        })

        // 6. 更新商品狀態為已售出
        await tx.product.updateMany({
          where: {
            id: {
              in: data.items.map((item) => item.productId),
            },
          },
          data: {
            status: 'SOLD',
          },
        })

        return newOrder
      })

      return order
    }

    async getOrderById(id: string): Promise<Order | null> {
      const order = await this.prisma.order.findUnique({
        where: { id },
        include: {
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                },
              },
            },
          },
        },
      })
      return order
    }

    async getOrders(query: QueryOrdersInput) {
      const { page, limit, status, channel, startDate, endDate, search } = query

      const where: Record<string, unknown> = {}

      if (status) where.status = status
      if (channel) where.channel = channel
      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) where.createdAt.gte = new Date(startDate)
        if (endDate) where.createdAt.lte = new Date(endDate)
      }
      if (search) {
        where.OR = [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { buyerName: { contains: search, mode: 'insensitive' } },
          { buyerEmail: { contains: search, mode: 'insensitive' } },
        ]
      }

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            items: {
              select: {
                productName: true,
                productPrice: true,
              },
            },
          },
        }),
        this.prisma.order.count({ where }),
      ])

      return {
        orders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    }

    async updateOrderStatus(id: string, data: UpdateOrderStatusInput): Promise<Order> {
      const updateData: Record<string, unknown> = {
        status: data.status,
      }

      // 根據狀態更新時間戳記
      if (data.status === 'SHIPPED') {
        updateData.shippedAt = new Date()
        if (data.trackingNumber) {
          updateData.trackingNumber = data.trackingNumber
        }
      }

      const order = await this.prisma.order.update({
        where: { id },
        data: updateData,
      })

      return order
    }

    async updatePaymentStatus(id: string, status: string, transactionId?: string): Promise<Order> {
      const updateData: Record<string, unknown> = {
        paymentStatus: status,
      }

      if (status === 'PAID') {
        updateData.paidAt = new Date()
        if (transactionId) {
          updateData.paymentTransactionId = transactionId
        }
      }

      const order = await this.prisma.order.update({
        where: { id },
        data: updateData,
      })

      return order
    }

    async cancelOrder(id: string): Promise<Order> {
      // 使用 Transaction
      const order = await this.prisma.$transaction(async (tx) => {
        // 1. 更新訂單狀態
        const updatedOrder = await tx.order.update({
          where: { id },
          data: { status: 'CANCELLED' },
          include: {
            items: true,
          },
        })

        // 2. 恢復商品狀態為上架
        await tx.product.updateMany({
          where: {
            id: {
              in: updatedOrder.items.map((item) => item.productId),
            },
          },
          data: {
            status: 'LISTED',
          },
        })

        return updatedOrder
      })

      return order
    }

    private calculateShippingFee(method: string): number {
      // 簡化版，實際應從配置讀取
      if (method === 'IN_STORE' || method === 'FACE_TO_FACE') {
        return 0
      }
      if (method === 'SEVEN_ELEVEN' || method === 'FAMILY_MART') {
        return 60
      }
      return 0
    }
  }
  ```

---

### 7.3 Routes 層

#### 7.3.1 建立 Orders Routes

- [ ] 建立 `src/modules/orders/orders.routes.ts`

  ```typescript
  import { FastifyPluginAsync } from 'fastify'
  import { OrdersService } from './orders.service'
  import {
    CreateOrderSchema,
    UpdateOrderStatusSchema,
    QueryOrdersSchema,
    OrderIdParamSchema,
  } from './orders.schema'
  import { successResponse, errorResponse } from '@/utils/response'

  const ordersRoutes: FastifyPluginAsync = async (server) => {
    const ordersService = new OrdersService(server.prisma)

    // GET /orders - 查詢訂單列表（需認證）
    server.get(
      '/',
      {
        onRequest: [server.authenticate],
        schema: {
          querystring: QueryOrdersSchema,
        },
      },
      async (request, reply) => {
        try {
          const query = QueryOrdersSchema.parse(request.query)
          const result = await ordersService.getOrders(query)

          return reply.send(
            successResponse(result.orders, {
              page: result.page,
              limit: result.limit,
              total: result.total,
              totalPages: result.totalPages,
            })
          )
        } catch (error) {
          server.log.error(error)
          return reply.code(500).send(errorResponse('INTERNAL_ERROR', '查詢訂單失敗'))
        }
      }
    )

    // GET /orders/:id - 查詢單一訂單
    server.get(
      '/:id',
      {
        schema: {
          params: OrderIdParamSchema,
        },
      },
      async (request, reply) => {
        try {
          const { id } = OrderIdParamSchema.parse(request.params)
          const order = await ordersService.getOrderById(id)

          if (!order) {
            return reply.code(404).send(errorResponse('ORDER_NOT_FOUND', '找不到指定訂單'))
          }

          return reply.send(successResponse(order))
        } catch (error) {
          server.log.error(error)
          return reply.code(500).send(errorResponse('INTERNAL_ERROR', '查詢訂單失敗'))
        }
      }
    )

    // POST /orders - 建立訂單
    server.post(
      '/',
      {
        schema: {
          body: CreateOrderSchema,
        },
      },
      async (request, reply) => {
        try {
          const data = CreateOrderSchema.parse(request.body)

          // 取得買家 ID（如果有登入）
          let buyerId: string | undefined
          try {
            await request.jwtVerify()
            buyerId = (request.user as { userId: string }).userId
          } catch {
            // 未登入，buyerId 為 undefined（現場購買）
          }

          const order = await ordersService.createOrder(data, buyerId)

          return reply.code(201).send(successResponse(order))
        } catch (error) {
          server.log.error(error)
          return reply.code(400).send(errorResponse('BAD_REQUEST', error.message))
        }
      }
    )

    // PATCH /orders/:id/status - 更新訂單狀態（需認證）
    server.patch(
      '/:id/status',
      {
        onRequest: [server.authenticate],
        schema: {
          params: OrderIdParamSchema,
          body: UpdateOrderStatusSchema,
        },
      },
      async (request, reply) => {
        try {
          const { id } = OrderIdParamSchema.parse(request.params)
          const data = UpdateOrderStatusSchema.parse(request.body)

          const order = await ordersService.updateOrderStatus(id, data)

          return reply.send(successResponse(order))
        } catch (error) {
          server.log.error(error)
          return reply.code(500).send(errorResponse('INTERNAL_ERROR', '更新訂單狀態失敗'))
        }
      }
    )

    // PUT /orders/:id/cancel - 取消訂單（需認證）
    server.put(
      '/:id/cancel',
      {
        onRequest: [server.authenticate],
        schema: {
          params: OrderIdParamSchema,
        },
      },
      async (request, reply) => {
        try {
          const { id } = OrderIdParamSchema.parse(request.params)
          const order = await ordersService.cancelOrder(id)

          return reply.send(successResponse(order))
        } catch (error) {
          server.log.error(error)
          return reply.code(500).send(errorResponse('INTERNAL_ERROR', '取消訂單失敗'))
        }
      }
    )
  }

  export default ordersRoutes
  ```

#### 7.3.2 整合到主 server

- [ ] 編輯 `src/server.ts`

  ```typescript
  import ordersRoutes from './modules/orders/orders.routes'

  await server.register(ordersRoutes, { prefix: '/api/orders' })
  ```

---

### 7.4 測試

#### 7.4.1 單元測試

- [ ] 建立 `tests/modules/orders/orders.service.test.ts`

  ```typescript
  import { describe, it, expect, beforeEach, afterEach } from 'vitest'
  import { PrismaClient } from '@prisma/client'
  import { OrdersService } from '@/modules/orders/orders.service'

  const prisma = new PrismaClient()
  const ordersService = new OrdersService(prisma)

  describe('OrdersService', () => {
    let testProductId: string

    beforeEach(async () => {
      // 建立測試商品
      const product = await prisma.product.create({
        data: {
          type: 'CARD',
          category: '測試',
          name: '測試商品',
          costPrice: 100,
          sellingPrice: 300,
          channel: 'BOTH',
          description: '測試',
          status: 'LISTED',
        },
      })
      testProductId = product.id
    })

    afterEach(async () => {
      await prisma.orderItem.deleteMany()
      await prisma.order.deleteMany()
      await prisma.product.deleteMany()
    })

    describe('createOrder', () => {
      it('should create an order and update product status', async () => {
        const orderData = {
          items: [{ productId: testProductId }],
          paymentMethod: 'CASH' as const,
          shippingMethod: 'IN_STORE' as const,
          channel: 'POS' as const,
          discountAmount: 0,
        }

        const order = await ordersService.createOrder(orderData)

        expect(order).toBeDefined()
        expect(order.orderNumber).toMatch(/^ORD\d{8}\d{3}$/)
        expect(order.subtotal).toBe(300)
        expect(order.finalAmount).toBe(300)

        // 驗證商品已售出
        const product = await prisma.product.findUnique({
          where: { id: testProductId },
        })
        expect(product?.status).toBe('SOLD')
      })

      it('should fail if product is already sold', async () => {
        // 先建立一筆訂單
        await ordersService.createOrder({
          items: [{ productId: testProductId }],
          paymentMethod: 'CASH',
          shippingMethod: 'IN_STORE',
          channel: 'POS',
          discountAmount: 0,
        })

        // 再次建立應失敗
        await expect(
          ordersService.createOrder({
            items: [{ productId: testProductId }],
            paymentMethod: 'CASH',
            shippingMethod: 'IN_STORE',
            channel: 'POS',
            discountAmount: 0,
          })
        ).rejects.toThrow('已售出')
      })
    })

    describe('cancelOrder', () => {
      it('should cancel order and restore product status', async () => {
        const order = await ordersService.createOrder({
          items: [{ productId: testProductId }],
          paymentMethod: 'CASH',
          shippingMethod: 'IN_STORE',
          channel: 'POS',
          discountAmount: 0,
        })

        await ordersService.cancelOrder(order.id)

        // 驗證訂單已取消
        const cancelledOrder = await prisma.order.findUnique({
          where: { id: order.id },
        })
        expect(cancelledOrder?.status).toBe('CANCELLED')

        // 驗證商品恢復上架
        const product = await prisma.product.findUnique({
          where: { id: testProductId },
        })
        expect(product?.status).toBe('LISTED')
      })
    })
  })
  ```

#### 7.4.2 整合測試

- [ ] 建立 `tests/modules/orders/orders.routes.test.ts`

---

## 🧪 測試步驟

1. **訂單編號生成測試**
   - 建立多筆訂單
   - 驗證編號連續遞增

2. **訂單建立測試**
   - 線上訂單（ONLINE）
   - POS 訂單（POS）
   - 多商品訂單
   - 驗證庫存扣減

3. **Transaction 測試**
   - 故意製造錯誤（如商品不存在）
   - 驗證 rollback 正確

4. **訂單取消測試**
   - 取消訂單
   - 驗證商品恢復上架

5. **效能測試**
   - 建立訂單回應時間 < 500ms
   - 查詢訂單列表回應時間 < 200ms

---

## 📝 交付物

- [ ] `src/modules/orders/orders.schema.ts`
- [ ] `src/modules/orders/orders.service.ts`
- [ ] `src/modules/orders/orders.routes.ts`
- [ ] `src/modules/orders/order-number-generator.ts`
- [ ] 單元測試與整合測試

---

## 🚨 注意事項

1. **Transaction 一致性**: 訂單建立、取消都必須使用 Transaction
2. **庫存同步**: 商品售出後立即更新狀態，避免超賣
3. **訂單編號**: 確保唯一性，考慮併發場景
4. **金額計算**: 使用 Decimal 避免浮點數誤差
5. **退款處理**: 取消訂單時需考慮付款狀態

## ⚠️ 勘誤 — 代碼片段與現行專案慣例的偏差

> 本文件撰寫時間較早，以下代碼片段存在與現行技術棧不一致之處。
> **實作時以本勘誤為準，代碼片段僅供參考邏輯流程。**

### Zod 相關

| 原文寫法                                                      | 正確寫法                                                                 | 說明                                               |
| ------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------- |
| `import { z } from 'zod'`                                     | `import { z } from 'zod/v4'`                                             | 全專案統一 Zod v4                                  |
| `z.nativeEnum(PaymentMethod)`                                 | `z.enum(['CASH', 'CREDIT_CARD', 'LINE_PAY', 'TRANSFER'])`                | Zod v4 無 `nativeEnum`，用 `z.enum` 搭配字串字面量 |
| `z.nativeEnum(ShippingMethod)`                                | `z.enum(['SEVEN_ELEVEN', 'FAMILY_MART', 'FACE_TO_FACE', 'IN_STORE'])`    | 同上                                               |
| `z.nativeEnum(OrderStatus)`                                   | `z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'])` | 同上                                               |
| `z.nativeEnum(OrderChannel)`                                  | `z.enum(['ONLINE', 'POS'])`                                              | 同上                                               |
| `z.string().transform(Number).default('1')`                   | `z.coerce.number().int().positive().default(1)`                          | 參照 products/auctions schema 慣例                 |
| `import { PaymentMethod, ... } from '@card-erp/shared-types'` | 不需要 import                                                            | Schema 內直接用 `z.enum([...])` 字面量即可         |

### Prisma / Import 路徑

| 原文寫法                                             | 正確寫法                                                                                                                                         | 說明                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `import { PrismaClient } from '@prisma/client'`      | `import type { PrismaClient } from '../generated/prisma/client.js'`（從 modules/ 出發）或 `'../../generated/prisma/client.js'`（從 tests/ 出發） | 本專案 Prisma Client 生成於 `src/generated/prisma/` |
| `import { successResponse } from '@/utils/response'` | `import { successResponse } from '../../utils/response.js'`                                                                                      | 專案未設定 `@/` alias，使用相對路徑 + `.js` 副檔名  |
| `import { FastifyPluginAsync } from 'fastify'`       | `import type { FastifyPluginAsync } from 'fastify'`                                                                                              | 型別用 `import type`                                |
| 所有 `.ts` import 結尾                               | 加 `.js` 副檔名                                                                                                                                  | ESM 慣例，例如 `'./orders.service.js'`              |

### 邏輯 / 模式

| 原文寫法                               | 正確做法                                                          | 說明                                                           |
| -------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| Routes 每個 handler 包 `try/catch`     | **不包 try/catch**，交給全域 errorHandler                         | 參照 auctions.routes.ts / products.routes.ts 慣例              |
| `JSON.stringify(data.shippingAddress)` | 直接傳物件                                                        | Prisma `Json?` 型別直接接受 JS 物件                            |
| `error.message`（routes 中）           | error 是 `unknown` 型別，需處理                                   | 改用 `(error as Error).message` 或交給 errorHandler            |
| `expect(order.subtotal).toBe(300)`     | `expect(order.subtotal.toNumber()).toBe(300)`                     | Prisma Decimal 非原生 number                                   |
| `product.images` in getOrderById       | 確認 Product model 是否有 `images` 欄位                           | 若無則移除                                                     |
| POST /orders 內 inline `jwtVerify()`   | 用 `onRequest: [server.authenticate]` 或獨立的 optional auth 邏輯 | 參照現有 auth plugin 模式                                      |
| `OrdersService` 只接 `prisma`          | 確認不需要 Redis（不同於 AuctionsService）                        | 訂單模組無即時快取需求，只用 Prisma 即可                       |
| module export 模式                     | 需建立 `src/modules/orders/index.ts`                              | 參照 `products/index.ts`、`auctions/index.ts` 的 barrel export |

---

## 🔗 相關文件

- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- [系統架構設計 - 訂單模組](../plans/2026-01-24-system-architecture-design.md)

---

## 📊 進度追蹤

| 子任務      | 狀態      | 負責人 | 完成日期 |
| ----------- | --------- | ------ | -------- |
| 7.1 Schema  | ⏳ 未開始 | -      | -        |
| 7.2 Service | ⏳ 未開始 | -      | -        |
| 7.3 Routes  | ⏳ 未開始 | -      | -        |
| 7.4 測試    | ⏳ 未開始 | -      | -        |

---

## 🔀 分段管線（Multi-Mission）

| Mission                        | 範圍                                          | 檔案數 | 依賴 | 狀態    |
| ------------------------------ | --------------------------------------------- | ------ | ---- | ------- |
| **A: Schema + Service + Test** | 7.1 + 7.2 + service test                      | 4      | 無   | ✅ 完成 |
| **B: Routes + 整合 + Test**    | 7.3 + server.ts 修改 + index.ts + routes test | 4      | A    | ✅ 完成 |

依賴圖：A → B

---

**上一個任務**: [06 - 競標 API](./06-api-auctions.md)
**下一個任務**: [08 - 金流 API](./08-api-payments.md)
