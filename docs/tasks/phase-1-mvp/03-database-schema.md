# 03 - 資料庫設計與實作

**階段**: 第一階段 MVP - Sprint 1
**預計時間**: 3 天
**負責人**: TBD
**優先級**: 🔴 Critical

---

## 📋 目標

使用 Prisma ORM 設計並實作完整的資料庫 Schema，建立第一階段 MVP 所需的核心資料表，並建立測試資料生成腳本。

## 🎯 成功標準

- [ ] Prisma Schema 定義完整且符合 PRD 需求
- [ ] 資料庫遷移成功執行
- [ ] 所有資料表關聯正確建立
- [ ] 索引策略已實施
- [ ] Seed 腳本可成功生成測試資料
- [ ] Prisma Client 可正常使用

## 📦 前置條件

**前置任務**:
- [x] 01 - 環境建置完成
- [x] 02 - shared-types 套件完成

**技術需求**:
- Prisma 5.x
- PostgreSQL 15

---

## ✅ 子任務清單

### 3.1 Prisma 設定

#### 3.1.1 安裝 Prisma
- [ ] 在 API 專案安裝 Prisma
  ```bash
  cd services/api
  pnpm add prisma @prisma/client
  pnpm add -D tsx
  ```

#### 3.1.2 初始化 Prisma
- [ ] 執行 Prisma 初始化
  ```bash
  pnpm exec prisma init
  ```
- [ ] 驗證產生的檔案
  - `prisma/schema.prisma`
  - `.env`（更新 DATABASE_URL）

#### 3.1.3 配置 schema.prisma 基礎設定
- [ ] 編輯 `prisma/schema.prisma`
  ```prisma
  generator client {
    provider = "prisma-client-js"
  }

  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```

---

### 3.2 定義核心資料表（第一階段 MVP）

#### 3.2.1 Products（商品表）
- [ ] 定義 Product model
  ```prisma
  model Product {
    id String @id @default(uuid())

    // 商品類型
    type ProductType

    // 基本資訊
    category String
    name String
    series String?
    cardNumber String?

    // 鑑定資訊
    gradingStatus GradingStatus?
    gradingScore Decimal? @db.Decimal(3, 1)

    // 價格
    costPrice Decimal @db.Decimal(10, 2)
    sellingPrice Decimal @db.Decimal(10, 2)

    // 賣家
    sellerId String?
    seller Seller? @relation(fields: [sellerId], references: [id])

    // 狀態
    status ProductStatus @default(PENDING)
    channel ProductChannel @default(BOTH)

    // 媒體
    images Json @default("[]")
    video String?

    // 描述
    description String @db.Text
    conditionNotes String? @db.Text

    // 進貨資訊
    supplier String?
    supplierContact String?

    // 庫存
    stockQuantity Int @default(1)

    // 時間戳記
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    // 關聯
    auction Auction?
    orderItems OrderItem[]

    @@index([status, channel])
    @@index([sellerId])
    @@index([category])
    @@index([createdAt])
    @@map("products")
  }

  enum ProductType {
    CARD
    ACCESSORY
  }

  enum ProductStatus {
    PENDING
    LISTED
    SOLD
  }

  enum ProductChannel {
    ONLINE
    OFFLINE
    BOTH
  }

  enum GradingStatus {
    RAW
    PSA
    ARS
    BGS
  }
  ```

#### 3.2.2 Auctions（競標表）
- [ ] 定義 Auction model
  ```prisma
  model Auction {
    id String @id @default(uuid())

    // 商品關聯
    productId String @unique
    product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

    // 價格設定
    startingPrice Decimal @db.Decimal(10, 2)
    buyNowPrice Decimal? @db.Decimal(10, 2)
    currentPrice Decimal @db.Decimal(10, 2)
    incrementAmount Decimal @db.Decimal(10, 2)

    // 當前最高出價者
    currentBidderId String?
    currentBidder User? @relation(fields: [currentBidderId], references: [id])

    // 時間
    startTime DateTime
    endTime DateTime

    // 狀態
    status AuctionStatus @default(UPCOMING)

    createdAt DateTime @default(now())

    // 關聯
    bids Bid[]

    @@index([status, endTime])
    @@map("auctions")
  }

  enum AuctionStatus {
    UPCOMING
    ACTIVE
    ENDED
    CANCELLED
  }
  ```

#### 3.2.3 Bids（出價記錄表）
- [ ] 定義 Bid model
  ```prisma
  model Bid {
    id String @id @default(uuid())

    auctionId String
    auction Auction @relation(fields: [auctionId], references: [id], onDelete: Cascade)

    bidderId String
    bidder User @relation(fields: [bidderId], references: [id])

    amount Decimal @db.Decimal(10, 2)

    createdAt DateTime @default(now())

    @@index([auctionId])
    @@index([bidderId])
    @@map("bids")
  }
  ```

#### 3.2.4 Orders（訂單表）
- [ ] 定義 Order model
  ```prisma
  model Order {
    id String @id @default(uuid())
    orderNumber String @unique

    // 買家
    buyerId String?
    buyer User? @relation(fields: [buyerId], references: [id])
    buyerName String?
    buyerEmail String?
    buyerPhone String?

    // 金額
    subtotal Decimal @db.Decimal(10, 2)
    shippingFee Decimal @default(0) @db.Decimal(10, 2)
    discountAmount Decimal @default(0) @db.Decimal(10, 2)
    finalAmount Decimal @db.Decimal(10, 2)

    // 付款
    paymentMethod PaymentMethod
    paymentStatus PaymentStatus @default(PENDING)
    paymentTransactionId String?
    paidAt DateTime?

    // 配送
    shippingMethod ShippingMethod
    shippingAddress Json?
    trackingNumber String?
    shippedAt DateTime?

    // 狀態
    status OrderStatus @default(PENDING)

    // 購買通路
    channel OrderChannel

    // 備註
    notes String? @db.Text

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    // 關聯
    items OrderItem[]

    @@index([buyerId])
    @@index([orderNumber])
    @@index([status])
    @@index([createdAt])
    @@map("orders")
  }

  model OrderItem {
    id String @id @default(uuid())

    orderId String
    order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

    productId String
    product Product @relation(fields: [productId], references: [id])

    productName String
    productPrice Decimal @db.Decimal(10, 2)
    sellerId String?

    @@index([orderId])
    @@map("order_items")
  }

  enum PaymentMethod {
    CASH
    CREDIT_CARD
    LINE_PAY
    TRANSFER
  }

  enum PaymentStatus {
    PENDING
    PAID
    FAILED
    REFUNDED
  }

  enum ShippingMethod {
    SEVEN_ELEVEN
    FAMILY_MART
    FACE_TO_FACE
    IN_STORE
  }

  enum OrderStatus {
    PENDING
    PROCESSING
    SHIPPED
    COMPLETED
    CANCELLED
  }

  enum OrderChannel {
    ONLINE
    POS
  }
  ```

#### 3.2.5 Users（買家表，第二階段需要，先預留）
- [ ] 定義 User model
  ```prisma
  model User {
    id String @id @default(uuid())

    email String @unique
    name String
    avatar String?
    phone String?

    // OAuth
    provider OAuthProvider
    providerId String

    // 會員
    loyaltyPoints Int @default(0)
    memberLevel String @default("STANDARD")

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    // 關聯
    orders Order[]
    bids Bid[]
    auctions Auction[]
    pointsLogs PointsLog[]

    @@unique([provider, providerId])
    @@map("users")
  }

  enum OAuthProvider {
    GOOGLE
    FACEBOOK
  }
  ```

#### 3.2.6 Sellers（賣家表，第三階段需要，先預留）
- [ ] 定義 Seller model
  ```prisma
  model Seller {
    id String @id @default(uuid())

    email String @unique
    name String
    phone String?

    // 帳號
    passwordHash String

    // 等級
    level SellerLevel @default(BRONZE)
    totalSales Decimal @default(0) @db.Decimal(12, 2)

    // 抽成設定
    commissionRate Decimal @db.Decimal(5, 2)
    onlineListingFee Decimal @db.Decimal(10, 2)
    offlineListingFee Decimal @db.Decimal(10, 2)

    // 財務
    balance Decimal @default(0) @db.Decimal(12, 2)

    // 狀態
    status SellerStatus @default(ACTIVE)

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    // 關聯
    products Product[]
    transactions SellerTransaction[]

    @@index([level])
    @@map("sellers")
  }

  enum SellerLevel {
    BRONZE
    SILVER
    GOLD
  }

  enum SellerStatus {
    ACTIVE
    SUSPENDED
  }
  ```

#### 3.2.7 SellerTransactions（賣家交易記錄，第三階段）
- [ ] 定義 SellerTransaction model
  ```prisma
  model SellerTransaction {
    id String @id @default(uuid())

    sellerId String
    seller Seller @relation(fields: [sellerId], references: [id])

    type SellerTransactionType
    amount Decimal @db.Decimal(12, 2)

    orderId String?
    productId String?

    description String?

    createdAt DateTime @default(now())

    @@index([sellerId])
    @@index([type])
    @@map("seller_transactions")
  }

  enum SellerTransactionType {
    SALE
    COMMISSION
    LISTING_FEE
    WITHDRAWAL
  }
  ```

#### 3.2.8 AdminUsers（管理員表）
- [ ] 定義 AdminUser model
  ```prisma
  model AdminUser {
    id String @id @default(uuid())

    username String @unique
    email String @unique
    passwordHash String

    name String

    // 權限
    role AdminRole @default(ADMIN)
    permissions Json @default("[]")

    status AdminStatus @default(ACTIVE)

    lastLoginAt DateTime?
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    // 關聯
    auditLogs AuditLog[]

    @@map("admin_users")
  }

  enum AdminRole {
    SUPER_ADMIN
    ADMIN
    STAFF
  }

  enum AdminStatus {
    ACTIVE
    INACTIVE
  }
  ```

#### 3.2.9 AuditLogs（操作記錄）
- [ ] 定義 AuditLog model
  ```prisma
  model AuditLog {
    id String @id @default(uuid())

    // 操作者
    userId String?
    userType UserType
    userName String?

    adminUser AdminUser? @relation(fields: [userId], references: [id])

    // 操作
    action String
    entityType String
    entityId String?

    // 變更內容
    changes Json?

    ipAddress String?
    userAgent String? @db.Text

    createdAt DateTime @default(now())

    @@index([userType, userId])
    @@index([entityType, entityId])
    @@index([createdAt])
    @@map("audit_logs")
  }

  enum UserType {
    ADMIN
    SELLER
  }
  ```

#### 3.2.10 PointsLog（紅利點數記錄，第二階段）
- [ ] 定義 PointsLog model
  ```prisma
  model PointsLog {
    id String @id @default(uuid())

    userId String
    user User @relation(fields: [userId], references: [id])

    amount Int
    type PointsLogType

    orderId String?

    description String?

    createdAt DateTime @default(now())

    @@index([userId])
    @@map("points_log")
  }

  enum PointsLogType {
    EARN
    REDEEM
    REFUND
    EXPIRE
  }
  ```

---

### 3.3 資料庫遷移

#### 3.3.1 建立初始遷移
- [ ] 執行遷移命令
  ```bash
  pnpm exec prisma migrate dev --name init
  ```
- [ ] 驗證遷移檔案產生
- [ ] 檢查資料庫是否成功建立資料表

#### 3.3.2 生成 Prisma Client
- [ ] 執行生成命令
  ```bash
  pnpm exec prisma generate
  ```
- [ ] 驗證 `node_modules/@prisma/client` 生成

#### 3.3.3 Prisma Studio 驗證
- [ ] 啟動 Prisma Studio
  ```bash
  pnpm exec prisma studio
  ```
- [ ] 瀏覽所有資料表
- [ ] 驗證欄位型別正確

---

### 3.4 測試資料生成（Seed）

#### 3.4.1 建立 Seed 腳本
- [ ] 建立 `prisma/seed.ts`
  ```typescript
  import { PrismaClient } from '@prisma/client'

  const prisma = new PrismaClient()

  async function main() {
    // 清理舊資料
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.bid.deleteMany()
    await prisma.auction.deleteMany()
    await prisma.product.deleteMany()
    await prisma.adminUser.deleteMany()

    // 建立管理員
    const admin = await prisma.adminUser.create({
      data: {
        username: 'admin',
        email: 'admin@card-erp.com',
        passwordHash: '...', // bcrypt hash
        name: '系統管理員',
        role: 'SUPER_ADMIN'
      }
    })

    // 建立測試商品
    const products = await Promise.all([
      prisma.product.create({
        data: {
          type: 'CARD',
          category: '寶可夢',
          name: '皮卡丘 V',
          series: '劍盾',
          cardNumber: '043/184',
          gradingStatus: 'PSA',
          gradingScore: 10,
          costPrice: 1000,
          sellingPrice: 3000,
          status: 'LISTED',
          channel: 'BOTH',
          description: '全新未拆PSA10鑑定卡',
          images: JSON.stringify([
            { url: 'https://example.com/image1.jpg', type: 'front' }
          ])
        }
      }),
      // ... 更多測試商品
    ])

    console.log('Seed completed!')
  }

  main()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
  ```

#### 3.4.2 配置 package.json
- [ ] 編輯 `package.json`
  ```json
  {
    "prisma": {
      "seed": "tsx prisma/seed.ts"
    },
    "scripts": {
      "db:seed": "prisma db seed"
    }
  }
  ```

#### 3.4.3 執行 Seed
- [ ] 執行 seed 命令
  ```bash
  pnpm run db:seed
  ```
- [ ] 使用 Prisma Studio 驗證資料

---

### 3.5 文檔

#### 3.5.1 建立 Schema 文檔
- [ ] 建立 `docs/database-schema.md`
  - ER Diagram（文字描述或 Mermaid）
  - 各資料表說明
  - 索引策略
  - 關聯關係

#### 3.5.2 建立遷移指南
- [ ] 建立 `docs/database-migration.md`
  - 如何建立新遷移
  - 如何回滾遷移
  - 生產環境遷移流程

---

## 🧪 測試步驟

1. **Schema 驗證**
   ```bash
   pnpm exec prisma validate
   ```

2. **格式化 Schema**
   ```bash
   pnpm exec prisma format
   ```

3. **遷移測試**
   - 建立遷移
   - 回滾遷移
   - 重新遷移

4. **Seed 測試**
   - 執行 seed
   - 驗證資料正確性

5. **Client 測試**
   ```typescript
   import { PrismaClient } from '@prisma/client'
   const prisma = new PrismaClient()

   const products = await prisma.product.findMany()
   console.log(products)
   ```

---

## 📝 交付物

- [ ] `prisma/schema.prisma`
- [ ] `prisma/migrations/` 遷移檔案
- [ ] `prisma/seed.ts`
- [ ] `docs/database-schema.md`
- [ ] `docs/database-migration.md`

---

## 🚨 注意事項

1. **資料型別精確度**: 金額使用 Decimal，避免浮點數誤差
2. **索引策略**: 根據查詢頻率建立索引
3. **關聯完整性**: 使用適當的 onDelete（Cascade, SetNull 等）
4. **JSON 欄位**: 僅用於非結構化資料（images, permissions 等）
5. **遷移管理**: 生產環境遷移需謹慎，做好備份

---

## 🔗 相關文件

- [Prisma 文檔](https://www.prisma.io/docs)
- [系統架構設計](../plans/2026-01-24-system-architecture-design.md)
- [PRD 資料庫設計章節](../PRD.md#3-資料庫設計)

---

## 📊 進度追蹤

| 子任務 | 狀態 | 負責人 | 完成日期 |
|--------|------|--------|---------|
| 3.1 Prisma 設定 | ⏳ 未開始 | - | - |
| 3.2 定義資料表 | ⏳ 未開始 | - | - |
| 3.3 資料庫遷移 | ⏳ 未開始 | - | - |
| 3.4 Seed 腳本 | ⏳ 未開始 | - | - |
| 3.5 文檔 | ⏳ 未開始 | - | - |

---

**上一個任務**: [02 - 共用套件開發](./02-shared-packages.md)
**下一個任務**: [04 - API 基礎架構](./04-api-foundation.md)
