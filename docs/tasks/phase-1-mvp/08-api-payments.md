# 08 - 金流 API 開發

**階段**: 第一階段 MVP - Sprint 3
**預計時間**: 3 天
**負責人**: TBD
**優先級**: 🔴 Critical

---

## 📋 目標

建立金流處理 API 基礎架構，包含付款狀態管理、交易記錄、回調處理框架等，並為綠界 ECPay 整合預留接口。

## 🎯 成功標準

- [ ] 付款狀態更新 API 正常運作
- [ ] 交易記錄完整且可查詢
- [ ] 回調處理框架建立完成
- [ ] CheckMacValue 驗證機制實作
- [ ] 現金付款流程正常
- [ ] 單元測試覆蓋率 > 80%
- [ ] API 整合測試通過

## 📦 前置條件

**前置任務**:

- [x] 04 - API 基礎架構完成
- [x] 07 - 訂單 API 完成

**技術需求**:

- Node.js 內建 `crypto` 模組（SHA256 HMAC 驗證，不需額外安裝 crypto-js）

**技術環境**:

- Fastify v5 + Zod v4 + Prisma v6
- ESM（所有 import 須加 `.js` 副檔名）

---

## ⚠️ 勘誤（與現有 codebase 不一致之處）

> 以下程式碼區塊保留原貌作為參考，實際實作時請依本勘誤修正。

### A. Zod 相關

| 原始寫法                  | 正確寫法                     | 說明                                    |
| ------------------------- | ---------------------------- | --------------------------------------- |
| `import { z } from 'zod'` | `import { z } from 'zod/v4'` | 專案統一 Zod v4                         |
| `z.infer<typeof Schema>`  | `z.infer<typeof Schema>`     | 寫法相同，但確保 import 來源為 `zod/v4` |

### B. Prisma / Import 相關

| 原始寫法                                                    | 正確寫法                                                                           | 說明                             |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------- |
| `import { PrismaClient, PaymentLog } from '@prisma/client'` | `import type { PrismaClient, PaymentLog } from '../../generated/prisma/client.js'` | 使用本地生成路徑 + `import type` |
| `import { Prisma } from '@prisma/client'`                   | `import { Prisma } from '../../generated/prisma/client.js'`                        | 需要 runtime value 時不加 type   |
| `import ... from './payments.schema'`                       | `import ... from './payments.schema.js'`                                           | ESM 須加 `.js` 副檔名            |
| `import ... from '@/utils/response'`                        | `import { successResponse, errorResponse } from '../../utils/response.js'`         | 無 `@/` alias，用相對路徑        |
| `import ... from '@/config'`                                | `import { config } from '../../config/index.js'`                                   | 同上                             |
| `import ... from '@/modules/...'`                           | 相對路徑 + `.js`                                                                   | 同上                             |

### C. 邏輯 / 模式相關

| 原始寫法                                            | 正確寫法                                                        | 說明                                        |
| --------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------- |
| `import { FastifyPluginAsync } from 'fastify'`      | `import type { FastifyPluginAsync } from 'fastify'`             | 純型別用 `import type`                      |
| Routes 內 `try/catch` + `reply.code(500)`           | 移除 try/catch，讓 error 拋到全域 errorHandler                  | 與 products/auctions/orders routes 一致     |
| `throw new Error('...')`                            | `throw this.httpError(statusCode, '...')`                       | Service 用 httpError helper 附加 statusCode |
| `const prisma = new PrismaClient()` (測試)          | `buildTestServer()` + `server.prisma`                           | 測試統一用 buildTestServer pattern          |
| `import CryptoJS from 'crypto-js'`                  | `import { createHash } from 'node:crypto'`                      | 使用 Node.js 內建 crypto，不裝 crypto-js    |
| `schema: { body: UpdatePaymentStatusSchema }` (Zod) | 需轉為 JSON Schema 物件或用 Zod schema 的 `.shape` 搭配 Swagger | Fastify native schema 是 JSON Schema        |
| barrel export 缺失                                  | 需建 `index.ts` 做 barrel export                                | 與 products/auctions/orders 一致            |

### D. ECPay 回調端點特殊處理

- ECPay callback (`POST /ecpay/callback`) **不需認證**，但回應格式必須是純文字 `1|OK` 或 `0|Error`
- 此端點的 try/catch 是**合理的**（因為需要確保任何錯誤都回應 `0|Error` 給綠界），不適用全域 errorHandler

### E. 新增資料表

- PaymentLog model 尚未存在於 `prisma/schema.prisma`，需新增並執行 migration
- 需在 Order model 加上 `paymentLogs PaymentLog[]` relation

---

## ✅ 子任務清單

### 8.1 資料驗證 Schema

#### 8.1.1 建立 Zod Schema

- [ ] 建立 `src/modules/payments/payments.schema.ts`

  ```typescript
  import { z } from 'zod'

  export const UpdatePaymentStatusSchema = z.object({
    orderId: z.string().uuid(),
    status: z.enum(['PAID', 'FAILED', 'REFUNDED']),
    transactionId: z.string().optional(),
    paidAmount: z.number().positive().optional(),
    paidAt: z.string().datetime().optional(),
  })

  export const ECPayCallbackSchema = z.object({
    MerchantID: z.string(),
    MerchantTradeNo: z.string(),
    RtnCode: z.string(),
    RtnMsg: z.string(),
    TradeNo: z.string(),
    TradeAmt: z.string(),
    PaymentDate: z.string(),
    PaymentType: z.string(),
    CheckMacValue: z.string(),
    // 其他綠界回傳欄位...
  })

  export const CreatePaymentLogSchema = z.object({
    orderId: z.string().uuid(),
    provider: z.enum(['ECPAY', 'MANUAL', 'CASH']),
    method: z.string(),
    amount: z.number().positive(),
    status: z.enum(['PENDING', 'SUCCESS', 'FAILED']),
    transactionId: z.string().optional(),
    requestData: z.record(z.unknown()).optional(),
    responseData: z.record(z.unknown()).optional(),
  })

  export type UpdatePaymentStatusInput = z.infer<typeof UpdatePaymentStatusSchema>
  export type ECPayCallbackInput = z.infer<typeof ECPayCallbackSchema>
  export type CreatePaymentLogInput = z.infer<typeof CreatePaymentLogSchema>
  ```

---

### 8.2 資料表設計

#### 8.2.1 建立 PaymentLogs 表

- [ ] 編輯 `prisma/schema.prisma`

  ```prisma
  model PaymentLog {
    id String @id @default(uuid())

    orderId String
    order Order @relation(fields: [orderId], references: [id])

    // 金流資訊
    provider PaymentProvider  // ECPAY, MANUAL, CASH
    method String             // CREDIT_CARD, LINE_PAY, CASH, TRANSFER
    amount Decimal @db.Decimal(10, 2)
    status PaymentLogStatus   // PENDING, SUCCESS, FAILED

    // 交易資訊
    transactionId String?

    // 請求與回應記錄
    requestData Json?
    responseData Json?

    // 錯誤資訊
    errorCode String?
    errorMessage String?

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@index([orderId])
    @@index([transactionId])
    @@map("payment_logs")
  }

  enum PaymentProvider {
    ECPAY
    MANUAL
    CASH
  }

  enum PaymentLogStatus {
    PENDING
    SUCCESS
    FAILED
  }
  ```

- [ ] 執行遷移
  ```bash
  pnpm exec prisma migrate dev --name add_payment_logs
  ```

---

### 8.3 Service 層

#### 8.3.1 建立 Payments Service

- [ ] 建立 `src/modules/payments/payments.service.ts`

  ```typescript
  import { PrismaClient, PaymentLog } from '@prisma/client'
  import type { UpdatePaymentStatusInput, CreatePaymentLogInput } from './payments.schema'

  export class PaymentsService {
    constructor(private prisma: PrismaClient) {}

    async createPaymentLog(data: CreatePaymentLogInput): Promise<PaymentLog> {
      const log = await this.prisma.paymentLog.create({
        data,
      })
      return log
    }

    async updatePaymentStatus(data: UpdatePaymentStatusInput): Promise<void> {
      const { orderId, status, transactionId, paidAmount, paidAt } = data

      await this.prisma.$transaction(async (tx) => {
        // 1. 更新訂單付款狀態
        const updateData: Record<string, unknown> = {
          paymentStatus: status,
        }

        if (status === 'PAID') {
          updateData.paidAt = paidAt ? new Date(paidAt) : new Date()
          if (transactionId) {
            updateData.paymentTransactionId = transactionId
          }
        }

        await tx.order.update({
          where: { id: orderId },
          data: updateData,
        })

        // 2. 建立付款記錄
        const order = await tx.order.findUnique({
          where: { id: orderId },
        })

        if (order) {
          await tx.paymentLog.create({
            data: {
              orderId,
              provider: 'MANUAL',
              method: order.paymentMethod,
              amount: paidAmount || order.finalAmount,
              status: status === 'PAID' ? 'SUCCESS' : 'FAILED',
              transactionId,
            },
          })
        }
      })
    }

    async getPaymentLogsByOrderId(orderId: string): Promise<PaymentLog[]> {
      const logs = await this.prisma.paymentLog.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
      })
      return logs
    }

    async processCashPayment(orderId: string): Promise<void> {
      await this.prisma.$transaction(async (tx) => {
        // 更新訂單為已付款
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'PAID',
            paidAt: new Date(),
          },
        })

        // 建立現金付款記錄
        const order = await tx.order.findUnique({
          where: { id: orderId },
        })

        if (order) {
          await tx.paymentLog.create({
            data: {
              orderId,
              provider: 'CASH',
              method: 'CASH',
              amount: order.finalAmount,
              status: 'SUCCESS',
            },
          })
        }
      })
    }

    async handleECPayCallback(callbackData: Record<string, unknown>): Promise<void> {
      // 此方法在綠界整合時完整實作（任務 19）
      // 這裡先預留框架

      const { MerchantTradeNo, RtnCode, TradeNo, TradeAmt } = callbackData as {
        MerchantTradeNo: string
        RtnCode: string
        TradeNo: string
        TradeAmt: string
      }

      // 1. 驗證 CheckMacValue（防止偽造）
      // const isValid = this.verifyCheckMacValue(callbackData)
      // if (!isValid) throw new Error('Invalid CheckMacValue')

      // 2. 根據訂單編號查詢訂單
      const order = await this.prisma.order.findUnique({
        where: { orderNumber: MerchantTradeNo },
      })

      if (!order) {
        throw new Error('Order not found')
      }

      // 3. 更新訂單付款狀態
      const status = RtnCode === '1' ? 'PAID' : 'FAILED'

      await this.updatePaymentStatus({
        orderId: order.id,
        status,
        transactionId: TradeNo,
        paidAmount: parseFloat(TradeAmt),
        paidAt: new Date().toISOString(),
      })

      // 4. 記錄完整的回調資料
      await this.prisma.paymentLog.create({
        data: {
          orderId: order.id,
          provider: 'ECPAY',
          method: 'CREDIT_CARD',
          amount: parseFloat(TradeAmt),
          status: RtnCode === '1' ? 'SUCCESS' : 'FAILED',
          transactionId: TradeNo,
          responseData: callbackData,
        },
      })
    }

    // 預留：驗證綠界 CheckMacValue
    private verifyCheckMacValue(data: Record<string, unknown>): boolean {
      // 在任務 19 實作
      return true
    }
  }
  ```

---

### 8.4 工具函數

#### 8.4.1 建立 CheckMacValue 驗證工具

- [ ] 建立 `src/utils/ecpay-validator.ts`（使用 Node.js 內建 `crypto`，無需安裝 crypto-js）

  ```typescript
  import CryptoJS from 'crypto-js'
  import { config } from '@/config'

  export function generateCheckMacValue(params: Record<string, string>): string {
    // 1. 過濾掉 CheckMacValue 欄位
    const filteredParams = Object.keys(params)
      .filter((key) => key !== 'CheckMacValue')
      .reduce(
        (obj, key) => {
          obj[key] = params[key]
          return obj
        },
        {} as Record<string, string>
      )

    // 2. 依照字母順序排序
    const sortedKeys = Object.keys(filteredParams).sort()

    // 3. 組合成 key1=value1&key2=value2... 格式
    const paramString = sortedKeys.map((key) => `${key}=${filteredParams[key]}`).join('&')

    // 4. 前後加上 HashKey 和 HashIV
    const rawString = `HashKey=${config.ECPAY_HASH_KEY}&${paramString}&HashIV=${config.ECPAY_HASH_IV}`

    // 5. URL encode
    const encodedString = encodeURIComponent(rawString).toLowerCase()

    // 6. SHA256 hash
    const hash = CryptoJS.SHA256(encodedString).toString()

    // 7. 轉大寫
    return hash.toUpperCase()
  }

  export function verifyCheckMacValue(data: Record<string, string>): boolean {
    const receivedCheckMacValue = data.CheckMacValue
    const calculatedCheckMacValue = generateCheckMacValue(data)

    return receivedCheckMacValue === calculatedCheckMacValue
  }
  ```

---

### 8.5 Routes 層

#### 8.5.1 建立 Payments Routes

- [ ] 建立 `src/modules/payments/payments.routes.ts`

  ```typescript
  import { FastifyPluginAsync } from 'fastify'
  import { PaymentsService } from './payments.service'
  import { UpdatePaymentStatusSchema, ECPayCallbackSchema } from './payments.schema'
  import { successResponse, errorResponse } from '@/utils/response'
  import { verifyCheckMacValue } from '@/utils/ecpay-validator'

  const paymentsRoutes: FastifyPluginAsync = async (server) => {
    const paymentsService = new PaymentsService(server.prisma)

    // POST /payments/status - 更新付款狀態（需認證）
    server.post(
      '/status',
      {
        onRequest: [server.authenticate],
        schema: {
          body: UpdatePaymentStatusSchema,
        },
      },
      async (request, reply) => {
        try {
          const data = UpdatePaymentStatusSchema.parse(request.body)
          await paymentsService.updatePaymentStatus(data)

          return reply.send(successResponse({ message: '付款狀態已更新' }))
        } catch (error) {
          server.log.error(error)
          return reply.code(500).send(errorResponse('INTERNAL_ERROR', '更新付款狀態失敗'))
        }
      }
    )

    // POST /payments/cash - 現金付款（需認證，POS 使用）
    server.post(
      '/cash',
      {
        onRequest: [server.authenticate],
      },
      async (request, reply) => {
        try {
          const { orderId } = request.body as { orderId: string }

          if (!orderId) {
            return reply.code(400).send(errorResponse('BAD_REQUEST', '缺少訂單 ID'))
          }

          await paymentsService.processCashPayment(orderId)

          return reply.send(successResponse({ message: '現金付款處理成功' }))
        } catch (error) {
          server.log.error(error)
          return reply.code(500).send(errorResponse('INTERNAL_ERROR', '處理現金付款失敗'))
        }
      }
    )

    // POST /payments/ecpay/callback - 綠界回調（無需認證）
    server.post('/ecpay/callback', async (request, reply) => {
      try {
        const callbackData = request.body as Record<string, string>

        server.log.info('ECPay callback received:', callbackData)

        // 驗證 CheckMacValue
        const isValid = verifyCheckMacValue(callbackData)

        if (!isValid) {
          server.log.error('Invalid CheckMacValue')
          return reply.send('0|Invalid CheckMacValue')
        }

        // 處理回調
        await paymentsService.handleECPayCallback(callbackData)

        // 綠界要求回應 "1|OK"
        return reply.send('1|OK')
      } catch (error) {
        server.log.error('ECPay callback error:', error)
        return reply.send('0|Error')
      }
    })

    // GET /payments/logs/:orderId - 查詢訂單付款記錄（需認證）
    server.get(
      '/logs/:orderId',
      {
        onRequest: [server.authenticate],
      },
      async (request, reply) => {
        try {
          const { orderId } = request.params as { orderId: string }
          const logs = await paymentsService.getPaymentLogsByOrderId(orderId)

          return reply.send(successResponse(logs))
        } catch (error) {
          server.log.error(error)
          return reply.code(500).send(errorResponse('INTERNAL_ERROR', '查詢付款記錄失敗'))
        }
      }
    )

    // POST /payments/ecpay/create - 建立綠界訂單（預留，任務 19 實作）
    server.post(
      '/ecpay/create',
      {
        onRequest: [server.authenticate],
      },
      async (request, reply) => {
        return reply.code(501).send(errorResponse('NOT_IMPLEMENTED', '功能尚未實作，請等待任務 19'))
      }
    )
  }

  export default paymentsRoutes
  ```

#### 8.5.2 整合到主 server

- [ ] 編輯 `src/server.ts`

  ```typescript
  import paymentsRoutes from './modules/payments/payments.routes'

  await server.register(paymentsRoutes, { prefix: '/api/payments' })
  ```

---

### 8.6 測試

#### 8.6.1 單元測試

- [ ] 建立 `tests/modules/payments/payments.service.test.ts`

  ```typescript
  import { describe, it, expect, beforeEach, afterEach } from 'vitest'
  import { PrismaClient } from '@prisma/client'
  import { PaymentsService } from '@/modules/payments/payments.service'

  const prisma = new PrismaClient()
  const paymentsService = new PaymentsService(prisma)

  describe('PaymentsService', () => {
    let testOrderId: string

    beforeEach(async () => {
      // 建立測試訂單
      const product = await prisma.product.create({
        data: {
          type: 'CARD',
          category: '測試',
          name: '測試商品',
          costPrice: 100,
          sellingPrice: 300,
          channel: 'BOTH',
          description: '測試',
          status: 'LISTED',
        },
      })

      const order = await prisma.order.create({
        data: {
          orderNumber: 'TEST001',
          subtotal: 300,
          finalAmount: 300,
          paymentMethod: 'CREDIT_CARD',
          paymentStatus: 'PENDING',
          shippingMethod: 'SEVEN_ELEVEN',
          status: 'PENDING',
          channel: 'ONLINE',
        },
      })

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          productName: product.name,
          productPrice: product.sellingPrice,
        },
      })

      testOrderId = order.id
    })

    afterEach(async () => {
      await prisma.paymentLog.deleteMany()
      await prisma.orderItem.deleteMany()
      await prisma.order.deleteMany()
      await prisma.product.deleteMany()
    })

    describe('updatePaymentStatus', () => {
      it('should update order payment status to PAID', async () => {
        await paymentsService.updatePaymentStatus({
          orderId: testOrderId,
          status: 'PAID',
          transactionId: 'TXN123',
        })

        const order = await prisma.order.findUnique({
          where: { id: testOrderId },
        })

        expect(order?.paymentStatus).toBe('PAID')
        expect(order?.paymentTransactionId).toBe('TXN123')
        expect(order?.paidAt).toBeDefined()
      })

      it('should create payment log', async () => {
        await paymentsService.updatePaymentStatus({
          orderId: testOrderId,
          status: 'PAID',
          transactionId: 'TXN123',
        })

        const logs = await prisma.paymentLog.findMany({
          where: { orderId: testOrderId },
        })

        expect(logs).toHaveLength(1)
        expect(logs[0].status).toBe('SUCCESS')
      })
    })

    describe('processCashPayment', () => {
      it('should process cash payment', async () => {
        await paymentsService.processCashPayment(testOrderId)

        const order = await prisma.order.findUnique({
          where: { id: testOrderId },
        })

        expect(order?.paymentStatus).toBe('PAID')

        const logs = await prisma.paymentLog.findMany({
          where: { orderId: testOrderId },
        })

        expect(logs).toHaveLength(1)
        expect(logs[0].provider).toBe('CASH')
      })
    })
  })
  ```

#### 8.6.2 CheckMacValue 驗證測試

- [ ] 建立 `tests/utils/ecpay-validator.test.ts`

  ```typescript
  import { describe, it, expect } from 'vitest'
  import { generateCheckMacValue, verifyCheckMacValue } from '@/utils/ecpay-validator'

  describe('ECPay Validator', () => {
    it('should generate correct CheckMacValue', () => {
      const params = {
        MerchantID: 'TEST123',
        MerchantTradeNo: 'ORD20260124001',
        TradeAmt: '1000',
      }

      const checkMacValue = generateCheckMacValue(params)

      expect(checkMacValue).toBeDefined()
      expect(typeof checkMacValue).toBe('string')
      expect(checkMacValue.length).toBe(64) // SHA256 length
    })

    it('should verify CheckMacValue correctly', () => {
      const params = {
        MerchantID: 'TEST123',
        MerchantTradeNo: 'ORD20260124001',
        TradeAmt: '1000',
      }

      const checkMacValue = generateCheckMacValue(params)

      const dataWithCheckMac = {
        ...params,
        CheckMacValue: checkMacValue,
      }

      const isValid = verifyCheckMacValue(dataWithCheckMac)

      expect(isValid).toBe(true)
    })

    it('should reject invalid CheckMacValue', () => {
      const dataWithInvalidCheckMac = {
        MerchantID: 'TEST123',
        MerchantTradeNo: 'ORD20260124001',
        TradeAmt: '1000',
        CheckMacValue: 'INVALID_HASH',
      }

      const isValid = verifyCheckMacValue(dataWithInvalidCheckMac)

      expect(isValid).toBe(false)
    })
  })
  ```

---

## 🧪 測試步驟

1. **現金付款測試**
   - 建立訂單（付款方式：CASH）
   - 呼叫現金付款 API
   - 驗證訂單狀態更新
   - 驗證付款記錄建立

2. **CheckMacValue 測試**
   - 測試生成 CheckMacValue
   - 測試驗證正確的 CheckMacValue
   - 測試驗證錯誤的 CheckMacValue

3. **回調處理測試**
   - 模擬綠界回調（成功）
   - 模擬綠界回調（失敗）
   - 驗證訂單狀態更新

4. **付款記錄查詢測試**
   - 查詢訂單的所有付款記錄
   - 驗證記錄完整性

---

## 📝 交付物

- [ ] `src/modules/payments/payments.schema.ts`
- [ ] `src/modules/payments/payments.service.ts`
- [ ] `src/modules/payments/payments.routes.ts`
- [ ] `src/utils/ecpay-validator.ts`
- [ ] `prisma/schema.prisma`（PaymentLog model）
- [ ] 遷移檔案
- [ ] 單元測試

---

## 🚨 注意事項

1. **CheckMacValue 驗證**: 必須嚴格驗證，防止偽造回調
2. **回調冪等性**: 綠界可能重複發送回調，需處理冪等性
3. **日誌記錄**: 所有金流操作都必須記錄完整日誌
4. **錯誤處理**: 回調失敗時需記錄錯誤，但仍回應綠界
5. **金額驗證**: 回調金額必須與訂單金額一致

---

## 🔗 相關文件

- [綠界 ECPay API 文檔](https://www.ecpay.com.tw/Service/API_Dwnld)
- [系統架構設計 - 金流模組](../plans/2026-01-24-system-architecture-design.md#64-金流整合)

---

## 📊 進度追蹤

| 子任務       | 狀態    | 負責人 | 完成日期   |
| ------------ | ------- | ------ | ---------- |
| 8.1 Schema   | ✅ 完成 | Codex  | 2026-02-15 |
| 8.2 資料表   | ✅ 完成 | Codex  | 2026-02-15 |
| 8.3 Service  | ✅ 完成 | Codex  | 2026-02-15 |
| 8.4 工具函數 | ✅ 完成 | Codex  | 2026-02-15 |
| 8.5 Routes   | ✅ 完成 | Codex  | 2026-02-15 |
| 8.6 測試     | ✅ 完成 | Codex  | 2026-02-15 |

---

## 🔀 Multi-Mission 分割

| Mission | 範圍                                                             | 新增/修改檔案                            | 測試數(預估)             |
| ------- | ---------------------------------------------------------------- | ---------------------------------------- | ------------------------ |
| A       | Schema + PaymentLog migration + Service + ecpay-validator + Test | 5 new + 2 modify (schema.prisma, config) | ✅ 12 tests (2026-02-15) |
| B       | Routes + barrel export + server 整合 + Routes Test               | 3 new + 1 modify (server.ts)             | ✅ 8 tests (2026-02-15)  |

---

**上一個任務**: [07 - 訂單 API](./07-api-orders.md)
**下一個任務**: [09 - 報表分析 API](./09-api-analytics.md)
**相關任務**: [19 - 綠界 ECPay 整合](./19-third-party-ecpay.md)（完整實作）
