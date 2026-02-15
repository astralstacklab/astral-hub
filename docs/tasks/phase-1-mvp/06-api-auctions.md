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
- [ ] Proxy Bidding（代理出價）機制正確：maxBid 隱藏、自動跟價、先出價者優先
- [ ] WebSocket 即時通知運作正常（僅推送 currentPrice，不洩漏 maxBid）
- [ ] 分散式鎖防止併發出價問題
- [ ] 競標結束定時任務正常執行
- [ ] Redis 即時資料同步正確
- [ ] 單元測試覆蓋率 > 80%
- [ ] API 整合測試通過
- [ ] 出價回應時間 < 100ms

## 📦 前置條件

**前置任務**:

- [x] 01 - 環境建置完成
- [x] 02 - shared-types 套件完成
- [x] 03 - 資料庫設計完成（Auction + Bid models 已就位）
- [x] 04 - API 基礎架構完成
- [x] 05 - 商品 API 完成

**技術需求**:

- Fastify 5.x（專案目前版本）
- @fastify/websocket
- node-cron（定時任務）

**⚠️ 專案架構提醒**（與 Task 5 products 模組一致）:

- Zod 使用 v4：`import { z } from 'zod/v4'`
- Prisma Client 從生成路徑匯入：`import type { PrismaClient, ... } from '../../../src/generated/prisma/client.js'`
- Redis 已掛載在 `server.redis`（ioredis 實例，由 `src/plugins/redis.ts` 提供）
- 所有 middleware 必須用 `fastify-plugin` 包裝（避免 Fastify scope encapsulation）
- Routes 不需要 try/catch（有全域 error-handler middleware 處理）
- Fastify schema 使用 JSON Schema 格式（非 Zod object）
- Zod 用於 handler 內部的 `.parse()` 驗證
- JWT user 型別為 `{ id: string; role: string }`（存取方式：`request.user.id`）
- Response schema 需定義所有可能的 status code（解決 Fastify v5 TypeScript 限制）
- Swagger tags/summary/description 遵循 Task 5 已建立的模式

---

## ✅ 子任務清單

### 6.1 資料驗證 Schema

#### 6.1.1 建立 Zod Schema

- [x] 建立 `src/modules/auctions/auctions.schema.ts`

  ```typescript
  import { z } from 'zod/v4'

  // ============================================
  // Create Auction
  // ============================================
  export const CreateAuctionSchema = z
    .object({
      productId: z.string().uuid(),
      startingPrice: z.number().positive(),
      buyNowPrice: z.number().positive().optional(),
      incrementAmount: z.number().positive(),
      startTime: z.string().datetime(),
      endTime: z.string().datetime(),
    })
    .refine(
      (data) => {
        const start = new Date(data.startTime)
        const end = new Date(data.endTime)
        return end > start
      },
      {
        message: '結束時間必須晚於開始時間',
      }
    )

  export type CreateAuctionInput = z.infer<typeof CreateAuctionSchema>

  // ============================================
  // Place Bid (Proxy Bidding)
  // ============================================
  export const PlaceBidSchema = z.object({
    maxBid: z.number().positive(),
  })

  export type PlaceBidInput = z.infer<typeof PlaceBidSchema>

  // ============================================
  // Query Auctions (querystring)
  // ============================================
  export const QueryAuctionsSchema = z.object({
    status: z.enum(['UPCOMING', 'ACTIVE', 'ENDED', 'CANCELLED']).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })

  export type QueryAuctionsInput = z.infer<typeof QueryAuctionsSchema>

  // ============================================
  // Params
  // ============================================
  export const AuctionIdParamSchema = z.object({
    id: z.string().uuid(),
  })
  ```

---

### 6.2 Service 層

#### 6.2.1 建立 Auctions Service

- [x] 建立 `src/modules/auctions/auctions.service.ts`

  ```typescript
  import type { PrismaClient, Auction, Bid, Prisma } from '../../../src/generated/prisma/client.js'
  import type Redis from 'ioredis'
  import type { CreateAuctionInput, QueryAuctionsInput } from './auctions.schema.js'

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

      // 儲存到 Redis（即時查詢用）
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
      return this.prisma.auction.findUnique({
        where: { id },
        include: {
          product: true,
          currentBidder: {
            select: { id: true, name: true },
          },
        },
      })
    }

    async getAuctions(query: QueryAuctionsInput) {
      const { page, limit, status } = query

      const where: Prisma.AuctionWhereInput = {}
      if (status) where.status = status

      const [auctions, total] = await Promise.all([
        this.prisma.auction.findMany({
          where,
          orderBy: { endTime: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            product: {
              select: { id: true, name: true, category: true },
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

    async placeBid(auctionId: string, bidderId: string, maxBidAmount: number): Promise<Bid> {
      // 使用 Redis SETNX 實現分散式鎖（Proxy 跟價必須在鎖內原子完成）
      const lockKey = `auction:${auctionId}:bid-lock`
      const lockOwner = `${bidderId}:${Date.now()}:${Math.random().toString(36).slice(2)}`
      const locked = await this.redis.set(lockKey, lockOwner, 'PX', 5000, 'NX')

      if (!locked) {
        throw new Error('系統忙碌，請稍後再試')
      }

      try {
        const auction = await this.prisma.auction.findUnique({ where: { id: auctionId } })
        if (!auction) throw new Error('競標不存在')
        if (auction.status !== 'ACTIVE') throw new Error('競標尚未開始或已結束')

        const currentPrice = auction.currentPrice.toNumber()
        const increment = auction.incrementAmount.toNumber()

        // maxBid 必須 >= currentPrice + increment
        if (maxBidAmount < currentPrice + increment) {
          throw new Error(`最高出價必須至少 ${currentPrice + increment}`)
        }

        // buyNowPrice 邏輯：若 maxBid >= buyNowPrice，直接以 buyNowPrice 結標
        if (auction.buyNowPrice && maxBidAmount >= auction.buyNowPrice.toNumber()) {
          // TODO: 直接結標邏輯（建立訂單），MVP 暫不實作
        }

        // 找出目前的 proxy 領先者（isActive = true）
        const defender = await this.prisma.bid.findFirst({
          where: { auctionId, isActive: true },
          orderBy: { maxBid: 'desc' },
        })

        // 同一用戶追加 maxBid
        if (defender && defender.bidderId === bidderId) {
          if (maxBidAmount <= defender.maxBid.toNumber()) {
            throw new Error('追加金額必須高於目前的最高出價')
          }
          // 更新 maxBid，不觸發跟價
          const updated = await this.prisma.bid.update({
            where: { id: defender.id },
            data: { maxBid: maxBidAmount },
          })
          return updated
        }

        // Proxy Bidding 跟價計算
        let newPrice: number
        let winnerId: string
        let defenderActive = true

        if (!defender) {
          // 首位出價者 → 顯示價 = 底標
          newPrice = auction.startingPrice.toNumber()
          winnerId = bidderId
        } else {
          const defenderMax = defender.maxBid.toNumber()

          if (maxBidAmount > defenderMax) {
            // challenger 勝出
            newPrice = Math.min(defenderMax + increment, maxBidAmount)
            winnerId = bidderId
            defenderActive = false
          } else if (maxBidAmount < defenderMax) {
            // defender 維持領先
            newPrice = Math.min(maxBidAmount + increment, defenderMax)
            winnerId = defender.bidderId
          } else {
            // 平手 → 先出價者優先（defender）
            newPrice = defenderMax
            winnerId = defender.bidderId
          }
        }

        // Transaction：建立 bid + 更新 auction + 更新舊 defender
        const bid = await this.prisma.$transaction(async (tx) => {
          // 若 defender 被超越，標記 isActive = false
          if (defender && !defenderActive) {
            await tx.bid.update({ where: { id: defender.id }, data: { isActive: false } })
          }

          const createdBid = await tx.bid.create({
            data: {
              auctionId,
              bidderId,
              maxBid: maxBidAmount,
              amount: newPrice,
              isActive: winnerId === bidderId,
            },
          })

          await tx.auction.update({
            where: { id: auctionId },
            data: { currentPrice: newPrice, currentBidderId: winnerId },
          })

          return createdBid
        })

        // Redis 同步（非關鍵路徑）
        try {
          await this.redis.hset(`auction:${auctionId}:info`, {
            currentPrice: newPrice.toString(),
            currentBidderId: winnerId,
          })
        } catch {
          // 靜默失敗
        }

        return bid
      } finally {
        // Lua script 安全釋鎖
        try {
          await this.redis.eval(
            "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end",
            1,
            lockKey,
            lockOwner
          )
        } catch {
          // TTL 自動回收
        }
      }
    }

    async getBids(auctionId: string): Promise<Bid[]> {
      return this.prisma.bid.findMany({
        where: { auctionId },
        orderBy: { amount: 'desc' },
        include: {
          bidder: {
            select: { id: true, name: true },
          },
        },
      })
    }

    async cancelAuction(id: string): Promise<Auction> {
      const auction = await this.prisma.auction.update({
        where: { id },
        data: { status: 'CANCELLED' },
      })

      await this.redis.hset(`auction:${id}:info`, 'status', 'CANCELLED')

      return auction
    }

    async endAuction(id: string): Promise<void> {
      const auction = await this.prisma.auction.findUnique({
        where: { id },
      })

      if (!auction) return

      await this.prisma.auction.update({
        where: { id },
        data: { status: 'ENDED' },
      })

      // TODO: 如果有得標者，建立訂單（完整實作在訂單模組 Task 07）
      // TODO: 發送得標通知

      await this.redis.hset(`auction:${id}:info`, 'status', 'ENDED')
    }
  }
  ```

  **關鍵設計**:
  - ✅ **Proxy Bidding**：用戶輸入 maxBid，系統自動跟價計算 currentPrice
  - ✅ 從 generated prisma client 匯入型別
  - ✅ `Decimal.toNumber()` 做數值比較
  - ✅ 出價使用 `prisma.$transaction` 確保一致性（bid create + auction update + defender deactivate）
  - ✅ Lua script 安全釋鎖（防止誤刪其他人的鎖）
  - ✅ Redis 同步以 try/catch 靜默失敗（非關鍵路徑）
  - ✅ 同一用戶追加 maxBid 不觸發跟價
  - ✅ 平手時先出價者優先（defender wins tie）
  - ✅ 使用 `Prisma.AuctionWhereInput` 型別

---

### 6.3 WebSocket 支援

#### 6.3.1 安裝 WebSocket 套件

- [x] 安裝依賴
  ```bash
  pnpm --filter @card-erp/api add @fastify/websocket
  ```

#### 6.3.2 建立 WebSocket Plugin

- [x] 建立 `src/plugins/websocket.ts`

  ```typescript
  import type { FastifyPluginAsync } from 'fastify'
  import fp from 'fastify-plugin'
  import websocket from '@fastify/websocket'

  const websocketPlugin: FastifyPluginAsync = async (server) => {
    await server.register(websocket)
  }

  export default fp(websocketPlugin, { name: 'websocket' })
  ```

#### 6.3.3 建立連線管理器（Room-based）

- [x] 建立 `src/modules/auctions/auction-rooms.ts`

  ```typescript
  import type { WebSocket } from 'ws'

  /**
   * 管理每個 auction 的 WebSocket 訂閱者。
   * 每個 auction 是一個 "room"，只有訂閱該 auction 的 client 會收到出價更新。
   */
  class AuctionRoomManager {
    private rooms = new Map<string, Set<WebSocket>>()

    join(auctionId: string, socket: WebSocket) {
      if (!this.rooms.has(auctionId)) {
        this.rooms.set(auctionId, new Set())
      }
      this.rooms.get(auctionId)!.add(socket)
    }

    leave(auctionId: string, socket: WebSocket) {
      const room = this.rooms.get(auctionId)
      if (room) {
        room.delete(socket)
        if (room.size === 0) {
          this.rooms.delete(auctionId)
        }
      }
    }

    broadcast(auctionId: string, message: unknown) {
      const room = this.rooms.get(auctionId)
      if (!room) return

      const data = JSON.stringify(message)
      for (const socket of room) {
        if (socket.readyState === 1) {
          // WebSocket.OPEN
          socket.send(data)
        }
      }
    }
  }

  export const auctionRooms = new AuctionRoomManager()
  ```

  **相較原版的改進**: 原版廣播給所有 WebSocket client（效率差），改為 room-based 只通知訂閱該競標的 client。

#### 6.3.4 註冊到主 server

- [x] 編輯 `src/server.ts`

  ```typescript
  import websocketPlugin from './plugins/websocket.js'
  import { auctionsRoutes } from './modules/auctions/index.js'

  // 在 authPlugin 之後、routes 之前
  await server.register(websocketPlugin)

  // 業務路由
  await server.register(auctionsRoutes, { prefix: '/api/auctions' })
  ```

---

### 6.4 Routes 層

#### 6.4.1 建立 Auctions Routes

- [x] 建立 `src/modules/auctions/auctions.routes.ts`

  **模式說明**: 遵循 Task 5 products routes 的架構模式：
  - Fastify schema 使用 JSON Schema 格式（用於 Swagger 文檔 + 輸入驗證）
  - Handler 內用 Zod `.parse()` 做更精細的驗證
  - 不需要 try/catch（由全域 error-handler 處理）
  - 需認證的端點使用 `onRequest: [server.authenticate]`
  - Response schema 列出所有可能的 status code

  ```typescript
  import type { FastifyPluginAsync } from 'fastify'
  import { AuctionsService } from './auctions.service.js'
  import {
    CreateAuctionSchema,
    PlaceBidSchema,
    QueryAuctionsSchema,
    AuctionIdParamSchema,
  } from './auctions.schema.js'
  import { successResponse, errorResponse } from '../../utils/response.js'
  import { auctionRooms } from './auction-rooms.js'

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

  const AuctionSchema = {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      productId: { type: 'string', format: 'uuid' },
      startingPrice: { type: 'number' },
      buyNowPrice: { type: 'number', nullable: true },
      currentPrice: { type: 'number' },
      incrementAmount: { type: 'number' },
      currentBidderId: { type: 'string', format: 'uuid', nullable: true },
      startTime: { type: 'string', format: 'date-time' },
      endTime: { type: 'string', format: 'date-time' },
      status: { type: 'string', enum: ['UPCOMING', 'ACTIVE', 'ENDED', 'CANCELLED'] },
      createdAt: { type: 'string', format: 'date-time' },
    },
  } as const

  const BidSchema = {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      auctionId: { type: 'string', format: 'uuid' },
      bidderId: { type: 'string', format: 'uuid' },
      amount: { type: 'number' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  } as const

  const auctionsRoutes: FastifyPluginAsync = async (server) => {
    const auctionsService = new AuctionsService(server.prisma, server.redis)

    // ============================================
    // GET / — 查詢競標列表
    // ============================================
    server.get(
      '/',
      {
        schema: {
          tags: ['Auctions'],
          summary: '查詢競標列表',
          description: '支援依狀態篩選與分頁',
          querystring: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['UPCOMING', 'ACTIVE', 'ENDED', 'CANCELLED'] },
              page: { type: 'integer', default: 1, minimum: 1 },
              limit: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
            },
          },
          response: {
            200: {
              description: '成功回傳競標列表',
              type: 'object',
              properties: {
                success: { type: 'boolean', enum: [true] },
                data: { type: 'array', items: AuctionSchema },
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
        const query = QueryAuctionsSchema.parse(request.query)
        const result = await auctionsService.getAuctions(query)

        const response = successResponse(result.auctions, {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        })

        return reply.send(response)
      }
    )

    // ============================================
    // GET /:id — 查詢單一競標
    // ============================================
    server.get(
      '/:id',
      {
        schema: {
          tags: ['Auctions'],
          summary: '查詢單一競標',
          description: '根據 ID 查詢競標詳情，含商品與當前最高出價者',
          params: {
            type: 'object',
            properties: { id: { type: 'string', format: 'uuid' } },
            required: ['id'],
          },
          response: {
            200: {
              description: '成功回傳競標詳情',
              type: 'object',
              properties: {
                success: { type: 'boolean', enum: [true] },
                data: AuctionSchema,
              },
            },
            404: { description: '找不到指定競標', ...ErrorResponseSchema },
          },
        },
      },
      async (request, reply) => {
        const { id } = AuctionIdParamSchema.parse(request.params)
        const auction = await auctionsService.getAuctionById(id)

        if (!auction) {
          return reply.code(404).send(errorResponse('AUCTION_NOT_FOUND', '找不到指定競標'))
        }

        return reply.send(successResponse(auction))
      }
    )

    // ============================================
    // POST / — 建立競標（需認證）
    // ============================================
    server.post(
      '/',
      {
        onRequest: [server.authenticate],
        schema: {
          tags: ['Auctions'],
          summary: '建立競標',
          security: [{ bearerAuth: [] }],
          body: {
            type: 'object',
            required: ['productId', 'startingPrice', 'incrementAmount', 'startTime', 'endTime'],
            properties: {
              productId: { type: 'string', format: 'uuid' },
              startingPrice: { type: 'number', exclusiveMinimum: 0 },
              buyNowPrice: { type: 'number', exclusiveMinimum: 0 },
              incrementAmount: { type: 'number', exclusiveMinimum: 0 },
              startTime: { type: 'string', format: 'date-time' },
              endTime: { type: 'string', format: 'date-time' },
            },
          },
          response: {
            201: {
              description: '競標建立成功',
              type: 'object',
              properties: {
                success: { type: 'boolean', enum: [true] },
                data: AuctionSchema,
              },
            },
            400: { description: '請求參數驗證失敗', ...ErrorResponseSchema },
            401: { description: '未授權', ...ErrorResponseSchema },
          },
        },
      },
      async (request, reply) => {
        const data = CreateAuctionSchema.parse(request.body)
        const auction = await auctionsService.createAuction(data)

        return reply.code(201).send(successResponse(auction))
      }
    )

    // ============================================
    // POST /:id/bid — 出價（需認證）
    // ============================================
    server.post(
      '/:id/bid',
      {
        onRequest: [server.authenticate],
        schema: {
          tags: ['Auctions'],
          summary: '出價',
          description: '對指定競標出價，使用 Redis 鎖防止併發問題',
          security: [{ bearerAuth: [] }],
          params: {
            type: 'object',
            properties: { id: { type: 'string', format: 'uuid' } },
            required: ['id'],
          },
          body: {
            type: 'object',
            required: ['maxBid'],
            properties: {
              maxBid: { type: 'number', exclusiveMinimum: 0, description: '最高願付金額（隱藏）' },
            },
          },
          response: {
            201: {
              description: '出價成功（回傳 currentPrice，不暴露 maxBid）',
              type: 'object',
              properties: {
                success: { type: 'boolean', enum: [true] },
                data: BidSchema,
              },
            },
            400: { description: '出價失敗（金額不足 / 競標未開始）', ...ErrorResponseSchema },
            401: { description: '未授權', ...ErrorResponseSchema },
            404: { description: '找不到指定競標', ...ErrorResponseSchema },
          },
        },
      },
      async (request, reply) => {
        const { id } = AuctionIdParamSchema.parse(request.params)
        const { maxBid } = PlaceBidSchema.parse(request.body)
        const bidderId = request.user.id

        const bid = await auctionsService.placeBid(id, bidderId, maxBid)

        // 廣播給訂閱該競標的 WebSocket client（只推 currentPrice，不暴露 maxBid）
        auctionRooms.broadcast(id, {
          type: 'NEW_BID',
          auctionId: id,
          currentPrice: bid.amount.toNumber(), // amount = 觸發後的顯示價
          leaderId: bid.isActive ? bidderId : undefined,
          timestamp: new Date().toISOString(),
        })

        // 回傳時：出價者本人可看到 maxBid，其他人只能看到 amount
        return reply.code(201).send(
          successResponse({
            id: bid.id,
            auctionId: bid.auctionId,
            maxBid: bid.maxBid, // 僅本人可見（前端需做 access control）
            currentPrice: bid.amount, // 顯示價
            isActive: bid.isActive,
            createdAt: bid.createdAt,
          })
        )
      }
    )

    // ============================================
    // GET /:id/bids — 查詢出價記錄
    // ============================================
    server.get(
      '/:id/bids',
      {
        schema: {
          tags: ['Auctions'],
          summary: '查詢出價記錄',
          description: '按金額降序排列',
          params: {
            type: 'object',
            properties: { id: { type: 'string', format: 'uuid' } },
            required: ['id'],
          },
          response: {
            200: {
              description: '成功回傳出價列表',
              type: 'object',
              properties: {
                success: { type: 'boolean', enum: [true] },
                data: { type: 'array', items: BidSchema },
              },
            },
          },
        },
      },
      async (request, reply) => {
        const { id } = AuctionIdParamSchema.parse(request.params)
        const bids = await auctionsService.getBids(id)

        return reply.send(successResponse(bids))
      }
    )

    // ============================================
    // PUT /:id/cancel — 取消競標（需認證）
    // ============================================
    server.put(
      '/:id/cancel',
      {
        onRequest: [server.authenticate],
        schema: {
          tags: ['Auctions'],
          summary: '取消競標',
          security: [{ bearerAuth: [] }],
          params: {
            type: 'object',
            properties: { id: { type: 'string', format: 'uuid' } },
            required: ['id'],
          },
          response: {
            200: {
              description: '競標取消成功',
              type: 'object',
              properties: {
                success: { type: 'boolean', enum: [true] },
                data: AuctionSchema,
              },
            },
            401: { description: '未授權', ...ErrorResponseSchema },
            404: { description: '找不到指定競標', ...ErrorResponseSchema },
          },
        },
      },
      async (request, reply) => {
        const { id } = AuctionIdParamSchema.parse(request.params)
        const auction = await auctionsService.cancelAuction(id)

        // 廣播取消通知
        auctionRooms.broadcast(id, {
          type: 'AUCTION_CANCELLED',
          auctionId: id,
        })

        return reply.send(successResponse(auction))
      }
    )

    // ============================================
    // WebSocket /:id/subscribe — 訂閱競標即時更新
    // ============================================
    // 注意：@fastify/websocket v11+ (Fastify v5) 的 handler 簽名：
    //   (socket: WebSocket, request: FastifyRequest) => void
    // socket 直接就是 WebSocket 物件，不再是 connection.socket
    server.get('/:id/subscribe', { websocket: true }, (socket, request) => {
      const { id } = request.params as { id: string }

      auctionRooms.join(id, socket)
      server.log.info(`Client subscribed to auction ${id}`)

      socket.send(
        JSON.stringify({
          type: 'CONNECTED',
          auctionId: id,
        })
      )

      socket.on('close', () => {
        auctionRooms.leave(id, socket)
        server.log.info(`Client unsubscribed from auction ${id}`)
      })
    })
  }

  export default auctionsRoutes
  ```

#### 6.4.2 建立 Module Index

- [x] 建立 `src/modules/auctions/index.ts`
  ```typescript
  export { default as auctionsRoutes } from './auctions.routes.js'
  export { AuctionsService } from './auctions.service.js'
  export * from './auctions.schema.js'
  ```

---

### 6.5 定時任務（競標結束處理）

#### 6.5.1 安裝 Cron 套件

- [ ] 安裝依賴
  ```bash
  pnpm --filter @card-erp/api add node-cron
  pnpm --filter @card-erp/api add -D @types/node-cron
  ```

#### 6.5.2 建立定時任務

- [ ] 建立 `src/jobs/auction-end.job.ts`

  ```typescript
  import cron from 'node-cron'
  import type { PrismaClient } from '../../src/generated/prisma/client.js'
  import type Redis from 'ioredis'
  import { logger } from '../utils/logger.js'
  import { AuctionsService } from '../modules/auctions/auctions.service.js'
  import { auctionRooms } from '../modules/auctions/auction-rooms.js'

  export function startAuctionEndJob(prisma: PrismaClient, redis: Redis) {
    const auctionsService = new AuctionsService(prisma, redis)

    // 每分鐘掃描一次已到期的競標
    cron.schedule('* * * * *', async () => {
      try {
        const endedAuctions = await prisma.auction.findMany({
          where: {
            status: 'ACTIVE',
            endTime: { lte: new Date() },
          },
        })

        for (const auction of endedAuctions) {
          await auctionsService.endAuction(auction.id)
          logger.info(`Ended auction ${auction.id}`)

          // 廣播結束通知
          auctionRooms.broadcast(auction.id, {
            type: 'AUCTION_ENDED',
            auctionId: auction.id,
          })
        }

        if (endedAuctions.length > 0) {
          logger.info(`Auction end job: processed ${endedAuctions.length} auctions`)
        }
      } catch (err) {
        logger.error({ err }, 'Auction end job failed')
      }
    })

    logger.info('Auction end job started (interval: every minute)')
  }
  ```

  **⚠️ MVP 限制**: 每分鐘掃一次，最多延遲 ~60 秒。後續可改用 Redis key expiry notification（`__keyevent@0__:expired`）實現精準結標。

#### 6.5.3 啟動定時任務

- [ ] 編輯 `src/server.ts` 的 `start()` 函數

  ```typescript
  import { startAuctionEndJob } from './jobs/auction-end.job.js'

  async function start() {
    const server = await buildServer()
    await server.listen({ port: config.API_PORT, host: config.API_HOST })

    // 啟動定時任務（僅在 server 直接執行時，不在測試中）
    startAuctionEndJob(server.prisma, server.redis)
  }
  ```

---

### 6.6 測試

#### 6.6.1 Service 單元測試

- [x] 建立 `tests/modules/auctions/auctions.service.test.ts`（16 tests passed）
  - 測試建立競標（正常 / 商品不存在 / 商品已售出 / 已有競標）
  - 測試出價邏輯（正常 / 金額不足 / 競標未開始 / 競標不存在）
  - 測試樂觀鎖行為
  - 測試取消競標
  - 測試結束競標

#### 6.6.2 Routes 整合測試

- [ ] 建立 `tests/modules/auctions/auctions.routes.test.ts`
  - 測試所有 REST API endpoints（含 Swagger response schema 驗證）
  - 測試認證保護
  - 測試 validation error 格式

#### 6.6.3 WebSocket 測試

- [ ] 在 routes test 中加入 WebSocket 測試
  - 測試 WebSocket 連接
  - 測試出價後收到即時通知
  - 測試斷開連線後不再收到通知

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
   - 驗證競標狀態更新

5. **效能測試**
   - 出價回應時間 < 100ms

---

## 📝 交付物

- [x] `src/modules/auctions/auctions.schema.ts`
- [x] `src/modules/auctions/auctions.service.ts`
- [x] `src/modules/auctions/auctions.routes.ts`
- [x] `src/modules/auctions/auction-rooms.ts`
- [x] `src/modules/auctions/index.ts`
- [x] `src/plugins/websocket.ts`
- [ ] `src/jobs/auction-end.job.ts`
- [x] `tests/modules/auctions/auctions.service.test.ts`
- [x] `tests/modules/auctions/auctions.routes.test.ts`

---

## 🚨 注意事項

1. **Proxy Bidding（代理出價）**: 採用 eBay 機制，用戶輸入 maxBid，系統自動以最低必要金額跟價。maxBid 對外隱藏，API/WebSocket 只暴露 currentPrice。詳見 `docs/plans/2026-02-14-auctions-api.md` 的跟價規則
2. **分散式鎖**: 使用 Redis SETNX + Lua script owner 驗證，proxy 跟價計算在鎖內原子完成
3. **Prisma Decimal**: 價格欄位是 `Decimal(10,2)`，做數值運算時需 `.toNumber()` 轉換
4. **WebSocket 連線管理**: 使用 room-based 管理器（`auction-rooms.ts`），斷線時自動清理
5. **定時任務**: 確保只有一個實例執行定時任務（分散式環境需考慮 leader election）
6. **Error handling**: 業務錯誤（商品不存在、出價過低）直接 `throw new Error()`，由全域 error-handler 統一處理。後續可引入自定義 Error 類別區分業務 vs 系統錯誤
7. **@fastify/websocket API**: Fastify v5 的 WebSocket handler 簽名可能與文檔不同，實作時需以安裝版本的實際 API 為準
8. **WebSocket 跨 Instance 同步（技術債）**: 目前 `auctionRooms` 為單 process 記憶體 Map，多 instance 部署時需透過 Redis Pub/Sub 廣播事件。已記錄於 `docs/roadmap/PHASE-2-3-OVERVIEW.md` 與 `TECHNICAL-EVOLUTION.md`

---

## 🔗 相關文件

- [@fastify/websocket](https://github.com/fastify/fastify-websocket)
- [node-cron](https://github.com/node-cron/node-cron)
- [Redis Distributed Locks](https://redis.io/docs/manual/patterns/distributed-locks/)
- Task 5 Products Module（架構參考）

---

## 📊 進度追蹤

| 子任務        | 狀態                               | 負責人 | 完成日期   |
| ------------- | ---------------------------------- | ------ | ---------- |
| 6.1 Schema    | ✅ 完成                            | Codex  | 2026-02-14 |
| 6.2 Service   | ✅ 完成                            | Codex  | 2026-02-14 |
| 6.3 WebSocket | ✅ 完成                            | Codex  | 2026-02-15 |
| 6.4 Routes    | ✅ 完成                            | Codex  | 2026-02-15 |
| 6.5 定時任務  | ⏳ 未開始                          | -      | -          |
| 6.6 測試      | 🔄 部分完成（service + routes ✅） | Codex  | 2026-02-15 |

---

## 🔀 分段管線評估

**建議採用分段管線**（Multi-Mission），理由：

1. **檔案數 = 9 個源檔 + 2 個測試檔**，超過單一 Mission 的 3~8 檔案建議值
2. **WebSocket 是獨立技術棧**，與 REST API 的 schema/service/routes 可平行開發
3. **Cron job 是獨立子系統**，不依賴 routes 完成

**建議拆分**:

| Mission                  | 範圍                                                  | 檔案數 | 依賴 | 狀態      |
| ------------------------ | ----------------------------------------------------- | ------ | ---- | --------- |
| **A: Schema + Service**  | 6.1 + 6.2 + service test                              | 3      | 無   | ✅ 完成   |
| **B: WebSocket + Rooms** | 6.3 + auction-rooms.ts                                | 3      | 無   | ✅ 完成   |
| **C: Routes + 整合**     | 6.4 + server.ts 修改 + routes test                    | 4      | A, B | ✅ 完成   |
| **C.5: Proxy Bidding**   | DB migration + schema + service + routes + tests 重構 | 6      | C    | ⏳ 未開始 |
| **D: Cron Job**          | 6.5 + server.ts start() 修改                          | 2      | C.5  | ⏳ 未開始 |

依賴圖：A + B → C → C.5 → D

---

**上一個任務**: [05 - 商品 API](./05-api-products.md)
**下一個任務**: [07 - 訂單 API](./07-api-orders.md)
