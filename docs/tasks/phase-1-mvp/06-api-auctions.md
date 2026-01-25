# 06 - 競標 API 開發

**階段**: 第一階段 MVP - Sprint 2
**預計時間**: 3 天
**負責人**: TBD
**優先級**: 🔴 Critical

---

## 📋 目標

實作完整的競標系統 API，包含競標建立、出價、WebSocket 即時通知、競標結束自動處理等功能，並使用 Redis 儲存即時競標資料。

## 🎯 成功標準

- [ ] 所有競標 API endpoints 正常運作
- [ ] WebSocket 即時通知運作正常
- [ ] 出價樂觀鎖防止併發問題
- [ ] 競標結束定時任務正常執行
- [ ] Redis 即時資料同步正確
- [ ] 單元測試覆蓋率 > 80%
- [ ] API 整合測試通過
- [ ] 出價回應時間 < 100ms

## 📦 前置條件

**前置任務**:
- [x] 01 - 環境建置完成
- [x] 02 - shared-types 套件完成
- [x] 03 - 資料庫設計完成
- [x] 04 - API 基礎架構完成
- [x] 05 - 商品 API 完成

**技術需求**:
- Fastify 4.x
- @fastify/websocket
- node-cron（定時任務）

---

## ✅ 子任務清單

### 6.1 資料驗證 Schema

#### 6.1.1 建立 Zod Schema
- [ ] 建立 `src/modules/auctions/auctions.schema.ts`
  ```typescript
  import { z } from 'zod'
  import { AuctionStatus } from '@card-erp/shared-types'

  export const CreateAuctionSchema = z.object({
    productId: z.string().uuid(),
    startingPrice: z.number().positive(),
    buyNowPrice: z.number().positive().optional(),
    incrementAmount: z.number().positive(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
  }).refine((data) => {
    const start = new Date(data.startTime)
    const end = new Date(data.endTime)
    return end > start
  }, {
    message: '結束時間必須晚於開始時間',
  })

  export const PlaceBidSchema = z.object({
    amount: z.number().positive(),
  })

  export const QueryAuctionsSchema = z.object({
    status: z.nativeEnum(AuctionStatus).optional(),
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
  })

  export const AuctionIdParamSchema = z.object({
    id: z.string().uuid(),
  })

  export type CreateAuctionInput = z.infer<typeof CreateAuctionSchema>
  export type PlaceBidInput = z.infer<typeof PlaceBidSchema>
  export type QueryAuctionsInput = z.infer<typeof QueryAuctionsSchema>
  ```

---

### 6.2 Service 層

#### 6.2.1 建立 Auctions Service
- [ ] 建立 `src/modules/auctions/auctions.service.ts`
  ```typescript
  import { PrismaClient, Auction, Bid } from '@prisma/client'
  import Redis from 'ioredis'
  import type { CreateAuctionInput, PlaceBidInput, QueryAuctionsInput } from './auctions.schema'

  export class AuctionsService {
    constructor(
      private prisma: PrismaClient,
      private redis: Redis
    ) {}

    async createAuction(data: CreateAuctionInput): Promise<Auction> {
      // 檢查商品是否存在且未售出
      const product = await this.prisma.product.findUnique({
        where: { id: data.productId },
      })

      if (!product) {
        throw new Error('商品不存在')
      }

      if (product.status === 'SOLD') {
        throw new Error('商品已售出')
      }

      // 檢查商品是否已有競標
      const existingAuction = await this.prisma.auction.findUnique({
        where: { productId: data.productId },
      })

      if (existingAuction) {
        throw new Error('商品已有進行中的競標')
      }

      // 建立競標
      const auction = await this.prisma.auction.create({
        data: {
          ...data,
          currentPrice: data.startingPrice,
          status: new Date(data.startTime) > new Date() ? 'UPCOMING' : 'ACTIVE',
        },
      })

      // 儲存到 Redis
      await this.redis.hset(`auction:${auction.id}:info`, {
        productId: auction.productId,
        currentPrice: auction.currentPrice.toString(),
        currentBidderId: auction.currentBidderId || '',
        status: auction.status,
        endTime: auction.endTime.toISOString(),
      })

      return auction
    }

    async getAuctionById(id: string): Promise<Auction | null> {
      const auction = await this.prisma.auction.findUnique({
        where: { id },
        include: {
          product: true,
          currentBidder: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
      return auction
    }

    async getAuctions(query: QueryAuctionsInput) {
      const { page, limit, status } = query

      const where: Record<string, unknown> = {}
      if (status) where.status = status

      const [auctions, total] = await Promise.all([
        this.prisma.auction.findMany({
          where,
          orderBy: { endTime: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        }),
        this.prisma.auction.count({ where }),
      ])

      return {
        auctions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    }

    async placeBid(auctionId: string, bidderId: string, amount: number): Promise<Bid> {
      // 使用 Redis 實現樂觀鎖
      const lockKey = `auction:${auctionId}:lock`
      const lockValue = Date.now().toString()
      const locked = await this.redis.set(lockKey, lockValue, 'PX', 5000, 'NX')

      if (!locked) {
        throw new Error('系統繁忙，請稍後再試')
      }

      try {
        // 從 Redis 獲取當前競標資訊
        const auctionInfo = await this.redis.hgetall(`auction:${auctionId}:info`)

        if (!auctionInfo || Object.keys(auctionInfo).length === 0) {
          // 從資料庫載入
          const auction = await this.prisma.auction.findUnique({
            where: { id: auctionId },
          })

          if (!auction) {
            throw new Error('競標不存在')
          }

          if (auction.status !== 'ACTIVE') {
            throw new Error('競標尚未開始或已結束')
          }

          // 寫入 Redis
          await this.redis.hset(`auction:${auctionId}:info`, {
            currentPrice: auction.currentPrice.toString(),
            currentBidderId: auction.currentBidderId || '',
            status: auction.status,
            endTime: auction.endTime.toISOString(),
          })
        }

        const currentPrice = parseFloat(auctionInfo.currentPrice || '0')
        const incrementAmount = await this.getIncrementAmount(auctionId)

        // 驗證出價金額
        if (amount < currentPrice + incrementAmount) {
          throw new Error(`出價必須至少 ${currentPrice + incrementAmount} 元`)
        }

        // 建立出價記錄
        const bid = await this.prisma.bid.create({
          data: {
            auctionId,
            bidderId,
            amount,
          },
        })

        // 更新競標資訊
        await Promise.all([
          this.prisma.auction.update({
            where: { id: auctionId },
            data: {
              currentPrice: amount,
              currentBidderId: bidderId,
            },
          }),
          this.redis.hset(`auction:${auctionId}:info`, {
            currentPrice: amount.toString(),
            currentBidderId: bidderId,
          }),
          this.redis.zadd(`auction:${auctionId}:bids`, amount, bid.id),
        ])

        return bid
      } finally {
        // 釋放鎖
        await this.redis.del(lockKey)
      }
    }

    async getBids(auctionId: string): Promise<Bid[]> {
      const bids = await this.prisma.bid.findMany({
        where: { auctionId },
        orderBy: { amount: 'desc' },
        include: {
          bidder: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
      return bids
    }

    async cancelAuction(id: string): Promise<Auction> {
      const auction = await this.prisma.auction.update({
        where: { id },
        data: { status: 'CANCELLED' },
      })

      // 更新 Redis
      await this.redis.hset(`auction:${id}:info`, 'status', 'CANCELLED')

      return auction
    }

    private async getIncrementAmount(auctionId: string): Promise<number> {
      const auction = await this.prisma.auction.findUnique({
        where: { id: auctionId },
        select: { incrementAmount: true },
      })

      return auction?.incrementAmount.toNumber() || 0
    }

    async endAuction(id: string): Promise<void> {
      const auction = await this.prisma.auction.findUnique({
        where: { id },
        include: {
          currentBidder: true,
        },
      })

      if (!auction) return

      // 更新競標狀態
      await this.prisma.auction.update({
        where: { id },
        data: { status: 'ENDED' },
      })

      // 如果有得標者，建立訂單（簡化版，完整實作在訂單模組）
      if (auction.currentBidderId) {
        // TODO: 建立訂單
        // TODO: 發送得標通知
      }

      // 更新 Redis
      await this.redis.hset(`auction:${id}:info`, 'status', 'ENDED')
    }
  }
  ```

---

### 6.3 WebSocket 支援

#### 6.3.1 安裝 WebSocket 套件
- [ ] 安裝依賴
  ```bash
  pnpm add @fastify/websocket
  ```

#### 6.3.2 建立 WebSocket Plugin
- [ ] 建立 `src/plugins/websocket.ts`
  ```typescript
  import { FastifyPluginAsync } from 'fastify'
  import websocket from '@fastify/websocket'
  import fp from 'fastify-plugin'

  const websocketPlugin: FastifyPluginAsync = async (server) => {
    await server.register(websocket)
  }

  export default fp(websocketPlugin)
  ```

#### 6.3.3 註冊到主 server
- [ ] 編輯 `src/server.ts`
  ```typescript
  import websocketPlugin from './plugins/websocket'

  await server.register(websocketPlugin)
  ```

---

### 6.4 Routes 層

#### 6.4.1 建立 Auctions Routes
- [ ] 建立 `src/modules/auctions/auctions.routes.ts`
  ```typescript
  import { FastifyPluginAsync } from 'fastify'
  import { AuctionsService } from './auctions.service'
  import {
    CreateAuctionSchema,
    PlaceBidSchema,
    QueryAuctionsSchema,
    AuctionIdParamSchema,
  } from './auctions.schema'
  import { successResponse, errorResponse } from '@/utils/response'

  const auctionsRoutes: FastifyPluginAsync = async (server) => {
    const auctionsService = new AuctionsService(server.prisma, server.redis)

    // GET /auctions - 查詢競標列表
    server.get(
      '/',
      {
        schema: {
          querystring: QueryAuctionsSchema,
        },
      },
      async (request, reply) => {
        try {
          const query = QueryAuctionsSchema.parse(request.query)
          const result = await auctionsService.getAuctions(query)

          return reply.send(
            successResponse(result.auctions, {
              page: result.page,
              limit: result.limit,
              total: result.total,
              totalPages: result.totalPages,
            })
          )
        } catch (error) {
          server.log.error(error)
          return reply.code(500).send(errorResponse('INTERNAL_ERROR', '查詢競標失敗'))
        }
      }
    )

    // GET /auctions/:id - 查詢單一競標
    server.get(
      '/:id',
      {
        schema: {
          params: AuctionIdParamSchema,
        },
      },
      async (request, reply) => {
        try {
          const { id } = AuctionIdParamSchema.parse(request.params)
          const auction = await auctionsService.getAuctionById(id)

          if (!auction) {
            return reply.code(404).send(errorResponse('AUCTION_NOT_FOUND', '找不到指定競標'))
          }

          return reply.send(successResponse(auction))
        } catch (error) {
          server.log.error(error)
          return reply.code(500).send(errorResponse('INTERNAL_ERROR', '查詢競標失敗'))
        }
      }
    )

    // POST /auctions - 建立競標（需認證）
    server.post(
      '/',
      {
        onRequest: [server.authenticate],
        schema: {
          body: CreateAuctionSchema,
        },
      },
      async (request, reply) => {
        try {
          const data = CreateAuctionSchema.parse(request.body)
          const auction = await auctionsService.createAuction(data)

          return reply.code(201).send(successResponse(auction))
        } catch (error) {
          server.log.error(error)
          return reply.code(400).send(errorResponse('BAD_REQUEST', error.message))
        }
      }
    )

    // POST /auctions/:id/bid - 出價（需認證）
    server.post(
      '/:id/bid',
      {
        onRequest: [server.authenticate],
        schema: {
          params: AuctionIdParamSchema,
          body: PlaceBidSchema,
        },
      },
      async (request, reply) => {
        try {
          const { id } = AuctionIdParamSchema.parse(request.params)
          const { amount } = PlaceBidSchema.parse(request.body)
          const bidderId = (request.user as { userId: string }).userId

          const bid = await auctionsService.placeBid(id, bidderId, amount)

          // 廣播給所有訂閱該競標的客戶端
          server.websocketServer?.clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(
                JSON.stringify({
                  type: 'NEW_BID',
                  auctionId: id,
                  bid: {
                    amount,
                    bidderId,
                    timestamp: new Date(),
                  },
                })
              )
            }
          })

          return reply.code(201).send(successResponse(bid))
        } catch (error) {
          server.log.error(error)
          return reply.code(400).send(errorResponse('BID_FAILED', error.message))
        }
      }
    )

    // GET /auctions/:id/bids - 查詢出價記錄
    server.get(
      '/:id/bids',
      {
        schema: {
          params: AuctionIdParamSchema,
        },
      },
      async (request, reply) => {
        try {
          const { id } = AuctionIdParamSchema.parse(request.params)
          const bids = await auctionsService.getBids(id)

          return reply.send(successResponse(bids))
        } catch (error) {
          server.log.error(error)
          return reply.code(500).send(errorResponse('INTERNAL_ERROR', '查詢出價記錄失敗'))
        }
      }
    )

    // PUT /auctions/:id/cancel - 取消競標（需認證）
    server.put(
      '/:id/cancel',
      {
        onRequest: [server.authenticate],
        schema: {
          params: AuctionIdParamSchema,
        },
      },
      async (request, reply) => {
        try {
          const { id } = AuctionIdParamSchema.parse(request.params)
          const auction = await auctionsService.cancelAuction(id)

          return reply.send(successResponse(auction))
        } catch (error) {
          server.log.error(error)
          return reply.code(500).send(errorResponse('INTERNAL_ERROR', '取消競標失敗'))
        }
      }
    )

    // WebSocket endpoint - 訂閱競標更新
    server.get(
      '/:id/subscribe',
      { websocket: true },
      (connection, request) => {
        const { id } = request.params as { id: string }

        connection.socket.on('message', (message) => {
          // 處理客戶端訊息（如心跳）
          server.log.info('Received:', message.toString())
        })

        connection.socket.on('close', () => {
          server.log.info(`Client disconnected from auction ${id}`)
        })

        // 發送歡迎訊息
        connection.socket.send(
          JSON.stringify({
            type: 'CONNECTED',
            auctionId: id,
          })
        )
      }
    )
  }

  export default auctionsRoutes
  ```

#### 6.4.2 整合到主 server
- [ ] 編輯 `src/server.ts`
  ```typescript
  import auctionsRoutes from './modules/auctions/auctions.routes'

  await server.register(auctionsRoutes, { prefix: '/api/auctions' })
  ```

---

### 6.5 定時任務（競標結束處理）

#### 6.5.1 安裝 Cron 套件
- [ ] 安裝依賴
  ```bash
  pnpm add node-cron
  pnpm add -D @types/node-cron
  ```

#### 6.5.2 建立定時任務
- [ ] 建立 `src/jobs/auction-end.job.ts`
  ```typescript
  import cron from 'node-cron'
  import { PrismaClient } from '@prisma/client'
  import { logger } from '@/utils/logger'
  import { AuctionsService } from '@/modules/auctions/auctions.service'
  import Redis from 'ioredis'

  export function startAuctionEndJob(prisma: PrismaClient, redis: Redis) {
    const auctionsService = new AuctionsService(prisma, redis)

    // 每分鐘執行一次
    cron.schedule('* * * * *', async () => {
      try {
        logger.info('Running auction end job...')

        // 查詢所有已結束但狀態仍為 ACTIVE 的競標
        const endedAuctions = await prisma.auction.findMany({
          where: {
            status: 'ACTIVE',
            endTime: {
              lte: new Date(),
            },
          },
        })

        logger.info(`Found ${endedAuctions.length} auctions to end`)

        for (const auction of endedAuctions) {
          await auctionsService.endAuction(auction.id)
          logger.info(`Ended auction ${auction.id}`)
        }
      } catch (error) {
        logger.error('Auction end job failed:', error)
      }
    })

    logger.info('Auction end job started')
  }
  ```

#### 6.5.3 啟動定時任務
- [ ] 編輯 `src/server.ts`
  ```typescript
  import { startAuctionEndJob } from './jobs/auction-end.job'

  async function start() {
    const server = await buildServer()
    await server.listen({ port: config.API_PORT, host: config.API_HOST })

    // 啟動定時任務
    startAuctionEndJob(server.prisma, server.redis)

    server.log.info(`Server listening on ${config.API_HOST}:${config.API_PORT}`)
  }
  ```

---

### 6.6 測試

#### 6.6.1 單元測試
- [ ] 建立 `tests/modules/auctions/auctions.service.test.ts`
  - 測試建立競標
  - 測試出價邏輯
  - 測試樂觀鎖
  - 測試競標結束

#### 6.6.2 整合測試
- [ ] 建立 `tests/modules/auctions/auctions.routes.test.ts`
  - 測試所有 API endpoints
  - 測試 WebSocket 連接

---

## 🧪 測試步驟

1. **建立競標測試**
   - 建立競標
   - 驗證商品狀態檢查

2. **出價測試**
   - 正常出價
   - 出價過低（應失敗）
   - 併發出價（樂觀鎖測試）

3. **WebSocket 測試**
   - 連接 WebSocket
   - 出價後驗證即時通知

4. **定時任務測試**
   - 建立已過期的競標
   - 等待 1 分鐘
   - 驗證競標狀態更新

5. **效能測試**
   - 出價回應時間 < 100ms
   - 併發 100 次出價測試

---

## 📝 交付物

- [ ] `src/modules/auctions/auctions.schema.ts`
- [ ] `src/modules/auctions/auctions.service.ts`
- [ ] `src/modules/auctions/auctions.routes.ts`
- [ ] `src/plugins/websocket.ts`
- [ ] `src/jobs/auction-end.job.ts`
- [ ] 單元測試與整合測試

---

## 🚨 注意事項

1. **樂觀鎖**: 使用 Redis SETNX 實現樂觀鎖，防止併發出價問題
2. **WebSocket 連接管理**: 記得清理斷開的連接
3. **定時任務**: 確保只有一個實例執行定時任務（分散式環境需考慮）
4. **通知實體店面**: 競標開始時需通知後台，提醒店員下架實體商品

---

## 🔗 相關文件

- [@fastify/websocket](https://github.com/fastify/fastify-websocket)
- [node-cron](https://github.com/node-cron/node-cron)
- [Redis 樂觀鎖](https://redis.io/docs/manual/patterns/distributed-locks/)

---

## 📊 進度追蹤

| 子任務 | 狀態 | 負責人 | 完成日期 |
|--------|------|--------|---------|
| 6.1 Schema | ⏳ 未開始 | - | - |
| 6.2 Service | ⏳ 未開始 | - | - |
| 6.3 WebSocket | ⏳ 未開始 | - | - |
| 6.4 Routes | ⏳ 未開始 | - | - |
| 6.5 定時任務 | ⏳ 未開始 | - | - |
| 6.6 測試 | ⏳ 未開始 | - | - |

---

**上一個任務**: [05 - 商品 API](./05-api-products.md)
**下一個任務**: [07 - 訂單 API](./07-api-orders.md)
