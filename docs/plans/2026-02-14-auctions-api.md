# 競標 API 全局實作計畫

> **For Claude:** 本計畫採分段管線（4.3 節），拆為 4 個 Mission 逐步執行。

**Goal:** 實作完整的競標系統 API 模組（`src/modules/auctions/`），包含 Zod 驗證 Schema、Service 層（CRUD + 出價 + Redis 鎖）、Routes 層（6 REST + 1 WebSocket）、Room-based WebSocket 管理、Cron 定時結標任務，以及 Service 單元測試和 Routes 整合測試。

**Tech Stack:** Fastify 5.x, @fastify/websocket, node-cron, Prisma (Auction + Bid models), Redis (ioredis), Vitest

**Task Reference:** `docs/tasks/phase-1-mvp/06-api-auctions.md`

---

## 設計決策

### 架構模式（延續 Task 5 Products）

- Zod v4 用於 handler 內 `.parse()` 驗證，Fastify schema 使用 JSON Schema（Swagger 文檔）
- 全域 error-handler 處理錯誤，routes 不需 try/catch
- Response schema 定義所有可能的 status code（解決 Fastify v5 TypeScript 限制）
- Prisma import 從 generated path：`../../../src/generated/prisma/client.js`
- Redis 由 `server.redis`（ioredis 實例）提供
- JWT user 型別：`{ id: string; role: string }`

### 競標特有

- **Proxy Bidding（代理出價）**: 採 eBay-like 機制（固定增額簡化版，非 eBay 分段加價梯度），用戶輸入 maxBid（最高願付），系統自動以最低必要金額跟價
- **出價鎖**: Redis SETNX + owner 驗證，proxy 跟價計算在鎖內原子完成
- **出價一致性**: `prisma.$transaction` 確保 bid create + auction update 原子操作
- **maxBid 隱藏**: API response 與 WebSocket broadcast 僅包含 currentPrice，不暴露任何人的 maxBid
- **WebSocket**: Room-based 管理（每 auction 一個 room），只通知訂閱者
- **定時結標**: Cron 每分鐘掃描（MVP 可接受 ~60s 延遲）
- **Decimal 處理**: Prisma Decimal 欄位用 `.toNumber()` 做數值比較

### Proxy Bidding 跟價規則

```
當 challenger 以 maxBid 進入出價：

1. 找出目前 isActive=true 的 proxy 領先者 (defender)

2. 無 defender（首位出價）：
   currentPrice = startingPrice
   winner = challenger

3. challenger.maxBid > defender.maxBid：
   currentPrice = min(defender.maxBid + increment, challenger.maxBid)
   winner = challenger（defender.isActive = false）

4. challenger.maxBid < defender.maxBid：
   currentPrice = min(challenger.maxBid + increment, defender.maxBid)
   winner = defender（不變）

5. challenger.maxBid == defender.maxBid：
   winner = defender（先出價者優先）
   currentPrice = defender.maxBid

6. 同一用戶追加 maxBid：
   更新其 Bid.maxBid（僅允許加碼），不建立新 record
   不觸發跟價（無競爭者變動）

7. maxBid >= buyNowPrice（若設定）：
   直接以 buyNowPrice 結標
```

### API Endpoints

| Method | Path                          | Auth | 說明                        |
| ------ | ----------------------------- | ---- | --------------------------- |
| GET    | `/api/auctions`               | 否   | 查詢競標列表（含篩選/分頁） |
| GET    | `/api/auctions/:id`           | 否   | 查詢單一競標                |
| POST   | `/api/auctions`               | 是   | 建立競標                    |
| POST   | `/api/auctions/:id/bid`       | 是   | 出價                        |
| GET    | `/api/auctions/:id/bids`      | 否   | 查詢出價記錄                |
| PUT    | `/api/auctions/:id/cancel`    | 是   | 取消競標                    |
| WS     | `/api/auctions/:id/subscribe` | 否   | WebSocket 訂閱即時更新      |

---

## Mission 拆分

### Mission A: Schema + Service + Service Test

**範圍**: 3 個檔案（子任務 6.1 + 6.2 + 6.6.1）

- `services/api/src/modules/auctions/auctions.schema.ts` — Zod v4 驗證 schema
- `services/api/src/modules/auctions/auctions.service.ts` — Service 層（商業邏輯）
- `services/api/tests/modules/auctions/auctions.service.test.ts` — Service 單元測試

**依賴**: 無（獨立）
**驗證**: `pnpm --filter @astral-hub/api exec tsc --noEmit` + `pnpm --filter @astral-hub/api test`

### Mission B: WebSocket Plugin + Room Manager

**範圍**: 3 個檔案（子任務 6.3）

- `services/api/src/plugins/websocket.ts` — WebSocket plugin
- `services/api/src/modules/auctions/auction-rooms.ts` — Room-based 連線管理器
- `services/api/package.json` — 新增 @fastify/websocket 依賴

**依賴**: 無（可與 A 平行）
**驗證**: `pnpm install` + `pnpm --filter @astral-hub/api exec tsc --noEmit`

### Mission C: Routes + Server 整合 + Routes Test

**範圍**: 4 個檔案（子任務 6.4 + 6.6.2 + 6.6.3）

- `services/api/src/modules/auctions/auctions.routes.ts` — Routes 層（REST + WebSocket）
- `services/api/src/modules/auctions/index.ts` — 模組匯出
- `services/api/src/server.ts` — 註冊 websocket plugin + auctions routes
- `services/api/tests/modules/auctions/auctions.routes.test.ts` — Routes 整合測試 + WebSocket 測試

**依賴**: Mission A + Mission B
**驗證**: `pnpm --filter @astral-hub/api exec tsc --noEmit` + `pnpm --filter @astral-hub/api test`

### Mission C.5: Proxy Bidding 機制

**範圍**: 6 個檔案（DB migration + schema + service + routes + tests）

- `services/api/prisma/schema.prisma` — Bid model 新增 maxBid / isActive 欄位
- `services/api/src/modules/auctions/auctions.schema.ts` — PlaceBidSchema 改用 maxBid
- `services/api/src/modules/auctions/auctions.service.ts` — placeBid 重寫為 proxy bidding 邏輯
- `services/api/src/modules/auctions/auctions.routes.ts` — bid handler 欄位調整 + maxBid 隱藏
- `services/api/tests/modules/auctions/auctions.service.test.ts` — proxy bidding 測試案例
- `services/api/tests/modules/auctions/auctions.routes.test.ts` — 更新 bid 相關測試

**依賴**: Mission C（Routes 已建立）
**驗證**: `prisma migrate dev` + `pnpm --filter @astral-hub/api exec tsc --noEmit` + `pnpm --filter @astral-hub/api test`

### Mission D: Cron Job

**範圍**: 2 個檔案（子任務 6.5）

- `services/api/src/jobs/auction-end.job.ts` — 定時結標任務
- `services/api/src/server.ts` — start() 函數加入 cron 啟動
- `services/api/package.json` — 新增 node-cron + @types/node-cron 依賴

**依賴**: Mission C.5（使用更新後的 AuctionsService）
**驗證**: `pnpm --filter @astral-hub/api exec tsc --noEmit` + `pnpm --filter @astral-hub/api test`

---

## 依賴圖

```
A: Schema + Service + Test  ─┬─→  C: Routes + 整合 + Test
B: WebSocket + Rooms         ─┘         │
                                        ↓
                               C.5: Proxy Bidding
                                        │
A ──────────────────────────────────→  D: Cron Job
```

- A、B 可平行
- C 需 A + B 完成
- C.5 需 C 完成（在現有明標基礎上重構為 proxy bidding）
- D 需 C.5 完成（使用更新後的 service）

---

## 共通規範

- **Zod v4**：`import { z } from "zod/v4"`
- **Prisma import**：`import type { PrismaClient, Auction, Bid, Prisma } from '../../../src/generated/prisma/client.js'`
- **Redis**：service 接收 `Redis` type import from `ioredis`，routes 使用 `server.redis`
- **相對路徑**：不使用 `@/` path alias
- **禁止 any**：所有型別明確定義
- **錯誤處理**：業務錯誤 `throw new Error()`，由全域 error-handler 統一回應
- **Decimal**：Prisma Decimal 欄位用 `.toNumber()` 轉換後比較
- **Swagger**：所有路由需含 tags / summary / description / response schema
