# Task 19: 綠界 ECPay 整合

## 概述

整合綠界 ECPay 金流服務（信用卡、LINE Pay）與超商物流服務（7-11、全家），處理付款回調、訂單狀態更新與物流單建立。

## 依賴

- Task 08: Payments API（付款 API 已建立，含 CheckMacValue 驗證）
- Task 13: Buyer Web Cart（結帳流程已建立）

---

## 一、申請綠界帳號與設定

### 1.1 註冊綠界帳號

1. 前往 [綠界科技](https://www.ecpay.com.tw/) 註冊帳號
2. 申請測試商店（Stage 環境）
3. 取得以下金鑰：
   - **MerchantID**：特店編號
   - **HashKey**：雜湊金鑰
   - **HashIV**：雜湊向量

### 1.2 環境變數設定

```bash
# apps/api/.env

# 綠界 ECPay 設定（測試環境）
ECPAY_MERCHANT_ID=2000132
ECPAY_HASH_KEY=5294y06JbISpM5x9
ECPAY_HASH_IV=v77hoKGq4kWxNNIS
ECPAY_PAYMENT_URL=https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5
ECPAY_LOGISTICS_URL=https://logistics-stage.ecpay.com.tw/Express/Create

# 回調 URL（需公開網址，開發時使用 ngrok）
ECPAY_RETURN_URL=https://your-domain.com/api/ecpay/callback
ECPAY_ORDER_RESULT_URL=https://your-domain.com/api/ecpay/order-result
ECPAY_LOGISTICS_CALLBACK_URL=https://your-domain.com/api/ecpay/logistics-callback
```

---

## 二、ECPay 工具函式

### 2.1 ECPay Service（擴充 Task 08）

```typescript
// apps/api/src/services/ecpay.service.ts

import { createHash } from 'crypto'
import axios from 'axios'

export interface ECPayPaymentParams {
  MerchantTradeNo: string // 訂單編號
  MerchantTradeDate: string // 交易時間
  TotalAmount: number // 交易金額
  TradeDesc: string // 交易描述
  ItemName: string // 商品名稱
  ReturnURL: string // 付款結果通知 URL
  OrderResultURL: string // 付款完成導向 URL
  ChoosePayment: 'Credit' | 'WebATM' | 'ATM' | 'CVS' | 'BARCODE' | 'ALL'
  EncryptType: 1 // 固定使用 SHA256
}

export interface ECPayLogisticsParams {
  MerchantTradeNo: string // 訂單編號
  MerchantTradeDate: string // 交易時間
  LogisticsType: 'CVS' // 超商類型
  LogisticsSubType: 'FAMI' | 'UNIMART' // 全家 | 7-11
  GoodsAmount: number // 商品金額
  GoodsName: string // 商品名稱
  SenderName: string // 寄件人姓名
  SenderCellPhone: string // 寄件人手機
  ReceiverName: string // 收件人姓名
  ReceiverCellPhone: string // 收件人手機
  ReceiverStoreID: string // 門市代號
  ServerReplyURL: string // 物流狀態通知 URL
}

export class ECPayService {
  private merchantID: string
  private hashKey: string
  private hashIV: string
  private paymentURL: string
  private logisticsURL: string

  constructor() {
    this.merchantID = process.env.ECPAY_MERCHANT_ID!
    this.hashKey = process.env.ECPAY_HASH_KEY!
    this.hashIV = process.env.ECPAY_HASH_IV!
    this.paymentURL = process.env.ECPAY_PAYMENT_URL!
    this.logisticsURL = process.env.ECPAY_LOGISTICS_URL!
  }

  /**
   * 產生 CheckMacValue（與 Task 08 共用邏輯）
   */
  generateCheckMacValue(params: Record<string, string | number>): string {
    // 1. 過濾 CheckMacValue 欄位
    const filtered = Object.entries(params)
      .filter(([key]) => key !== 'CheckMacValue')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

    // 2. 依照 key 排序
    const sorted = Object.keys(filtered)
      .sort()
      .reduce((acc, key) => ({ ...acc, [key]: filtered[key] }), {})

    // 3. 組成查詢字串
    const queryString = Object.entries(sorted)
      .map(([key, value]) => `${key}=${value}`)
      .join('&')

    // 4. 加上 HashKey 與 HashIV
    const rawString = `HashKey=${this.hashKey}&${queryString}&HashIV=${this.hashIV}`

    // 5. URL Encode（特殊處理）
    const encoded = encodeURIComponent(rawString)
      .replace(/%20/g, '+')
      .toLowerCase()

    // 6. SHA256 加密並轉大寫
    const hash = createHash('sha256').update(encoded).digest('hex')
    return hash.toUpperCase()
  }

  /**
   * 驗證 CheckMacValue
   */
  verifyCheckMacValue(params: Record<string, string>): boolean {
    const receivedCheckMacValue = params.CheckMacValue
    const calculatedCheckMacValue = this.generateCheckMacValue(params)
    return receivedCheckMacValue === calculatedCheckMacValue
  }

  /**
   * 建立付款訂單
   */
  createPayment(params: ECPayPaymentParams): { url: string; formData: Record<string, string> } {
    const paymentParams = {
      MerchantID: this.merchantID,
      ...params,
    }

    const checkMacValue = this.generateCheckMacValue(paymentParams)

    const formData = {
      ...paymentParams,
      CheckMacValue: checkMacValue,
    }

    return {
      url: this.paymentURL,
      formData: Object.entries(formData).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: String(value),
      }), {}),
    }
  }

  /**
   * 建立超商物流訂單
   */
  async createLogistics(params: ECPayLogisticsParams): Promise<{
    AllPayLogisticsID: string
    CVSPaymentNo: string
    CVSValidationNo: string
  }> {
    const logisticsParams = {
      MerchantID: this.merchantID,
      ...params,
      IsCollection: 'N', // 是否代收貨款
      Temperature: '0001', // 常溫
      Distance: '00', // 距離
      Specification: '0001', // 規格
      ScheduledPickupTime: '4', // 預定取件時段
    }

    const checkMacValue = this.generateCheckMacValue(logisticsParams)

    const formData = {
      ...logisticsParams,
      CheckMacValue: checkMacValue,
    }

    try {
      const response = await axios.post(this.logisticsURL, new URLSearchParams(formData as Record<string, string>), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      // 解析回傳的 Query String
      const result = new URLSearchParams(response.data)
      return {
        AllPayLogisticsID: result.get('AllPayLogisticsID') || '',
        CVSPaymentNo: result.get('CVSPaymentNo') || '',
        CVSValidationNo: result.get('CVSValidationNo') || '',
      }
    } catch (error) {
      console.error('ECPay Logistics Error:', error)
      throw new Error('建立物流訂單失敗')
    }
  }
}
```

---

## 三、API Routes

### 3.1 ECPay Callback Routes

```typescript
// apps/api/src/routes/ecpay.routes.ts

import { FastifyInstance } from 'fastify'
import { ECPayService } from '../services/ecpay.service'
import { PrismaClient, PaymentStatus, OrderStatus } from '@prisma/client'

export async function ecpayRoutes(fastify: FastifyInstance) {
  const ecpayService = new ECPayService()
  const prisma = new PrismaClient()

  /**
   * POST /api/ecpay/callback - 付款結果通知（綠界回調）
   */
  fastify.post('/callback', async (request, reply) => {
    const params = request.body as Record<string, string>

    // 驗證 CheckMacValue
    if (!ecpayService.verifyCheckMacValue(params)) {
      fastify.log.error('Invalid CheckMacValue:', params)
      return reply.code(400).send('0|CheckMacValue verification failed')
    }

    const {
      MerchantTradeNo, // 訂單編號
      RtnCode, // 付款結果代碼
      RtnMsg, // 付款結果訊息
      TradeNo, // 綠界交易編號
      TradeAmt, // 交易金額
      PaymentDate, // 付款時間
      PaymentType, // 付款方式
      PaymentTypeChargeFee, // 手續費
    } = params

    try {
      // 查詢訂單
      const order = await prisma.order.findUnique({
        where: { orderNumber: MerchantTradeNo },
      })

      if (!order) {
        fastify.log.error('Order not found:', MerchantTradeNo)
        return reply.code(404).send('0|Order not found')
      }

      // 付款成功
      if (RtnCode === '1' || RtnCode === '2') {
        await prisma.$transaction([
          // 更新訂單付款狀態
          prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: PaymentStatus.PAID,
              status: OrderStatus.CONFIRMED,
            },
          }),

          // 記錄付款日誌
          prisma.paymentLog.create({
            data: {
              orderId: order.id,
              paymentMethod: PaymentType,
              amount: parseFloat(TradeAmt),
              status: 'SUCCESS',
              transactionId: TradeNo,
              response: JSON.stringify(params),
            },
          }),
        ])

        fastify.log.info('Payment success:', MerchantTradeNo)
        return reply.send('1|OK')
      } else {
        // 付款失敗
        await prisma.paymentLog.create({
          data: {
            orderId: order.id,
            paymentMethod: PaymentType || 'UNKNOWN',
            amount: parseFloat(TradeAmt) || 0,
            status: 'FAILED',
            response: JSON.stringify(params),
            errorMessage: RtnMsg,
          },
        })

        fastify.log.warn('Payment failed:', MerchantTradeNo, RtnMsg)
        return reply.send('1|OK')
      }
    } catch (error) {
      fastify.log.error('Callback error:', error)
      return reply.code(500).send('0|Internal server error')
    }
  })

  /**
   * POST /api/ecpay/order-result - 付款完成導向（前端頁面）
   */
  fastify.post('/order-result', async (request, reply) => {
    const params = request.body as Record<string, string>

    // 驗證 CheckMacValue
    if (!ecpayService.verifyCheckMacValue(params)) {
      return reply.redirect('/cart/checkout?error=invalid_checksum')
    }

    const { MerchantTradeNo, RtnCode } = params

    if (RtnCode === '1' || RtnCode === '2') {
      // 付款成功，導向成功頁
      const order = await prisma.order.findUnique({
        where: { orderNumber: MerchantTradeNo },
      })
      return reply.redirect(`/cart/success?orderId=${order?.id}`)
    } else {
      // 付款失敗，導向錯誤頁
      return reply.redirect('/cart/checkout?error=payment_failed')
    }
  })

  /**
   * POST /api/ecpay/logistics-callback - 物流狀態通知
   */
  fastify.post('/logistics-callback', async (request, reply) => {
    const params = request.body as Record<string, string>

    // 驗證 CheckMacValue
    if (!ecpayService.verifyCheckMacValue(params)) {
      fastify.log.error('Invalid CheckMacValue:', params)
      return reply.code(400).send('0|CheckMacValue verification failed')
    }

    const {
      MerchantTradeNo,
      RtnCode,
      RtnMsg,
      AllPayLogisticsID,
      LogisticsType,
      LogisticsSubType,
      GoodsAmount,
      UpdateStatusDate,
      ReceiverName,
      ReceiverCellPhone,
      ReceiverEmail,
      ReceiverAddress,
      CVSPaymentNo,
      CVSValidationNo,
    } = params

    try {
      // 更新訂單物流資訊
      await prisma.order.update({
        where: { orderNumber: MerchantTradeNo },
        data: {
          // 可新增物流相關欄位到 Order schema
          // logisticsId: AllPayLogisticsID,
          // cvsPaymentNo: CVSPaymentNo,
          // cvsValidationNo: CVSValidationNo,
        },
      })

      fastify.log.info('Logistics callback:', MerchantTradeNo)
      return reply.send('1|OK')
    } catch (error) {
      fastify.log.error('Logistics callback error:', error)
      return reply.code(500).send('0|Internal server error')
    }
  })
}
```

### 3.2 註冊路由

```typescript
// apps/api/src/app.ts

import { ecpayRoutes } from './routes/ecpay.routes'

// ...

app.register(ecpayRoutes, { prefix: '/api/ecpay' })
```

---

## 四、前端整合（買家結帳頁）

### 4.1 更新 Checkout Page

```vue
<!-- apps/buyer-web/pages/cart/checkout.vue (擴充) -->

<template>
  <!-- ... 現有內容 ... -->

  <!-- 付款方式選擇（更新） -->
  <div class="card">
    <h2 class="font-bold text-xl mb-4">付款方式</h2>
    <div class="space-y-3">
      <label
        v-for="method in paymentMethods"
        :key="method.value"
        class="flex items-center gap-3 p-4 border rounded-md cursor-pointer"
        :class="formData.paymentMethod === method.value ? 'border-primary-600 bg-primary-50' : 'border-gray-300'"
      >
        <input
          v-model="formData.paymentMethod"
          type="radio"
          :value="method.value"
          class="w-4 h-4 text-primary-600"
        >
        <div class="flex-1">
          <p class="font-medium">{{ method.label }}</p>
          <p class="text-sm text-gray-500">{{ method.description }}</p>
        </div>
      </label>
    </div>
  </div>

  <!-- ... 其他內容 ... -->

  <!-- ECPay 付款表單（隱藏） -->
  <form
    v-if="ecpayFormData"
    ref="ecpayForm"
    :action="ecpayFormData.url"
    method="post"
    style="display: none;"
  >
    <input
      v-for="(value, key) in ecpayFormData.formData"
      :key="key"
      type="hidden"
      :name="key"
      :value="value"
    >
  </form>
</template>

<script setup lang="ts">
// ... 現有程式碼 ...

const ecpayForm = ref<HTMLFormElement | null>(null)
const ecpayFormData = ref<{ url: string; formData: Record<string, string> } | null>(null)

const paymentMethods = [
  { value: 'CASH', label: '貨到付款', description: '收到商品時付款' },
  { value: 'CREDIT_CARD', label: '信用卡', description: '綠界 ECPay 金流' },
  { value: 'LINE_PAY', label: 'LINE Pay', description: '使用 LINE Pay 付款' },
]

const handleSubmit = async (): Promise<void> => {
  if (!validateForm()) {
    return
  }

  submitting.value = true
  submitError.value = ''

  try {
    // 建立訂單
    const orderData: CreateOrderInput = {
      channel: 'ONLINE',
      items: cartStore.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      recipientName: formData.value.recipientName,
      recipientPhone: formData.value.recipientPhone,
      recipientEmail: formData.value.recipientEmail,
      shippingMethod: formData.value.shippingMethod,
      shippingAddress: formData.value.shippingAddress,
      shippingFee,
      paymentMethod: formData.value.paymentMethod,
      note: formData.value.note,
    }

    const order = await ordersApi.create(orderData)

    // 貨到付款：直接導向成功頁
    if (formData.value.paymentMethod === 'CASH') {
      cartStore.clearCart()
      router.push(`/cart/success?orderId=${order.id}`)
      return
    }

    // 信用卡 / LINE Pay：取得 ECPay 表單並自動提交
    if (formData.value.paymentMethod === 'CREDIT_CARD' || formData.value.paymentMethod === 'LINE_PAY') {
      const paymentData = await paymentsApi.createECPayPayment(order.id, {
        paymentMethod: formData.value.paymentMethod,
      })

      ecpayFormData.value = paymentData

      // 等待 DOM 更新後自動提交表單
      await nextTick()
      ecpayForm.value?.submit()
    }
  } catch (error) {
    submitError.value = handleApiError(error)
  } finally {
    submitting.value = false
  }
}
</script>
```

### 4.2 Payments API (前端)

```typescript
// apps/buyer-web/composables/usePaymentsApi.ts

export const usePaymentsApi = () => {
  const { apiFetch } = useApiClient()

  return {
    /**
     * 建立 ECPay 付款
     */
    createECPayPayment: async (
      orderId: string,
      data: { paymentMethod: string }
    ): Promise<{ url: string; formData: Record<string, string> }> => {
      return await apiFetch(`/api/payments/${orderId}/ecpay`, {
        method: 'POST',
        body: data,
      })
    },
  }
}
```

### 4.3 Payments API Route (後端)

```typescript
// apps/api/src/routes/payments.routes.ts (擴充)

/**
 * POST /api/payments/:orderId/ecpay - 建立 ECPay 付款
 */
fastify.post('/:orderId/ecpay', async (request, reply) => {
  const { orderId } = request.params as { orderId: string }
  const { paymentMethod } = request.body as { paymentMethod: string }

  const order = await fastify.prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: true },
  })

  if (!order) {
    return reply.code(404).send({ error: 'Order not found' })
  }

  const ecpayService = new ECPayService()

  // 組合商品名稱（ECPay 限制 200 字元）
  const itemNames = order.orderItems.map(item => item.product.name).join('#')
  const truncatedItemName = itemNames.length > 200 ? itemNames.substring(0, 197) + '...' : itemNames

  const paymentParams: ECPayPaymentParams = {
    MerchantTradeNo: order.orderNumber,
    MerchantTradeDate: new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14), // YYYYMMDDHHmmss
    TotalAmount: Math.round(parseFloat(order.totalAmount)), // 需為整數
    TradeDesc: '卡牌商城訂單',
    ItemName: truncatedItemName,
    ReturnURL: process.env.ECPAY_RETURN_URL!,
    OrderResultURL: process.env.ECPAY_ORDER_RESULT_URL!,
    ChoosePayment: paymentMethod === 'LINE_PAY' ? 'ALL' : 'Credit',
    EncryptType: 1,
  }

  const paymentData = ecpayService.createPayment(paymentParams)

  reply.send(paymentData)
})
```

---

## 五、超商選擇器整合

### 5.1 ECPay 超商選擇器

```typescript
// apps/api/src/routes/ecpay.routes.ts (擴充)

/**
 * GET /api/ecpay/cvs-map - 綠界超商選擇器
 */
fastify.get('/cvs-map', async (request, reply) => {
  const { LogisticsSubType, orderId } = request.query as {
    LogisticsSubType: 'FAMI' | 'UNIMART'
    orderId: string
  }

  const ecpayService = new ECPayService()

  // 產生超商選擇器 URL
  const mapParams = {
    MerchantID: process.env.ECPAY_MERCHANT_ID!,
    MerchantTradeNo: `MAP${Date.now()}`,
    LogisticsType: 'CVS',
    LogisticsSubType,
    IsCollection: 'N',
    ServerReplyURL: `${process.env.ECPAY_RETURN_URL}/cvs-callback?orderId=${orderId}`,
  }

  const checkMacValue = ecpayService.generateCheckMacValue(mapParams)

  const formData = {
    ...mapParams,
    CheckMacValue: checkMacValue,
  }

  // 返回 HTML form 自動提交
  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>超商選擇</title></head>
    <body>
      <form id="ecpay-form" action="https://logistics-stage.ecpay.com.tw/Express/map" method="post">
        ${Object.entries(formData)
          .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}">`)
          .join('')}
      </form>
      <script>document.getElementById('ecpay-form').submit();</script>
    </body>
    </html>
  `

  reply.type('text/html').send(html)
})

/**
 * POST /api/ecpay/cvs-callback - 超商選擇回調
 */
fastify.post('/cvs-callback', async (request, reply) => {
  const params = request.body as Record<string, string>
  const { orderId } = request.query as { orderId: string }

  const {
    CVSStoreID,
    CVSStoreName,
    CVSAddress,
    CVSTelephone,
  } = params

  // 儲存門市資訊到訂單
  await prisma.order.update({
    where: { id: orderId },
    data: {
      // 需在 schema 新增欄位
      // cvsStoreId: CVSStoreID,
      // cvsStoreName: CVSStoreName,
      shippingAddress: `${CVSStoreName} (${CVSAddress})`,
    },
  })

  // 關閉視窗
  reply.type('text/html').send(`
    <script>
      if (window.opener) {
        window.opener.postMessage({ type: 'cvs-selected', storeId: '${CVSStoreID}', storeName: '${CVSStoreName}' }, '*');
        window.close();
      }
    </script>
  `)
})
```

---

## 六、驗收標準

- [ ] ECPay 測試環境設定完成
- [ ] CheckMacValue 產生與驗證正確
- [ ] 信用卡付款流程正常運作
- [ ] 付款回調正確更新訂單狀態
- [ ] 付款日誌正確記錄
- [ ] LINE Pay 付款流程正常運作
- [ ] 超商選擇器正常開啟與回調
- [ ] 物流訂單建立成功
- [ ] 物流狀態回調正確處理
- [ ] 無使用 `any` 型別（除單元測試外）

---

## 七、注意事項

1. **CheckMacValue 驗證**：
   - 必須嚴格驗證所有回調請求
   - 防止偽造付款通知
   - 記錄驗證失敗的請求

2. **回調 URL**：
   - 開發環境使用 ngrok 提供公開 URL
   - 正式環境使用 HTTPS
   - 綠界會同時回調 ReturnURL（背景通知）與 OrderResultURL（前端導向）

3. **金額處理**：
   - ECPay 金額必須為整數（四捨五入）
   - 小數點需在後端計算完成後再轉換
   - 記錄原始金額與轉換後金額

4. **錯誤處理**：
   - 付款失敗記錄到 PaymentLog
   - 提供友善的錯誤訊息給使用者
   - 定期檢查未完成付款訂單

5. **測試流程**：
   - 使用綠界提供的測試卡號
   - 測試各種付款失敗情境
   - 驗證回調機制正確運作

6. **超商物流**：
   - 7-11：LogisticsSubType = 'UNIMART'
   - 全家：LogisticsSubType = 'FAMI'
   - 需額外申請物流服務

---

## 八、測試資料

### 8.1 測試卡號（綠界提供）

```
信用卡號：4311-9522-2222-2222
有效期限：任意未來日期（如 12/25）
安全碼：222
```

### 8.2 ngrok 設定（開發環境）

```bash
# 安裝 ngrok
npm install -g ngrok

# 啟動 API server
cd apps/api
pnpm dev

# 另開終端，啟動 ngrok
ngrok http 3001

# 將 ngrok 提供的 URL 設定到 .env
ECPAY_RETURN_URL=https://xxxx.ngrok.io/api/ecpay/callback
```

---

## 九、後續任務

- **Task 20**: Third-party GCS（Google Cloud Storage 圖片上傳）
- **Task 21**: Testing（單元測試與 E2E 測試）
- **Task 22**: Deployment（GCP Cloud Run 部署）
