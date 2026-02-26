# shared-types 套件 實作計畫

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 建立 `@astral-hub/shared-types` 套件，為前後端提供統一的型別定義（entities、enums、DTOs、API response types）。

**Architecture:** 純 TypeScript 套件，只輸出型別定義和 const enums。使用 Zod v4 定義 schema 同時產生 runtime validation + TypeScript 型別。套件透過 pnpm workspace 供 monorepo 內其他專案引用。

**Tech Stack:** TypeScript 5.2+, Zod v4 (`import { z } from "zod/v4"`)

---

## Task 1: 套件骨架與配置

**Files:**

- Create: `packages/shared-types/package.json`
- Create: `packages/shared-types/tsconfig.json`
- Create: `packages/shared-types/src/index.ts`

**Step 1: 建立 package.json**

```json
{
  "name": "@astral-hub/shared-types",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "typescript": "^5.2.0"
  }
}
```

**Step 2: 建立 tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: 建立空的 src/index.ts**

```typescript
// @astral-hub/shared-types
// 統一匯出入口
```

**Step 4: 安裝依賴並驗證**

Run: `cd /home/a9293340/astral-hub && pnpm install`

Run: `pnpm --filter @astral-hub/shared-types type-check`
Expected: 通過，無錯誤

**Step 5: Commit**

```bash
git add packages/shared-types/
git commit -m "feat(shared-types): 建立套件骨架與配置"
```

---

## Task 2: 枚舉定義（enums/）

枚舉必須在 entities 之前完成，因為 entities 依賴 enums。

**Files:**

- Create: `packages/shared-types/src/enums/product.ts`
- Create: `packages/shared-types/src/enums/order.ts`
- Create: `packages/shared-types/src/enums/auction.ts`
- Create: `packages/shared-types/src/enums/common.ts`
- Create: `packages/shared-types/src/enums/index.ts`

**Step 1: 建立 enums/product.ts**

參考 AGENTS.md 和 Task 02 定義。使用 `as const` 物件 + type 推導（比 TS enum 更安全、tree-shakable）：

```typescript
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
```

**Step 2: 建立 enums/order.ts**

```typescript
export const PaymentMethod = {
  CASH: 'CASH',
  CREDIT_CARD: 'CREDIT_CARD',
  LINE_PAY: 'LINE_PAY',
  TRANSFER: 'TRANSFER',
} as const
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]

export const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]

export const ShippingMethod = {
  SEVEN_ELEVEN: 'SEVEN_ELEVEN',
  FAMILY_MART: 'FAMILY_MART',
  FACE_TO_FACE: 'FACE_TO_FACE',
  IN_STORE: 'IN_STORE',
} as const
export type ShippingMethod = (typeof ShippingMethod)[keyof typeof ShippingMethod]

export const OrderStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]

export const OrderChannel = {
  ONLINE: 'ONLINE',
  POS: 'POS',
} as const
export type OrderChannel = (typeof OrderChannel)[keyof typeof OrderChannel]
```

**Step 3: 建立 enums/auction.ts**

```typescript
export const AuctionStatus = {
  UPCOMING: 'UPCOMING',
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED',
  CANCELLED: 'CANCELLED',
} as const
export type AuctionStatus = (typeof AuctionStatus)[keyof typeof AuctionStatus]
```

**Step 4: 建立 enums/common.ts**

```typescript
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
```

**Step 5: 建立 enums/index.ts**

```typescript
export * from './product'
export * from './order'
export * from './auction'
export * from './common'
```

**Step 6: 更新 src/index.ts 並驗證**

```typescript
// Enums
export * from './enums'
```

Run: `pnpm --filter @astral-hub/shared-types type-check`
Expected: 通過

**Step 7: Commit**

```bash
git add packages/shared-types/src/enums/
git add packages/shared-types/src/index.ts
git commit -m "feat(shared-types): 定義所有枚舉（product, order, auction, common）"
```

---

## Task 3: 實體型別定義（entities/）

**Files:**

- Create: `packages/shared-types/src/entities/product.ts`
- Create: `packages/shared-types/src/entities/order.ts`
- Create: `packages/shared-types/src/entities/auction.ts`
- Create: `packages/shared-types/src/entities/user.ts`
- Create: `packages/shared-types/src/entities/seller.ts`
- Create: `packages/shared-types/src/entities/admin-user.ts`
- Create: `packages/shared-types/src/entities/index.ts`

**Step 1: 建立 entities/product.ts**

```typescript
import type { ProductType, ProductStatus, ProductChannel, GradingStatus, ImageType } from '../enums'

export interface ProductImage {
  url: string
  type: ImageType
}

export interface Product {
  id: string
  type: ProductType
  category: string
  name: string
  series: string | null
  cardNumber: string | null
  gradingStatus: GradingStatus | null
  gradingScore: number | null
  costPrice: number
  sellingPrice: number
  sellerId: string | null
  status: ProductStatus
  channel: ProductChannel
  images: ProductImage[]
  video: string | null
  description: string
  conditionNotes: string | null
  supplier: string | null
  stockQuantity: number
  createdAt: Date
  updatedAt: Date
}
```

**Step 2: 建立 entities/order.ts**

```typescript
import type {
  PaymentMethod,
  PaymentStatus,
  ShippingMethod,
  OrderStatus,
  OrderChannel,
} from '../enums'

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface ShippingAddress {
  recipientName: string
  phone: string
  zipCode: string
  city: string
  district: string
  address: string
  storeId?: string
  storeName?: string
}

export interface Order {
  id: string
  orderNumber: string
  buyerId: string
  items: OrderItem[]
  totalAmount: number
  discountAmount: number
  finalAmount: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  shippingMethod: ShippingMethod
  shippingAddress: ShippingAddress | null
  trackingNumber: string | null
  status: OrderStatus
  channel: OrderChannel
  createdAt: Date
}
```

**Step 3: 建立 entities/auction.ts**

```typescript
import type { AuctionStatus } from '../enums'

export interface Auction {
  id: string
  productId: string
  startingPrice: number
  buyNowPrice: number | null
  currentPrice: number
  incrementAmount: number
  currentBidderId: string | null
  startTime: Date
  endTime: Date
  status: AuctionStatus
  createdAt: Date
}

export interface Bid {
  id: string
  auctionId: string
  bidderId: string
  amount: number
  createdAt: Date
}
```

**Step 4: 建立 entities/user.ts**

```typescript
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
```

**Step 5: 建立 entities/seller.ts**

```typescript
import type { SellerLevel, SellerStatus } from '../enums'

export interface Seller {
  id: string
  email: string
  name: string
  level: SellerLevel
  totalSales: number
  balance: number
  commissionRate: number
  onlineListingFee: number
  offlineListingFee: number
  status: SellerStatus
  createdAt: Date
}
```

**Step 6: 建立 entities/admin-user.ts**

```typescript
import type { AdminRole } from '../enums'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: AdminRole
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
}
```

**Step 7: 建立 entities/index.ts**

```typescript
export type { Product, ProductImage } from './product'
export type { Order, OrderItem, ShippingAddress } from './order'
export type { Auction, Bid } from './auction'
export type { User } from './user'
export type { Seller } from './seller'
export type { AdminUser } from './admin-user'
```

**Step 8: 更新 src/index.ts 並驗證**

```typescript
// Enums
export * from './enums'

// Entities
export * from './entities'
```

Run: `pnpm --filter @astral-hub/shared-types type-check`
Expected: 通過

**Step 9: Commit**

```bash
git add packages/shared-types/src/entities/
git add packages/shared-types/src/index.ts
git commit -m "feat(shared-types): 定義所有實體型別（product, order, auction, user, seller, admin-user）"
```

---

## Task 4: DTO 型別定義（dtos/）

**Files:**

- Create: `packages/shared-types/src/dtos/product-dto.ts`
- Create: `packages/shared-types/src/dtos/order-dto.ts`
- Create: `packages/shared-types/src/dtos/auction-dto.ts`
- Create: `packages/shared-types/src/dtos/user-dto.ts`
- Create: `packages/shared-types/src/dtos/index.ts`

**Step 1: 建立 dtos/product-dto.ts**

```typescript
import type { ProductType, ProductStatus, ProductChannel, GradingStatus } from '../enums'

export interface CreateProductDTO {
  type: ProductType
  category: string
  name: string
  series?: string
  cardNumber?: string
  gradingStatus?: GradingStatus
  gradingScore?: number
  costPrice: number
  sellingPrice: number
  sellerId?: string
  channel: ProductChannel
  description: string
  conditionNotes?: string
  supplier?: string
}

export interface UpdateProductDTO {
  name?: string
  sellingPrice?: number
  status?: ProductStatus
  channel?: ProductChannel
  description?: string
  conditionNotes?: string
}

export interface QueryProductsDTO {
  category?: string
  status?: ProductStatus
  channel?: ProductChannel
  minPrice?: number
  maxPrice?: number
  search?: string
  page?: number
  limit?: number
  sort?: string
}
```

**Step 2: 建立 dtos/order-dto.ts**

```typescript
import type { PaymentMethod, ShippingMethod, OrderStatus } from '../enums'

export interface CreateOrderItemDTO {
  productId: string
  quantity: number
}

export interface CreateOrderDTO {
  items: CreateOrderItemDTO[]
  paymentMethod: PaymentMethod
  shippingMethod: ShippingMethod
  shippingAddress?: {
    recipientName: string
    phone: string
    zipCode: string
    city: string
    district: string
    address: string
    storeId?: string
    storeName?: string
  }
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus
  trackingNumber?: string
}

export interface QueryOrdersDTO {
  status?: OrderStatus
  page?: number
  limit?: number
}
```

**Step 3: 建立 dtos/auction-dto.ts**

```typescript
export interface CreateAuctionDTO {
  productId: string
  startingPrice: number
  buyNowPrice?: number
  incrementAmount: number
  startTime: string
  endTime: string
}

export interface PlaceBidDTO {
  amount: number
}

export interface QueryAuctionsDTO {
  status?: string
  page?: number
  limit?: number
}
```

**Step 4: 建立 dtos/user-dto.ts**

```typescript
export interface UpdateUserProfileDTO {
  name?: string
  avatar?: string
}
```

**Step 5: 建立 dtos/index.ts**

```typescript
export type { CreateProductDTO, UpdateProductDTO, QueryProductsDTO } from './product-dto'

export type {
  CreateOrderDTO,
  CreateOrderItemDTO,
  UpdateOrderStatusDTO,
  QueryOrdersDTO,
} from './order-dto'

export type { CreateAuctionDTO, PlaceBidDTO, QueryAuctionsDTO } from './auction-dto'

export type { UpdateUserProfileDTO } from './user-dto'
```

**Step 6: 更新 src/index.ts 並驗證**

```typescript
// Enums
export * from './enums'

// Entities
export * from './entities'

// DTOs
export * from './dtos'
```

Run: `pnpm --filter @astral-hub/shared-types type-check`
Expected: 通過

**Step 7: Commit**

```bash
git add packages/shared-types/src/dtos/
git add packages/shared-types/src/index.ts
git commit -m "feat(shared-types): 定義所有 DTO 型別（product, order, auction, user）"
```

---

## Task 5: API 回應型別（api/）

**Files:**

- Create: `packages/shared-types/src/api/response.ts`
- Create: `packages/shared-types/src/api/index.ts`

**Step 1: 建立 api/response.ts**

```typescript
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface SuccessResponse<T = unknown> {
  success: true
  data: T
  meta?: PaginationMeta
}

export interface ErrorDetail {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface ErrorResponse {
  success: false
  error: ErrorDetail
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse
```

**Step 2: 建立 api/index.ts**

```typescript
export type {
  PaginationMeta,
  SuccessResponse,
  ErrorDetail,
  ErrorResponse,
  ApiResponse,
} from './response'
```

**Step 3: 更新 src/index.ts 並驗證**

```typescript
// Enums
export * from './enums'

// Entities
export * from './entities'

// DTOs
export * from './dtos'

// API
export * from './api'
```

Run: `pnpm --filter @astral-hub/shared-types type-check`
Expected: 通過

**Step 4: Commit**

```bash
git add packages/shared-types/src/api/
git add packages/shared-types/src/index.ts
git commit -m "feat(shared-types): 定義 API 回應型別（SuccessResponse, ErrorResponse, ApiResponse）"
```

---

## Task 6: Build 測試 + 最終驗證

**Files:**

- Modify: `packages/shared-types/package.json`（如需調整）

**Step 1: 執行完整 build**

Run: `pnpm --filter @astral-hub/shared-types build`
Expected: 成功，`packages/shared-types/dist/` 產生 `.js` + `.d.ts` 檔案

**Step 2: 驗證 dist 輸出結構**

Run: `ls packages/shared-types/dist/`
Expected: 包含 `index.js`, `index.d.ts` 及各子目錄

**Step 3: 驗證型別可被引用**

在專案根目錄建立臨時驗證檔 `packages/shared-types/verify.ts`：

```typescript
import type { Product, ApiResponse, CreateProductDTO, ProductType } from './src'

// 確認型別可正常使用
const _test: ApiResponse<Product[]> = {
  success: true,
  data: [],
  meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
}
```

Run: `cd packages/shared-types && npx tsc --noEmit verify.ts --moduleResolution bundler --module esnext --target es2022 --strict`
Expected: 通過

刪除驗證檔：`rm packages/shared-types/verify.ts`

**Step 4: 更新 Task 02 文件勾選狀態**

更新 `docs/tasks/phase-1-mvp/02-shared-packages.md`：

- 勾選 2.1.1 ~ 2.1.7 所有子項目
- 更新進度追蹤表 2.1 狀態為 `✅ 完成`

**Step 5: Commit**

```bash
git add packages/shared-types/ docs/tasks/phase-1-mvp/02-shared-packages.md
git commit -m "feat(shared-types): 完成 Task 2.1 shared-types 套件"
```

---

## 設計決策備註

### 為何用 `as const` 物件而非 TS `enum`？

1. **Tree-shaking 友善** — `enum` 編譯後是 IIFE，bundler 無法 tree-shake
2. **Zod 相容性更好** — `z.enum()` 接受 string tuple，`as const` 物件的 values 可直接取用
3. **跨模組一致** — Prisma 生成的 enum 也是 string literal，保持一致

### 為何 shared-types 依賴 Zod？

目前 Task 2.1 只定義純型別，Zod 暫未使用。但 `dependencies` 中先加入 Zod 是因為：

- 後續會在此套件加入 Zod schema（runtime validation）
- 前後端共用同一份 schema = single source of truth
- 避免後續再改 package.json 導致不必要的 commit

如果後續確認 schema 不放在 shared-types（例如放在 api 層），可移除此依賴。
