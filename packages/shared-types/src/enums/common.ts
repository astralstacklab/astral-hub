export const UserRole = {
  BUYER: 'BUYER',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const AdminRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
} as const
export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole]

export const OAuthProvider = {
  GOOGLE: 'GOOGLE',
  FACEBOOK: 'FACEBOOK',
} as const
export type OAuthProvider = (typeof OAuthProvider)[keyof typeof OAuthProvider]

export const SellerLevel = {
  BRONZE: 'BRONZE',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
} as const
export type SellerLevel = (typeof SellerLevel)[keyof typeof SellerLevel]

export const SellerStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const
export type SellerStatus = (typeof SellerStatus)[keyof typeof SellerStatus]

export const MemberLevel = {
  STANDARD: 'STANDARD',
} as const
export type MemberLevel = (typeof MemberLevel)[keyof typeof MemberLevel]
