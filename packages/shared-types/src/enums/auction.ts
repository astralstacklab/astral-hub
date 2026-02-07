export const AuctionStatus = {
  UPCOMING: 'UPCOMING',
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED',
  CANCELLED: 'CANCELLED',
} as const
export type AuctionStatus = (typeof AuctionStatus)[keyof typeof AuctionStatus]
