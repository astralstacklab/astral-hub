# 系統架構設計文檔
# Astral Hub - OMO 收藏卡交易平台

**版本**: 1.0
**日期**: 2026-01-24
**設計者**: System Architect Team

---

## 目錄

1. [系統概覽](#1-系統概覽)
2. [架構設計](#2-架構設計)
3. [資料庫設計](#3-資料庫設計)
4. [API 設計](#4-api-設計)
5. [前端架構](#5-前端架構)
6. [關鍵功能設計](#6-關鍵功能設計)
7. [安全性設計](#7-安全性設計)
8. [效能優化](#8-效能優化)
9. [部署架構](#9-部署架構)
10. [監控與日誌](#10-監控與日誌)

---

## 1. 系統概覽

### 1.1 系統目標

建立一個線上線下整合（OMO）的收藏卡交易平台，實現：
- 實體店面與線上商城庫存同步
- 多賣家寄賣與自動抽成
- QR Code 快速結帳
- 線上競標功能
- 完整的後台管理與報表系統

### 1.2 技術選型總覽

| 層級 | 技術棧 | 理由 |
|-----|-------|------|
| **前端框架** | Vue 3 + Nuxt 3 | SSR/SSG 支援、SEO 友善、開發效率高 |
| **狀態管理** | Pinia | Vue 3 官方推薦、TypeScript 支援佳 |
| **UI 框架** | TailwindCSS | Utility-first、高度自訂、打包體積小 |
| **後端框架** | Fastify + TypeScript | 效能優異、插件生態豐富、公司熟悉 |
| **ORM** | Prisma | 型別安全、遷移管理方便、開發體驗好 |
| **資料庫** | PostgreSQL | 強大的查詢能力、ACID 保證、適合財務計算 |
| **快取** | Redis | 高效能、支援多種資料結構、即時競標需求 |
| **儲存** | Google Cloud Storage | 與 GCP 整合、CDN 支援、成本效益高 |
| **部署** | GCP Cloud Run | Serverless、自動擴展、min-instances=0 節費 |
| **CI/CD** | GitHub Actions | 與 GitHub 整合、免費額度高 |

---

## 2. 架構設計

### 2.1 整體系統架構

```
┌──────────────────────────────────────────────────────────────┐
│                        用戶端層                               │
├──────────────────────────────────────────────────────────────┤
│  買家端              後台管理             店面結帳             │
│  (Nuxt 3 SSR)        (Vue 3 SPA)         (Vue 3 PWA)          │
│  ├─ PWA             ├─ 商品管理           ├─ QR 掃描          │
│  ├─ SEO             ├─ 訂單管理           ├─ 購物車           │
│  └─ Capacitor*      ├─ 報表分析           └─ 結帳             │
│                      └─ 會員管理                              │
└──────────────────────────────────────────────────────────────┘
                             ↓ HTTPS/WSS
┌──────────────────────────────────────────────────────────────┐
│                        API Gateway 層                         │
├──────────────────────────────────────────────────────────────┤
│  Fastify Server (TypeScript)                                 │
│  ├─ RESTful API (商品、訂單、用戶、金流等)                      │
│  ├─ WebSocket (競標即時通知)                                  │
│  ├─ JWT 認證 (後台、賣家)                                      │
│  ├─ OAuth 認證 (買家 - Google/FB)                             │
│  └─ Rate Limiting & Security Middleware                      │
└──────────────────────────────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────┐
│                        業務邏輯層                             │
├──────────────────────────────────────────────────────────────┤
│  Products Module    │  Orders Module    │  Auctions Module   │
│  (商品管理)          │  (訂單處理)        │  (競標邏輯)         │
│                     │                   │                    │
│  Users Module       │  Sellers Module   │  Payments Module   │
│  (買家會員)          │  (賣家管理)        │  (金流整合)         │
│                     │                   │                    │
│  Shipping Module    │  Analytics Module │  Notifications     │
│  (物流整合)          │  (報表分析)        │  (通知系統)         │
└──────────────────────────────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────┐
│                        資料持久層                             │
├──────────────────────────────────────────────────────────────┤
│  PostgreSQL          │  Redis Cloud      │  GCS               │
│  ├─ 商品資料          │  ├─ Session      │  ├─ 商品圖片        │
│  ├─ 訂單資料          │  ├─ 競標快取      │  ├─ 影片           │
│  ├─ 用戶資料          │  ├─ 商品列表快取  │  └─ QR Code        │
│  ├─ 賣家資料          │  └─ 購物車       │                    │
│  └─ 財務紀錄          │                  │                    │
└──────────────────────────────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────┐
│                        外部服務層                             │
├──────────────────────────────────────────────────────────────┤
│  綠界 ECPay          │  7-11 賣貨便      │  Google OAuth      │
│  ├─ 信用卡           │  ├─ 寄件 API     │  ├─ 登入驗證        │
│  └─ LINE Pay         │  └─ 物流追蹤      │  └─ 用戶資料        │
│                      │                  │                    │
│  全家店到店           │  Facebook Login  │  Email Service     │
│  └─ 寄件 API         │  └─ 登入驗證      │  └─ 訂單通知        │
└──────────────────────────────────────────────────────────────┘
```

**註**: * Capacitor 在第二階段啟用

### 2.2 模組劃分

#### 2.2.1 前端模組

**buyer-web（買家端 - Nuxt 3）**
- **頁面**: 首頁、商品列表、商品詳情、購物車、結帳、訂單查詢、會員中心
- **功能**: 商品瀏覽、競標出價、購物車、訂單管理、紅利點數
- **技術**: Nuxt 3 (SSR/SSG)、Pinia、TailwindCSS、PWA

**admin-web（後台管理 - Vue 3 SPA）**
- **頁面**: 儀表板、商品管理、訂單管理、會員管理、賣家管理、報表分析、系統設定
- **功能**: CRUD 操作、資料視覺化、權限管理、抽成設定
- **技術**: Vue 3、Vite、Vue Router、Pinia、TailwindCSS、Chart.js

**pos-web（店面結帳 - Vue 3 PWA）**
- **頁面**: 掃碼介面、購物車、結帳頁面
- **功能**: QR Code 掃描、商品累加、金流串接（LINE Pay、信用卡、現金）
- **技術**: Vue 3、PWA、ZXing (QR Code Scanner)、TailwindCSS

#### 2.2.2 後端模組

**services/api（Fastify API）**

採用 **模組化架構**（Module-based Architecture）：

```
services/api/src/
├── modules/
│   ├── products/              # 商品模組
│   │   ├── products.routes.ts
│   │   ├── products.service.ts
│   │   ├── products.schema.ts  (Zod validation)
│   │   └── products.test.ts
│   │
│   ├── orders/                # 訂單模組
│   ├── auctions/              # 競標模組
│   ├── users/                 # 用戶模組
│   ├── sellers/               # 賣家模組
│   ├── payments/              # 金流模組
│   ├── shipping/              # 物流模組
│   └── analytics/             # 報表模組
│
├── plugins/                   # Fastify 插件
│   ├── auth.ts                # JWT/OAuth 認證
│   ├── prisma.ts              # Prisma 連接
│   ├── redis.ts               # Redis 連接
│   └── websocket.ts           # WebSocket 支援
│
├── middlewares/               # 中間件
│   ├── error-handler.ts
│   ├── rate-limiter.ts
│   └── cors.ts
│
├── utils/                     # 工具函數
│   ├── gcs-uploader.ts        # GCS 檔案上傳
│   ├── image-processor.ts     # 圖片處理（壓縮、浮水印）
│   ├── qrcode-generator.ts    # QR Code 生成
│   └── logger.ts              # 日誌系統
│
└── server.ts                  # 伺服器入口
```

---

## 3. 資料庫設計

### 3.1 ER Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Sellers   │ 1     * │  Products   │ *     1 │   Orders    │
│             ├─────────┤             ├─────────┤             │
│ id (PK)     │         │ id (PK)     │         │ id (PK)     │
│ name        │         │ sellerId(FK)│         │ buyerId(FK) │
│ level       │         │ name        │         │ totalAmount │
│ balance     │         │ price       │         │ status      │
└─────────────┘         │ status      │         └─────────────┘
                        └─────────────┘
                              │ 1
                              │
                              │ 0..1
                        ┌─────────────┐
                        │  Auctions   │
                        │             │
                        │ id (PK)     │
                        │ productId(FK)│
                        │ currentPrice │
                        │ endTime     │
                        └─────────────┘
                              │ 1
                              │
                              │ *
                        ┌─────────────┐
                        │    Bids     │
                        │             │
                        │ id (PK)     │
                        │ auctionId(FK)│
                        │ bidderId(FK)│
                        │ amount      │
                        └─────────────┘

┌─────────────┐
│    Users    │
│  (Buyers)   │
│             │
│ id (PK)     │ 1       * ┌─────────────┐
│ email       ├───────────┤   Orders    │
│ name        │           └─────────────┘
│ loyaltyPoints│
└─────────────┘
      │ 1
      │
      │ *
┌─────────────┐
│PointsLog   │
│             │
│ id (PK)     │
│ userId(FK)  │
│ amount      │
│ type        │
└─────────────┘
```

### 3.2 資料表 Schema

#### 3.2.1 Products（商品表）

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 商品類型
  type VARCHAR(20) NOT NULL,  -- 'CARD' | 'ACCESSORY'

  -- 基本資訊
  category VARCHAR(50) NOT NULL,  -- '海賊王', '寶可夢', '遊戲王' 等
  name VARCHAR(255) NOT NULL,
  series VARCHAR(255),
  card_number VARCHAR(100),

  -- 鑑定資訊
  grading_status VARCHAR(20),  -- 'RAW' | 'PSA' | 'ARS' | 'BGS' | NULL
  grading_score DECIMAL(3,1),

  -- 價格
  cost_price DECIMAL(10,2) NOT NULL,     -- 進貨價
  selling_price DECIMAL(10,2) NOT NULL,  -- 售價

  -- 賣家
  seller_id UUID REFERENCES sellers(id),  -- NULL = 自營

  -- 狀態
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- 'PENDING' | 'LISTED' | 'SOLD'
  channel VARCHAR(20) NOT NULL DEFAULT 'BOTH',    -- 'ONLINE' | 'OFFLINE' | 'BOTH'

  -- 媒體
  images JSONB NOT NULL DEFAULT '[]',  -- [{"url": "...", "type": "front|back|detail|cert"}]
  video VARCHAR(500),

  -- 描述
  description TEXT,
  condition_notes TEXT,  -- 狀況描述

  -- 進貨資訊
  supplier VARCHAR(255),
  supplier_contact VARCHAR(255),

  -- 庫存（僅周邊商品）
  stock_quantity INTEGER DEFAULT 1,  -- 卡片固定為 1，周邊可 > 1

  -- 時間戳記
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 索引
  INDEX idx_status_channel (status, channel),
  INDEX idx_seller_id (seller_id),
  INDEX idx_category (category)
);
```

#### 3.2.2 Auctions（競標表）

```sql
CREATE TABLE auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- 價格設定
  starting_price DECIMAL(10,2) NOT NULL,     -- 底價
  buy_now_price DECIMAL(10,2),               -- 直購價（可選）
  current_price DECIMAL(10,2) NOT NULL,      -- 當前價格
  increment_amount DECIMAL(10,2) NOT NULL,   -- 每次加價金額

  -- 當前最高出價者
  current_bidder_id UUID REFERENCES users(id),

  -- 時間
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,

  -- 狀態
  status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING',  -- 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'CANCELLED'

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE INDEX idx_product_id (product_id),  -- 一個商品只能有一個競標
  INDEX idx_status_endtime (status, end_time)
);
```

#### 3.2.3 Bids（出價記錄表）

```sql
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES users(id),

  amount DECIMAL(10,2) NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_auction_id (auction_id),
  INDEX idx_bidder_id (bidder_id)
);
```

#### 3.2.4 Orders（訂單表）

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) NOT NULL UNIQUE,  -- 自動生成：ORD20260124001

  -- 買家
  buyer_id UUID REFERENCES users(id),  -- NULL = 現場購買未登入
  buyer_name VARCHAR(100),
  buyer_email VARCHAR(255),
  buyer_phone VARCHAR(20),

  -- 訂單項目（JSON 儲存）
  items JSONB NOT NULL,  -- [{"productId": "...", "name": "...", "price": 100, "sellerId": "..."}]

  -- 金額
  subtotal DECIMAL(10,2) NOT NULL,           -- 小計
  shipping_fee DECIMAL(10,2) DEFAULT 0,      -- 運費
  discount_amount DECIMAL(10,2) DEFAULT 0,   -- 紅利折抵
  final_amount DECIMAL(10,2) NOT NULL,       -- 實付金額

  -- 付款
  payment_method VARCHAR(20) NOT NULL,  -- 'CASH' | 'CREDIT_CARD' | 'LINE_PAY' | 'TRANSFER'
  payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  payment_transaction_id VARCHAR(255),
  paid_at TIMESTAMP,

  -- 配送
  shipping_method VARCHAR(30) NOT NULL,  -- 'SEVEN_ELEVEN' | 'FAMILY_MART' | 'FACE_TO_FACE' | 'IN_STORE'
  shipping_address JSONB,  -- {"store_id": "...", "store_name": "...", "recipient": "..."}
  tracking_number VARCHAR(100),
  shipped_at TIMESTAMP,

  -- 狀態
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED'

  -- 購買通路
  channel VARCHAR(10) NOT NULL,  -- 'ONLINE' | 'POS'

  -- 備註
  notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_buyer_id (buyer_id),
  INDEX idx_order_number (order_number),
  INDEX idx_status (status)
);
```

#### 3.2.5 Users（買家表）

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  avatar VARCHAR(500),
  phone VARCHAR(20),

  -- OAuth
  provider VARCHAR(20) NOT NULL,  -- 'GOOGLE' | 'FACEBOOK'
  provider_id VARCHAR(255) NOT NULL,

  -- 會員
  loyalty_points INTEGER DEFAULT 0,  -- 紅利點數
  member_level VARCHAR(20) DEFAULT 'STANDARD',  -- 預留等級擴充

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE INDEX idx_provider (provider, provider_id)
);
```

#### 3.2.6 Sellers（賣家表）

```sql
CREATE TABLE sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),

  -- 帳號（後台登入）
  password_hash VARCHAR(255) NOT NULL,

  -- 等級
  level VARCHAR(20) NOT NULL DEFAULT 'BRONZE',  -- 'BRONZE' | 'SILVER' | 'GOLD'
  total_sales DECIMAL(12,2) DEFAULT 0,          -- 總銷售額（用於自動升級）

  -- 抽成設定（可被後台覆寫）
  commission_rate DECIMAL(5,2) NOT NULL,        -- 交易抽成比例（%）
  online_listing_fee DECIMAL(10,2) NOT NULL,    -- 線上上架費
  offline_listing_fee DECIMAL(10,2) NOT NULL,   -- 實體上架費

  -- 財務
  balance DECIMAL(12,2) DEFAULT 0,              -- 虛擬錢包餘額

  -- 狀態
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- 'ACTIVE' | 'SUSPENDED'

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_level (level)
);
```

#### 3.2.7 PointsLog（紅利點數記錄）

```sql
CREATE TABLE points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),

  amount INTEGER NOT NULL,  -- 正數 = 獲得，負數 = 使用
  type VARCHAR(20) NOT NULL,  -- 'EARN' | 'REDEEM' | 'REFUND' | 'EXPIRE'

  -- 關聯
  order_id UUID REFERENCES orders(id),  -- 若與訂單相關

  description VARCHAR(255),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id)
);
```

#### 3.2.8 SellerTransactions（賣家交易記錄）

```sql
CREATE TABLE seller_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id),

  type VARCHAR(20) NOT NULL,  -- 'SALE' | 'COMMISSION' | 'LISTING_FEE' | 'WITHDRAWAL'

  amount DECIMAL(12,2) NOT NULL,  -- 正數 = 收入，負數 = 支出

  -- 關聯
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),

  description VARCHAR(255),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_seller_id (seller_id),
  INDEX idx_type (type)
);
```

#### 3.2.9 AdminUsers（管理員表）

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,

  name VARCHAR(100) NOT NULL,

  -- 權限
  role VARCHAR(20) NOT NULL DEFAULT 'ADMIN',  -- 'SUPER_ADMIN' | 'ADMIN' | 'STAFF'
  permissions JSONB DEFAULT '[]',  -- ['products.write', 'orders.read', ...]

  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- 'ACTIVE' | 'INACTIVE'

  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.2.10 AuditLogs（操作記錄）

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 操作者
  user_id UUID,  -- 可能是 admin_users.id 或 sellers.id
  user_type VARCHAR(20) NOT NULL,  -- 'ADMIN' | 'SELLER'
  user_name VARCHAR(100),

  -- 操作
  action VARCHAR(50) NOT NULL,  -- 'CREATE_PRODUCT' | 'UPDATE_PRICE' | 'DELETE_ORDER' 等
  entity_type VARCHAR(50) NOT NULL,  -- 'Product' | 'Order' | 'User' 等
  entity_id UUID,

  -- 變更內容
  changes JSONB,  -- {"before": {...}, "after": {...}}

  ip_address VARCHAR(50),
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user (user_type, user_id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at)
);
```

### 3.3 索引策略

**高頻查詢索引**:
- `products`: `(status, channel)`, `seller_id`, `category`
- `orders`: `buyer_id`, `order_number`, `status`
- `auctions`: `product_id` (UNIQUE), `(status, end_time)`
- `users`: `(provider, provider_id)` (UNIQUE)
- `sellers`: `level`

**全文搜尋**（未來可考慮）:
- PostgreSQL `tsvector` for `products.name`, `products.description`

---

## 4. API 設計

### 4.1 API 規範

**基礎 URL**: `https://api.astral-hub.com/v1`

**認證方式**:
- 後台/賣家: `Authorization: Bearer <JWT>`
- 買家: `Authorization: Bearer <OAuth_Token>`

**回應格式**:

成功:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

失敗:
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "找不到指定商品",
    "details": {}
  }
}
```

### 4.2 主要 API Endpoints

#### 4.2.1 商品相關

```
GET    /products                  # 商品列表（分頁、篩選）
GET    /products/:id              # 商品詳情
POST   /products                  # 新增商品（後台/賣家）
PUT    /products/:id              # 更新商品（後台/賣家）
DELETE /products/:id              # 刪除商品（後台）
POST   /products/:id/images       # 上傳圖片
POST   /products/:id/qrcode       # 生成 QR Code
```

**查詢參數範例**:
```
GET /products?category=寶可夢&status=LISTED&page=1&limit=20&sort=price:desc
```

#### 4.2.2 競標相關

```
GET    /auctions                  # 競標列表
GET    /auctions/:id              # 競標詳情
POST   /auctions                  # 建立競標（後台/賣家）
POST   /auctions/:id/bid          # 出價
GET    /auctions/:id/bids         # 出價記錄
PUT    /auctions/:id/cancel       # 取消競標（後台）
```

**WebSocket 訂閱**:
```javascript
ws://api.astral-hub.com/ws/auctions/:id
// 接收即時出價通知
```

#### 4.2.3 訂單相關

```
GET    /orders                    # 訂單列表（後台）
GET    /orders/:id                # 訂單詳情
POST   /orders                    # 建立訂單（買家/POS）
PUT    /orders/:id/status         # 更新訂單狀態（後台）
POST   /orders/:id/refund         # 退款（後台）
GET    /orders/:id/invoice        # 下載發票
```

#### 4.2.4 用戶相關

```
# 買家
GET    /users/me                  # 當前用戶資訊
GET    /users/me/orders           # 我的訂單
GET    /users/me/points           # 紅利點數
POST   /auth/google               # Google OAuth 登入
POST   /auth/facebook             # Facebook OAuth 登入

# 賣家
GET    /sellers/me                # 賣家資訊
GET    /sellers/me/products       # 我的商品
GET    /sellers/me/sales          # 銷售報表
GET    /sellers/me/transactions   # 交易記錄
POST   /sellers/me/withdraw       # 申請提領
POST   /auth/seller/login         # 賣家登入
```

#### 4.2.5 金流相關

```
POST   /payments/ecpay/create     # 建立綠界訂單
POST   /payments/ecpay/callback   # 綠界回調（接收付款結果）
POST   /payments/linepay/create   # 建立 LINE Pay 訂單
POST   /payments/linepay/confirm  # LINE Pay 確認
```

#### 4.2.6 物流相關

```
POST   /shipping/7eleven/create   # 建立 7-11 寄件單
POST   /shipping/family/create    # 建立全家寄件單
GET    /shipping/tracking/:number # 查詢物流狀態
```

#### 4.2.7 後台管理

```
# 報表
GET    /admin/analytics/sales     # 銷售報表
GET    /admin/analytics/revenue   # 收入分析
GET    /admin/analytics/sellers   # 賣家統計

# 系統設定
GET    /admin/settings/commission # 抽成設定
PUT    /admin/settings/commission # 更新抽成設定
GET    /admin/audit-logs          # 操作記錄
```

### 4.3 錯誤碼定義

| 錯誤碼 | HTTP Status | 說明 |
|--------|-------------|------|
| `PRODUCT_NOT_FOUND` | 404 | 商品不存在 |
| `AUCTION_ENDED` | 400 | 競標已結束 |
| `BID_TOO_LOW` | 400 | 出價過低 |
| `INSUFFICIENT_POINTS` | 400 | 紅利點數不足 |
| `PAYMENT_FAILED` | 402 | 付款失敗 |
| `UNAUTHORIZED` | 401 | 未授權 |
| `FORBIDDEN` | 403 | 權限不足 |
| `RATE_LIMIT_EXCEEDED` | 429 | 請求過於頻繁 |
| `INTERNAL_ERROR` | 500 | 伺服器錯誤 |

---

## 5. 前端架構

### 5.1 Nuxt 3（buyer-web）

**目錄結構**:
```
apps/buyer-web/
├── pages/                      # 自動路由
│   ├── index.vue               # 首頁
│   ├── products/
│   │   ├── index.vue           # 商品列表
│   │   └── [id].vue            # 商品詳情
│   ├── auctions.vue            # 競標列表
│   ├── cart.vue                # 購物車
│   ├── checkout.vue            # 結帳
│   └── user/
│       ├── orders.vue          # 我的訂單
│       └── points.vue          # 紅利點數
│
├── components/                 # 元件
│   ├── ProductCard.vue
│   ├── AuctionTimer.vue
│   ├── CartItem.vue
│   └── ...
│
├── composables/                # Composition API
│   ├── useProducts.ts          # 商品 API 呼叫
│   ├── useAuctions.ts          # 競標相關
│   ├── useAuth.ts              # 認證
│   └── useCart.ts              # 購物車邏輯
│
├── stores/                     # Pinia Stores
│   ├── user.ts                 # 用戶狀態
│   ├── cart.ts                 # 購物車狀態
│   └── auctions.ts             # 競標狀態
│
├── assets/                     # 靜態資源
│   └── styles/
│       └── main.css            # TailwindCSS
│
├── public/                     # 公開檔案
│   ├── favicon.ico
│   └── manifest.json           # PWA Manifest
│
├── server/                     # Server Middleware（可選）
│   └── api/
│       └── proxy.ts            # API Proxy
│
├── nuxt.config.ts              # Nuxt 配置
└── capacitor.config.ts         # Capacitor 配置（第二階段）
```

**關鍵配置**:

`nuxt.config.ts`:
```typescript
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@vite-pwa/nuxt'  // PWA 支援
  ],

  pwa: {
    manifest: {
      name: 'Astral Hub',
      short_name: 'CardERP',
      description: '收藏卡交易平台',
      theme_color: '#ffffff'
    },
    workbox: {
      // 離線快取策略
    }
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:3000/api'
    }
  }
})
```

### 5.2 Vue 3 SPA（admin-web / pos-web）

**目錄結構**（以 admin-web 為例）:
```
apps/admin-web/
├── src/
│   ├── views/                  # 頁面視圖
│   │   ├── Dashboard.vue
│   │   ├── ProductList.vue
│   │   ├── OrderList.vue
│   │   └── Analytics.vue
│   │
│   ├── components/             # 元件
│   │   ├── DataTable.vue
│   │   ├── Modal.vue
│   │   └── Chart.vue
│   │
│   ├── stores/                 # Pinia Stores
│   │   ├── auth.ts
│   │   └── products.ts
│   │
│   ├── router/                 # Vue Router
│   │   └── index.ts
│   │
│   ├── api/                    # API 呼叫
│   │   ├── client.ts           # Axios instance
│   │   ├── products.ts
│   │   └── orders.ts
│   │
│   ├── utils/                  # 工具函數
│   │   ├── formatters.ts
│   │   └── validators.ts
│   │
│   ├── App.vue
│   └── main.ts
│
└── vite.config.ts
```

---

## 6. 關鍵功能設計

### 6.1 QR Code 掃碼結帳

**流程**:
```
店員開啟 POS 系統
  ↓
掃描商品 QR Code（使用手機相機 or 掃碼槍）
  ↓
API: GET /products/{uuid}
  ↓
檢查商品狀態（是否已售出、是否在競標中）
  ↓
加入購物車（Redis 暫存）
  ↓
客人繼續挑選 or 結帳
  ↓
選擇付款方式（現金 / LINE Pay / 信用卡）
  ↓
API: POST /orders（建立訂單）
  ↓
更新商品狀態為 SOLD
  ↓
WebSocket 通知（線上商城同步下架）
```

**技術實現**:
- **QR Code 內容**: UUID（商品 ID）
- **掃描器**: ZXing（Web QR Code Scanner）
- **購物車**: Redis（5 分鐘過期）
- **即時同步**: WebSocket 或 Server-Sent Events

### 6.2 競標系統

**資料結構**（Redis）:
```
auction:{auctionId}:info         # Hash，競標基本資訊
auction:{auctionId}:bids         # Sorted Set，出價記錄（分數 = 金額）
auction:{auctionId}:subscribers  # Set，訂閱 WebSocket 的用戶
```

**出價流程**:
```
買家出價
  ↓
API: POST /auctions/:id/bid
  ↓
驗證：
├─ 競標是否已結束
├─ 出價是否 >= 當前價格 + 加價金額
└─ 買家是否有足夠餘額（預留功能）
  ↓
Redis: ZADD auction:{id}:bids {amount} {bidderId}
  ↓
更新 PostgreSQL auctions.current_price, current_bidder_id
  ↓
WebSocket 廣播給所有訂閱者
  ↓
若商品在實體店面，發送通知給後台（提醒店員下架）
```

**結束競標**（定時任務）:
```
每分鐘執行一次：
  ↓
查詢所有 status='ACTIVE' 且 end_time < NOW() 的競標
  ↓
更新 status='ENDED'
  ↓
建立訂單給最高出價者
  ↓
發送得標通知（Email / 推播）
```

### 6.3 圖片與影片處理

**上傳流程**:
```
前端上傳
  ↓
API: POST /products/:id/images
  ↓
驗證檔案類型、大小
  ↓
上傳原圖到 GCS: /products/{id}/original/{filename}
  ↓
背景任務（Queue）:
├─ 壓縮成 WebP
├─ 生成多尺寸（200x200, 800x800, 1200x1200）
├─ 加浮水印（中圖、大圖）
└─ 儲存到 GCS: /products/{id}/{size}/{filename}
  ↓
更新 products.images JSON
```

**技術工具**:
- **圖片處理**: Sharp.js（Node.js）
- **浮水印**: 在圖片右下角加上半透明店名 Logo
- **影片壓縮**: FFmpeg（限制 10 秒、720p、5MB）

**GCS 生命週期管理**:
```
原圖：90 天後轉 Nearline Storage（冷儲存）
縮圖：永久保留（Standard Storage）
```

### 6.4 金流串接（綠界 ECPay）

**建立訂單流程**:
```
前端: POST /payments/ecpay/create
  ↓
後端生成綠界訂單參數:
{
  MerchantID: "xxx",
  MerchantTradeNo: "ORD20260124001",
  MerchantTradeDate: "2026/01/24 12:00:00",
  PaymentType: "aio",
  TotalAmount: 1500,
  TradeDesc: "收藏卡購買",
  ItemName: "寶可夢 皮卡丘",
  ReturnURL: "https://api.astral-hub.com/payments/ecpay/callback",
  ChoosePayment: "Credit",  // or "ALL" 讓用戶選擇
  CheckMacValue: "..." // HMAC 簽章
}
  ↓
回傳綠界付款頁面 URL 給前端
  ↓
前端導向綠界付款頁面
  ↓
用戶完成付款
  ↓
綠界回調: POST /payments/ecpay/callback
  ↓
驗證 CheckMacValue
  ↓
更新訂單狀態為 PAID
  ↓
發送訂單確認 Email
```

**安全性**:
- 使用 HMAC 驗證回調真實性
- 訂單金額二次驗證（防止竄改）
- 記錄所有金流交易日誌

### 6.5 賣家抽成計算

**銷售時自動計算**:
```sql
-- 假設訂單中有多個商品，部分自營、部分寄賣
UPDATE sellers
SET
  total_sales = total_sales + {該賣家商品總額},
  balance = balance + {商品售價 - 抽成 - 上架費}
WHERE id = {sellerId};

INSERT INTO seller_transactions (seller_id, type, amount, order_id, description)
VALUES
  ({sellerId}, 'SALE', {商品售價}, {orderId}, '商品銷售'),
  ({sellerId}, 'COMMISSION', -{抽成金額}, {orderId}, '平台抽成 12%'),
  ({sellerId}, 'LISTING_FEE', -{上架費}, NULL, '上架費');
```

**自動升級**（定時任務）:
```
每日凌晨執行：
  ↓
查詢所有 level='BRONZE' 且 total_sales >= 50000 的賣家
  ↓
UPDATE sellers SET level='SILVER', commission_rate=12
  ↓
查詢所有 level='SILVER' 且 total_sales >= 200000 的賣家
  ↓
UPDATE sellers SET level='GOLD', commission_rate=8
```

---

## 7. 安全性設計

### 7.1 認證與授權

**買家（OAuth）**:
```
Google/Facebook 登入
  ↓
取得 OAuth Token
  ↓
API: POST /auth/google (帶 OAuth Token)
  ↓
後端驗證 Token 真實性
  ↓
查詢或建立 users 記錄
  ↓
簽發 JWT（包含 userId、email、role）
  ↓
前端存儲 JWT（localStorage 或 httpOnly Cookie）
```

**後台/賣家（JWT）**:
```
輸入帳號密碼
  ↓
API: POST /auth/seller/login
  ↓
驗證密碼（bcrypt compare）
  ↓
簽發 JWT（包含 sellerId、role、permissions）
  ↓
前端存儲 JWT
```

**JWT Payload 範例**:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "SELLER",
  "permissions": ["products.write", "sales.read"],
  "iat": 1674567890,
  "exp": 1675172690
}
```

### 7.2 API 安全

**Rate Limiting**（防止濫用）:
```typescript
// Fastify Rate Limit
fastify.register(require('@fastify/rate-limit'), {
  max: 100,          // 每 IP 每時間窗口最多 100 次請求
  timeWindow: '1 minute',
  redis: redisClient  // 使用 Redis 儲存計數
})
```

**CORS 配置**:
```typescript
fastify.register(require('@fastify/cors'), {
  origin: [
    'https://astral-hub.com',
    'https://admin.astral-hub.com',
    'http://localhost:3001'  // 開發環境
  ],
  credentials: true
})
```

**Input Validation**（Zod）:
```typescript
const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  category: z.enum(['海賊王', '寶可夢', '遊戲王', '棒球卡']),
  images: z.array(z.string().url()).max(10)
})

fastify.post('/products', async (request, reply) => {
  const data = CreateProductSchema.parse(request.body)
  // ...
})
```

**XSS 防護**:
- 使用 Vue 的自動 HTML 編碼
- CSP (Content Security Policy) Headers
- 禁止 `v-html` 使用未驗證的用戶輸入

**SQL Injection 防護**:
- 使用 Prisma ORM（自動參數化查詢）
- 避免原生 SQL 字串拼接

### 7.3 資料加密

- **密碼**: bcrypt（cost factor = 12）
- **JWT Secret**: 強隨機字串，定期輪換
- **敏感資料**: AES-256 加密（如：信用卡末四碼）
- **傳輸**: 全站 HTTPS（TLS 1.3）

---

## 8. 效能優化

### 8.1 資料庫優化

**索引策略**（已在 3.3 節說明）

**查詢優化**:
- 使用 `SELECT` 指定欄位，避免 `SELECT *`
- 避免 N+1 查詢（使用 `include` 或 JOIN）
- 複雜查詢使用 Materialized Views（報表）

**連接池**:
```typescript
// Prisma Client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // 連接池設定
  pool: {
    min: 2,
    max: 10
  }
})
```

### 8.2 快取策略

**Redis 快取**:

| 資料類型 | 快取鍵 | TTL |
|---------|--------|-----|
| 商品列表 | `products:list:{category}:{page}` | 5 分鐘 |
| 商品詳情 | `products:{id}` | 10 分鐘 |
| 用戶 Session | `session:{userId}` | 7 天 |
| 競標資訊 | `auction:{id}:info` | 即時更新 |
| 購物車 | `cart:{sessionId}` | 30 分鐘 |

**快取更新策略**:
- **Write-Through**: 寫入資料庫同時更新快取
- **Cache Invalidation**: 商品更新時刪除相關快取
- **LRU**: Redis 設定 `maxmemory-policy allkeys-lru`

### 8.3 前端優化

**程式碼分割**:
```typescript
// Nuxt 3 自動分割
// 或手動使用動態導入
const ProductDetail = defineAsyncComponent(() =>
  import('~/components/ProductDetail.vue')
)
```

**圖片優化**:
- **Lazy Load**: `loading="lazy"` 或 Intersection Observer
- **Responsive Images**: `<picture>` + `srcset`
- **WebP**: 優先使用 WebP，fallback 到 JPG

**SSR/SSG**（Nuxt 3）:
- 首頁、商品列表使用 SSG（靜態生成）
- 商品詳情使用 SSR（伺服器端渲染）
- 用戶相關頁面使用 CSR（客戶端渲染）

### 8.4 CDN

**第四階段啟用**:
- GCS + Cloud CDN（靜態資源、圖片）
- 全球分發，降低延遲
- 節省 Cloud Run 流量成本

---

## 9. 部署架構

### 9.1 GCP 資源配置

```
┌──────────────────────────────────────────┐
│          Cloud Load Balancer             │
│         (HTTPS, SSL Termination)         │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│           Cloud Run Services             │
├──────────────────────────────────────────┤
│  api-service        (Fastify API)        │
│  ├─ min-instances: 0                     │
│  ├─ max-instances: 10                    │
│  └─ concurrency: 80                      │
│                                          │
│  buyer-web-service  (Nuxt 3 SSR)         │
│  admin-web-service  (靜態託管)            │
│  pos-web-service    (靜態託管)            │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│          Cloud SQL (PostgreSQL)          │
│  ├─ Instance: db-f1-micro (初期)         │
│  ├─ Storage: 10GB SSD                    │
│  └─ Backup: 每日自動備份                  │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│         Redis Cloud (外部服務)            │
│  └─ 使用既有資源                          │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│      Cloud Storage (GCS Bucket)          │
│  ├─ astral-hub-storage/products/           │
│  ├─ Lifecycle: 90天後轉 Nearline         │
│  └─ Public Access (圖片 URLs)            │
└──────────────────────────────────────────┘
```

### 9.2 環境劃分

| 環境 | 用途 | 部署方式 | 資料庫 |
|------|------|---------|--------|
| **Development** | 本地開發 | 本機運行 | Docker PostgreSQL |
| **Staging** | 測試環境 | Cloud Run (手動) | Cloud SQL (關機狀態，測試時開啟) |
| **Production** | 生產環境 | Cloud Run (CI/CD) | Cloud SQL (24/7 運行) |

### 9.3 CI/CD 流程

**GitHub Actions Workflow**:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup GCP
        uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}

      - name: Build Docker Image
        run: |
          cd services/api
          docker build -t gcr.io/$PROJECT_ID/api:${{ github.sha }} .

      - name: Push to GCR
        run: docker push gcr.io/$PROJECT_ID/api:${{ github.sha }}

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy api-service \
            --image gcr.io/$PROJECT_ID/api:${{ github.sha }} \
            --platform managed \
            --region asia-east1 \
            --min-instances 0 \
            --max-instances 10

  deploy-frontend:
    # 類似步驟...
```

**部署策略**:
- **Blue-Green Deployment**: Cloud Run 原生支援
- **Rollback**: 保留前 3 個版本，可快速回滾
- **Health Check**: `/health` endpoint，自動檢測服務健康

---

## 10. 監控與日誌

### 10.1 日誌系統

**結構化日誌**（JSON 格式）:
```json
{
  "timestamp": "2026-01-24T12:00:00Z",
  "level": "INFO",
  "service": "api",
  "message": "Order created",
  "context": {
    "orderId": "uuid",
    "userId": "uuid",
    "amount": 1500
  }
}
```

**日誌工具**:
- **Pino**: 高效能 Node.js 日誌庫
- **Cloud Logging**: GCP 原生日誌服務
- **日誌保留**: 30 天（可設定更長）

### 10.2 監控指標

**系統監控**（Cloud Monitoring）:
- CPU/記憶體使用率
- API 回應時間（P50, P95, P99）
- 錯誤率（5xx）
- 併發請求數

**業務監控**:
- 每日訂單數
- GMV（總成交金額）
- 競標成交率
- 用戶活躍度

**告警規則**:
- API 錯誤率 > 5%：發送 Email
- 資料庫連接失敗：發送緊急通知
- Cloud SQL CPU > 80%：警告

### 10.3 效能追蹤

**APM（Application Performance Monitoring）**:
- **Sentry**: 錯誤追蹤與效能監控
- **Cloud Trace**: GCP 原生分散式追蹤

**範例**:
```typescript
// 追蹤 API 回應時間
fastify.addHook('onRequest', async (request, reply) => {
  request.startTime = Date.now()
})

fastify.addHook('onResponse', async (request, reply) => {
  const duration = Date.now() - request.startTime
  logger.info({
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    duration
  })
})
```

---

## 附錄

### A. 技術選型決策記錄

| 技術 | 備選方案 | 選擇理由 |
|------|---------|---------|
| Fastify | Express, NestJS | 效能最佳、公司已採用、插件豐富 |
| PostgreSQL | MongoDB | 強 ACID、複雜查詢、財務計算需要精確性 |
| Nuxt 3 | Next.js, SvelteKit | Vue 3 生態、SSR/SSG 支援、開發效率 |
| Prisma | TypeORM, Sequelize | 型別安全、DX 好、遷移管理方便 |
| Cloud Run | GKE, App Engine | Serverless、自動擴展、成本效益 |
| 綠界 ECPay | 藍新、PayPal | 手續費合理、文件完整、社群資源多 |

### B. 成本估算（月費）

**初期（MVP 上線後 3 個月）**:
- Cloud Run（API + 前端）: $20-40（流量小，常為 0 instance）
- Cloud SQL (db-f1-micro): $10
- Redis Cloud: $0（既有資源）
- GCS: $5-10（10GB 圖片）
- 綠界手續費: 交易額 * 2.8%
- **總計**: ~$35-60/月 + 交易手續費

**成長期（半年後）**:
- Cloud Run: $100-200
- Cloud SQL (db-g1-small): $35
- GCS: $20-30
- **總計**: ~$155-265/月 + 交易手續費

### C. 待解決問題

1. **競標結束時的併發處理**: 需要詳細設計鎖機制，避免同時得標
2. **高價商品的保險機制**: 是否需要整合物流保險 API
3. **跨境交易**: 未來是否支援國際物流與外幣結算
4. **行動支付擴充**: 街口支付、Apple Pay、Google Pay 等

---

**文檔結束**
