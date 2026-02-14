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

- **出價鎖**: Redis SETNX + owner 驗證，避免併發問題
- **出價一致性**: `prisma.$transaction` 確保 bid create + auction update 原子操作
- **WebSocket**: Room-based 管理（每 auction 一個 room），只通知訂閱者
- **定時結標**: Cron 每分鐘掃描（MVP 可接受 ~60s 延遲）
- **Decimal 處理**: Prisma Decimal 欄位用 `.toNumber()` 做數值比較

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
**驗證**: `pnpm --filter @card-erp/api exec tsc --noEmit` + `pnpm --filter @card-erp/api test`

### Mission B: WebSocket Plugin + Room Manager

**範圍**: 3 個檔案（子任務 6.3）

- `services/api/src/plugins/websocket.ts` — WebSocket plugin
- `services/api/src/modules/auctions/auction-rooms.ts` — Room-based 連線管理器
- `services/api/package.json` — 新增 @fastify/websocket 依賴

**依賴**: 無（可與 A 平行）
**驗證**: `pnpm install` + `pnpm --filter @card-erp/api exec tsc --noEmit`

### Mission C: Routes + Server 整合 + Routes Test

**範圍**: 4 個檔案（子任務 6.4 + 6.6.2 + 6.6.3）

- `services/api/src/modules/auctions/auctions.routes.ts` — Routes 層（REST + WebSocket）
- `services/api/src/modules/auctions/index.ts` — 模組匯出
- `services/api/src/server.ts` — 註冊 websocket plugin + auctions routes
- `services/api/tests/modules/auctions/auctions.routes.test.ts` — Routes 整合測試 + WebSocket 測試

**依賴**: Mission A + Mission B
**驗證**: `pnpm --filter @card-erp/api exec tsc --noEmit` + `pnpm --filter @card-erp/api test`

### Mission D: Cron Job

**範圍**: 2 個檔案（子任務 6.5）

- `services/api/src/jobs/auction-end.job.ts` — 定時結標任務
- `services/api/src/server.ts` — start() 函數加入 cron 啟動
- `services/api/package.json` — 新增 node-cron + @types/node-cron 依賴

**依賴**: Mission A（使用 AuctionsService）
**驗證**: `pnpm --filter @card-erp/api exec tsc --noEmit` + `pnpm --filter @card-erp/api test`

---

## 依賴圖

```
A: Schema + Service + Test  ─┬─→  C: Routes + 整合 + Test
B: WebSocket + Rooms         ─┘
A ───────────────────────────────→  D: Cron Job
```

- A、B 可平行
- C 需 A + B 完成
- D 只需 A 完成

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
