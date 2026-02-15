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

  describe('placeBid — Proxy Bidding', () => {
    it('首位出價者：currentPrice = startingPrice', async () => {
      const auction = await createActiveAuction(baseProductId, 100, 10)

      const bid = await service.placeBid(auction.id, bidderId, 500)

      expect(bid.amount.toNumber()).toBe(100)
      expect(bid.maxBid.toNumber()).toBe(500)
      expect(bid.isActive).toBe(true)

      const updated = await server.prisma.auction.findUnique({ where: { id: auction.id } })
      expect(updated!.currentPrice.toNumber()).toBe(100)
      expect(updated!.currentBidderId).toBe(bidderId)
    })

    it('challenger 勝出：currentPrice = min(defender.maxBid + increment, challenger.maxBid)', async () => {
      const auction = await createActiveAuction(baseProductId, 100, 10)
      await service.placeBid(auction.id, bidderId, 200)

      const bidder2 = await server.prisma.user.create({
        data: {
          email: `bidder-auctest-proxy-2-${Date.now()}@example.com`,
          name: 'Bidder Two',
          provider: 'FACEBOOK',
          providerId: `provider-bidder-proxy-2-${Date.now()}`,
        },
      })
      const bid2 = await service.placeBid(auction.id, bidder2.id, 500)

      expect(bid2.amount.toNumber()).toBe(210)
      expect(bid2.isActive).toBe(true)

      const updated = await server.prisma.auction.findUnique({ where: { id: auction.id } })
      expect(updated!.currentPrice.toNumber()).toBe(210)
      expect(updated!.currentBidderId).toBe(bidder2.id)

      const oldBid = await server.prisma.bid.findFirst({
        where: { auctionId: auction.id, bidderId },
      })
      expect(oldBid!.isActive).toBe(false)
    })

    it('defender 維持領先：currentPrice = min(challenger.maxBid + increment, defender.maxBid)', async () => {
      const auction = await createActiveAuction(baseProductId, 100, 10)
      await service.placeBid(auction.id, bidderId, 500)

      const bidder2 = await server.prisma.user.create({
        data: {
          email: `bidder-auctest-proxy-3-${Date.now()}@example.com`,
          name: 'Bidder Three',
          provider: 'FACEBOOK',
          providerId: `provider-bidder-proxy-3-${Date.now()}`,
        },
      })
      const bid2 = await service.placeBid(auction.id, bidder2.id, 200)

      expect(bid2.amount.toNumber()).toBe(210)
      expect(bid2.isActive).toBe(false)

      const updated = await server.prisma.auction.findUnique({ where: { id: auction.id } })
      expect(updated!.currentPrice.toNumber()).toBe(210)
      expect(updated!.currentBidderId).toBe(bidderId)
    })

    it('平手時先出價者優先（defender wins tie）', async () => {
      const auction = await createActiveAuction(baseProductId, 100, 10)
      await service.placeBid(auction.id, bidderId, 300)

      const bidder2 = await server.prisma.user.create({
        data: {
          email: `bidder-auctest-proxy-4-${Date.now()}@example.com`,
          name: 'Bidder Four',
          provider: 'FACEBOOK',
          providerId: `provider-bidder-proxy-4-${Date.now()}`,
        },
      })
      const bid2 = await service.placeBid(auction.id, bidder2.id, 300)

      expect(bid2.amount.toNumber()).toBe(300)
      expect(bid2.isActive).toBe(false)

      const updated = await server.prisma.auction.findUnique({ where: { id: auction.id } })
      expect(updated!.currentBidderId).toBe(bidderId)
    })

    it('同一用戶追加 maxBid：更新原 record，不觸發跟價', async () => {
      const auction = await createActiveAuction(baseProductId, 100, 10)

      const firstBid = await service.placeBid(auction.id, bidderId, 200)
      const updatedBid = await service.placeBid(auction.id, bidderId, 500)

      expect(updatedBid.id).toBe(firstBid.id)
      expect(updatedBid.maxBid.toNumber()).toBe(500)

      const updated = await server.prisma.auction.findUnique({ where: { id: auction.id } })
      expect(updated!.currentPrice.toNumber()).toBe(100)
    })

    it('同一用戶追加 maxBid 低於原值時應拋錯', async () => {
      const auction = await createActiveAuction(baseProductId, 100, 10)
      await service.placeBid(auction.id, bidderId, 500)

      await expect(service.placeBid(auction.id, bidderId, 300)).rejects.toThrow(
        '追加金額必須高於目前的最高出價'
      )
    })

    it('maxBid 低於最低要求時應拋錯', async () => {
      const auction = await createActiveAuction(baseProductId, 100, 10)

      await expect(service.placeBid(auction.id, bidderId, 50)).rejects.toThrow('最高出價必須至少')
    })

    it('有 defender 後第二位出價者最低要求 = currentPrice + increment', async () => {
      const auction = await createActiveAuction(baseProductId, 100, 10)
      await service.placeBid(auction.id, bidderId, 200)

      const bidder2 = await server.prisma.user.create({
        data: {
          email: `bidder-auctest-proxy-5-${Date.now()}@example.com`,
          name: 'Bidder Five',
          provider: 'FACEBOOK',
          providerId: `provider-bidder-proxy-5-${Date.now()}`,
        },
      })

      await expect(service.placeBid(auction.id, bidder2.id, 105)).rejects.toThrow(
        '最高出價必須至少'
      )
    })

    it('競標不存在時應拋錯', async () => {
      await expect(
        service.placeBid('00000000-0000-0000-0000-000000000000', bidderId, 100)
      ).rejects.toThrow('競標不存在')
    })

    it('競標非 ACTIVE 時應拋錯', async () => {
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

    it('任何時刻同一 auction 最多一筆 isActive=true（single active invariant）', async () => {
      const auction = await createActiveAuction(baseProductId, 100, 10)
      await service.placeBid(auction.id, bidderId, 200)

      const bidder2 = await server.prisma.user.create({
        data: {
          email: `bidder-auctest-proxy-inv-${Date.now()}@example.com`,
          name: 'Bidder Invariant',
          provider: 'FACEBOOK',
          providerId: `provider-bidder-proxy-inv-${Date.now()}`,
        },
      })
      await service.placeBid(auction.id, bidder2.id, 500)

      const bidder3 = await server.prisma.user.create({
        data: {
          email: `bidder-auctest-proxy-inv2-${Date.now()}@example.com`,
          name: 'Bidder Invariant 2',
          provider: 'FACEBOOK',
          providerId: `provider-bidder-proxy-inv2-${Date.now()}`,
        },
      })
      await service.placeBid(auction.id, bidder3.id, 300)

      const activeBids = await server.prisma.bid.findMany({
        where: { auctionId: auction.id, isActive: true },
      })
      expect(activeBids).toHaveLength(1)
      expect(activeBids[0].bidderId).toBe(bidder2.id)
    })

    it('buyNowPrice 觸發時應以 buyNowPrice 結標', async () => {
      const product = await createProduct('直購測試商品')
      const now = Date.now()
      const auction = await service.createAuction({
        productId: product.id,
        startingPrice: 100,
        buyNowPrice: 1000,
        incrementAmount: 10,
        startTime: new Date(now - 60_000).toISOString(),
        endTime: new Date(now + 3_600_000).toISOString(),
      })

      const bid = await service.placeBid(auction.id, bidderId, 1000)

      expect(bid.amount.toNumber()).toBe(1000)
      expect(bid.isActive).toBe(true)

      const updated = await server.prisma.auction.findUnique({ where: { id: auction.id } })
      expect(updated!.status).toBe('ENDED')
      expect(updated!.currentPrice.toNumber()).toBe(1000)
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

      await service.placeBid(auction.id, bidderId, 200)
      await service.placeBid(auction.id, bidder2.id, 500)

      const bids = await service.getBids(auction.id)

      expect(bids).toHaveLength(2)
      expect(bids[0].amount.toNumber()).toBe(210)
      expect(bids[1].amount.toNumber()).toBe(100)
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
