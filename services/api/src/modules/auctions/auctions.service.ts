import type { PrismaClient, Auction, Bid, Prisma } from '../../../src/generated/prisma/client.js'
import type Redis from 'ioredis'
import type { CreateAuctionInput, QueryAuctionsInput } from './auctions.schema.js'

export class AuctionsService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {}

  async createAuction(data: CreateAuctionInput): Promise<Auction> {
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
    })

    if (!product) {
      throw new Error('商品不存在')
    }

    if (product.status === 'SOLD') {
      throw new Error('商品已售出')
    }

    const existingAuction = await this.prisma.auction.findUnique({
      where: { productId: data.productId },
    })

    if (existingAuction) {
      throw new Error('商品已有進行中的競標')
    }

    const now = new Date()
    const startTime = new Date(data.startTime)
    const status = startTime > now ? 'UPCOMING' : 'ACTIVE'

    const auction = await this.prisma.auction.create({
      data: {
        ...data,
        startTime,
        endTime: new Date(data.endTime),
        currentPrice: data.startingPrice,
        status,
      },
    })

    try {
      await this.redis.hset(`auction:${auction.id}:info`, {
        status: auction.status,
        productId: auction.productId,
        currentPrice: auction.currentPrice.toString(),
        incrementAmount: auction.incrementAmount.toString(),
        startTime: auction.startTime.toISOString(),
        endTime: auction.endTime.toISOString(),
      })
    } catch {
      // Redis 非關鍵路徑：不阻斷主流程
    }

    return auction
  }

  async getAuctionById(id: string): Promise<Auction | null> {
    return this.prisma.auction.findUnique({
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
  }

  async getAuctions(query: QueryAuctionsInput) {
    const { page, limit, status } = query

    const where: Prisma.AuctionWhereInput = {}
    if (status) {
      where.status = status
    }

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
              category: true,
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
    const lockKey = `auction:${auctionId}:bid-lock`
    const lockOwner = `${bidderId}:${Date.now()}:${Math.random().toString(36).slice(2)}`

    const lockResult = await this.redis.set(lockKey, lockOwner, 'PX', 5000, 'NX')
    if (!lockResult) {
      throw new Error('系統忙碌，請稍後再試')
    }

    try {
      const auction = await this.prisma.auction.findUnique({
        where: { id: auctionId },
      })

      if (!auction) {
        throw new Error('競標不存在')
      }

      if (auction.status !== 'ACTIVE') {
        throw new Error('競標尚未開始或已結束')
      }

      const minimumAmount = auction.currentPrice.toNumber() + auction.incrementAmount.toNumber()
      if (amount < minimumAmount) {
        throw new Error(`出價必須至少 ${minimumAmount}`)
      }

      const bid = await this.prisma.$transaction(async (tx) => {
        const createdBid = await tx.bid.create({
          data: {
            auctionId,
            bidderId,
            amount,
          },
        })

        await tx.auction.update({
          where: { id: auctionId },
          data: {
            currentPrice: amount,
            currentBidderId: bidderId,
          },
        })

        return createdBid
      })

      try {
        await this.redis.hset(`auction:${auctionId}:info`, {
          currentPrice: amount.toString(),
          currentBidderId: bidderId,
        })
      } catch {
        // Redis 同步失敗不影響交易一致性
      }

      return bid
    } finally {
      try {
        await this.redis.eval(
          "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end",
          1,
          lockKey,
          lockOwner
        )
      } catch {
        // 釋放鎖失敗由 TTL 自動回收
      }
    }
  }

  async getBids(auctionId: string): Promise<Bid[]> {
    return this.prisma.bid.findMany({
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
  }

  async cancelAuction(id: string): Promise<Auction> {
    const auction = await this.prisma.auction.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    try {
      await this.redis.hset(`auction:${id}:info`, 'status', 'CANCELLED')
    } catch {
      // Redis 非關鍵路徑：不阻斷主流程
    }

    return auction
  }

  async endAuction(id: string): Promise<void> {
    await this.prisma.auction.update({
      where: { id },
      data: { status: 'ENDED' },
    })

    // TODO: 建立訂單 / 發送通知

    try {
      await this.redis.hset(`auction:${id}:info`, 'status', 'ENDED')
    } catch {
      // Redis 非關鍵路徑：不阻斷主流程
    }
  }
}
