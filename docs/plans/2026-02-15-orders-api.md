# Planning — Task 07: 訂單 API

> **日期**: 2026-02-15
> **前置**: Task 06 競標 API ✅ 完成

---

## 概覽

訂單管理 API，支援線上（ONLINE）與 POS 雙通路。核心功能：建單（Transaction 原子性）、查詢（多條件篩選 + 分頁）、狀態更新、付款狀態更新、取消（恢復商品狀態）。

---

## 現有資源盤點

### Prisma Schema（已存在，不需 migration）

- `Order` model：orderNumber / buyer / 金額（subtotal, shippingFee, discountAmount, finalAmount）/ 付款 / 配送 / 狀態 / 通路
- `OrderItem` model：orderId / productId / productName / productPrice / sellerId
- Enums：`OrderStatus`（PENDING, PROCESSING, SHIPPED, COMPLETED, CANCELLED）/ `OrderChannel`（ONLINE, POS）/ `PaymentMethod`（CASH, CREDIT_CARD, LINE_PAY, TRANSFER）/ `PaymentStatus`（PENDING, PAID, FAILED, REFUNDED）/ `ShippingMethod`（SEVEN_ELEVEN, FAMILY_MART, FACE_TO_FACE, IN_STORE）

### 可複用模式（從 products/auctions 模組）

- Zod schema 慣例：`import { z } from 'zod/v4'`，querystring 用 `z.coerce.number()`
- Service 類別：`constructor(private prisma: PrismaClient)`
- Routes 慣例：無 try/catch（交給 errorHandler），`successResponse` / `errorResponse` helper
- Module export：`index.ts` barrel file
- 測試模式：`buildServer()` + `server.inject()`（routes test）/ 直接 PrismaClient（service test）

---

## API 端點設計

| Method  | Path                      | Auth | 說明                                                                     |
| ------- | ------------------------- | ---- | ------------------------------------------------------------------------ |
| `POST`  | `/api/orders`             | ✅   | 建立訂單（Transaction：驗證商品 → 算金額 → 建單 → 建項目 → 商品改 SOLD） |
| `GET`   | `/api/orders`             | ✅   | 查詢訂單列表（status / channel / 日期範圍 / search + 分頁）              |
| `GET`   | `/api/orders/:id`         | ✅   | 查詢單一訂單（含 items + buyer）                                         |
| `PATCH` | `/api/orders/:id/status`  | ✅   | 更新訂單狀態（附帶 trackingNumber）                                      |
| `PATCH` | `/api/orders/:id/payment` | ✅   | 更新付款狀態（附帶 transactionId）                                       |
| `PUT`   | `/api/orders/:id/cancel`  | ✅   | 取消訂單（Transaction：改狀態 + 恢復商品 LISTED）                        |

> 與 task doc 差異：所有端點都需要認證（admin/staff 操作），不存在匿名建單場景（POS 也是員工操作）。

---

## 關鍵設計決策

### 1. 訂單編號生成

- 格式：`ORD{YYYYMMDD}{3位序號}`，例如 `ORD20260215001`
- 實作：Transaction 內查當日最後一筆 → 序號 +1
- 併發安全：Transaction 隔離 + orderNumber UNIQUE constraint 保底

### 2. 金額計算

- `subtotal` = 所有商品 sellingPrice 加總
- `shippingFee` = 依 shippingMethod 查表（超商 60, 面交/自取 0）
- `finalAmount` = subtotal + shippingFee - discountAmount
- 全部用 Prisma Decimal，避免浮點誤差

### 3. 訂單狀態流轉

```
PENDING → PROCESSING → SHIPPED → COMPLETED
    ↓
CANCELLED（僅 PENDING 可取消）
```

- updateOrderStatus 應加狀態轉換驗證（不能從 COMPLETED 回到 PENDING）

### 4. 付款狀態

```
PENDING → PAID（成功）
    ↓
FAILED（失敗，可重試 → PAID）
PAID → REFUNDED（退款）
```

- CASH 付款建單時直接設 PAID + paidAt

### 5. 取消訂單

- 僅 PENDING 狀態可取消（已出貨不能取消）
- Transaction 內：Order → CANCELLED + 所有 items 的 Product → LISTED

---

## Mission 拆分

### Mission A: Schema + Service + Service Test（4 檔）

| #   | 檔案                                           | 說明                                                    |
| --- | ---------------------------------------------- | ------------------------------------------------------- |
| 1   | `src/modules/orders/orders.schema.ts`          | Zod v4 schemas（Create, Query, Update, Cancel, Params） |
| 2   | `src/modules/orders/order-number-generator.ts` | 訂單編號生成器                                          |
| 3   | `src/modules/orders/orders.service.ts`         | Service 類（6 個方法）                                  |
| 4   | `tests/modules/orders/orders.service.test.ts`  | Service 單元測試                                        |

**Service 方法清單**:

- `createOrder(data, buyerId)` — Transaction
- `getOrderById(id)` — include items + buyer
- `getOrders(query)` — 多條件篩選 + 分頁
- `updateOrderStatus(id, data)` — 含狀態轉換驗證
- `updatePaymentStatus(id, status, transactionId?)` — 含 paidAt 時間戳
- `cancelOrder(id)` — Transaction，僅 PENDING 可取消

**Service Test 覆蓋**:

- 建單成功 + 商品狀態變 SOLD
- 建單失敗：商品不存在 / 已售出 / 未上架
- 多商品建單
- 訂單編號格式 + 連續遞增
- 查詢 + 分頁
- 狀態更新（合法轉換 + 非法轉換拋錯）
- 付款狀態更新
- 取消 + 商品恢復 LISTED
- 取消已出貨訂單應拋錯
- 運費計算

### Mission B: Routes + 整合 + Routes Test（4 檔）

| #   | 檔案                                         | 說明               |
| --- | -------------------------------------------- | ------------------ |
| 1   | `src/modules/orders/orders.routes.ts`        | 6 個 REST 端點     |
| 2   | `src/modules/orders/index.ts`                | barrel export      |
| 3   | `src/server.ts`                              | 註冊 orders routes |
| 4   | `tests/modules/orders/orders.routes.test.ts` | Routes 整合測試    |

**Routes Test 覆蓋**:

- POST /orders — 201 成功 / 400 驗證失敗 / 401 未授權
- GET /orders — 200 列表 + 分頁
- GET /orders/:id — 200 成功 / 404 不存在
- PATCH /orders/:id/status — 200 成功
- PATCH /orders/:id/payment — 200 成功
- PUT /orders/:id/cancel — 200 成功 / 401 未授權

---

## 預期測試數量

- Mission A：~15 service tests
- Mission B：~10 routes tests
- 累計（含現有 77）：~102 tests

---

## 風險與注意事項

1. **訂單編號併發**：Transaction 隔離 + UNIQUE constraint 雙重保障，MVP 可接受
2. **狀態轉換驗證**：task doc 沒提，但必須加（防止非法狀態轉換）
3. **取消限制**：task doc 沒限制取消條件，但合理做法是僅 PENDING 可取消
4. **Decimal 比較**：測試中要用 `.toNumber()` 轉換後再比較
5. **Product images 欄位存在**：已確認 Product model 有 `images Json @default("[]")`
