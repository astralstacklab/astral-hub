import { z } from 'zod/v4'

export const CreateAuctionSchema = z
  .object({
    productId: z.string().uuid(),
    startingPrice: z.number().positive(),
    buyNowPrice: z.number().positive().optional(),
    incrementAmount: z.number().positive(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  })

export type CreateAuctionInput = z.infer<typeof CreateAuctionSchema>

export const PlaceBidSchema = z.object({
  amount: z.number().positive(),
})

export type PlaceBidInput = z.infer<typeof PlaceBidSchema>

export const QueryAuctionsSchema = z.object({
  status: z.enum(['UPCOMING', 'ACTIVE', 'ENDED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type QueryAuctionsInput = z.infer<typeof QueryAuctionsSchema>

export const AuctionIdParamSchema = z.object({
  id: z.string().uuid(),
})
