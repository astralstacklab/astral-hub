export const ProductType = {
  CARD: 'CARD',
  ACCESSORY: 'ACCESSORY',
} as const
export type ProductType = (typeof ProductType)[keyof typeof ProductType]

export const ProductStatus = {
  PENDING: 'PENDING',
  LISTED: 'LISTED',
  SOLD: 'SOLD',
} as const
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus]

export const ProductChannel = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  BOTH: 'BOTH',
} as const
export type ProductChannel = (typeof ProductChannel)[keyof typeof ProductChannel]

export const GradingStatus = {
  RAW: 'RAW',
  PSA: 'PSA',
  ARS: 'ARS',
  BGS: 'BGS',
} as const
export type GradingStatus = (typeof GradingStatus)[keyof typeof GradingStatus]

export const ImageType = {
  FRONT: 'front',
  BACK: 'back',
  DETAIL: 'detail',
  CERT: 'cert',
} as const
export type ImageType = (typeof ImageType)[keyof typeof ImageType]
