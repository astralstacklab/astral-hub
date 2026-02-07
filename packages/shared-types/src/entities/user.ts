import type { OAuthProvider, MemberLevel } from '../enums'

export interface User {
  id: string
  email: string
  name: string
  avatar: string | null
  provider: OAuthProvider
  providerId: string
  loyaltyPoints: number
  memberLevel: MemberLevel
  createdAt: Date
}
