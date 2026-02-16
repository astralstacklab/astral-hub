# Planning: Task 09 — 報表分析 API

## 現有資源盤點

### 可用 Models（不需 migration）

- **Order**: finalAmount, subtotal, shippingFee, discountAmount, paymentStatus, status, channel, createdAt
- **OrderItem**: productPrice, sellerId（nullable，null=自營，有值=寄賣）
- **Product**: type, category, name, status(PENDING/LISTED/SOLD), sellerId, costPrice, sellingPrice
- **Seller**: name, level(BRONZE/SILVER/GOLD), commissionRate, totalSales, status
- **Auction**: status, startTime, endTime
- **PaymentLog**: provider, method, amount, status

### 關鍵發現

- **無 sourceType 欄位** — 自營 vs 寄賣判斷方式：`product.sellerId IS NULL` = 自營，`IS NOT NULL` = 寄賣
- **OrderItem 無 quantity/subtotal** — 每張卡唯一，quantity 永遠 = 1，金額 = `productPrice`
- **Seller.level**（非 tier）— SellerLevel enum: BRONZE/SILVER/GOLD
- **Order.finalAmount**（非 totalAmount）— 最終金額
- **AnalyticsSnapshot 表** — MVP 不需要，報表即時計算 + Redis 快取

### 新依賴需安裝

- `date-fns`：日期計算（startOfDay, endOfDay, addDays, eachDayOfInterval）
- `csv-stringify`：CSV 匯出（帶 BOM 支援中文 Excel）

---

## API 端點設計（5 個，全需認證）

| Method                         | Path                                    | 說明   | 快取 TTL |
| ------------------------------ | --------------------------------------- | ------ | -------- |
| `GET /api/analytics/sales`     | 銷售報表（期間 + 通路 + 自營/寄賣拆分） | 5 min  |
| `GET /api/analytics/products`  | 商品統計（暢銷排行 + 庫存 + 類別）      | 5 min  |
| `GET /api/analytics/sellers`   | 賣家佣金報表（抽成計算）                | 5 min  |
| `GET /api/analytics/dashboard` | 儀表板總覽（KPI + 趨勢 + 快速統計）     | 3 min  |
| `GET /api/analytics/export`    | CSV 匯出（sales/products/sellers）      | 不快取 |

---

## 關鍵設計決策

### 1. Schema 放置

- Zod query schemas 放在 `analytics.schema.ts`（API module 內）
- Response types 用 TypeScript interface（不用 Zod，因為是 service 回傳值）
- **不修改 shared-types**（報表類型是 API 內部用，不需跨套件共享）

### 2. 自營 vs 寄賣判斷

```
自營: orderItem.sellerId IS NULL (或 product.sellerId IS NULL)
寄賣: orderItem.sellerId IS NOT NULL
```

OrderItem 有 sellerId 欄位（建單時從 product 複製過來），可直接用。

### 3. 佣金計算

- 從 `seller.commissionRate` 取得（Decimal）
- 平台抽成 = productPrice × commissionRate
- 賣家所得 = productPrice - 平台抽成
- **不硬編碼 15%**

### 4. 統計條件

- 銷售報表只算 `status = 'COMPLETED' AND paymentStatus = 'PAID'` 的訂單
- 商品統計的庫存用 `status` groupBy（PENDING / LISTED / SOLD）
- Dashboard 的 pendingOrders 算 `status = 'PENDING'`

### 5. Raw SQL 使用

- 類別營收統計需要 $queryRaw（groupBy + join + sum）
- 注意 Prisma 的 camelCase 映射：DB 欄位名要用 `"productPrice"` 不是 `product_price`
  （因為 Prisma 沒有用 @@map 做欄位映射，保持 camelCase）

### 6. Redis 快取策略

- Service 方法接收 `redis` 參數（從 `server.redis` 傳入）
- constructor: `(prisma, redis)` 同時接收
- 快取 key pattern: `analytics:{report_type}:{params_hash}`
- TTL: 報表 300s (5min)，dashboard 180s (3min)
- CSV export 不快取（每次重新生成）

---

## Mission 分割

### Mission A: Schema + Service + 依賴安裝 + Test

**新建檔案**：

1. `services/api/src/modules/analytics/analytics.schema.ts` — 4 query schemas + 1 export schema
2. `services/api/src/modules/analytics/analytics.service.ts` — AnalyticsService (4 methods)
3. `services/api/tests/modules/analytics/analytics.service.test.ts` — ~8 tests

**依賴安裝**：

```bash
cd services/api && pnpm add date-fns csv-stringify
```

**Service 4 方法**：

- `getSalesReport(query)` — 期間銷售統計 + 自營/寄賣/通路拆分 + 每日明細
- `getProductStats(query)` — 暢銷排行 + 庫存分布 + 類別統計
- `getSellerCommission(query)` — 賣家佣金計算（用 seller.commissionRate）
- `getDashboard()` — 總覽 KPI + 7/30 天趨勢 + 成長率 + 快速統計

**預估測試 ~8**：

1. getSalesReport — 基本查詢（summary 正確）
2. getSalesReport — 通路拆分（online vs pos）
3. getSalesReport — 自營 vs 寄賣拆分
4. getProductStats — 暢銷排行
5. getProductStats — 庫存分布
6. getSellerCommission — 佣金計算正確（用 seller.commissionRate）
7. getDashboard — 總覽數據
8. getDashboard — 快速統計（pendingOrders, activeAuctions）

### Mission B: Routes + CSV Export + barrel + server 整合 + Test

**新建/修改檔案**：

1. `services/api/src/modules/analytics/analytics.routes.ts` — 5 endpoints
2. `services/api/src/modules/analytics/index.ts` — barrel export
3. 修改 `services/api/src/server.ts` — 註冊 /api/analytics
4. `services/api/tests/modules/analytics/analytics.routes.test.ts` — ~8 tests

**5 個端點**：

- `GET /sales` — querystring 驗證 → getSalesReport → successResponse
- `GET /products` — querystring 驗證 → getProductStats → successResponse
- `GET /sellers` — querystring 驗證 → getSellerCommission → successResponse
- `GET /dashboard` — getDashboard → successResponse
- `GET /export` — 根據 reportType 呼叫對應 service → csv-stringify → 設 Content-Type/Disposition

**預估測試 ~8**：

1. GET /sales — 200 成功
2. GET /products — 200 成功
3. GET /sellers — 200 成功
4. GET /dashboard — 200 成功
5. GET /export?reportType=sales — 200 CSV 回應
6. GET /export?reportType=products — 200 CSV 回應
7. GET /sales — 401 未授權
8. GET /export — 400 缺少必要參數
