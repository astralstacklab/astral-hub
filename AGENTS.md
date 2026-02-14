# Card ERP - AI Agent 專案指南

> 此文件為 AI 編程助手（Claude、Gemini、Codex 等）提供專案背景與開發指引

---

## 專案簡介

**Card ERP** 是一個 OMO（線上線下整合）收藏卡交易平台，主要功能包含：

- 🏪 **實體店面**: QR Code 掃碼結帳系統
- 🛒 **線上商城**: 直購 + 競標功能
- 👥 **多賣家寄賣**: 自動抽成與對帳
- 📊 **後台管理**: 商品管理、報表分析、會員系統

**商品類型**: 裸卡、鑑定卡（PSA/ARS/BGS）、周邊商品（保護殼等）

---

## 技術棧總覽

### 前端

- **框架**: Vue 3 + Nuxt 3
- **狀態管理**: Pinia
- **樣式**: TailwindCSS
- **移動端**: PWA（第一階段） + Capacitor（第二階段，已預埋接口）
- **構建工具**: Vite

### 後端

- **框架**: Fastify + TypeScript
- **ORM**: Prisma (推薦) 或 TypeORM
- **驗證**: Zod (Schema Validation)
- **認證**: JWT (後台) + OAuth (買家端)

### 資料層

- **主資料庫**: PostgreSQL (Cloud SQL)
- **快取**: Redis Cloud（既有資源）
- **檔案儲存**: Google Cloud Storage (GCS)

### 部署

- **平台**: GCP Cloud Run (前後端)
- **CI/CD**: GitHub Actions
- **環境**: Development (本地) / Staging (Cloud SQL 關機) / Production

### 第三方服務

- **金流**: 綠界 ECPay
- **物流**: 7-11 賣貨便、全家店到店
- **認證**: Google OAuth、Facebook Login

---

## 專案結構

```
card-erp/                          # Monorepo 根目錄
│
├── apps/                          # 前端應用
│   ├── buyer-web/                 # 買家端 (Nuxt 3 SSR + PWA)
│   │   ├── pages/                 # 路由頁面
│   │   ├── components/            # 頁面元件
│   │   ├── composables/           # Composition API
│   │   ├── stores/                # Pinia stores
│   │   ├── assets/                # 靜態資源
│   │   ├── public/                # 公開資源
│   │   ├── nuxt.config.ts         # Nuxt 配置
│   │   └── capacitor.config.ts    # Capacitor 配置（第二階段啟用）
│   │
│   ├── admin-web/                 # 後台管理 (Vue 3 SPA)
│   │   ├── src/
│   │   │   ├── views/             # 頁面視圖
│   │   │   ├── components/        # 元件
│   │   │   ├── stores/            # Pinia stores
│   │   │   ├── router/            # Vue Router
│   │   │   ├── api/               # API 呼叫
│   │   │   └── main.ts            # 入口文件
│   │   └── vite.config.ts         # Vite 配置
│   │
│   └── pos-web/                   # 店面結帳系統 (Vue 3 PWA)
│       ├── src/
│       │   ├── views/             # 掃碼、購物車、結帳頁面
│       │   ├── components/
│       │   └── main.ts
│       └── vite.config.ts
│
├── services/                      # 後端服務
│   └── api/                       # Fastify API Server
│       ├── src/
│       │   ├── modules/           # 功能模組（按業務領域劃分）
│       │   │   ├── products/      # 商品模組
│       │   │   ├── orders/        # 訂單模組
│       │   │   ├── users/         # 用戶模組
│       │   │   ├── sellers/       # 賣家模組
│       │   │   ├── auctions/      # 競標模組
│       │   │   └── payments/      # 金流模組
│       │   ├── plugins/           # Fastify 插件
│       │   ├── utils/             # 工具函數
│       │   ├── middlewares/       # 中間件
│       │   └── server.ts          # 伺服器入口
│       ├── prisma/                # Prisma Schema
│       │   └── schema.prisma
│       ├── tests/                 # 測試
│       └── tsconfig.json
│
├── packages/                      # 共用套件
│   ├── shared-types/              # TypeScript 共用型別定義
│   │   ├── src/
│   │   │   ├── entities/          # 實體類型（Product, Order, User 等）
│   │   │   ├── dtos/              # DTO 類型
│   │   │   ├── enums/             # 枚舉
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── ui-components/             # Vue 共用元件庫
│   │   ├── src/
│   │   │   ├── components/        # 通用元件（Button, Card, Modal 等）
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── utils/                     # 共用工具函數
│       ├── src/
│       │   ├── formatters/        # 格式化工具（日期、金額等）
│       │   ├── validators/        # 驗證工具
│       │   └── index.ts
│       └── package.json
│
├── docs/                          # 文檔
│   ├── PRD.md                     # 產品需求文檔
│   ├── plans/                     # 系統設計文檔
│   │   └── 2026-01-24-system-architecture-design.md
│   └── api/                       # API 文檔
│
├── scripts/                       # 工具腳本
│   ├── setup-dev.sh               # 開發環境設定
│   ├── deploy.sh                  # 部署腳本
│   └── seed-data.ts               # 測試資料生成
│
├── .github/workflows/             # CI/CD
│   ├── ci.yml                     # 持續整合
│   └── deploy.yml                 # 部署流程
│
├── package.json                   # Root package.json (Monorepo)
├── pnpm-workspace.yaml            # PNPM Workspace 配置
├── tsconfig.json                  # Root TypeScript 配置
├── .env.example                   # 環境變數範例
├── .gitignore
├── README.md                      # 專案說明
├── AGENTS.md                      # 本文件（AI Agent 共用指引）
└── CLAUDE.md                      # Claude Code 專屬配置（參考本文件）
```

---

## 開發規範

### 代碼風格

- **TypeScript**: 必須，所有 `.ts` 和 `.vue` 檔案使用 TypeScript
- **嚴格型別**: 禁止使用 `any` 型別（單元測試除外），改用 `unknown` 或明確型別定義
- **ESLint**: 遵循 `@nuxt/eslint-config` 與 `@typescript-eslint/recommended`
- **Prettier**: 統一格式化，2 空格縮排，單引號
- **命名規範**:
  - 檔案: `kebab-case.ts`、`PascalCase.vue`（元件）
  - 變數/函數: `camelCase`
  - 常數: `UPPER_SNAKE_CASE`
  - 型別/介面: `PascalCase`
  - Enum: `PascalCase`

### Git Commit 規範

**⚠️ 重要**: Git commit 操作僅由專案負責人發起，AI 助手不應執行 `git commit` 或 `git push` 指令，除非明確被要求。

使用 Conventional Commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**:

- `feat`: 新功能
- `fix`: 修復 bug
- `docs`: 文檔更新
- `style`: 代碼格式調整（不影響功能）
- `refactor`: 重構
- `perf`: 效能優化
- `test`: 測試
- `chore`: 建構/工具變動

**範例**:

```
feat(products): 新增商品競標功能

- 新增競標資料表 schema
- 實作競標 API endpoints
- WebSocket 即時出價通知

Closes #123
```

### 分支策略

```
main            # 生產環境（保護分支）
  ├── develop   # 開發主分支
  │   ├── feature/product-auction   # 功能分支
  │   ├── feature/seller-dashboard
  │   └── fix/qrcode-scanning-bug   # 修復分支
```

**流程**:

1. 從 `develop` 切出 `feature/*` 或 `fix/*` 分支
2. 開發完成後發起 PR 到 `develop`
3. Code Review 通過後合併
4. 定期從 `develop` 合併到 `main` 並部署

### Multi-Agent 協作規範

本專案採用多 Agent 協作開發，角色分配如下：

- **Planner / Archiver（策劃 + 進版控）**：Claude（固定）
- **Executor（開發）**：Gemini / Codex / Antigravity（由 Coordinator 彈性指派）
- **Reviewer（審查）**：Gemini / Codex / Antigravity（由 Coordinator 彈性指派，需與 Executor 不同）

**觸發辨識**：當 Coordinator 要求 Agent「讀取 MISSION_CONTROL」或「開始執行」→ Executor 角色；要求「REVIEW」或「閱讀 EXECUTION_LOG」→ Reviewer 角色。

**任務分級**：

- **L1（單兵）**：改動 < 3 個檔案、無跨模組影響 → 單一 Agent 直接完成
- **L2（標準）**：邊界清晰的獨立功能 → 完整管線（策劃 → 執行 → 審查 → 歸檔）
- **L3（複雜）**：多模組、需反覆迭代 → 迭代管線（最多 3 輪）

**契約產物**：Agent 間透過 3 份固定的結構化 Markdown 產物溝通（位於 repo 根目錄，不進版控，每次任務覆寫）：

- `MISSION_CONTROL.md` — 策劃者產出，定義目標、範圍、約束、驗證指令
- `EXECUTION_LOG.md` — 執行者產出，記錄操作步驟與決策理由
- `REVIEW_REPORT.md` — 審查者產出，結構化差異分析與改進建議

**完整協定**：[`docs/MULTI_AGENT_PROTOCOL.md`](./docs/MULTI_AGENT_PROTOCOL.md)

### Executor 失敗熔斷機制

**⚠️ 強制要求**: Executor 在開發過程中遇到無法解決的問題時，**禁止無限重試**。

**規則**: 對**同一個問題**嘗試修復 **3 次**仍無法通過驗證時，必須立即執行以下步驟：

1. **停止嘗試** — 不再對同一問題進行第 4 次修復
2. **整理問題報告** — 在 `EXECUTION_LOG.md` 中記錄：
   - 完整的錯誤訊息
   - 已嘗試的 3 種修復方法及各自失敗的原因
   - 問題根源的初步分析
   - 建議的解決方向（如有）
3. **回報使用者** — 明確告知「此問題已嘗試 3 次修復未果，需要其他 Agent 協助」

**判定標準**：

- 「同一個問題」指同一個錯誤訊息、同一個測試失敗、或同一個型別錯誤
- 每次嘗試必須是**不同的修復策略**，重複同一做法不計為新嘗試
- 已完成的其他工作不受影響，應正常記錄在 EXECUTION_LOG 中

### Review 完成後的任務勾選規則

**⚠️ 強制要求**: AI 助手在完成 Review 並確認任務通過後，**必須**執行以下動作：

1. **勾選任務文件中的對應項目**: 在 `docs/tasks/phase-1-mvp/` 下的任務文件中，將已完成並通過 Review 的子任務 checkbox 從 `[ ]` 改為 `[x]`
2. **更新進度追蹤表**: 將對應子任務的狀態從 `⏳ 未開始` 更新為 `✅ 完成`，並填入完成日期
3. **勾選交付物**: 在「📝 交付物」區段中，勾選已交付的項目
4. **勾選成功標準**: 在「🎯 成功標準」區段中，勾選已驗證通過的項目

**範例**: 完成 1.1.3 Docker 環境測試後，應勾選：

- 成功標準中的 Docker/PostgreSQL/Redis 相關項目
- 1.1.1 ~ 1.1.3 所有已完成的 checkbox
- 交付物中的 `docker-compose.yml`、`scripts/init-db.sql` 等
- 進度追蹤表中 1.1 的狀態更新為 `✅ 完成`

---

## 資料庫設計要點

### 核心實體

#### Products（商品）

```typescript
{
  id: UUID                    // 主鍵
  type: 'CARD' | 'ACCESSORY'  // 商品類型
  category: string            // 類別（海賊王、寶可夢等）
  name: string
  series: string              // 系列
  cardNumber: string          // 卡號
  gradingStatus: 'RAW' | 'PSA' | 'ARS' | 'BGS' | null
  gradingScore: number | null
  costPrice: number           // 進貨價
  sellingPrice: number        // 售價
  sellerId: UUID              // 賣家 ID（自營則為 null）
  status: 'PENDING' | 'LISTED' | 'SOLD'
  channel: 'ONLINE' | 'OFFLINE' | 'BOTH'
  images: JSON[]              // 圖片 URLs
  video: string | null
  description: string
  condition: string           // 狀況描述
  supplier: string | null     // 供應商
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Orders（訂單）

```typescript
{
  id: UUID
  orderNumber: string         // 訂單編號（自動生成）
  buyerId: UUID
  items: JSON[]               // 訂單項目
  totalAmount: number
  discountAmount: number      // 紅利折抵
  finalAmount: number
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'LINE_PAY' | 'TRANSFER'
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  shippingMethod: 'SEVEN_ELEVEN' | 'FAMILY_MART' | 'FACE_TO_FACE' | 'IN_STORE'
  shippingAddress: JSON | null
  trackingNumber: string | null
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED'
  channel: 'ONLINE' | 'POS'   // 購買通路
  createdAt: DateTime
}
```

#### Auctions（競標）

```typescript
{
  id: UUID
  productId: UUID
  startingPrice: number // 底價
  buyNowPrice: number | null // 直購價
  currentPrice: number // 當前價格
  incrementAmount: number // 每次加價金額
  currentBidderId: UUID | null
  startTime: DateTime
  endTime: DateTime
  status: 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'CANCELLED'
  createdAt: DateTime
}
```

#### Users（用戶 - 買家）

```typescript
{
  id: UUID
  email: string
  name: string
  avatar: string | null
  provider: 'GOOGLE' | 'FACEBOOK' // OAuth provider
  providerId: string
  loyaltyPoints: number // 紅利點數
  memberLevel: 'STANDARD' // 預留等級擴充
  createdAt: DateTime
}
```

#### Sellers（賣家）

```typescript
{
  id: UUID
  email: string
  name: string
  level: 'BRONZE' | 'SILVER' | 'GOLD'
  totalSales: number // 總銷售額（用於自動升級）
  balance: number // 虛擬錢包餘額
  commissionRate: number // 當前抽成比例
  onlineListingFee: number // 線上上架費
  offlineListingFee: number // 實體上架費
  status: 'ACTIVE' | 'SUSPENDED'
  createdAt: DateTime
}
```

### 索引策略

- `Products.status + Products.channel`: 商品列表查詢
- `Products.sellerId`: 賣家商品查詢
- `Orders.buyerId`: 買家訂單查詢
- `Orders.orderNumber`: 訂單編號查詢（唯一索引）
- `Auctions.productId`: 商品競標查詢（唯一索引）
- `Auctions.status + Auctions.endTime`: 競標列表查詢

---

## API 設計規範

### RESTful 路由設計

```
# 商品相關
GET    /api/products              # 商品列表（支援分頁、篩選）
GET    /api/products/:id          # 商品詳情
POST   /api/products              # 新增商品（後台）
PUT    /api/products/:id          # 更新商品（後台）
DELETE /api/products/:id          # 刪除商品（後台）
POST   /api/products/:id/qrcode   # 生成 QR Code（後台）

# 競標相關
GET    /api/auctions              # 競標列表
GET    /api/auctions/:id          # 競標詳情
POST   /api/auctions              # 建立競標（後台/賣家）
POST   /api/auctions/:id/bid      # 出價
GET    /api/auctions/:id/bids     # 出價記錄

# 訂單相關
GET    /api/orders                # 訂單列表
GET    /api/orders/:id            # 訂單詳情
POST   /api/orders                # 建立訂單
PUT    /api/orders/:id/status     # 更新訂單狀態（後台）

# 金流相關
POST   /api/payments/ecpay/create # 建立綠界訂單
POST   /api/payments/ecpay/callback # 綠界回調

# 用戶相關
GET    /api/users/me              # 當前用戶資訊
GET    /api/users/me/orders       # 我的訂單
GET    /api/users/me/points       # 我的紅利點數

# 賣家相關（第三階段）
GET    /api/sellers/me            # 賣家資訊
GET    /api/sellers/me/products   # 我的商品
GET    /api/sellers/me/sales      # 銷售報表
POST   /api/sellers/me/withdraw   # 申請提領
```

### 回應格式

**成功回應**:

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

**錯誤回應**:

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "找不到指定商品",
    "details": { ... }
  }
}
```

### 認證方式

**後台 API** (管理員、賣家):

```
Authorization: Bearer <JWT_TOKEN>
```

**買家 API**:

```
Authorization: Bearer <JWT_TOKEN>  # OAuth 登入後取得
```

---

## 環境變數

建立 `.env` 檔案（參考 `.env.example`）:

```env
# 環境
NODE_ENV=development

# API Server
API_PORT=3000
API_HOST=0.0.0.0

# 資料庫
DATABASE_URL=postgresql://user:password@localhost:5678/card_erp
REDIS_URL=redis://localhost:6379

# GCS
GCS_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=card-erp-storage
GCS_KEY_FILE=./gcs-key.json

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
FACEBOOK_APP_ID=xxx
FACEBOOK_APP_SECRET=xxx

# 綠界 ECPay
ECPAY_MERCHANT_ID=xxx
ECPAY_HASH_KEY=xxx
ECPAY_HASH_IV=xxx
ECPAY_API_URL=https://payment-stage.ecpay.com.tw  # 測試環境

# 7-11 / 全家
SEVEN_ELEVEN_API_KEY=xxx
FAMILY_MART_API_KEY=xxx

# 前端 URLs
BUYER_WEB_URL=http://localhost:3001
ADMIN_WEB_URL=http://localhost:3002
POS_WEB_URL=http://localhost:3003
```

---

## 開發流程

### 本地開發設定

1. **安裝依賴**:

   ```bash
   # 使用 pnpm（推薦）
   pnpm install
   ```

2. **啟動 PostgreSQL（Docker）**:

   ```bash
   docker run -d \
     --name card-erp-postgres \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=card_erp \
     -p 5678:5432 \
     postgres:15
   ```

3. **啟動 Redis**（使用既有 Redis Cloud 或本地）:

   ```bash
   docker run -d --name card-erp-redis -p 6379:6379 redis:7
   ```

4. **資料庫遷移**:

   ```bash
   cd services/api
   pnpm prisma migrate dev
   ```

5. **啟動開發伺服器**:

   ```bash
   # 後端 API
   cd services/api
   pnpm dev

   # 買家端
   cd apps/buyer-web
   pnpm dev

   # 後台管理
   cd apps/admin-web
   pnpm dev

   # 店面結帳
   cd apps/pos-web
   pnpm dev
   ```

### 測試

```bash
# 單元測試
pnpm test

# E2E 測試
pnpm test:e2e

# 測試覆蓋率
pnpm test:coverage
```

### 部署

```bash
# 建構生產版本
pnpm build

# 部署到 Cloud Run
pnpm deploy
```

---

## 常見開發任務

### 新增一個 API Endpoint

1. 在 `services/api/src/modules/<module>/` 建立 route 檔案
2. 定義 Zod schema 驗證請求
3. 實作業務邏輯
4. 寫單元測試
5. 更新 API 文檔

### 新增一個前端頁面

1. 在 `apps/buyer-web/pages/` 建立頁面檔案（Nuxt 自動路由）
2. 建立對應的 composable（API 呼叫、狀態管理）
3. 使用共用元件（`packages/ui-components`）
4. 測試響應式設計（手機/桌面）

### 新增一個共用型別

1. 在 `packages/shared-types/src/` 定義型別
2. 導出到 `index.ts`
3. 前後端專案即可引用: `import { Product } from '@card-erp/shared-types'`

---

## 重要注意事項

### ⚠️ 安全性

- **絕不提交敏感資訊**: `.env`、API Keys、密碼等
- **XSS 防護**: 使用者輸入必須驗證與編碼
- **SQL Injection**: 使用 Prisma ORM，避免原生 SQL
- **CSRF**: 所有 POST/PUT/DELETE 需 CSRF Token
- **圖片上傳**: 限制檔案類型、大小，掃描惡意檔案

### ⚠️ 效能優化

- **圖片**: WebP 格式、Lazy Load、CDN（第四階段）
- **快取**: Redis 快取熱門商品、會員 Session
- **資料庫**: 適當索引、避免 N+1 查詢
- **前端**: Code Splitting、Tree Shaking、SSR/SSG

### ⚠️ 成本控管

- **Cloud Run**: 設定 `min-instances=0`
- **Cloud SQL**: 開發期關機，只付儲存費
- **GCS**: 90 天後自動轉冷儲存
- **監控**: 設定 GCP Budget Alerts

---

## 開發階段優先級

### 第一階段（當前）- 自營 MVP

- [ ] 商品 CRUD API
- [ ] QR Code 生成功能
- [ ] 店面結帳系統（掃碼、購物車、結帳）
- [ ] 線上商城（商品列表、詳情頁）
- [ ] 競標系統（建立、出價、WebSocket 通知）
- [ ] 金流串接（綠界 ECPay）
- [ ] 後台管理（商品管理、訂單管理、報表）
- [ ] 圖片上傳與處理（GCS、壓縮、浮水印）

### 第二階段 - 買家會員

- [ ] OAuth 登入（Google、Facebook）
- [ ] 紅利點數系統
- [ ] 物流串接（7-11、全家）
- [ ] 訂單追蹤

### 第三階段 - 賣家系統

- [ ] 賣家後台
- [ ] 寄賣審核流程
- [ ] 抽成與對帳系統
- [ ] 提領功能

### 第四階段 - 進階功能

- [ ] 權限管理
- [ ] Capacitor APP
- [ ] 多元物流（黑貓等）
- [ ] CDN 與效能優化

---

## 有用的指令

```bash
# Monorepo 管理
pnpm install                    # 安裝所有依賴
pnpm build                      # 建構所有專案
pnpm dev                        # 啟動所有開發伺服器（需配置）

# 針對特定專案
pnpm --filter buyer-web dev     # 僅啟動買家端
pnpm --filter api test          # 僅測試後端 API

# 資料庫操作
pnpm --filter api prisma studio          # 開啟 Prisma Studio
pnpm --filter api prisma migrate dev     # 執行遷移
pnpm --filter api prisma generate        # 生成 Prisma Client

# 代碼品質
pnpm lint                       # ESLint 檢查
pnpm format                     # Prettier 格式化
pnpm type-check                 # TypeScript 型別檢查
```

---

## 文件索引與參考方針

### 📚 文件導航

Card ERP 專案包含完整的文件體系，確保開發過程有據可循。所有文件分為以下類別：

**完整文件索引**: [docs/DOCS_INDEX.md](./docs/DOCS_INDEX.md)

#### 核心文件分類

```
docs/
├── 📋 產品規劃
│   ├── PRD.md                          # 產品需求文檔
│   └── TASKS.md                        # 任務總綱
│
├── 🎨 設計系統
│   └── design-system/
│       ├── BRAND_GUIDELINES.md         # 品牌設計指南
│       ├── ADMIN_WEB_STYLE_GUIDE.md    # Admin Web 風格（Fintech/Crypto）
│       ├── BUYER_WEB_STYLE_GUIDE.md    # Buyer Web 風格（DeFi Cyberpunk）
│       ├── POS_WEB_STYLE_GUIDE.md      # POS Web 風格（功能型）
│       ├── TAILWIND_USAGE.md           # Tailwind 使用指南
│       └── tailwind-preset.js          # 共用 Tailwind preset
│
├── 🏗️ 架構設計
│   └── plans/
│       └── 2026-01-24-system-architecture-design.md
│
├── 🗺️ 產品路線圖
│   └── roadmap/
│       ├── README.md                   # 路線圖總覽（三階段）
│       ├── PHASE-2-3-OVERVIEW.md       # Phase 2/3 功能概覽
│       └── TECHNICAL-EVOLUTION.md      # 技術演進路線圖
│
├── ✅ 實作任務
│   └── tasks/
│       └── phase-1-mvp/                # 01-22 詳細任務文件
│
└── 🔧 開發指南
    ├── SKILLS_GUIDE.md                 # Skills 使用指南
    ├── SKILLS_LOCATION.md              # Skills 位置說明
    └── DOCS_INDEX.md                   # 文件索引（本導航）
```

### 🎯 執行方針：文件先行原則

**核心原則**: **執行 A 任務 → 先讀 A 文件 → 完成後更新 A 文件**

#### 開發前必讀

| 開發任務              | 必讀文件                                                                    | 完成後需更新                                                               |
| --------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **新增產品功能**      | `PRD.md` → 對應 `Task 文件`                                                 | `PRD.md`（如需求變更）<br>`Task 文件`（如步驟調整）                        |
| **UI/UX 開發**        | `BRAND_GUIDELINES.md` → 對應應用的 `Style Guide` → `TAILWIND_USAGE.md`      | `Style Guide`（如新增顏色/組件）<br>`tailwind-preset.js`（如共用樣式變更） |
| **架構調整**          | `plans/2026-01-24-system-architecture-design.md` → `TECHNICAL-EVOLUTION.md` | `Architecture Design`<br>受影響的 `Task 文件`                              |
| **執行 Phase 1 任務** | `tasks/phase-1-mvp/XX-<topic>.md` → `PRD.md` → `Architecture Design`        | 對應的 `Task 文件`（如實作調整）                                           |
| **路線圖規劃**        | `roadmap/README.md` → `PHASE-2-3-OVERVIEW.md` → `TECHNICAL-EVOLUTION.md`    | 所有 roadmap 文件<br>`PRD.md`（如產品方向變更）                            |

### 🔄 文件同步更新規則

**當發生以下變更時，必須同步更新相關文件**：

#### 1. 產品需求變更

```
變更流程:
1. 更新 docs/PRD.md（需求定義）
2. 更新 docs/roadmap/README.md（如影響路線圖）
3. 更新受影響的 Task 文件（具體實作）
```

#### 2. 架構調整

```
變更流程:
1. 更新 docs/plans/2026-01-24-system-architecture-design.md（架構設計）
2. 更新受影響的 Task 文件（如 22-deployment.md）
3. 更新 AGENTS.md（如技術棧變更）
4. 更新 docs/roadmap/TECHNICAL-EVOLUTION.md（如影響演進方向）
```

#### 3. UI 風格變更

```
變更流程:
1. 更新對應的 Style Guide（ADMIN/BUYER/POS_WEB_STYLE_GUIDE.md）
2. 更新 docs/design-system/BRAND_GUIDELINES.md（如影響統一原則）
3. 更新 docs/design-system/TAILWIND_USAGE.md（如配置變更）
4. 更新 tailwind-preset.js（如共用樣式變更）
```

#### 4. 路線圖調整

```
變更流程:
1. 更新 docs/roadmap/README.md（總體規劃）
2. 更新 docs/roadmap/PHASE-2-3-OVERVIEW.md（功能清單）
3. 更新 docs/PRD.md（如產品願景變更）
```

### 📋 文件一致性檢查 Checklist

在提交重大變更或 Pull Request 前，應檢查：

- [ ] `PRD.md` 與 `roadmap/README.md` 的產品願景是否一致？
- [ ] `Architecture Design` 與 Phase 1 Task 文件的架構是否一致？
- [ ] 三個 `Style Guide` 與 `BRAND_GUIDELINES.md` 的統一原則是否一致？
- [ ] `TECHNICAL-EVOLUTION.md` 與 `AGENTS.md` 的技術棧是否一致？
- [ ] 所有受影響的文件是否都已更新？
- [ ] 是否更新了文件的「最後更新」日期？

### 🚨 強制要求

**AI 助手與開發者在開發過程中**：

1. ✅ **開始任務前** → 必須先閱讀對應的文件
2. ✅ **方案調整時** → 必須同步更新相關文件
3. ✅ **完成任務後** → 必須在 Commit Message 中說明文件變更
4. ❌ **禁止** → 只改代碼不更新文件
5. ❌ **禁止** → 文件與實作不一致

### 📖 詳細參考

完整的文件參考指引、更新規則、文件關聯圖請參考：
👉 **[docs/DOCS_INDEX.md](./docs/DOCS_INDEX.md)**

---

## 資源連結

### 內部文檔

- **[文件索引](./docs/DOCS_INDEX.md)** - 完整文件導航與參考指引 ⭐
- **[PRD 產品需求文檔](./docs/PRD.md)** - 產品需求與功能範圍
- **[系統設計文檔](./docs/plans/)** - 架構設計與技術規格
- **[產品路線圖](./docs/roadmap/)** - 三階段演進規劃
- **[設計系統](./docs/design-system/)** - UI/UX 風格指南
- **[Phase 1 任務](./docs/tasks/phase-1-mvp/)** - MVP 詳細實作任務
- **[Skills 使用指南](./docs/SKILLS_GUIDE.md)** - AI Agent Skills 使用說明

### 外部資源

- [Nuxt 3 文檔](https://nuxt.com/)
- [Fastify 文檔](https://www.fastify.io/)
- [Prisma 文檔](https://www.prisma.io/)
- [綠界 ECPay API](https://www.ecpay.com.tw/Service/API_Dwnld)
- [GCP Cloud Run 文檔](https://cloud.google.com/run/docs)

---

## 聯絡與支援

如果你是 AI 助手，在開發過程中遇到問題或需要更多背景資訊：

1. 參考 `docs/PRD.md` 了解完整需求
2. 參考 `docs/plans/` 查看設計文檔
3. 查看 `README.md` 了解專案結構
4. 檢查 `.env.example` 確認環境變數配置

**開發原則**:

- ✅ TypeScript 優先
- ✅ 遵循 SOLID 原則
- ✅ 寫清晰的註解（中文或英文）
- ✅ 測試驅動開發（重要功能）
- ✅ 代碼審查（PR 必須經過 Review）
- ✅ 持續重構，保持代碼整潔

---

**祝開發順利！🚀**
