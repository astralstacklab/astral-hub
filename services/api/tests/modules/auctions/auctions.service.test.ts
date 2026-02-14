import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { AuctionsService } from '../../../src/modules/auctions/auctions.service.js'
import { buildTestServer, closeTestServer } from '../../helpers.js'

let server: FastifyInstance
let service: AuctionsService
let baseProductId: string
let bidderId: string

async function createProduct(name: string, status: 'PENDING' | 'LISTED' | 'SOLD' = 'PENDING') {
  return server.prisma.product.create({
    data: {
      type: 'CARD',
      category: '測試分類',
      name: `AUCTEST-${name}`,
      costPrice: 100,
      sellingPrice: 200,
      description: '測試商品',
      status,
    },
  })
}

async function createActiveAuction(productId: string, startingPrice = 100, incrementAmount = 10) {
  const now = Date.now()
  return service.createAuction({
    productId,
    startingPrice,
    incrementAmount,
    startTime: new Date(now - 60_000).toISOString(),
    endTime: new Date(now + 3_600_000).toISOString(),
  })
}

beforeAll(async () => {
  server = await buildTestServer()
  service = new AuctionsService(server.prisma, server.redis)
})

beforeEach(async () => {
  await server.prisma.bid.deleteMany()
  await server.prisma.auction.deleteMany()
  await server.prisma.product.deleteMany({
    where: { name: { startsWith: 'AUCTEST-' } },
  })
  await server.prisma.user.deleteMany({
    where: { email: { startsWith: 'bidder-auctest-' } },
  })

  const baseProduct = await createProduct('基礎競標商品')
  baseProductId = baseProduct.id

  const bidder = await server.prisma.user.create({
    data: {
      email: `bidder-auctest-1-${Date.now()}@example.com`,
      name: 'Bidder One',
      provider: 'GOOGLE',
      providerId: `provider-bidder-auctest-1-${Date.now()}`,
    },
  })
  bidderId = bidder.id

  await server.redis.flushdb()
})

afterAll(async () => {
  await server.prisma.bid.deleteMany()
  await server.prisma.auction.deleteMany()
  await server.prisma.product.deleteMany({
    where: { name: { startsWith: 'AUCTEST-' } },
  })
  await server.prisma.user.deleteMany({
    where: { email: { startsWith: 'bidder-auctest-' } },
  })

  await closeTestServer(server)
})

describe('AuctionsService', () => {
  describe('createAuction', () => {
    it('should create UPCOMING auction when startTime is in the future', async () => {
      const now = Date.now()
      const created = await service.createAuction({
        productId: baseProductId,
        startingPrice: 100,
        incrementAmount: 10,
        startTime: new Date(now + 60_000).toISOString(),
        endTime: new Date(now + 7_200_000).toISOString(),
      })

      expect(created.status).toBe('UPCOMING')
      expect(created.currentPrice.toNumber()).toBe(100)

      const redisInfo = await server.redis.hgetall(`auction:${created.id}:info`)
      expect(redisInfo.status).toBe('UPCOMING')
      expect(redisInfo.currentPrice).toBe('100')
    })

    it('should create ACTIVE auction when startTime is in the past', async () => {
      const now = Date.now()
      const created = await service.createAuction({
        productId: baseProductId,
        startingPrice: 100,
        incrementAmount: 10,
        startTime: new Date(now - 60_000).toISOString(),
        endTime: new Date(now + 3_600_000).toISOString(),
      })

      expect(created.status).toBe('ACTIVE')
    })

    it('should throw when product does not exist', async () => {
      const now = Date.now()
      await expect(
        service.createAuction({
          productId: '00000000-0000-0000-0000-000000000000',
          startingPrice: 100,
          incrementAmount: 10,
          startTime: new Date(now - 60_000).toISOString(),
          endTime: new Date(now + 3_600_000).toISOString(),
        })
      ).rejects.toThrow('商品不存在')
    })

    it('should throw when product is sold', async () => {
      await server.prisma.product.update({
        where: { id: baseProductId },
        data: { status: 'SOLD' },
      })

      const now = Date.now()
      await expect(
        service.createAuction({
          productId: baseProductId,
          startingPrice: 100,
          incrementAmount: 10,
          startTime: new Date(now - 60_000).toISOString(),
          endTime: new Date(now + 3_600_000).toISOString(),
        })
      ).rejects.toThrow('商品已售出')
    })

    it('should throw when product already has auction', async () => {
      await createActiveAuction(baseProductId)

      const now = Date.now()
      await expect(
        service.createAuction({
          productId: baseProductId,
          startingPrice: 200,
          incrementAmount: 10,
          startTime: new Date(now - 60_000).toISOString(),
          endTime: new Date(now + 3_600_000).toISOString(),
        })
      ).rejects.toThrow('商品已有進行中的競標')
    })
  })

  describe('getAuctionById', () => {
    it('should return auction with product and currentBidder relations', async () => {
      const auction = await createActiveAuction(baseProductId)
      await server.prisma.auction.update({
        where: { id: auction.id },
        data: { currentBidderId: bidderId },
      })

      const found = await service.getAuctionById(auction.id)

      expect(found).not.toBeNull()
      expect(found!.product.id).toBe(baseProductId)
      expect(found!.currentBidder!.id).toBe(bidderId)
    })

    it('should return null when auction does not exist', async () => {
      const found = await service.getAuctionById('00000000-0000-0000-0000-000000000000')
      expect(found).toBeNull()
    })
  })

  describe('getAuctions', () => {
    it('should return paginated data', async () => {
      const p1 = await createProduct('分頁商品 1')
      const p2 = await createProduct('分頁商品 2')
      const p3 = await createProduct('分頁商品 3')

      await createActiveAuction(p1.id)
      await createActiveAuction(p2.id)
      await createActiveAuction(p3.id)

      const result = await service.getAuctions({ page: 1, limit: 2 })

      expect(result.auctions).toHaveLength(2)
      expect(result.total).toBe(3)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(2)
      expect(result.totalPages).toBe(2)
    })

    it('should filter by status', async () => {
      const activeProduct = await createProduct('ACTIVE 商品')
      const upcomingProduct = await createProduct('UPCOMING 商品')

      await createActiveAuction(activeProduct.id)

      const now = Date.now()
      await service.createAuction({
        productId: upcomingProduct.id,
        startingPrice: 100,
        incrementAmount: 10,
        startTime: new Date(now + 60_000).toISOString(),
        endTime: new Date(now + 3_600_000).toISOString(),
      })

      const result = await service.getAuctions({ status: 'UPCOMING', page: 1, limit: 20 })

      expect(result.total).toBe(1)
      expect(result.auctions[0].status).toBe('UPCOMING')
    })
  })

  describe('placeBid', () => {
    it('should place bid successfully', async () => {
      const auction = await createActiveAuction(baseProductId, 100, 10)

      const bid = await service.placeBid(auction.id, bidderId, 110)

      expect(bid.amount.toNumber()).toBe(110)

      const updated = await server.prisma.auction.findUnique({ where: { id: auction.id } })
      expect(updated!.currentPrice.toNumber()).toBe(110)
      expect(updated!.currentBidderId).toBe(bidderId)
    })

    it('should throw when bid amount is too low', async () => {
      const auction = await createActiveAuction(baseProductId, 100, 10)

      await expect(service.placeBid(auction.id, bidderId, 109)).rejects.toThrow('出價必須至少')
    })

    it('should throw when auction does not exist', async () => {
      await expect(
        service.placeBid('00000000-0000-0000-0000-000000000000', bidderId, 100)
      ).rejects.toThrow('競標不存在')
    })

    it('should throw when auction is not ACTIVE', async () => {
      const now = Date.now()
      const auction = await service.createAuction({
        productId: baseProductId,
        startingPrice: 100,
        incrementAmount: 10,
        startTime: new Date(now + 60_000).toISOString(),
        endTime: new Date(now + 3_600_000).toISOString(),
      })

      await expect(service.placeBid(auction.id, bidderId, 110)).rejects.toThrow(
        '競標尚未開始或已結束'
      )
    })
  })

  describe('getBids', () => {
    it('should return bids ordered by amount desc', async () => {
      const auction = await createActiveAuction(baseProductId, 100, 10)

      const bidder2 = await server.prisma.user.create({
        data: {
          email: `bidder-auctest-2-${Date.now()}@example.com`,
          name: 'Bidder Two',
          provider: 'FACEBOOK',
          providerId: `provider-bidder-auctest-2-${Date.now()}`,
        },
      })

      await service.placeBid(auction.id, bidderId, 110)
      await service.placeBid(auction.id, bidder2.id, 130)

      const bids = await service.getBids(auction.id)

      expect(bids).toHaveLength(2)
      expect(bids[0].amount.toNumber()).toBe(130)
      expect(bids[1].amount.toNumber()).toBe(110)
      expect(bids[0].bidder.name).toBe('Bidder Two')
    })
  })

  describe('cancelAuction', () => {
    it('should set status to CANCELLED', async () => {
      const auction = await createActiveAuction(baseProductId)

      const cancelled = await service.cancelAuction(auction.id)

      expect(cancelled.status).toBe('CANCELLED')

      const redisStatus = await server.redis.hget(`auction:${auction.id}:info`, 'status')
      expect(redisStatus).toBe('CANCELLED')
    })
  })

  describe('endAuction', () => {
    it('should set status to ENDED', async () => {
      const auction = await createActiveAuction(baseProductId)

      await service.endAuction(auction.id)

      const ended = await server.prisma.auction.findUnique({ where: { id: auction.id } })
      expect(ended!.status).toBe('ENDED')

      const redisStatus = await server.redis.hget(`auction:${auction.id}:info`, 'status')
      expect(redisStatus).toBe('ENDED')
    })
  })
})
