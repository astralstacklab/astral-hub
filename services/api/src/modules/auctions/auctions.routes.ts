import type { FastifyPluginAsync } from 'fastify'
import type { WebSocket } from 'ws'
import { AuctionsService } from './auctions.service.js'
import {
  CreateAuctionSchema,
  PlaceBidSchema,
  QueryAuctionsSchema,
  AuctionIdParamSchema,
} from './auctions.schema.js'
import { successResponse, errorResponse } from '../../utils/response.js'
import { auctionRooms } from './auction-rooms.js'

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

      return reply.send(
        successResponse(result.auctions, {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        })
      )
    }
  )

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
          required: ['amount'],
          properties: {
            amount: { type: 'number', exclusiveMinimum: 0 },
          },
        },
        response: {
          201: {
            description: '出價成功',
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
      const { amount } = PlaceBidSchema.parse(request.body)
      const bidderId = request.user.id

      const auction = await auctionsService.getAuctionById(id)
      if (!auction) {
        return reply.code(404).send(errorResponse('AUCTION_NOT_FOUND', '找不到指定競標'))
      }

      if (auction.status !== 'ACTIVE') {
        return reply.code(400).send(errorResponse('BID_REJECTED', '競標尚未開始或已結束'))
      }

      const minBidAmount = auction.currentPrice.toNumber() + auction.incrementAmount.toNumber()
      if (amount < minBidAmount) {
        return reply.code(400).send(errorResponse('BID_REJECTED', `出價必須至少 ${minBidAmount}`))
      }

      const bid = await auctionsService.placeBid(id, bidderId, amount)

      auctionRooms.broadcast(id, {
        type: 'NEW_BID',
        auctionId: id,
        bid: { amount, bidderId, timestamp: new Date().toISOString() },
      })

      return reply.code(201).send(successResponse(bid))
    }
  )

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
      const auction = await auctionsService.getAuctionById(id)

      if (!auction) {
        return reply.code(404).send(errorResponse('AUCTION_NOT_FOUND', '找不到指定競標'))
      }

      const cancelledAuction = await auctionsService.cancelAuction(id)

      auctionRooms.broadcast(id, {
        type: 'AUCTION_CANCELLED',
        auctionId: id,
      })

      return reply.send(successResponse(cancelledAuction))
    }
  )

  server.get('/:id/subscribe', { websocket: true }, (socket: WebSocket, request) => {
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
