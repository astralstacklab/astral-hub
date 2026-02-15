import cron from 'node-cron'
import type Redis from 'ioredis'
import type { PrismaClient } from '../generated/prisma/client.js'
import { logger } from '../utils/logger.js'
import { AuctionsService } from '../modules/auctions/auctions.service.js'
import { auctionRooms } from '../modules/auctions/auction-rooms.js'

export function startAuctionEndJob(prisma: PrismaClient, redis: Redis) {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date()
      const expiredAuctions = await prisma.auction.findMany({
        where: {
          status: 'ACTIVE',
          endTime: {
            lte: now,
          },
        },
        select: {
          id: true,
        },
      })

      if (expiredAuctions.length === 0) {
        return
      }

      const auctionsService = new AuctionsService(prisma, redis)

      for (const auction of expiredAuctions) {
        await auctionsService.endAuction(auction.id)
        auctionRooms.broadcast(auction.id, {
          type: 'AUCTION_ENDED',
          auctionId: auction.id,
        })
      }
    } catch (error) {
      logger.error({ err: error }, 'Auction end cron job failed')
    }
  })
}
